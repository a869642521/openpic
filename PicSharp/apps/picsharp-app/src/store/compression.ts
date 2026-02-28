import { create } from 'zustand';
import EventEmitter from 'eventemitter3';
import { convertFileSrc } from '@tauri-apps/api/core';
import useAppStore from './app';
import { clearImageViewerCache } from '@/components/image-viewer/cache';

export type CompressionModeType = 'classic' | 'watch';

interface CompressionState {
  mode: CompressionModeType;
  working: boolean;
  inCompressing: boolean;
  watchingFolder: string;
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
  watchFolderStats:
    | {
        totalCount: number;
        totalBytes: number;
      }
    | { failed: true }
    | null;
}

interface CompressionAction {
  setMode: (mode: CompressionModeType) => void;
  setWorking: (value: boolean) => void;
  setInCompressing: (inCompressing: boolean) => void;
  setWatchingFolder: (path: string) => void;
  setFiles: (files: FileInfo[]) => void;
  setClassicFiles: (files: FileInfo[]) => void;
  setWatchFiles: (files: FileInfo[]) => void;
  appendWatchFiles: (files: FileInfo[]) => void;
  setSelectedFiles: (selectedFiles: string[]) => void;
  removeFile: (path: string) => void;
  updateFilePath: (oldPath: string, newPath: string, newName: string) => void;
  reset: () => void;
  resetClassic: () => void;
  resetWatch: () => void;
  resetWatchOnly: () => void;
  setWatchFolderStats: (
    stats:
      | { totalCount: number; totalBytes: number }
      | { failed: true }
      | null,
  ) => void;
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
  watchingFolder: '',
  files: [],
  fileMap: new Map(),
  selectedFiles: [],
  classicFiles: [],
  classicFileMap: new Map(),
  classicSelectedFiles: [],
  watchFiles: [],
  watchFileMap: new Map(),
  watchSelectedFiles: [],
  watchFolderStats: null,
  inCompressing: false,

  setWatchFolderStats: (stats) => {
    set({ watchFolderStats: stats });
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
  setWatchingFolder: (path) => {
    set({ watchingFolder: path });
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
    const fileMap = new Map(files.map((file) => [file.path, file]));
    const selectedFiles = files.map((file) => file.path);
    const { mode } = get();
    const patch: Partial<CompressionState> = {
      classicFiles: files,
      classicFileMap: fileMap,
      classicSelectedFiles: selectedFiles,
    };
    if (mode === 'classic') {
      Object.assign(patch, { files, fileMap, selectedFiles });
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
    };
    if (isCompleted) {
      updated.outputPath = newPath;
      updated.assetPath = convertFileSrc(newPath);
    } else {
      updated.path = newPath;
      updated.assetPath = convertFileSrc(newPath);
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
      watchingFolder: '',
      files: [],
      fileMap: new Map(),
      selectedFiles: [],
      classicFiles: [],
      classicFileMap: new Map(),
      classicSelectedFiles: [],
      watchFiles: [],
      watchFileMap: new Map(),
      watchSelectedFiles: [],
      watchFolderStats: null,
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
      watchingFolder: '',
      watchFiles: [],
      watchFileMap: new Map(),
      watchSelectedFiles: [],
      watchFolderStats: null,
    };
    if (mode === 'watch') {
      Object.assign(patch, { files: [], fileMap: new Map(), selectedFiles: [] });
    }
    set(patch);
  },

  resetWatchOnly: () => {
    set({
      working: false,
      watchingFolder: '',
      watchFolderStats: null,
    });
  },
}));

export default useCompressionStore;
