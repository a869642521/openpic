import type { ICompressor } from '../utils/compressor';
import type { CompressionMode, CompressionOutputMode, CompressionType, ConvertFormat, ResizeFit, ResizeMode, WatermarkType } from '../constants';
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
    // 每个文件夹独立的基础压缩设置（新增，可选以兼容旧数据）
    compressionMode?: CompressionMode;
    compressionLevel?: number;
    compressionType?: CompressionType;
    compressionOutput?: CompressionOutputMode;
    saveAsFileSuffix?: string;
    saveToFolder?: string;
    targetSizeEnable?: boolean;
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
    targetSizeAchieved?: boolean;
  }
}

export {};
