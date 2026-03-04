import type { ICompressor } from '../utils/compressor';
import type { CompressionOutputMode, ConvertFormat, ResizeFit, ResizeMode, WatermarkType } from '../constants';
import type { TinypngMetadata } from '../constants';

declare global {
  interface ConvertResult {
    success: boolean;
    output_path: string;
    format: string;
    error_msg?: string;
    info: {
      format: string;
      width: number;
      height: number;
      channels: number;
      premultiplied: boolean;
      size: number;
    };
  }

  interface WatchFolderSettings {
    compressionEnable: boolean;
    sizeFilterEnable: boolean;
    sizeFilterValue: number;
    preserveMetadata: TinypngMetadata[];
    convertEnable: boolean;
    convertTypes: ConvertFormat[];
    convertAlpha: string;
    resizeEnable: boolean;
    resizeMode: ResizeMode;
    resizeScale: number;
    resizeDimensions: [number, number];
    resizeFit: ResizeFit;
    watermarkEnable: boolean;
    watermarkType: WatermarkType;
    watermarkText: string;
    watermarkTextColor: string;
    watermarkFontSize: number;
    watermarkPosition: string;
    watermarkImagePath: string;
    watermarkImageOpacity: number;
    watermarkImageScale: number;
  }

  interface WatchFolder {
    id: string;
    path: string;
    addMode: 'monitor_only' | 'compress_then_monitor' | null;
    status: 'monitoring' | 'paused' | 'stopped' | 'error';
    settings: WatchFolderSettings;
    stats: { totalCount: number; totalBytes: number } | { failed: true } | null;
  }

  interface FileInfo {
    id: string;
    name: string;
    path: string;
    batchId?: number;
    watchFolderId?: string;
    parentDir: string;
    assetPath: string;
    bytesSize: number;
    formattedBytesSize: string;
    diskSize: number;
    formattedDiskSize: string;
    ext: string;
    mimeType: string;
    compressedBytesSize: number;
    formattedCompressedBytesSize: string;
    compressedDiskSize: number;
    formattedCompressedDiskSize: string;
    compressRate: string;
    outputPath: string;
    status: ICompressor.Status;
    originalTempPath: string;
    originalTempPathConverted: string;
    errorMessage?: string;
    saveType?: CompressionOutputMode;
    convertResults?: ConvertResult[];
    ssim: number;
  }
}

export {};
