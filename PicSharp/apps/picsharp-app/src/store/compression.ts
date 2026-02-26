import { create } from 'zustand';
import EventEmitter from 'eventemitter3';
import { convertFileSrc } from '@tauri-apps/api/core';
import useAppStore from './app';
import { clearImageViewerCache } from '@/components/image-viewer/cache';

interface CompressionState {
  working: boolean;
  inCompressing: boolean;
  watchingFolder: string;
  eventEmitter: EventEmitter;
  files: FileInfo[];
  fileMap: Map<string, FileInfo>;
  selectedFiles: string[];
}

interface CompressionAction {
  setWorking: (value: boolean) => void;
  setInCompressing: (inCompressing: boolean) => void;
  setWatchingFolder: (path: string) => void;
  setFiles: (files: FileInfo[]) => void;
  removeFile: (path: string) => void;
  updateFilePath: (oldPath: string, newPath: string, newName: string) => void;
  reset: () => void;
}

const useCompressionStore = create<CompressionState & CompressionAction>((set, get) => ({
  working: false,
  eventEmitter: new EventEmitter(),
  watchingFolder: '',
  files: [],
  fileMap: new Map(),
  selectedFiles: [],
  inCompressing: false,
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
    set({
      files,
      fileMap: new Map(files.map((file) => [file.path, file])),
      selectedFiles: files.map((file) => file.path),
    });
  },
  removeFile: (path: string) => {
    const targetIndex = get().files.findIndex((file) => file.path === path);
    if (targetIndex !== -1) {
      get().files.splice(targetIndex, 1);
      get().fileMap.delete(path);
      const selectedFiles = get().selectedFiles.filter((file) => file !== path);
      set({
        files: [...get().files],
        fileMap: new Map(get().fileMap),
        selectedFiles,
      });
    }
  },
  updateFilePath: (oldPath: string, newPath: string, newName: string) => {
    const file = get().fileMap.get(oldPath);
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
    const fileMap = new Map(get().fileMap);
    fileMap.delete(oldPath);
    fileMap.set(updated.path, updated);
    const selectedFiles = get().selectedFiles.map((s) => (s === oldPath ? updated.path : s));
    set({ files, fileMap, selectedFiles });
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
    });
  },
}));

export default useCompressionStore;
