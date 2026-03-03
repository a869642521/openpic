import { create } from 'zustand';
import EventEmitter from 'eventemitter3';
import { CompressionOutputMode, ResizeFit } from '@/constants';

export enum ResizeStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

export interface ResizeFileInfo extends Omit<FileInfo, 'status' | 'outputPath'> {
  status: ResizeStatus;
  outputPath?: string;
  errorMessage?: string;
}

interface ResizeOptions {
  dimensions: [number, number];
  fit: ResizeFit;
}

interface ResizeState {
  files: ResizeFileInfo[];
  fileMap: Map<string, ResizeFileInfo>;
  selectedFiles: string[];
  working: boolean;
  inCompressing: boolean;
  outputMode: CompressionOutputMode;
  outputSaveAsFileSuffix: string;
  outputSaveToFolder: string;
  options: ResizeOptions;
  currentBatchTimestamp: number;
  eventEmitter: EventEmitter;
  setFiles: (files: ResizeFileInfo[]) => void;
  setWorking: (working: boolean) => void;
  setInCompressing: (inCompressing: boolean) => void;
  setOutputMode: (mode: CompressionOutputMode) => void;
  setOutputSaveAsFileSuffix: (suffix: string) => void;
  setOutputSaveToFolder: (path: string) => void;
  setOptions: (options: Partial<ResizeOptions>) => void;
  setSelectedFiles: (paths: string[]) => void;
  updateFileItem: (path: string, updates: Partial<ResizeFileInfo>) => void;
  appendFiles: (files: ResizeFileInfo[]) => void;
  reset: () => void;
}

const defaultOptions: ResizeOptions = {
  dimensions: [0, 0],
  fit: ResizeFit.Inside,
};

const useResizeStore = create<ResizeState>((set, get) => ({
  files: [],
  fileMap: new Map(),
  selectedFiles: [],
  working: false,
  inCompressing: false,
  outputMode: CompressionOutputMode.Overwrite,
  outputSaveAsFileSuffix: '_resized',
  outputSaveToFolder: '',
  options: defaultOptions,
  currentBatchTimestamp: 0,
  eventEmitter: new EventEmitter(),

  setFiles: (files) => {
    const fileMap = new Map<string, ResizeFileInfo>();
    files.forEach((f) => fileMap.set(f.path, f));
    set({
      files,
      fileMap,
      selectedFiles: files.map((f) => f.path),
      currentBatchTimestamp: Date.now(),
    });
  },

  setWorking: (working) => set({ working }),
  setInCompressing: (inCompressing) => set({ inCompressing }),
  setOutputMode: (outputMode) => set({ outputMode }),
  setOutputSaveAsFileSuffix: (outputSaveAsFileSuffix) => set({ outputSaveAsFileSuffix }),
  setOutputSaveToFolder: (outputSaveToFolder) => set({ outputSaveToFolder }),
  setOptions: (options) => set((s) => ({ options: { ...s.options, ...options } })),
  setSelectedFiles: (selectedFiles) => set({ selectedFiles }),

  updateFileItem: (path, updates) => {
    const { fileMap, eventEmitter } = get();
    const file = fileMap.get(path);
    if (file) {
      Object.assign(file, updates);
      set({ fileMap: new Map(fileMap) });
      eventEmitter.emit('update_file_item', path);
    }
  },

  appendFiles: (files) => {
    const { files: existing, fileMap, currentBatchTimestamp } = get();
    const tagged = files.map((f) => ({
      ...f,
      batchId: currentBatchTimestamp,
      status: ResizeStatus.Pending,
    }));
    const merged = [...existing, ...tagged];
    const newMap = new Map(fileMap);
    tagged.forEach((f) => newMap.set(f.path, f));
    set({
      files: merged,
      fileMap: newMap,
      selectedFiles: merged.map((f) => f.path),
    });
  },

  reset: () => {
    const { eventEmitter } = useResizeStore.getState();
    eventEmitter.removeAllListeners?.();
    set({
      files: [],
      fileMap: new Map(),
      selectedFiles: [],
      working: false,
    });
  },
}));

export default useResizeStore;
