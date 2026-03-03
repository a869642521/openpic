import { create } from 'zustand';
import EventEmitter from 'eventemitter3';
import { convertFileSrc } from '@tauri-apps/api/core';
import useAppStore from './app';
import { clearImageViewerCache } from '@/components/image-viewer/cache';
import { normalizePathForCompare } from '@/utils/fs';
import { ConvertFormat, ResizeFit, WatermarkType, WatermarkPosition, TinypngMetadata } from '@/constants';

export type CompressionModeType = 'classic' | 'watch';

export const defaultWatchFolderSettings: WatchFolderSettings = {
  sizeFilterEnable: false,
  sizeFilterValue: 500,
  preserveMetadata: [],
  convertEnable: false,
  convertTypes: [] as ConvertFormat[],
  convertAlpha: '#ffffff',
  resizeEnable: false,
  resizeDimensions: [0, 0],
  resizeFit: ResizeFit.Inside,
  watermarkType: WatermarkType.None,
  watermarkText: '',
  watermarkTextColor: '#ffffff',
  watermarkFontSize: 24,
  watermarkPosition: WatermarkPosition.BottomRight,
  watermarkImagePath: '',
  watermarkImageOpacity: 0.8,
  watermarkImageScale: 0.2,
};

interface CompressionState {
  mode: CompressionModeType;
  working: boolean;
  inCompressing: boolean;
  /** 最近一次压缩完成的时间戳，新拖入文件使用此值作为 batchId */
  currentBatchTimestamp: number;
  watchFolders: WatchFolder[];
  eventEmitter: EventEmitter;
  files: FileInfo[];
  fileMap: Map<string, FileInfo>;
  selectedFiles: string[];
  classicFiles: FileInfo[];
  classicFileMap: Map<string, FileInfo>;
  classicSelectedFiles: string[];
  watchFiles: FileInfo[];
  watchFileMap: Map<string, FileInfo>;
  watchSelectedFiles: string[];
}

interface CompressionAction {
  setMode: (mode: CompressionModeType) => void;
  setWorking: (value: boolean) => void;
  setInCompressing: (inCompressing: boolean) => void;
  setCurrentBatchTimestamp: (ts: number) => void;
  // Watch folder management
  addWatchFolder: (folder: WatchFolder) => void;
  removeWatchFolder: (id: string) => void;
  updateWatchFolderSettings: (id: string, settings: Partial<WatchFolderSettings>) => void;
  updateWatchFolderStatus: (id: string, status: WatchFolder['status']) => void;
  updateWatchFolderStats: (id: string, stats: WatchFolder['stats']) => void;
  // File management
  setFiles: (files: FileInfo[]) => void;
  setClassicFiles: (files: FileInfo[]) => void;
  setWatchFiles: (files: FileInfo[]) => void;
  appendWatchFiles: (files: FileInfo[]) => void;
  appendClassicFiles: (files: FileInfo[]) => void;
  setSelectedFiles: (selectedFiles: string[]) => void;
  removeFile: (path: string) => void;
  updateFilePath: (oldPath: string, newPath: string, newName: string) => void;
  reset: () => void;
  resetClassic: () => void;
  resetWatch: () => void;
  resetWatchOnly: () => void;
}

function syncViewFromMode(state: Partial<CompressionState>, mode: CompressionModeType) {
  if (mode === 'classic') {
    return {
      files: state.classicFiles ?? [],
      fileMap: state.classicFileMap ?? new Map(),
      selectedFiles: state.classicSelectedFiles ?? [],
    };
  }
  return {
    files: state.watchFiles ?? [],
    fileMap: state.watchFileMap ?? new Map(),
    selectedFiles: state.watchSelectedFiles ?? [],
  };
}

const useCompressionStore = create<CompressionState & CompressionAction>((set, get) => ({
  mode: 'classic',
  working: false,
  eventEmitter: new EventEmitter(),
  watchFolders: [],
  files: [],
  fileMap: new Map(),
  selectedFiles: [],
  classicFiles: [],
  classicFileMap: new Map(),
  classicSelectedFiles: [],
  watchFiles: [],
  watchFileMap: new Map(),
  watchSelectedFiles: [],
  inCompressing: false,
  currentBatchTimestamp: 0,

  setCurrentBatchTimestamp: (ts: number) => {
    set({ currentBatchTimestamp: ts });
  },

  setMode: (mode: CompressionModeType) => {
    const state = get();
    const view = syncViewFromMode(state, mode);
    set({ mode, ...view });
  },

  setWorking: (value: boolean) => {
    set({ working: value });
  },
  setInCompressing: (inCompressing: boolean) => {
    set({ inCompressing });
  },

  // Watch folder management
  addWatchFolder: (folder: WatchFolder) => {
    const { watchFolders } = get();
    set({ watchFolders: [...watchFolders, folder] });
  },

  removeWatchFolder: (id: string) => {
    const { watchFolders, watchFiles, mode } = get();
    const newFolders = watchFolders.filter((f) => f.id !== id);
    // Also remove all files belonging to this folder
    const newFiles = watchFiles.filter((f) => f.watchFolderId !== id);
    const fileMap = new Map(newFiles.map((f) => [f.path, f]));
    const selectedFiles = newFiles.map((f) => f.path);
    const patch: Partial<CompressionState> = {
      watchFolders: newFolders,
      watchFiles: newFiles,
      watchFileMap: fileMap,
      watchSelectedFiles: selectedFiles,
    };
    if (mode === 'watch') {
      Object.assign(patch, { files: newFiles, fileMap, selectedFiles });
    }
    set(patch);
  },

  updateWatchFolderSettings: (id: string, settings: Partial<WatchFolderSettings>) => {
    const { watchFolders } = get();
    const newFolders = watchFolders.map((f) =>
      f.id === id ? { ...f, settings: { ...f.settings, ...settings } } : f,
    );
    set({ watchFolders: newFolders });
  },

  updateWatchFolderStatus: (id: string, status: WatchFolder['status']) => {
    const { watchFolders } = get();
    const newFolders = watchFolders.map((f) => (f.id === id ? { ...f, status } : f));
    set({ watchFolders: newFolders });
  },

  updateWatchFolderStats: (id: string, stats: WatchFolder['stats']) => {
    const { watchFolders } = get();
    const newFolders = watchFolders.map((f) => (f.id === id ? { ...f, stats } : f));
    set({ watchFolders: newFolders });
  },

  setFiles: (files: FileInfo[]) => {
    const { mode } = get();
    const fileMap = new Map(files.map((file) => [file.path, file]));
    const selectedFiles = files.map((file) => file.path);
    if (mode === 'classic') {
      set({
        classicFiles: files,
        classicFileMap: fileMap,
        classicSelectedFiles: selectedFiles,
        files,
        fileMap,
        selectedFiles,
      });
    } else {
      set({
        watchFiles: files,
        watchFileMap: fileMap,
        watchSelectedFiles: selectedFiles,
        files,
        fileMap,
        selectedFiles,
      });
    }
  },

  setClassicFiles: (files: FileInfo[]) => {
    const deduped = Array.from(new Map(files.map((f) => [f.path, f])).values());
    const fileMap = new Map(deduped.map((file) => [file.path, file]));
    const selectedFiles = deduped.map((file) => file.path);
    const { mode } = get();
    const patch: Partial<CompressionState> = {
      classicFiles: deduped,
      classicFileMap: fileMap,
      classicSelectedFiles: selectedFiles,
    };
    if (mode === 'classic') {
      Object.assign(patch, { files: deduped, fileMap, selectedFiles });
    }
    set(patch);
  },

  setWatchFiles: (files: FileInfo[]) => {
    const fileMap = new Map(files.map((file) => [file.path, file]));
    const selectedFiles = files.map((file) => file.path);
    const { mode } = get();
    const patch: Partial<CompressionState> = {
      watchFiles: files,
      watchFileMap: fileMap,
      watchSelectedFiles: selectedFiles,
    };
    if (mode === 'watch') {
      Object.assign(patch, { files, fileMap, selectedFiles });
    }
    set(patch);
  },

  appendClassicFiles: (newFiles: FileInfo[]) => {
    const { classicFiles, classicFileMap, mode } = get();
    const uniqueNew = newFiles.filter((f) => !classicFileMap.has(f.path));
    if (uniqueNew.length === 0) return;
    const merged = [...uniqueNew, ...classicFiles];
    const fileMap = new Map(merged.map((file) => [file.path, file]));
    const selectedFiles = merged.map((file) => file.path);
    const patch: Partial<CompressionState> = {
      classicFiles: merged,
      classicFileMap: fileMap,
      classicSelectedFiles: selectedFiles,
    };
    if (mode === 'classic') {
      Object.assign(patch, { files: merged, fileMap, selectedFiles });
    }
    set(patch);
  },

  appendWatchFiles: (newFiles: FileInfo[]) => {
    const { watchFiles, mode } = get();
    const merged = [...watchFiles, ...newFiles];
    const fileMap = new Map(merged.map((file) => [file.path, file]));
    const selectedFiles = merged.map((file) => file.path);
    const patch: Partial<CompressionState> = {
      watchFiles: merged,
      watchFileMap: fileMap,
      watchSelectedFiles: selectedFiles,
    };
    if (mode === 'watch') {
      Object.assign(patch, { files: merged, fileMap, selectedFiles });
    }
    set(patch);
  },

  setSelectedFiles: (selectedFiles: string[]) => {
    const { mode } = get();
    if (mode === 'classic') {
      set({ classicSelectedFiles: selectedFiles, selectedFiles });
    } else {
      set({ watchSelectedFiles: selectedFiles, selectedFiles });
    }
  },

  removeFile: (path: string) => {
    const { mode, files, fileMap, selectedFiles } = get();
    const targetIndex = files.findIndex((file) => file.path === path);
    if (targetIndex === -1) return;
    const newFiles = files.filter((f) => f.path !== path);
    const newFileMap = new Map(fileMap);
    newFileMap.delete(path);
    const newSelectedFiles = selectedFiles.filter((s) => s !== path);
    if (mode === 'classic') {
      set({
        classicFiles: newFiles,
        classicFileMap: newFileMap,
        classicSelectedFiles: newSelectedFiles,
        files: newFiles,
        fileMap: newFileMap,
        selectedFiles: newSelectedFiles,
      });
    } else {
      set({
        watchFiles: newFiles,
        watchFileMap: newFileMap,
        watchSelectedFiles: newSelectedFiles,
        files: newFiles,
        fileMap: newFileMap,
        selectedFiles: newSelectedFiles,
      });
    }
  },

  updateFilePath: (oldPath: string, newPath: string, newName: string) => {
    const { mode, fileMap } = get();
    const file = fileMap.get(oldPath);
    if (!file) return;
    const isCompleted = file.status === 'completed';
    const updated: FileInfo = {
      ...file,
      name: newName,
      path: newPath,
      assetPath: convertFileSrc(newPath),
    };
    // 覆盖模式下 outputPath 与 path 相同，重命名后需同步更新
    if (isCompleted && file.outputPath && normalizePathForCompare(file.outputPath) === normalizePathForCompare(oldPath)) {
      updated.outputPath = newPath;
    }
    const files = get().files.map((f) => (f.path === oldPath ? updated : f));
    const newFileMap = new Map(get().fileMap);
    newFileMap.delete(oldPath);
    newFileMap.set(updated.path, updated);
    const newSelectedFiles = get().selectedFiles.map((s) => (s === oldPath ? updated.path : s));
    if (mode === 'classic') {
      set({
        classicFiles: files,
        classicFileMap: newFileMap,
        classicSelectedFiles: newSelectedFiles,
        files,
        fileMap: newFileMap,
        selectedFiles: newSelectedFiles,
      });
    } else {
      set({
        watchFiles: files,
        watchFileMap: newFileMap,
        watchSelectedFiles: newSelectedFiles,
        files,
        fileMap: newFileMap,
        selectedFiles: newSelectedFiles,
      });
    }
  },

  reset: () => {
    clearImageViewerCache();
    useAppStore.getState().clearImageCache();
    set({
      working: false,
      inCompressing: false,
      watchFolders: [],
      files: [],
      fileMap: new Map(),
      selectedFiles: [],
      classicFiles: [],
      classicFileMap: new Map(),
      classicSelectedFiles: [],
      watchFiles: [],
      watchFileMap: new Map(),
      watchSelectedFiles: [],
    });
  },

  resetClassic: () => {
    const { mode } = get();
    const patch: Partial<CompressionState> = {
      classicFiles: [],
      classicFileMap: new Map(),
      classicSelectedFiles: [],
    };
    if (mode === 'classic') {
      Object.assign(patch, { files: [], fileMap: new Map(), selectedFiles: [] });
    }
    set(patch);
  },

  resetWatch: () => {
    const { mode } = get();
    const patch: Partial<CompressionState> = {
      working: false,
      watchFolders: [],
      watchFiles: [],
      watchFileMap: new Map(),
      watchSelectedFiles: [],
    };
    if (mode === 'watch') {
      Object.assign(patch, { files: [], fileMap: new Map(), selectedFiles: [] });
    }
    set(patch);
  },

  resetWatchOnly: () => {
    set({
      working: false,
      watchFolders: [],
    });
  },
}));

export default useCompressionStore;
