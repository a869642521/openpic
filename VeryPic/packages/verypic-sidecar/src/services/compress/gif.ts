import { Metadata } from 'sharp';
import {
  getPlainMetadata,
  CompressError,
  getFileSize,
  createOutputPath,
  copyFileToTemp,
  hashFile,
  calCompressionRate,
  isWindows,
} from '../../utils';
import { applyImageTransformations, applyImageConversion } from './utils';
import sharp from 'sharp';
import { SaveMode } from '../../constants';
import { copyFile, writeFile } from 'node:fs/promises';

export interface ImageTaskPayload {
  input_path: string;
  options: any;
  process_options: any;
}

/**
 * 色数递减候选序列：从最高质量到最激进压缩。
 * 每一步颜色减半；256→128 通常肉眼几乎无差别，128→64 轻微，64→32 较明显。
 */
const COLOUR_STEPS = [256, 128, 64, 32] as const;

export async function processGif(payload: ImageTaskPayload) {
  let originalSize: number = 0;
  let originalMetadata: Metadata | undefined;
  try {
    originalSize = await getFileSize(payload.input_path);
    const transformer = sharp(payload.input_path, { limitInputPixels: false, animated: true });
    originalMetadata = await transformer.metadata();
    return await optimizeGif(transformer, payload, originalSize, originalMetadata);
  } catch (error) {
    throw new CompressError('GIF Compress Error', {
      cause: error,
      payload: {
        originalSize,
        ...(getPlainMetadata(originalMetadata) || {}),
      },
    });
  }
}

async function optimizeGif(
  transformer: sharp.Sharp,
  payload: ImageTaskPayload,
  originalSize: number,
  originalMetadata: Metadata,
) {
  const { input_path, options, process_options } = payload;
  const isAnimated = (originalMetadata.pages ?? 1) > 1;

  if (isWindows && options.save.mode === SaveMode.Overwrite) {
    sharp.cache(false);
  }
  if (options.keep_metadata) transformer.keepMetadata();

  // ── 阶段一：应用变换（缩放/水印），同时得到 resizeApplied 信息 ──────────────
  const { resizeApplied } = await applyImageTransformations(transformer, originalMetadata, options);

  const outputPath = await createOutputPath(input_path, {
    mode: options.save.mode,
    new_file_suffix: options.save.new_file_suffix,
    new_folder_path: options.save.new_folder_path,
  });

  // ── 阶段二：格式转换（如有），使用已应用变换的 transformer ──────────────────
  const convert_results = await applyImageConversion(
    transformer,
    outputPath,
    options.convert_enable,
    options.convert_types,
    options.convert_alpha,
  );

  // ── 阶段三：构造编码参数 ─────────────────────────────────────────────────────
  // 动画 GIF：提高帧间误差容忍度，允许跨帧复用调色板
  const po = process_options;
  const baseEncOpts = {
    reuse:     po.reuse     ?? true,
    progressive: po.progressive ?? false,
    effort:    po.effort    ?? 7,
    dither:    po.dither    ?? 1.0,
    interFrameMaxError:   isAnimated ? Math.max(po.interFrameMaxError   ?? 0, 4) : (po.interFrameMaxError   ?? 0),
    interPaletteMaxError: isAnimated ? Math.max(po.interPaletteMaxError ?? 3, 8) : (po.interPaletteMaxError ?? 3),
    loop:  po.loop ?? 0,
    force: true,
  };

  // 若用户明确指定了 colours，严格遵守；否则走自动递减策略
  const userColours: number | undefined = po.colours ?? po.colors;
  const colourCandidates: readonly number[] = userColours !== undefined
    ? [userColours]
    : COLOUR_STEPS;

  const targetBytes: number | null =
    options.target_size_enable && options.target_size_kb
      ? (options.target_size_kb as number) * 1024
      : null;

  // ── 阶段四：多轮色数试探，每次从原始文件重新读取 ─────────────────────────────
  // 关键：不走「GIF→中间GIF→再编码」的双重编码路径。
  // 每轮直接从原始文件创建新的 Sharp 实例并重新应用变换，
  // 保留原始帧间结构信息，避免中间编码引入多余体积开销。
  let bestBuffer: Buffer | null = null;
  let bestSize = Infinity;

  for (const colours of colourCandidates) {
    let buf: Buffer;
    try {
      const s = sharp(input_path, { animated: true, limitInputPixels: false });
      if (options.keep_metadata) s.keepMetadata();
      await applyImageTransformations(s, originalMetadata, options);
      buf = await s.gif({ ...baseEncOpts, colours }).toBuffer();
    } catch {
      continue; // 该色数编码失败，跳过
    }

    if (targetBytes !== null) {
      if (buf.length <= targetBytes) {
        // 满足目标大小的第一个命中（色数最多 = 质量最高），立刻停止
        bestBuffer = buf;
        bestSize = buf.length;
        break;
      }
      if (buf.length < bestSize) { bestBuffer = buf; bestSize = buf.length; }
    } else {
      if (buf.length < bestSize) { bestBuffer = buf; bestSize = buf.length; }
    }
  }

  // ── 阶段五：保存决策 ─────────────────────────────────────────────────────────
  const originalEctypePath = await copyFileToTemp(input_path, options.temp_dir);
  const compressedSize = bestBuffer?.length ?? originalSize;
  const compressionRate = calCompressionRate(originalSize, compressedSize);
  const limitRate: number = options.limit_compress_rate ?? 0;
  const shouldSave =
    (compressionRate >= limitRate || resizeApplied) &&
    !!bestBuffer &&
    compressedSize < originalSize;

  if (shouldSave && bestBuffer) {
    await writeFile(outputPath, bestBuffer);
  } else {
    if (input_path !== outputPath) {
      await copyFile(input_path, outputPath);
    }
  }

  return {
    input_path,
    input_size: originalSize,
    output_path: outputPath,
    output_size: shouldSave ? compressedSize : originalSize,
    compression_rate: shouldSave ? compressionRate : 0,
    original_temp_path: originalEctypePath,
    available_compress_rate: shouldSave,
    hash: await hashFile(outputPath),
    convert_results,
    original_metadata: originalMetadata,
    ...(targetBytes
      ? { target_size_achieved: !!bestBuffer && bestBuffer.length <= targetBytes }
      : {}),
  };
}
