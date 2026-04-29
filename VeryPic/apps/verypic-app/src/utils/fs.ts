import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { ICompressor } from './compressor';
import { isValidArray } from '.';
import { CompressionOutputMode } from '@/constants';
import { copyFile, exists, remove } from '@tauri-apps/plugin-fs';
import { isMac, isLinux, isWindows } from './platform';

const mags = ' KMGTPEZY';

/** Normalize path for comparison (handles Windows backslash vs forward slash, case on Windows). */
export function normalizePathForCompare(path: string): string {
  let s = String(path || '').trim().replace(/\\/g, '/');
  if (isWindows) s = s.toLowerCase();
  return s;
}

/** Parse size string like "500kb", "500", "1.5MB" to KB (number). Returns 0 if invalid. */
export function parseSizeToKb(input: string): number {
  const s = String(input || '').trim().toLowerCase();
  if (!s) return 0;
  const match = s.match(/^([\d.]+)\s*(k|kb|m|mb|g|gb)?$/);
  if (!match) return 0;
  const num = Number(match[1]);
  if (!Number.isFinite(num) || num < 0) return 0;
  const unit = match[2] || 'k';
  if (unit === 'k' || unit === 'kb') return Math.floor(num);
  if (unit === 'm' || unit === 'mb') return Math.floor(num * 1024);
  if (unit === 'g' || unit === 'gb') return Math.floor(num * 1024 * 1024);
  return Math.floor(num);
}

export function humanSize(bytes: number) {
  if (bytes === 0) {
    return '0B';
  }

  let base = 1024;
  let precision = 1;
  // mac or linux use Base-10 for file size
  if (isMac || isLinux) {
    base = 1000;
  }
  const magnitude = Math.min((Math.log(bytes) / Math.log(base)) | 0, mags.length - 1);
  if (magnitude <= 1) {
    precision = 0;
  }
  const result = bytes / Math.pow(base, magnitude);
  const suffix = mags[magnitude].trim() + 'B';
  return `${Number(result.toFixed(precision))}${suffix}`;
}

export interface ParsePathsItem {
  id: string;
  name: string;
  path: string;
  base_dir: string;
  bytes_size: number;
  disk_size: number;
  ext: string;
  mime_type: string;
}

/** 路径中是否包含 zip/rar（导入时可能较慢，用于进度文案） */
export function pathsIncludeArchive(paths: string[]): boolean {
  return paths.some((p) => /\.(zip|rar)$/i.test(p));
}

export async function parsePaths(paths: string[], validExts: string[]) {
  const candidates = await invoke<ParsePathsItem[]>('ipc_parse_paths', {
    paths,
    validExts,
  });
  if (isValidArray(candidates)) {
    return candidates.map<FileInfo>((item) => {
      return {
        id: item.id,
        path: item.path,
        assetPath: convertFileSrc(item.path),
        name: item.name,
        parentDir: item.base_dir,
        bytesSize: item.bytes_size,
        formattedBytesSize: humanSize(item.bytes_size),
        diskSize: item.disk_size,
        formattedDiskSize: humanSize(item.disk_size),
        mimeType: item.mime_type,
        ext: item.ext,
        compressedBytesSize: 0,
        formattedCompressedBytesSize: '',
        compressedDiskSize: 0,
        formattedCompressedDiskSize: '',
        compressRate: '',
        outputPath: '',
        status: ICompressor.Status.Pending,
        originalTempPath: '',
        originalTempPathConverted: '',
        ssim: 0,
      };
    });
  }
  return [];
}

export async function countValidFiles(paths: string[], validExts: string[]) {
  const count = await invoke<number>('ipc_count_valid_files', {
    paths,
    validExts,
  });
  return count;
}

export function getFilename(path: string): string {
  if (typeof path !== 'string' || !path.trim()) {
    return '';
  }

  const cleanPath = path.trim().replace(/[/\\]+$/, '');

  if (!cleanPath) {
    return '';
  }

  const pathParts = cleanPath.split(/[/\\]+/).filter((part) => part.length > 0);

  if (pathParts.length === 0) {
    return '';
  }

  const filename = pathParts[pathParts.length - 1];

  if (filename.startsWith('.') && filename.indexOf('.', 1) === -1) {
    return filename;
  }

  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === 0) {
    return filename;
  }

  return filename;
}

export async function undoSave(file: FileInfo) {
  if (
    file.status === ICompressor.Status.Completed &&
    file.outputPath &&
    file.originalTempPath &&
    file.originalTempPathConverted &&
    file.saveType
  ) {
    const { path, outputPath, originalTempPath, saveType } = file;
    if (!(await exists(originalTempPath))) {
      return {
        success: false,
        message: 'undo.original_file_not_exists',
      };
    }
    if (saveType === CompressionOutputMode.Overwrite) {
      copyFile(originalTempPath, path);
    } else {
      if (!(await exists(outputPath))) {
        return {
          success: false,
          message: 'undo.output_file_not_exists',
        };
      }
      if (file.path === file.outputPath) {
        copyFile(originalTempPath, path);
      } else {
        remove(outputPath);
      }
    }
    if (isValidArray(file.convertResults)) {
      await Promise.all(
        file.convertResults.map(async (item) => {
          if (item.success && (await exists(item.output_path))) {
            return remove(item.output_path);
          }
          return Promise.resolve();
        }),
      );
    }
    return {
      success: true,
      message: 'undo.success',
    };
  }
  return {
    success: false,
    message: 'undo.no_allow_undo',
  };
}
