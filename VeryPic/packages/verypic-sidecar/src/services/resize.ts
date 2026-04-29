import { Metadata, ResizeOptions, FitEnum, Sharp } from 'sharp';
import { isValidArray, createTempFilePath } from '../utils';
import { nanoid } from 'nanoid';

export interface Dimensions {
  width: number;
  height: number;
}

export interface ResizeResult extends Dimensions {
  resized: boolean;
}

export type Fit = keyof FitEnum;

export function calculateResizeDimensions(
  originalDimensions: Dimensions,
  targetDimensions: Partial<Dimensions>,
  fitMode: Fit,
): Dimensions {
  const { width: originalWidth, height: originalHeight } = originalDimensions;

  let finalTargetWidth: number;
  let finalTargetHeight: number;

  const originalRatio = originalWidth / originalHeight;

  if (targetDimensions.width && targetDimensions.height) {
    finalTargetWidth = targetDimensions.width;
    finalTargetHeight = targetDimensions.height;
  } else if (targetDimensions.width) {
    finalTargetWidth = targetDimensions.width;
    finalTargetHeight = Math.round(targetDimensions.width / originalRatio);
  } else if (targetDimensions.height) {
    finalTargetWidth = Math.round(targetDimensions.height * originalRatio);
    finalTargetHeight = targetDimensions.height;
  } else {
    return originalDimensions;
  }

  if (fitMode === 'cover') {
    const ratioW = finalTargetWidth / originalWidth;
    const ratioH = finalTargetHeight / originalHeight;
    const finalRatio = Math.max(ratioW, ratioH);
    return {
      width: Math.round(originalWidth * finalRatio),
      height: Math.round(originalHeight * finalRatio),
    };
  }

  if (fitMode === 'contain') {
    const ratioW = finalTargetWidth / originalWidth;
    const ratioH = finalTargetHeight / originalHeight;
    const finalRatio = Math.min(ratioW, ratioH);
    return {
      width: Math.round(originalWidth * finalRatio),
      height: Math.round(originalHeight * finalRatio),
    };
  }

  if (fitMode === 'fill') {
    return {
      width: finalTargetWidth,
      height: finalTargetHeight,
    };
  }

  if (fitMode === 'inside') {
    if (originalWidth <= finalTargetWidth && originalHeight <= finalTargetHeight) {
      return originalDimensions;
    }
    const ratioW = finalTargetWidth / originalWidth;
    const ratioH = finalTargetHeight / originalHeight;
    const finalRatio = Math.min(ratioW, ratioH);
    return {
      width: Math.round(originalWidth * finalRatio),
      height: Math.round(originalHeight * finalRatio),
    };
  }

  if (fitMode === 'outside') {
    const ratioW = finalTargetWidth / originalWidth;
    const ratioH = finalTargetHeight / originalHeight;
    const finalRatio = Math.max(ratioW, ratioH);
    return {
      width: Math.round(originalWidth * finalRatio),
      height: Math.round(originalHeight * finalRatio),
    };
  }

  return originalDimensions;
}
export interface ResizeFromSharpStreamPayload {
  stream: Sharp;
  originalMetadata: Metadata | Dimensions;
  options: any;
}

export async function resizeFromSharpStream(
  params: ResizeFromSharpStreamPayload,
): Promise<ResizeResult> {
  const { stream, originalMetadata, options } = params;

  if (!originalMetadata.width || !originalMetadata.height) {
    return { width: originalMetadata.width ?? 0, height: originalMetadata.height ?? 0, resized: false };
  }

  let resizeParams: ResizeOptions | null = null;

  // 比例缩放：resize_scale 为 1-99 的整数百分比
  if (
    options.resize_scale &&
    typeof options.resize_scale === 'number' &&
    options.resize_scale > 0 &&
    options.resize_scale < 100
  ) {
    const scale = options.resize_scale / 100;
    resizeParams = {
      width: Math.round(originalMetadata.width * scale),
      height: Math.round(originalMetadata.height * scale),
      fit: 'fill',
    };
  } else if (
    isValidArray(options.resize_dimensions) &&
    options.resize_dimensions.some((dim: number) => dim > 0)
  ) {
    // 自定义尺寸
    resizeParams = { fit: 'inside' };
    let useFit = false;
    if (options.resize_dimensions[0] > 0) {
      resizeParams.width = options.resize_dimensions[0];
      useFit = true;
    }
    if (options.resize_dimensions[1] > 0) {
      resizeParams.height = options.resize_dimensions[1];
      useFit = true;
    }
    if (options.resize_fit && useFit) {
      resizeParams.fit = options.resize_fit;
    }
    if (!resizeParams.width && !resizeParams.height) {
      resizeParams = null;
    }
  }

  if (resizeParams) {
    stream.resize(resizeParams);
    const tempFilePath = createTempFilePath(`resize_${nanoid()}.webp`, options.temp_dir);
    const info = await stream
      .clone()
      .webp({
        quality: 70,
        force: true,
        effort: 0,
      })
      .toFile(tempFilePath);
    return {
      width: info.width,
      height: info.height,
      resized: true,
    };
  }

  return { ...originalMetadata, resized: false };
}
