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

enum PresetEnum {
  Default = 'default',
  Photo = 'photo',
  Picture = 'picture',
  Drawing = 'drawing',
  Icon = 'icon',
  Text = 'text',
}

const ProcessOptionsSchema = z
  .object({
    // ??????????????????
    reuse: z.boolean().optional().default(true),
    // ???????????
    progressive: z.boolean().optional().default(false),
    // ????????????? 2~256 ???
    // ??????service ??? undefined ?????????????256?128?64?32??
    // ?????????????????????
    colours: z.number().min(2).max(256).optional(),
    // `colours` ??????????????????
    colors: z.number().min(2).max(256).optional(),
    // CPU ??????? 1????? 10??????
    effort: z.number().min(1).max(10).optional().default(7),
    // Floyd-Steinberg ?????????? 0????? 1??????
    dither: z.number().min(0).max(1).optional().default(1.0),
    // ???????????? 0????? 32 ????? GIF ? service ??????
    interFrameMaxError: z.number().min(0).max(32).optional().default(0),
    // ??????????????? 0 ? 256 ??
    interPaletteMaxError: z.number().min(0).max(256).optional().default(3),
    // ???????0 ??????
    loop: z.number().optional().default(0),
    // ????????????
    delay: z.union([z.number(), z.array(z.number())]).optional(),
    // ?? GIF ??
    force: z.boolean().optional().default(true),
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
    type: 'gif',
    payload: { input_path, options, process_options },
  });
  return context.json(result);
});

export default app;
