import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export interface WatermarkOptions {
  watermarkType: WatermarkType;
  watermarkPosition: WatermarkPosition;
  watermarkText: string;
  watermarkTextColor: string;
  watermarkFontSize: number;
  watermarkImagePath: string;
  watermarkImageOpacity: number;
  watermarkImageScale: number;
  /** 平铺：横向间距 (px) */
  tileGapX: number;
  /** 平铺：纵向间距 (px) */
  tileGapY: number;
  /** 平铺：旋转角度 (度) */
  tileRotation: number;
  /** 水印锚点：原图内水平比例 0–1 */
  positionNormX: number;
  /** 水印锚点：原图内垂直比例 0–1 */
  positionNormY: number;
}

export interface WatermarkPreset {
  name: string;
  options: WatermarkOptions;
  createdAt: number;
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
  presets: WatermarkPreset[];
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
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;
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
  tileGapX: 40,
  tileGapY: 40,
  tileRotation: 0,
  positionNormX: 0.98,
  positionNormY: 0.98,
};

const useWatermarkStore = create<WatermarkState>()(
  persist(
    (set, get) => ({
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
      presets: [],

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

      savePreset: (name: string) => {
        const { options, presets } = get();
        const filtered = presets.filter((p) => p.name !== name);
        set({
          presets: [
            ...filtered,
            { name, options: { ...options }, createdAt: Date.now() },
          ],
        });
      },

      loadPreset: (name: string) => {
        const { presets } = get();
        const preset = presets.find((p) => p.name === name);
        if (preset) {
          set({ options: { ...defaultOptions, ...preset.options } });
        }
      },

      deletePreset: (name: string) => {
        const { presets } = get();
        set({ presets: presets.filter((p) => p.name !== name) });
      },
    }),
    {
      name: 'verypic-watermark',
      merge: (persisted, current) => {
        const p = persisted as Partial<Pick<WatermarkState, 'options' | 'presets' | 'outputMode' | 'outputSaveAsFileSuffix' | 'outputSaveToFolder'>> | undefined;
        if (!p) return current;
        return {
          ...current,
          options: { ...defaultOptions, ...(p.options || {}) },
          presets: p.presets ?? current.presets,
          outputMode: p.outputMode ?? current.outputMode,
          outputSaveAsFileSuffix: p.outputSaveAsFileSuffix ?? current.outputSaveAsFileSuffix,
          outputSaveToFolder: p.outputSaveToFolder ?? current.outputSaveToFolder,
        };
      },
      partialize: (state) => ({
        options: state.options,
        presets: state.presets,
        outputMode: state.outputMode,
        outputSaveAsFileSuffix: state.outputSaveAsFileSuffix,
        outputSaveToFolder: state.outputSaveToFolder,
      }),
    },
  ),
);

export default useWatermarkStore;
