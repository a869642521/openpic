import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import sharp from 'sharp';
import path from 'node:path';
import { checkFile, getFileSize, isDirectory } from '../utils';
import { SaveMode, ConvertFormat } from '../constants';
import { convert } from '../services/convert';
import { payloadValidator } from './utils';

const app = new Hono();

async function createConvertOutputPath(
  inputPath: string,
  targetFormat: string,
  options: {
    mode: string;
    new_file_suffix?: string;
    new_folder_path?: string;
  },
): Promise<string> {
  const ext = `.${targetFormat}`;
  const baseName = path.basename(inputPath, path.extname(inputPath));

  switch (options.mode) {
    case 'overwrite':
      return path.join(path.dirname(inputPath), `${baseName}${ext}`);
    case 'save_as_new_file': {
      const suffix = options.new_file_suffix || '_converted';
      return path.join(path.dirname(inputPath), `${baseName}${suffix}${ext}`);
    }
    case 'save_to_new_folder': {
      if (!(await isDirectory(options.new_folder_path || ''))) {
        throw new Error(`Directory '${options.new_folder_path}' does not exist`);
      }
      return path.join(options.new_folder_path!, `${baseName}${ext}`);
    }
    default:
      return path.join(path.dirname(inputPath), `${baseName}${ext}`);
  }
}

const PayloadSchema = z.object({
  input_path: z.string(),
  options: z
    .object({
      target_format: z.nativeEnum(ConvertFormat),
      convert_alpha: z.string().optional().default('#FFFFFF'),
    })
    .optional()
    .default({} as any),
  save: z
    .object({
      mode: z.nativeEnum(SaveMode).optional().default(SaveMode.Overwrite),
      new_file_suffix: z.string().optional().default('_converted'),
      new_folder_path: z.string().optional(),
    })
    .optional()
    .default({}),
});

app.post('/', zValidator('json', PayloadSchema, payloadValidator), async (context) => {
  const { input_path, options, save } = await context.req.json<z.infer<typeof PayloadSchema>>();
  await checkFile(input_path);

  const alpha =
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(options.convert_alpha?.trim() || '')
      ? options.convert_alpha.trim()
      : '#FFFFFF';

  try {
    const outputPath = await createConvertOutputPath(input_path, options.target_format, {
      mode: save.mode,
      new_file_suffix: save.new_file_suffix,
      new_folder_path: save.new_folder_path,
    });

    const originalSize = await getFileSize(input_path);
    const stream = sharp(input_path, { limitInputPixels: false });

    const result = await convert(stream, outputPath, options.target_format, alpha);

    if (!result.success) {
      return context.json({
        success: false,
        input_path,
        error_msg: result.error_msg || 'Conversion failed',
      });
    }

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
