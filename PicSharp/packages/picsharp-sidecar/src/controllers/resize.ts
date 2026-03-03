import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import sharp, { FormatEnum } from 'sharp';
import path from 'node:path';
import { checkFile, createOutputPath, getFileSize } from '../utils';
import { SaveMode, ResizeFit } from '../constants';
import { payloadValidator } from './utils';

const app = new Hono();

const PayloadSchema = z.object({
  input_path: z.string(),
  options: z
    .object({
      resize_dimensions: z.tuple([z.number(), z.number()]).or(z.array(z.number()).length(2)),
      resize_fit: z.nativeEnum(ResizeFit).optional().default(ResizeFit.Inside),
    })
    .optional()
    .default({}),
  save: z
    .object({
      mode: z.nativeEnum(SaveMode).optional().default(SaveMode.Overwrite),
      new_file_suffix: z.string().optional().default('_resized'),
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

  const MAX_DIMENSION = 32767;
  const dims = options.resize_dimensions || [0, 0];
  const width = Math.max(0, Math.min(MAX_DIMENSION, dims[0] || 0));
  const height = Math.max(0, Math.min(MAX_DIMENSION, dims[1] || 0));

  if (width <= 0 && height <= 0) {
    return context.json({
      success: false,
      input_path,
      error_msg: 'At least one of width or height must be greater than 0',
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

    const resizeOptions: { width?: number; height?: number; fit?: string } = {};
    if (width > 0) resizeOptions.width = width;
    if (height > 0) resizeOptions.height = height;
    resizeOptions.fit = options.resize_fit || ResizeFit.Inside;

    let stream = sharp(input_path, { limitInputPixels: false });
    stream = stream.resize(resizeOptions as any);
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
