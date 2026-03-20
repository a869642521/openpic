import sharp, { Metadata } from 'sharp';
import {
  calCompressionRate,
  createOutputPath,
  copyFileToTemp,
  getFileSize,
  hashFile,
  getPlainMetadata,
  CompressError,
} from '../../utils';
import { writeFile, copyFile, readFile } from 'node:fs/promises';
import { isValidArray, isWindows } from '../../utils';
import { SaveMode, WatermarkType } from '../../constants';
import { losslessCompressPng, PNGLosslessOptions, pngQuantize } from '@napi-rs/image';
import { applyImageTransformations, applyImageConversion } from './utils';

export async function processPngLossy(payload: {
  input_path: string;
  options: any;
  process_options: { minQuality?: number; maxQuality?: number; speed?: number };
}) {
  let originalSize: number = 0;
  let originalMetadata: Metadata | undefined;
  try {
    const { input_path, options, process_options } = payload;
    originalSize = await getFileSize(input_path);
    if (isWindows && options.save.mode === SaveMode.Overwrite) {
      sharp.cache(false);
    }
    const transformer = sharp(input_path, { limitInputPixels: false });
    originalMetadata = await transformer.metadata();

    const outputPath = await createOutputPath(input_path, {
      mode: options.save.mode,
      new_file_suffix: options.save.new_file_suffix,
      new_folder_path: options.save.new_folder_path,
    });

    if (options.keep_metadata) transformer.keepMetadata();
    const { resizeApplied } = await applyImageTransformations(transformer, originalMetadata, options);

    // 先用 sharp 输出无损 PNG buffer（包含 resize/watermark 变换结果），再通过 pngquant 做调色板量化
    const pngBuffer = await transformer.png({ force: true }).toBuffer();

    // 转换任务使用独立的 sharp 实例
    const convert_results: any[] = await applyImageConversion(
      sharp(pngBuffer),
      outputPath,
      options.convert_enable,
      options.convert_types,
      options.convert_alpha,
    );

    const targetBytes: number | null =
      options.target_size_enable && options.target_size_kb
        ? (options.target_size_kb as number) * 1024
        : null;

    let quantized: Buffer;

    if (targetBytes) {
      // 目标大小：对 pngquant 的 maxQuality 使用「预估起点 + 线性步进」算法（同 webp2jpg 参考项目）
      // minQuality 固定为 0，防止 pngquant 因质量不达标而失败（退出码 99）
      const adjustedTarget = targetBytes - 4096;

      // 阶段一：以 maxQuality=81 获取参考大小
      const refBuf = await pngQuantize(pngBuffer, { minQuality: 0, maxQuality: 81, speed: 3 });
      const refSize = refBuf.length;
      // 阶段二：估算起始 maxQuality（始终执行，不再提前返回 refBuf）
      // 当 refSize < adjustedTarget 时用 0.81*0.81 因子，倒推出更高的起始质量（向上探）
      const yu = adjustedTarget > refSize ? 0.81 * 0.81 : 0.81;
      let q = Math.round((adjustedTarget / refSize) * yu * 100);
      q = Math.max(10, Math.min(95, q));

      // 阶段三：±1 线性步进，直至落入容差区间 [adjustedTarget×(1-tolerance), adjustedTarget)
      const tolerance = (options.target_size_tolerance as number) ?? 0.1;
      let stepBest: Buffer | null = null;
      for (let i = 0; i < 60; i++) {
        const buf = await pngQuantize(pngBuffer, { minQuality: 0, maxQuality: q, speed: 3 });
        const bSize = buf.length;

        if (bSize > adjustedTarget * (1 - tolerance) && bSize < adjustedTarget) {
          stepBest = buf;
          break;
        }
        if (q >= 95 && bSize < adjustedTarget) { stepBest = buf; break; }
        if (q <= 10 && bSize > adjustedTarget) { stepBest = buf; break; }
        if (q <= 10 && bSize < adjustedTarget) { stepBest = buf; break; }

        if (bSize < adjustedTarget) {
          q = Math.min(95, q + 1);
          stepBest = buf;
        } else {
          q = Math.max(10, q - 1);
        }
      }
      quantized = stepBest ?? refBuf;
    } else {
      // 普通压缩，使用传入的 process_options
      quantized = await pngQuantize(pngBuffer, {
        minQuality: process_options.minQuality ?? 70,
        maxQuality: process_options.maxQuality ?? 99,
        speed: process_options.speed ?? 5,
      });
    }

    // pngquant 量化时会剥离所有元数据，如果需要保留则通过 sharp 重新注入
    let finalBuffer = quantized;
    if (
      options.keep_metadata &&
      (originalMetadata?.exif || originalMetadata?.icc || originalMetadata?.xmp)
    ) {
      finalBuffer = await sharp(quantized, { limitInputPixels: false })
        .withMetadata({
          ...(originalMetadata.exif ? { exif: originalMetadata.exif as any } : {}),
          ...(originalMetadata.icc ? { icc: originalMetadata.icc as unknown as string } : {}),
          ...(originalMetadata.xmp ? { xmp: originalMetadata.xmp as any } : {}),
        })
        .png({ force: true, palette: true, compressionLevel: 9 })
        .toBuffer();
    }

    const compressedSize = finalBuffer.byteLength;
    const compressionRate = calCompressionRate(originalSize, compressedSize);
    const availableCompressRate = compressionRate >= (options.limit_compress_rate || 0);
    // 只有 resize 实际发生了尺寸变化时，才无视压缩率强制保存
    const shouldSave = availableCompressRate || resizeApplied;
    const originalEctypePath = await copyFileToTemp(input_path, options.temp_dir);

    if (shouldSave) {
      await writeFile(outputPath, finalBuffer);
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
      ...(targetBytes ? { target_size_achieved: finalBuffer.byteLength < targetBytes } : {}),
    };
  } catch (error) {
    throw new CompressError('PNG Lossy Compress Error', {
      cause: error,
      payload: {
        originalSize,
        ...(getPlainMetadata(originalMetadata) || {}),
      },
    });
  }
}

export async function processPngLossless(payload: {
  input_path: string;
  options: any;
  process_options: PNGLosslessOptions;
}) {
  let originalSize: number = 0;
  let originalMetadata: Metadata | undefined;
  try {
    const { input_path, options, process_options } = payload;
    originalSize = await getFileSize(input_path);
    if (isWindows && options.save.mode === SaveMode.Overwrite) {
      sharp.cache(false);
    }
    const transformer = sharp(input_path, { limitInputPixels: false });
    originalMetadata = await transformer.metadata();
    const outputPath = await createOutputPath(input_path, {
      mode: options.save.mode,
      new_file_suffix: options.save.new_file_suffix,
      new_folder_path: options.save.new_folder_path,
    });
    const requiredTransformations =
      options.resize_enable ||
      options.watermark_type !== WatermarkType.None ||
      (options.convert_enable && isValidArray(options.convert_types));
    if (requiredTransformations) {
      if (options.keep_metadata) transformer.keepMetadata();
      const { resizeApplied } = await applyImageTransformations(transformer, originalMetadata, options);
      const convert_results: any[] = await applyImageConversion(
        transformer,
        outputPath,
        options.convert_enable,
        options.convert_types,
        options.convert_alpha,
      );
      const optimizedImageBuffer = await losslessCompressPng(
        await transformer
          .png({
            quality: 100,
            force: true,
            palette: false,
          })
          .toBuffer(),
        process_options,
      );
      const compressedSize = optimizedImageBuffer.byteLength;
      const compressionRate = calCompressionRate(originalSize, compressedSize);
      const availableCompressRate = compressionRate >= (options.limit_compress_rate || 0);
      // 只有 resize 实际发生了尺寸变化时，才无视压缩率强制保存
      const shouldSave = availableCompressRate || resizeApplied;
      const originalEctypePath = await copyFileToTemp(input_path, options.temp_dir);
      if (shouldSave) {
        await writeFile(outputPath, optimizedImageBuffer);
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
      };
    } else {
      if (options.keep_metadata) transformer.keepMetadata();
      const fileData = await readFile(input_path);
      const optimizedImageBuffer = await losslessCompressPng(fileData, process_options);
      const compressedSize = optimizedImageBuffer.byteLength;
      const compressionRate = calCompressionRate(originalSize, compressedSize);
      const availableCompressRate = compressionRate >= (options.limit_compress_rate || 0);
      const originalEctypePath = await copyFileToTemp(input_path, options.temp_dir);
      if (availableCompressRate) {
        await writeFile(outputPath, optimizedImageBuffer);
      } else {
        if (input_path !== outputPath) {
          await copyFile(input_path, outputPath);
        }
      }
      const convert_results: any[] = await applyImageConversion(
        transformer,
        outputPath,
        options.convert_enable,
        options.convert_types,
        options.convert_alpha,
      );
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
      };
    }
  } catch (error) {
    throw new CompressError('PNG Lossless Compress Error', {
      cause: error,
      payload: {
        originalSize,
        ...(getPlainMetadata(originalMetadata) || {}),
      },
    });
  }
}
