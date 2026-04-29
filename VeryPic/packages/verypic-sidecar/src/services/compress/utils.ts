import sharp, { Metadata, FormatEnum } from 'sharp';
import { Dimensions, ResizeResult } from '../resize';
import { WatermarkType } from '../../constants';
import { addTextWatermark, addImageWatermark } from '../watermark';
import { resizeFromSharpStream } from '../resize';
import { bulkConvert } from '../convert';
import { isValidArray, isWindows, getFileSize, hashFile } from '../../utils';
import path from 'node:path';
import { ConvertFormat, SaveMode } from '../../constants';
import { createOutputPath, copyFileToTemp, createOutputPathTempPath } from '../../utils';
import { rename, unlink, copyFile, writeFile } from 'node:fs/promises';
import { calCompressionRate } from '../../utils';

type Format = keyof FormatEnum;

export async function applyImageTransformations(
  stream: sharp.Sharp,
  originalMetadata: Dimensions,
  options: any,
): Promise<{ dimensions: Dimensions; resizeApplied: boolean }> {
  let dimensions: Dimensions = originalMetadata;
  let resizeApplied = false;
  if (options.resize_enable) {
    const result: ResizeResult = await resizeFromSharpStream({
      stream,
      originalMetadata: dimensions,
      options,
    });
    dimensions = { width: result.width, height: result.height };
    resizeApplied = result.resized;
  }
  if (options.watermark_type !== WatermarkType.None) {
    if (options.watermark_type === WatermarkType.Text && options.watermark_text) {
      await addTextWatermark({
        stream: stream,
        text: options.watermark_text,
        color: options.watermark_text_color,
        fontSize: options.watermark_font_size,
        position: options.watermark_position,
        container: dimensions,
      });
    } else if (options.watermark_type === WatermarkType.Image && options.watermark_image_path) {
      await addImageWatermark({
        stream: stream,
        imagePath: options.watermark_image_path,
        opacity: options.watermark_image_opacity,
        scale: options.watermark_image_scale,
        position: options.watermark_position,
        container: dimensions,
      });
    }
  }
  return { dimensions, resizeApplied };
}

export async function applyImageConversion(
  stream: sharp.Sharp,
  outputPath: string,
  enable: boolean,
  convertTypes: ConvertFormat[],
  convertAlpha: string,
) {
  if (enable && isValidArray(convertTypes)) {
    const ext = path.extname(outputPath);
    return bulkConvert(
      stream,
      ext,
      path.basename(outputPath, ext),
      path.dirname(outputPath),
      convertTypes,
      convertAlpha,
    );
  }
  return [];
}

export async function saveImage(
  stream: sharp.Sharp,
  inputPath: string,
  format: Format,
  originalSize: number,
  options: any,
  process_options: any,
  resizeApplied = false,
) {
  // 获取输出路径
  const outputPath = await createOutputPath(inputPath, {
    mode: options.save.mode,
    new_file_suffix: options.save.new_file_suffix,
    new_folder_path: options.save.new_folder_path,
  });
  // 复制原始文件到临时文件
  const originalEctypePath = await copyFileToTemp(inputPath, options.temp_dir);
  // 创建输出临时文件
  const outputTempPath = createOutputPathTempPath(outputPath);
  // 输出到临时文件（单次压缩）
  const { size: compressedSize } = await stream
    .toFormat(format, process_options)
    .toFile(outputTempPath);
  // 计算压缩率
  const compressionRate = calCompressionRate(originalSize, compressedSize);
  const availableCompressRate = compressionRate >= (options.limit_compress_rate || 0);
  // 只有 resize 实际发生了尺寸变化时，才无视压缩率强制保存
  const shouldSave = availableCompressRate || resizeApplied;
  if (shouldSave) {
    await rename(outputTempPath, outputPath);
  } else {
    if (inputPath !== outputPath) {
      await copyFile(inputPath, outputPath);
    }
    await unlink(outputTempPath);
  }
  return {
    availableCompressRate: shouldSave,
    originalEctypePath,
    compressedSize,
    compressionRate,
  };
}

export interface ImageTaskPayload {
  input_path: string;
  options: any;
  process_options: any;
}

export async function processImage(
  transformer: sharp.Sharp,
  format: Format,
  payload: ImageTaskPayload,
  originalSize: number,
  originalMetadata: Metadata,
) {
  const { input_path, options, process_options } = payload;

  if (isWindows && options.save.mode === SaveMode.Overwrite) {
    sharp.cache(false);
  }
  if (options.keep_metadata) transformer.keepMetadata();
  const { resizeApplied } = await applyImageTransformations(transformer, originalMetadata, options);

  const outputPath = await createOutputPath(input_path, {
    mode: options.save.mode,
    new_file_suffix: options.save.new_file_suffix,
    new_folder_path: options.save.new_folder_path,
  });

  const targetBytes: number | null =
    options.target_size_enable && options.target_size_kb
      ? (options.target_size_kb as number) * 1024
      : null;

  // 目标大小路径：JPEG / WebP 使用「预估起点 + 线性步进」算法（同 webp2jpg 参考项目）
  if (targetBytes && (format === 'jpeg' || format === 'webp')) {
    // 先把所有变换（resize/watermark）输出为无损 PNG 中间 buffer
    const intermediateBuffer = await transformer.png({ force: true }).toBuffer();

    // 转换任务使用独立的 sharp 实例
    const convert_results: any[] = await applyImageConversion(
      sharp(intermediateBuffer),
      outputPath,
      options.convert_enable,
      options.convert_types,
      options.convert_alpha,
    );

    // 扣除文件系统簇开销（参考项目同样减 4000 bytes）
    const adjustedTarget = targetBytes - 4096;

    // 阶段一：以 quality=81 编码，获取参考大小
    // JPEG 启用 mozjpeg 感知优化选项，WebP 使用最高 effort，保证参考尺寸与实际编码一致
    const refOpts =
      format === 'jpeg'
        ? { ...process_options, quality: 81, mozjpeg: true, force: true,
            trellisQuantisation: true, overshootDeringing: true, optimiseScans: true }
        : { ...process_options, quality: 81, effort: 6, force: true };
    const refBuf = await sharp(intermediateBuffer).toFormat(format, refOpts).toBuffer();
    const refSize = refBuf.length;

    // 阶段二：估算起始质量（与参考项目公式一致）
    // 当 refSize < adjustedTarget 时用 0.81*0.81 因子，倒推出更高的起始质量（向上探）
    // 当 refSize > adjustedTarget 时用 0.81 因子，倒推出更低的起始质量（向下探）
    const yu = adjustedTarget > refSize ? 0.81 * 0.81 : 0.81;
    let q = Math.round((adjustedTarget / refSize) * yu * 100);
    q = Math.max(1, Math.min(99, q));

    // 阶段三：±1 线性步进，直至落入容差区间 [adjustedTarget×(1-tolerance), adjustedTarget)
    const tolerance = (options.target_size_tolerance as number) ?? 0.1;
    let stepBest: Buffer | null = null;
    for (let i = 0; i < 60; i++) {
      const opts =
        format === 'jpeg'
          ? { ...process_options, quality: q, mozjpeg: true, force: true,
              trellisQuantisation: true, overshootDeringing: true, optimiseScans: true }
          : { ...process_options, quality: q, effort: 6, force: true };
      const buf = await sharp(intermediateBuffer).toFormat(format, opts).toBuffer();
      const bSize = buf.length;

      if (bSize > adjustedTarget * (1 - tolerance) && bSize < adjustedTarget) {
        stepBest = buf;
        break;
      }
      // 图片本身已很小，最高质量仍低于目标，直接用最高质量
      if (q >= 95 && bSize < adjustedTarget) {
        stepBest = buf;
        break;
      }
      // 已到最低质量仍无法压缩到目标（内容过复杂）
      if (q <= 1 && bSize > adjustedTarget) {
        stepBest = buf;
        break;
      }
      // 已到最低质量且满足目标
      if (q <= 1 && bSize < adjustedTarget) {
        stepBest = buf;
        break;
      }
      // 步进
      if (bSize < adjustedTarget) {
        q = Math.min(99, q + 1);
        stepBest = buf;
      } else {
        q = Math.max(1, q - 1);
      }
    }
    const bestBuffer = stepBest ?? refBuf;

    const originalEctypePath = await copyFileToTemp(input_path, options.temp_dir);
    const compressedSize = bestBuffer.length;
    const compressionRate = calCompressionRate(originalSize, compressedSize);
    const shouldSave = compressedSize < originalSize || resizeApplied;

    if (shouldSave) {
      await writeFile(outputPath, bestBuffer);
    } else {
      if (input_path !== outputPath) await copyFile(input_path, outputPath);
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
      target_size_achieved: bestBuffer.length < targetBytes,
    };
  }

  // 普通路径（AVIF / TIFF / GIF，或未开启目标大小）
  const convert_results: any[] = await applyImageConversion(
    transformer,
    outputPath,
    options.convert_enable,
    options.convert_types,
    options.convert_alpha,
  );
  const { availableCompressRate, originalEctypePath, compressedSize, compressionRate } =
    await saveImage(transformer, input_path, format, originalSize, options, process_options, resizeApplied);

  return {
    input_path,
    input_size: originalSize,
    output_path: outputPath,
    output_size: availableCompressRate ? compressedSize : originalSize,
    compression_rate: availableCompressRate ? compressionRate : 0,
    original_temp_path: originalEctypePath,
    available_compress_rate: availableCompressRate,
    hash: await hashFile(outputPath),
    convert_results,
    original_metadata: originalMetadata,
    // AVIF/TIFF/GIF 不支持目标大小步进，有目标时标记为未达到
    ...(targetBytes ? { target_size_achieved: false } : {}),
  };
}
