import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { checkFile } from '../../utils';
import {
  SaveMode,
  ConvertFormat,
  ResizeFit,
  WatermarkType,
  WatermarkPosition,
} from '../../constants';
import { getThreadPool } from '../../workers/thread-pool';
import { payloadValidator } from '../utils';

const app = new Hono();

const OptionsSchema = z
  .object({
    limit_compress_rate: z.number().min(0).max(1).optional(),
    save: z
      .object({
        mode: z.nativeEnum(SaveMode).optional().default(SaveMode.Overwrite),
        new_file_suffix: z.string().optional().default('_compressed'),
        new_folder_path: z.string().optional(),
      })
      .optional()
      .default({}),
    temp_dir: z.string().optional(),
    convert_enable: z.boolean().optional().default(false),
    convert_types: z.array(z.nativeEnum(ConvertFormat)).optional().default([]),
    convert_alpha: z.string().optional().default('#FFFFFF'),
    resize_enable: z.boolean().optional().default(false),
    resize_scale: z.number().optional().default(0),
    resize_dimensions: z.array(z.number()).optional().default([]),
    resize_fit: z.nativeEnum(ResizeFit).optional().default(ResizeFit.Cover),
    watermark_type: z.nativeEnum(WatermarkType).optional().default(WatermarkType.None),
    watermark_position: z
      .nativeEnum(WatermarkPosition)
      .optional()
      .default(WatermarkPosition.BottomRight),
    watermark_text: z.string().optional().default(''),
    watermark_text_color: z.string().optional().default('#FFFFFF'),
    watermark_font_size: z.number().optional().default(16),
    watermark_image_path: z.string().optional().default(''),
    watermark_image_opacity: z.number().min(0).max(1).optional().default(1),
    watermark_image_scale: z.number().min(0).max(1).optional().default(0.15),
    keep_metadata: z.boolean().optional().default(false),
  })
  .optional()
  .default({});

enum BitDepthEnum {
  Eight = 8,
  Ten = 10,
  Twelve = 12,
}

const ProcessOptionsSchema = z
  .object({
    // 质量，整�?-100
    quality: z.number().min(1).max(100).optional().default(50),
    // 使用无损压缩模式
    lossless: z.boolean().optional().default(false),
    // CPU努力程度，介�?（最快）�?（最慢）之间
    effort: z.number().min(0).max(9).optional().default(4),
    // 色度子采样，设置�?4:2:0'以使用色度子采样，默认为'4:4:4'
    chromaSubsampling: z.string().optional().default('4:4:4'),
    // 位深度，设置�?�?0�?2�?    bitdepth: z.nativeEnum(BitDepthEnum).optional().default(BitDepthEnum.Eight),
  })
  .optional()
  .default({});

const PayloadSchema = z.object({
  input_path: z.string(),
  options: OptionsSchema,
  process_options: ProcessOptionsSchema,
});

app.post('/', zValidator('json', PayloadSchema, payloadValidator), async (context) => {
  let { input_path, options, process_options } =
    await context.req.json<z.infer<typeof PayloadSchema>>();
  await checkFile(input_path);
  options = OptionsSchema.parse(options);
  process_options = ProcessOptionsSchema.parse(process_options);
  const result = await getThreadPool().run<any, any>({
    type: 'avif',
    payload: { input_path, options, process_options },
  });
  return context.json(result);
});

export default app;
