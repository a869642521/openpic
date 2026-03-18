import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import sharp, { FormatEnum } from 'sharp';
import path from 'node:path';
import { checkFile, createOutputPath, getFileSize } from '../utils';
import { SaveMode, WatermarkType, WatermarkPosition } from '../constants';
import { addTextWatermark, addImageWatermark } from '../services/watermark';
import { payloadValidator } from './utils';

const app = new Hono();

const PayloadSchema = z.object({
  input_path: z.string(),
  options: z
    .object({
      watermark_type: z.nativeEnum(WatermarkType),
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
    })
    .optional()
    .default({} as any),
  save: z
    .object({
      mode: z.nativeEnum(SaveMode).optional().default(SaveMode.Overwrite),
      new_file_suffix: z.string().optional().default('_watermark'),
      new_folder_path: z.string().optional(),
    })
    .optional()
    .default({}),
});

type Format = keyof FormatEnum;

const FORMAT_EXT_MAP: Record<string, Format> = {
  '.png': 'png',
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.webp': 'webp',
  '.avif': 'avif',
  '.gif': 'gif',
  '.tiff': 'tiff',
  '.tif': 'tiff',
};

function getFormatFromPath(inputPath: string): Format {
  const ext = path.extname(inputPath).toLowerCase();
  return FORMAT_EXT_MAP[ext] || 'png';
}

function getFormatOptions(format: Format): Record<string, unknown> {
  switch (format) {
    case 'png':
      return { compressionLevel: 6 };
    case 'jpeg':
    case 'jpg':
      return { quality: 90 };
    case 'webp':
      return { quality: 90 };
    case 'avif':
      return { quality: 90 };
    case 'gif':
      return { effort: 4 };
    case 'tiff':
      return { compression: 'lzw' };
    default:
      return { quality: 90 };
  }
}

app.post('/', zValidator('json', PayloadSchema, payloadValidator), async (context) => {
  const { input_path, options, save } = await context.req.json<z.infer<typeof PayloadSchema>>();
  await checkFile(input_path);

  if (options.watermark_type === WatermarkType.None) {
    return context.json({
      success: false,
      input_path,
      error_msg: 'Watermark type must be text or image',
    });
  }

  if (
    options.watermark_type === WatermarkType.Text &&
    (!options.watermark_text || options.watermark_text.trim() === '')
  ) {
    return context.json({
      success: false,
      input_path,
      error_msg: 'Text watermark requires watermark_text',
    });
  }

  if (
    options.watermark_type === WatermarkType.Image &&
    (!options.watermark_image_path || options.watermark_image_path.trim() === '')
  ) {
    return context.json({
      success: false,
      input_path,
      error_msg: 'Image watermark requires watermark_image_path',
    });
  }

  try {
    const outputPath = await createOutputPath(input_path, {
      mode: save.mode,
      new_file_suffix: save.new_file_suffix,
      new_folder_path: save.new_folder_path,
    });

    const originalSize = await getFileSize(input_path);
    const format = getFormatFromPath(input_path);
    const formatOptions = getFormatOptions(format);

    let stream = sharp(input_path, { limitInputPixels: false });
    const metadata = await stream.metadata();
    const dimensions = {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };

    if (options.watermark_type === WatermarkType.Text) {
      await addTextWatermark({
        stream,
        text: options.watermark_text,
        color: options.watermark_text_color,
        fontSize: options.watermark_font_size,
        position: options.watermark_position as any,
        container: dimensions,
      });
    } else if (options.watermark_type === WatermarkType.Image) {
      await addImageWatermark({
        stream,
        imagePath: options.watermark_image_path,
        opacity: options.watermark_image_opacity,
        scale: options.watermark_image_scale,
        position: options.watermark_position as any,
        container: dimensions,
      });
    }

    await stream.toFormat(format, formatOptions).toFile(outputPath);
    const outputSize = await getFileSize(outputPath);

    return context.json({
      success: true,
      input_path,
      input_size: originalSize,
      output_path: outputPath,
      output_size: outputSize,
    });
  } catch (error: any) {
    return context.json({
      success: false,
      input_path,
      error_msg: error?.message || error?.toString() || 'Unknown error',
    });
  }
});

export default app;
