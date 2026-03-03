import Scheduler from './scheduler';
import { CompressionOutputMode, ResizeFit } from '@/constants';
import type { ResizeFileInfo } from '@/store/resize';

export interface ResizeOptions {
  sidecarDomain: string;
  outputMode: CompressionOutputMode;
  newFileSuffix: string;
  newFolderPath: string;
  dimensions: [number, number];
  fit: ResizeFit;
  concurrency?: number;
}

export interface ResizeResult {
  success: boolean;
  input_path: string;
  output_path?: string;
  output_size?: number;
  input_size?: number;
  error_msg?: string;
}

const saveModeMap = {
  [CompressionOutputMode.Overwrite]: 'overwrite',
  [CompressionOutputMode.SaveAsNewFile]: 'save_as_new_file',
  [CompressionOutputMode.SaveToNewFolder]: 'save_to_new_folder',
} as const;

export async function resizeImages(
  files: ResizeFileInfo[],
  options: ResizeOptions,
  onFulfilled: (res: ResizeResult) => void,
  onRejected: (res: { input_path: string; error: string }) => void,
) {
  const baseUrl = options.sidecarDomain.replace(/\/$/, '');
  const url = `${baseUrl}/api/resize`;

  const payload = {
    options: {
      resize_dimensions: options.dimensions,
      resize_fit: options.fit,
    },
    save: {
      mode: saveModeMap[options.outputMode],
      new_file_suffix: options.newFileSuffix,
      new_folder_path: options.newFolderPath,
    },
  };

  const scheduler = new Scheduler({
    concurrency: options.concurrency ?? 6,
  });

  const tasks = files.map(
    (file) => async () => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            input_path: file.path,
          }),
        });
        let data: any = {};
        try {
          data = await res.json();
        } catch (_) {
          data = { err_msg: 'Invalid response', error_msg: 'Invalid response' };
        }
        if (!res.ok) {
          const err = { input_path: file.path, error: data.err_msg || data.error_msg || 'Request failed' };
          onRejected(err);
          throw err;
        }
        if (data.success) {
          onFulfilled(data);
          return data;
        }
        const err = {
          input_path: data.input_path || file.path,
          error: data.error_msg || 'Unknown error',
        };
        onRejected(err);
        throw err;
      } catch (e: any) {
        const err =
          e?.input_path !== undefined
            ? e
            : { input_path: file.path, error: e?.message || String(e) };
        onRejected(err);
        throw err;
      }
    },
  );

  scheduler.setTasks(tasks);
  await scheduler.run();
}
