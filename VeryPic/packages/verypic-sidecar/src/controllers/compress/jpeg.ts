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
    target_size_enable: z.boolean().optional().default(false),
    target_size_kb: z.number().min(1).optional(),
    target_size_tolerance: z.number().min(0).max(1).optional().default(0.1),
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

const ProcessOptionsSchema = z
  .object({
    // 质量，整�?-100
    quality: z.number().min(0).max(100).optional().default(80),
    // 是否使用渐进式（交错）扫�?    progressive: z.boolean().optional().default(false),
    // 色度子采样，设置�?4:4:4'以防止色度子采样，默认为'4:2:0'
    chromaSubsampling: z.string().optional().default('4:2:0'),
    // 优化霍夫曼编码表
    optimiseCoding: z.boolean().optional().default(true),
    // 优化编码的替代拼�?    optimizeCoding: z.boolean().optional().default(true),
    // 使用mozjpeg默认�?    mozjpeg: z.boolean().optional().default(false),
    // 应用网格量化
    trellisQuantisation: z.boolean().optional().default(false),
    // 应用过冲去振�?    overshootDeringing: z.boolean().optional().default(false),
    // 优化渐进式扫�?    optimiseScans: z.boolean().optional().default(false),
    // 优化扫描的替代拼�?    optimizeScans: z.boolean().optional().default(false),
    // 量化表，整数0-8
    quantisationTable: z.number().optional(),
    // 量化表的替代拼写
    quantizationTable: z.number().optional(),
    // 强制JPEG输出，即使输入图像的alpha通道被使�?    force: z.boolean().optional().default(true),
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
    type: 'jpeg',
    payload: { input_path, options, process_options },
  });

  return context.json(result);
});

export default app;

