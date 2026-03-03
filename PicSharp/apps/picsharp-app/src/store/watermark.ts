import { create } from 'zustand';
import EventEmitter from 'eventemitter3';
import {
  CompressionOutputMode,
  WatermarkType,
  WatermarkPosition,
} from '@/constants';

export enum WatermarkStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

export interface WatermarkFileInfo extends Omit<FileInfo, 'status' | 'outputPath'> {
  status: WatermarkStatus;
  outputPath?: string;
  errorMessage?: string;
}

interface WatermarkOptions {
  watermarkType: WatermarkType;
  watermarkPosition: WatermarkPosition;
  watermarkText: string;
  watermarkTextColor: string;
  watermarkFontSize: number;
  watermarkImagePath: string;
  watermarkImageOpacity: number;
  watermarkImageScale: number;
}

interface WatermarkState {
  files: WatermarkFileInfo[];
  fileMap: Map<string, WatermarkFileInfo>;
  selectedFiles: string[];
  working: boolean;
  inCompressing: boolean;
  outputMode: CompressionOutputMode;
  outputSaveAsFileSuffix: string;
  outputSaveToFolder: string;
  options: WatermarkOptions;
  watermarkImageFileExists: boolean;
  currentBatchTimestamp: number;
  eventEmitter: EventEmitter;
  setFiles: (files: WatermarkFileInfo[]) => void;
  setWorking: (working: boolean) => void;
  setInCompressing: (inCompressing: boolean) => void;
  setOutputMode: (mode: CompressionOutputMode) => void;
  setOutputSaveAsFileSuffix: (suffix: string) => void;
  setOutputSaveToFolder: (path: string) => void;
  setOptions: (options: Partial<WatermarkOptions>) => void;
  setWatermarkImageFileExists: (exists: boolean) => void;
  setSelectedFiles: (paths: string[]) => void;
  updateFileItem: (path: string, updates: Partial<WatermarkFileInfo>) => void;
  appendFiles: (files: WatermarkFileInfo[]) => void;
  reset: () => void;
}

const defaultOptions: WatermarkOptions = {
  watermarkType: WatermarkType.Text,
  watermarkPosition: WatermarkPosition.BottomRight,
  watermarkText: '',
  watermarkTextColor: '#FFFFFF',
  watermarkFontSize: 16,
  watermarkImagePath: '',
  watermarkImageOpacity: 1,
  watermarkImageScale: 0.15,
};

const useWatermarkStore = create<WatermarkState>((set, get) => ({
  files: [],
  fileMap: new Map(),
  selectedFiles: [],
  working: false,
  inCompressing: false,
  outputMode: CompressionOutputMode.Overwrite,
  outputSaveAsFileSuffix: '_watermark',
  outputSaveToFolder: '',
  options: defaultOptions,
  watermarkImageFileExists: false,
  currentBatchTimestamp: 0,
  eventEmitter: new EventEmitter(),

  setFiles: (files) => {
    const fileMap = new Map<string, WatermarkFileInfo>();
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

  setOptions: (options) =>
    set((s) => ({ options: { ...s.options, ...options } })),

  setWatermarkImageFileExists: (watermarkImageFileExists) => set({ watermarkImageFileExists }),

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
      status: WatermarkStatus.Pending as WatermarkStatus,
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
    const { eventEmitter } = useWatermarkStore.getState();
    eventEmitter.removeAllListeners?.();
    set({
      files: [],
      fileMap: new Map(),
      selectedFiles: [],
      working: false,
    });
  },
}));

export default useWatermarkStore;
