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
import { losslessCompressPng, PNGLosslessOptions, pngQuantize, PngRowFilter } from '@napi-rs/image';
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

    // 判断是否需要 sharp 变换：无 resize 且无水印时直接读原始字节，避免 sharp 把调色板 PNG 展开为
    // 32-bit RGBA 后重编码导致中间体膨胀（8-bit 调色板 PNG 可膨胀 5~10 倍），
    // 使得 pngquant 的输出仍大于原始文件，最终压缩率为负数/0%。
    const needsTransform =
      resizeApplied ||
      (options.watermark_type !== undefined && options.watermark_type !== WatermarkType.None);
    const pngBuffer: Buffer = needsTransform
      ? await transformer.png({ force: true }).toBuffer()
      : await readFile(input_path);
    const pngBitDepth = pngBuffer[24];
    const pngColorType = pngBuffer[25];
    const isTruecolorPng = pngBitDepth === 8 && (pngColorType === 2 || pngColorType === 6);

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
      // 普通压缩：minQuality 固定为 0 防止 pngquant 因色彩复杂度不达标而静默返回未量化的 buffer
      // （minQuality > 0 时，pngquant 在无法达标时退出码为 99，@napi-rs/image 可能返回原始 buffer
      //   导致中间体比原文件大，最终压缩率为负数 → 显示 0%）
      quantized = await pngQuantize(pngBuffer, {
        minQuality: 0,
        maxQuality: process_options.maxQuality ?? 99,
        speed: process_options.speed ?? 5,
      });
    }

    // 真彩 PNG（非调色板）在 @napi-rs/image 的 pngQuantize 上可能直接返回原始 buffer。
    // 对这类图片回退到 sharp 的 palette PNG 量化，仍保持 PNG 格式，但能获得真实压缩收益。
    // dither: 1.0 启用 Floyd-Steinberg 抖动，让颜色过渡更自然，接近 TinyPNG 的视觉效果。
    if (isTruecolorPng && quantized.length >= pngBuffer.length) {
      const palettePng = await sharp(pngBuffer, { limitInputPixels: false })
        .png({
          force: true,
          palette: true,
          quality: process_options.maxQuality ?? 85,
          dither: 1.0,
          effort: 10,
          compressionLevel: 9,
        })
        .toBuffer();
      if (palettePng.length < quantized.length) {
        quantized = palettePng;
      }
    }

    // 双阶段优化：pngquant 量化（有损）→ OxiPNG（无损）
    // Brute 穷举全部滤波器组合，在量化后数据已大幅缩减的基础上额外再压 2~8%
    // OxiPNG 出错时降级保留 pngquant 结果，不影响主流程
    try {
      const oxipng = await losslessCompressPng(quantized, {
        filter: [PngRowFilter.Brute],
        bitDepthReduction: true,
        colorTypeReduction: true,
        paletteReduction: true,
        grayscaleReduction: true,
        idatRecoding: true,
        strip: !options.keep_metadata,
      });
      if (oxipng.length < quantized.length) {
        quantized = oxipng;
      }
    } catch {
      // OxiPNG 降级：保留 pngquant 输出继续
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
    if (options.keep_metadata) transformer.keepMetadata();
    const { resizeApplied } = await applyImageTransformations(transformer, originalMetadata, options);

    // 与有损路径保持一致：只有确实发生 resize/水印时才走 sharp 中间体，
    // 纯压缩场景直接读取原始 PNG 字节，避免不必要的重编码。
    const needsTransform =
      resizeApplied ||
      (options.watermark_type !== undefined && options.watermark_type !== WatermarkType.None);
    const pngBuffer: Buffer = needsTransform
      ? await transformer
          .png({
            quality: 100,
            force: true,
            palette: false,
          })
          .toBuffer()
      : await readFile(input_path);

    // Brute (9) 对每行穷举全部 10 种滤波器组合取最优，等效于 pngcrush --all-filters
    // 是 OxiPNG 中压缩率最高的设置，用于无损模式完全合适（用户选无损即接受较慢速度换最优体积）
    const losslessOptions = {
      ...process_options,
      filter: [PngRowFilter.Brute],
    };
    const optimizedImageBuffer = await losslessCompressPng(pngBuffer, losslessOptions);
    const compressedSize = optimizedImageBuffer.byteLength;
    const compressionRate = calCompressionRate(originalSize, compressedSize);
    const availableCompressRate = compressionRate >= (options.limit_compress_rate || 0);
    const shouldSave = availableCompressRate || resizeApplied;
    const originalEctypePath = await copyFileToTemp(input_path, options.temp_dir);

    if (shouldSave) {
      await writeFile(outputPath, optimizedImageBuffer);
    } else {
      if (input_path !== outputPath) {
        await copyFile(input_path, outputPath);
      }
    }

    const convert_results: any[] = await applyImageConversion(
      sharp(pngBuffer, { limitInputPixels: false }),
      outputPath,
      options.convert_enable,
      options.convert_types,
      options.convert_alpha,
    );

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
