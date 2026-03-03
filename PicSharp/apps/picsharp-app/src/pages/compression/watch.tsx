import { useEffect, useRef, useContext, createContext, useCallback } from 'react';
import { debounce } from 'radash';
import useCompressionStore from '@/store/compression';
import WatchFolderList from './watch-folder-list';

export const WatchContext = createContext<{
  startWatching: (folder: WatchFolder) => void;
  stopWatching: (folderId: string) => void;
}>({
  startWatching: () => {},
  stopWatching: () => {},
});
import { parsePaths, humanSize, normalizePathForCompare } from '@/utils/fs';
import { VALID_IMAGE_EXTS } from '@/constants';
import { isValidArray, correctFloat } from '@/utils';
import Compressor, { ICompressor } from '@/utils/compressor';
import { SettingsKey, TinypngMetadata } from '@/constants';
import { isString } from 'radash';
import { useI18n } from '@/i18n';
import useSettingsStore from '@/store/settings';
import { useNavigate } from '../../hooks/useNavigate';
import { sendTextNotification } from '@/utils/notification';
import useAppStore from '@/store/app';
import { convertFileSrc } from '@tauri-apps/api/core';
import { AppContext } from '@/routes';
import { CompressionContext } from '.';
import { message } from '@/components/message';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useReport } from '@/hooks/useReport';
import { captureError } from '@/utils';
import { exists } from '@tauri-apps/plugin-fs';
import { dirname } from '@tauri-apps/api/path';

function CompressionWatch() {
  const { progressRef } = useContext(CompressionContext);
  const navigate = useNavigate();
  const t = useI18n();
  const { messageApi } = useContext(AppContext);
  const r = useReport();

  // 每个文件夹对应独立的 SSE 控制器、压缩队列、防抖处理器
  const sseControllersRef = useRef<Map<string, AbortController>>(new Map());
  const queuesRef = useRef<Map<string, string[]>>(new Map());
  const historysRef = useRef<Map<string, Set<string>>>(new Map());
  const isFirstInitRef = useRef<Map<string, boolean>>(new Map());

  const alert = async (title: string, content: string = '') => {
    sendTextNotification(title, content);
    message?.error({ title, description: content });
  };

  /** 压缩指定文件，使用文件夹自己的设置 */
  const handleCompress = async (
    files: FileInfo[],
    folder: WatchFolder,
    onProgress?: () => void,
  ) => {
    let fulfilled = 0;
    let rejected = 0;
    const rejectedList = [];
    const startTime = Date.now();
    try {
      const { sidecar, imageTempDir } = useAppStore.getState();
      const { fileMap, eventEmitter } = useCompressionStore.getState();

      const {
        [SettingsKey.TinypngApiKeys]: tinypngApiKeys,
        [SettingsKey.CompressionMode]: compressionMode,
        [SettingsKey.CompressionOutput]: outputMode,
        [SettingsKey.CompressionOutputSaveToFolder]: saveToFolder,
        [SettingsKey.CompressionOutputSaveAsFileSuffix]: saveAsFileSuffix,
        [SettingsKey.CompressionThresholdEnable]: thresholdEnable,
        [SettingsKey.CompressionThresholdValue]: thresholdValue,
        [SettingsKey.CompressionLevel]: compressionLevel,
        [SettingsKey.CompressionType]: compressionType,
      } = useSettingsStore.getState();

      // 使用文件夹独立设置（兼容旧版 keepMetadata boolean）
      const folderSettings = folder.settings;
      const preserveMetadata =
        folderSettings.preserveMetadata ??
        ('keepMetadata' in folderSettings && (folderSettings as any).keepMetadata
          ? [TinypngMetadata.Copyright, TinypngMetadata.Creator, TinypngMetadata.Location]
          : []);
      const {
        convertEnable,
        convertTypes,
        convertAlpha,
        resizeEnable,
        resizeDimensions,
        resizeFit,
        watermarkType,
        watermarkPosition,
        watermarkText,
        watermarkTextColor,
        watermarkFontSize,
        watermarkImagePath,
        watermarkImageOpacity,
        watermarkImageScale,
      } = folderSettings;

      eventEmitter.emit('update_file_item', 'all');

      await new Compressor({
        compressionMode,
        compressionLevel,
        compressionType,
        limitCompressRate: thresholdEnable ? thresholdValue : undefined,
        tinifyApiKeys: tinypngApiKeys.map((key) => key.api_key),
        save: {
          mode: outputMode,
          newFileSuffix: saveAsFileSuffix,
          newFolderPath: saveToFolder,
        },
        tempDir: imageTempDir,
        sidecarDomain: sidecar?.origin,
        convertEnable,
        convertTypes,
        convertAlpha,
        resizeDimensions,
        resizeEnable,
        resizeFit,
        watermarkType,
        watermarkPosition,
        watermarkText,
        watermarkTextColor,
        watermarkFontSize,
        watermarkImagePath,
        watermarkImageOpacity,
        watermarkImageScale,
        preserveMetadata,
      }).compress(
        files,
        (res) => {
          onProgress?.();
          const targetFile = fileMap.get(res.input_path);
          if (targetFile) {
            fulfilled++;
            targetFile.status = ICompressor.Status.Completed;
            if (res.compression_rate > 0) {
              targetFile.compressedBytesSize = res.output_size;
              targetFile.compressedDiskSize = res.output_size;
              targetFile.formattedCompressedBytesSize = humanSize(res.output_size);
              targetFile.compressRate = `${correctFloat(res.compression_rate * 100)}%`;
            } else {
              targetFile.compressedBytesSize = targetFile.bytesSize;
              targetFile.compressedDiskSize = targetFile.diskSize;
              targetFile.formattedCompressedBytesSize = humanSize(targetFile.bytesSize);
              targetFile.compressRate = '0%';
            }
            targetFile.assetPath = convertFileSrc(res.output_path);
            targetFile.outputPath = res.output_path;
            targetFile.originalTempPath = res.original_temp_path;
            targetFile.originalTempPathConverted = convertFileSrc(res.original_temp_path);
            targetFile.saveType = outputMode;
            // 记录到该文件夹的历史 hash
            const folderHistory = historysRef.current.get(folder.id);
            if (folderHistory) folderHistory.add(res.hash);
            if (isValidArray(res.convert_results)) {
              targetFile.convertResults = res.convert_results;
            }
          } else {
            rejected++;
            rejectedList.push(res);
            r('file_not_found_after_compression', { success: true, data: res });
          }
          eventEmitter.emit('update_file_item', res.input_path);
        },
        (res) => {
          onProgress?.();
          rejected++;
          rejectedList.push(res);
          const targetFile = fileMap.get(res.input_path);
          if (targetFile) {
            targetFile.status = ICompressor.Status.Failed;
            if (isString(res.error)) {
              targetFile.errorMessage = res.error;
            } else {
              targetFile.errorMessage = res.error.toString();
            }
            eventEmitter.emit('update_file_item', targetFile.path);
          } else {
            r('file_not_found_after_compression', { success: false, data: res });
          }
        },
      );
      messageApi?.success(
        t('tips.compress_completed', { fulfilled, rejected, total: files.length }),
      );
      sendTextNotification(
        t('common.compress_completed'),
        t('tips.compress_completed', { fulfilled, rejected, total: files.length }),
      );
      r('watch_compress_completed', {
        fulfilled,
        rejected,
        total: files.length,
        folderId: folder.id,
        costTime: Date.now() - startTime,
      });
    } catch (error) {
      captureError(error);
      r('watch_compress_failed', {
        fulfilled,
        rejected,
        total: files.length,
        folderId: folder.id,
        error: error.toString(),
        costTime: Date.now() - startTime,
      });
      messageApi?.error(t('common.compress_failed_msg'));
      sendTextNotification(t('common.compress_failed'), t('common.compress_failed_msg'));
    }
  };

  /** 获取文件夹当前最新的设置（从 store 中实时读取） */
  const getFolderSettings = (folderId: string) => {
    const { watchFolders } = useCompressionStore.getState();
    return watchFolders.find((f) => f.id === folderId);
  };

  /** 创建一个文件夹的防抖压缩处理器 */
  const createThrottledProcessor = (folderId: string) => {
    return debounce({ delay: 1000 }, () => {
      const queue = queuesRef.current.get(folderId);
      if (!isValidArray(queue)) return;
      const paths = [...queue];
      queuesRef.current.set(folderId, []);

      const folder = getFolderSettings(folderId);
      if (!folder) return;

      const { sizeFilterEnable, sizeFilterValue } = folder.settings;

      parsePaths(paths, VALID_IMAGE_EXTS)
        .then((candidates) => {
          if (isValidArray(candidates)) {
            const sizeFilterBytes = sizeFilterEnable ? sizeFilterValue * 1024 : 0;
            const filtered =
              sizeFilterBytes > 0
                ? candidates.filter((f) => (f.bytesSize || 0) >= sizeFilterBytes)
                : candidates;
            if (isValidArray(filtered)) {
              const { appendWatchFiles } = useCompressionStore.getState();
              appendWatchFiles(
                filtered.map((item) => ({
                  ...item,
                  watchFolderId: folderId,
                  status: ICompressor.Status.Processing,
                })),
              );
              handleCompress(filtered, folder);
            }
          }
        })
        .catch(captureError);
    });
  };

  const throttledProcessorsRef = useRef<Map<string, ReturnType<typeof debounce>>>(new Map());

  /** 启动一个文件夹的 SSE 监听 */
  const startWatching = useCallback((folder: WatchFolder) => {
    const { sidecar } = useAppStore.getState();
    if (!sidecar?.origin) return;

    const { compression_watch_file_ignore: ignores = [] } = useSettingsStore.getState();
    const ctrl = new AbortController();
    sseControllersRef.current.set(folder.id, ctrl);
    historysRef.current.set(folder.id, new Set());
    queuesRef.current.set(folder.id, []);
    isFirstInitRef.current.set(folder.id, true);

    const processor = createThrottledProcessor(folder.id);
    throttledProcessorsRef.current.set(folder.id, processor);

    const { updateWatchFolderStatus } = useCompressionStore.getState();

    fetchEventSource(`${sidecar.origin}/stream/watch/new-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer picsharp_sidecar`,
      },
      body: JSON.stringify({ path: folder.path, ignores }),
      signal: ctrl.signal,
      openWhenHidden: true,
      onopen: async (response) => {
        if (response.ok && response.headers.get('content-type') === 'text/event-stream') {
          console.log(`[Watch] SSE opened for ${folder.path}`);
          isFirstInitRef.current.set(folder.id, false);
          updateWatchFolderStatus(folder.id, 'monitoring');
        } else {
          alert(t('tips.watch_service_startup_failed'));
        }
      },
      async onmessage(msg) {
        const currentFolder = getFolderSettings(folder.id);
        if (!currentFolder) return;

        if (msg.event === 'ready') {
          console.log(`[Watch] SSE ready for ${folder.path}`);
          // 仅当是第一个文件夹初始化时关闭全局进度条
          const { watchFolders } = useCompressionStore.getState();
          if (watchFolders.length > 0 && watchFolders[0].id === folder.id) {
            progressRef.current?.done();
          }
        } else if (msg.event === 'add') {
          const payload = JSON.parse(msg.data);
          const path = payload.fullPath;
          const hash = payload.content_hash;
          const folderHistory = historysRef.current.get(folder.id) || new Set();
          const inHistory = folderHistory.has(hash);

          if (!inHistory) {
            const q = queuesRef.current.get(folder.id) || [];
            q.push(path);
            queuesRef.current.set(folder.id, q);
          } else {
            parsePaths([path], VALID_IMAGE_EXTS)
              .then((candidates) => {
                if (isValidArray(candidates)) {
                  const { sizeFilterEnable, sizeFilterValue } = currentFolder.settings;
                  const sizeFilterBytes = sizeFilterEnable ? sizeFilterValue * 1024 : 0;
                  const filtered =
                    sizeFilterBytes > 0
                      ? candidates.filter((f) => (f.bytesSize || 0) >= sizeFilterBytes)
                      : candidates;
                  if (isValidArray(filtered)) {
                    useCompressionStore.getState().appendWatchFiles(
                      filtered.map((item) => ({
                        ...item,
                        watchFolderId: folder.id,
                        status: ICompressor.Status.Pending,
                      })),
                    );
                    useCompressionStore.getState().eventEmitter.emit('update_file_item', 'all');
                  }
                }
              })
              .catch(captureError);
          }
          const proc = throttledProcessorsRef.current.get(folder.id);
          if (proc) proc();
        } else if (msg.event === 'rename') {
          const payload = JSON.parse(msg.data);
          const oldPath = payload.oldPath;
          const newPath = payload.newPath;
          const newData = payload.newData || payload.to;
          const newName = newData?.name || newPath?.split(/[/\\]/).filter(Boolean).pop() || '';
          if (!oldPath || !newPath) return;

          const folderNorm = normalizePathForCompare(currentFolder.path);
          const newPathNorm = normalizePathForCompare(newPath);
          const isStillInWatch =
            newPathNorm === folderNorm || newPathNorm.startsWith(folderNorm + '/');

          const { fileMap, updateFilePath, eventEmitter, removeFile } =
            useCompressionStore.getState();
          const matchedPath = Array.from(fileMap.keys()).find(
            (p) => normalizePathForCompare(p) === normalizePathForCompare(oldPath),
          );
          if (matchedPath) {
            if (isStillInWatch) {
              updateFilePath(matchedPath, newPath, newName);
            } else {
              removeFile(matchedPath);
            }
            eventEmitter.emit('update_file_item', 'all');
          }
        } else if (msg.event === 'remove') {
          const payload = JSON.parse(msg.data);
          const removedPath = payload.fullPath;
          if (!removedPath) return;
          const removedPathNorm = normalizePathForCompare(removedPath);
          const { removeFile, eventEmitter, fileMap } = useCompressionStore.getState();
          const isDirectory = payload.isDirectory === true;
          let totalCountDelta = 0;
          let totalBytesDelta = 0;
          if (isDirectory) {
            const toRemove = Array.from(fileMap.keys()).filter((p) => {
              const norm = normalizePathForCompare(p);
              return norm === removedPathNorm || norm.startsWith(removedPathNorm + '/');
            });
            toRemove.forEach((p) => {
              const file = fileMap.get(p);
              if (file) {
                totalCountDelta += 1;
                totalBytesDelta += file.bytesSize || 0;
              }
              removeFile(p);
            });
          } else {
            const matchedPath = Array.from(fileMap.keys()).find(
              (p) => normalizePathForCompare(p) === removedPathNorm,
            );
            if (matchedPath) {
              const file = fileMap.get(matchedPath);
              totalCountDelta = 1;
              totalBytesDelta = file?.bytesSize || 0;
              removeFile(matchedPath);
            }
          }
          if (totalCountDelta > 0) {
            eventEmitter.emit('update_file_item', 'all');
            const { watchFolders, updateWatchFolderStats } = useCompressionStore.getState();
            const f = watchFolders.find((wf) => wf.id === folder.id);
            if (f?.stats && 'totalCount' in f.stats) {
              updateWatchFolderStats(folder.id, {
                totalCount: Math.max(0, f.stats.totalCount - totalCountDelta),
                totalBytes: Math.max(0, f.stats.totalBytes - totalBytesDelta),
              });
            }
          }
        } else if (msg.event === 'self-enoent') {
          console.log(`[Watch] SSE self-enoent for ${folder.path}`);
          ctrl.abort();
          updateWatchFolderStatus(folder.id, 'error');
          alert(t('tips.file_watch_target_changed'));
          getCurrentWebviewWindow().show();
          getCurrentWebviewWindow().setFocus();
          // 如果已经没有正常监听的文件夹，返回引导页
          checkAndRegainIfEmpty();
        } else if (msg.event === 'fault') {
          console.log(`[Watch] SSE fault for ${folder.path}`, msg);
        }
      },
      onerror(error) {
        console.log(`[Watch] SSE error for ${folder.path}`, error);
        captureError(error);
        setTimeout(() => {
          if (!ctrl.signal.aborted) {
            updateWatchFolderStatus(folder.id, 'error');
            const isFirst = isFirstInitRef.current.get(folder.id) ?? true;
            alert(isFirst ? t('tips.watch_service_startup_failed') : t('tips.file_watch_abort'));
            getCurrentWebviewWindow().show();
            getCurrentWebviewWindow().setFocus();
            checkAndRegainIfEmpty();
          }
        }, 1000);
      },
      onclose() {
        console.log(`[Watch] SSE closed for ${folder.path}`);
        if (!ctrl.signal.aborted) {
          updateWatchFolderStatus(folder.id, 'stopped');
          const isFirst = isFirstInitRef.current.get(folder.id) ?? true;
          alert(isFirst ? t('tips.watch_service_startup_failed') : t('tips.file_watch_abort'));
          getCurrentWebviewWindow().show();
          getCurrentWebviewWindow().setFocus();
          checkAndRegainIfEmpty();
        }
      },
    });
  }, []);

  /** 停止一个文件夹的 SSE 监听 */
  const stopWatching = useCallback((folderId: string) => {
    sseControllersRef.current.get(folderId)?.abort();
    sseControllersRef.current.delete(folderId);
    queuesRef.current.delete(folderId);
    throttledProcessorsRef.current.delete(folderId);
  }, []);

  /** 如果所有文件夹都已停止/错误，返回引导页 */
  const checkAndRegainIfEmpty = () => {
    const { watchFolders, resetWatchOnly } = useCompressionStore.getState();
    const activeCount = watchFolders.filter((f) => f.status === 'monitoring').length;
    if (activeCount === 0 && watchFolders.length > 0) {
      resetWatchOnly();
      progressRef.current?.done();
      navigate('/compression/watch/guide');
    }
  };

  /** 初始化目录扫描：统计文件数量并按 addMode 决定是否压缩存量图 */
  const initFolder = async (folder: WatchFolder) => {
    const { setWatchFiles, appendWatchFiles, updateWatchFolderStats, eventEmitter } =
      useCompressionStore.getState();

    try {
      const files = await parsePaths([folder.path], VALID_IMAGE_EXTS);
      const { sizeFilterEnable, sizeFilterValue } = folder.settings;

      const imageFiles = files.filter(
        (f) => f.ext && VALID_IMAGE_EXTS.includes(f.ext.toLowerCase()),
      );
      const sizeFilterBytes = sizeFilterEnable ? sizeFilterValue * 1024 : 0;
      const toCompress =
        sizeFilterBytes > 0
          ? imageFiles.filter((f) => (f.bytesSize || 0) >= sizeFilterBytes)
          : imageFiles;

      const totalCount = imageFiles.length;
      const totalBytes = imageFiles.reduce((s, f) => s + (f.bytesSize || 0), 0);
      updateWatchFolderStats(folder.id, { totalCount, totalBytes });

      if (folder.addMode === 'monitor_only' || !folder.addMode) {
        // 仅监听模式：不展示存量文件，直接等待新文件
        progressRef.current?.done();
        return;
      }

      if (folder.addMode === 'compress_then_monitor' && isValidArray(toCompress)) {
        progressRef.current?.show(false);
        progressRef.current?.setDescription(
          t('page.compression.watch.list.compress_progress', {
            current: 0,
            total: toCompress.length,
          }),
        );
        appendWatchFiles(
          toCompress.map((item) => ({
            ...item,
            watchFolderId: folder.id,
            status: ICompressor.Status.Processing,
          })),
        );
        eventEmitter.emit('update_file_item', 'all');

        let processedCount = 0;
        const onProgress = () => {
          processedCount++;
          const pct = Math.min(100, Math.round((processedCount / toCompress.length) * 100));
          progressRef.current?.setValue(pct);
          progressRef.current?.setDescription?.(
            t('page.compression.watch.list.compress_progress', {
              current: processedCount,
              total: toCompress.length,
            }),
          );
        };

        // 更新 addMode 为 null（已处理过存量图）
        useCompressionStore.getState().updateWatchFolderStatus(folder.id, 'monitoring');
        await handleCompress(toCompress, folder, onProgress);
        progressRef.current?.done();
      } else {
        progressRef.current?.done();
      }
    } catch (error) {
      captureError(error);
      useCompressionStore.getState().updateWatchFolderStats(folder.id, { failed: true });
      progressRef.current?.done();
    }
  };

  // 监听 watchFolders 变化，为新增的文件夹启动 SSE 和初始化
  useEffect(() => {
    const { watchFolders } = useCompressionStore.getState();

    // 初始化时为所有已有文件夹建立连接
    watchFolders.forEach((folder) => {
      if (!sseControllersRef.current.has(folder.id)) {
        startWatching(folder);
        initFolder(folder);
      }
    });

    // 监听 store 变化，动态为新增文件夹建立连接
    const unsubscribe = useCompressionStore.subscribe((state, prevState) => {
      const newFolders = state.watchFolders;
      const prevFolders = prevState.watchFolders;
      if (newFolders.length > prevFolders.length) {
        const addedFolders = newFolders.filter(
          (nf) => !prevFolders.some((pf) => pf.id === nf.id),
        );
        addedFolders.forEach((folder) => {
          if (!sseControllersRef.current.has(folder.id)) {
            startWatching(folder);
            initFolder(folder);
          }
        });
      }
      // 处理被移除的文件夹
      if (newFolders.length < prevFolders.length) {
        const removedFolders = prevFolders.filter(
          (pf) => !newFolders.some((nf) => nf.id === pf.id),
        );
        removedFolders.forEach((folder) => stopWatching(folder.id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 页面可见性恢复检查
  useEffect(() => {
    const handlePageVisible = () => {
      if (document.visibilityState === 'visible') {
        const { watchFolders } = useCompressionStore.getState();
        const hasActive = watchFolders.some((f) => f.status === 'monitoring');
        if (!hasActive && watchFolders.length > 0) {
          alert(t('tips.file_watch_abort'));
          getCurrentWebviewWindow().show();
          getCurrentWebviewWindow().setFocus();
        }
      }
    };
    window.addEventListener('visibilitychange', handlePageVisible);
    return () => {
      window.removeEventListener('visibilitychange', handlePageVisible);
    };
  }, []);

  // 卸载时停止所有 SSE
  useEffect(() => {
    return () => {
      sseControllersRef.current.forEach((ctrl) => ctrl.abort());
      sseControllersRef.current.clear();
    };
  }, []);

  // 定期检查文件是否仍然存在
  useEffect(() => {
    async function syncRemoveNonExistent() {
      const {
        watchFolders,
        watchFiles,
        removeFile,
        updateFilePath,
        eventEmitter,
        updateWatchFolderStats,
        fileMap,
      } = useCompressionStore.getState();
      if (!isValidArray(watchFiles) || watchFolders.length === 0) return;

      const checks = await Promise.all(
        watchFiles.map(async (file) => ({
          file,
          path: file.path,
          exists: await exists(file.path),
          bytesSize: file.bytesSize || 0,
        })),
      );
      const toRemove = checks.filter((c) => !c.exists);
      if (toRemove.length === 0) return;

      const matchedPaths = new Set<string>();
      try {
        for (const folder of watchFolders) {
          const currentFiles = await parsePaths([folder.path], VALID_IMAGE_EXTS);
          const ourPaths = new Set(watchFiles.map((f) => normalizePathForCompare(f.path)));
          const newFilesList = currentFiles.filter(
            (f) => !ourPaths.has(normalizePathForCompare(f.path)),
          );

          for (const { path, bytesSize } of toRemove) {
            const parentDir = await dirname(path);
            const parentNorm = normalizePathForCompare(parentDir);
            const candidates = newFilesList.filter((f) => {
              const fParent = f.parentDir || f.path.split(/[/\\]/).slice(0, -1).join('/');
              return (
                normalizePathForCompare(fParent) === parentNorm &&
                (f.bytesSize || 0) === bytesSize
              );
            });
            if (candidates.length === 1) {
              updateFilePath(path, candidates[0].path, candidates[0].name);
              matchedPaths.add(path);
              newFilesList.splice(newFilesList.indexOf(candidates[0]), 1);
            }
          }
        }
      } catch (e) {
        captureError(e);
      }

      const folderDeltaMap = new Map<string, { count: number; bytes: number }>();
      for (const { path, bytesSize, file } of toRemove) {
        if (matchedPaths.has(path)) continue;
        const fm = fileMap.get(path);
        if (fm) {
          removeFile(path);
          const fid = file.watchFolderId || '';
          const delta = folderDeltaMap.get(fid) || { count: 0, bytes: 0 };
          delta.count += 1;
          delta.bytes += bytesSize;
          folderDeltaMap.set(fid, delta);
        }
      }
      if (matchedPaths.size > 0 || folderDeltaMap.size > 0) {
        eventEmitter.emit('update_file_item', 'all');
      }
      folderDeltaMap.forEach((delta, fid) => {
        const { watchFolders: wf } = useCompressionStore.getState();
        const f = wf.find((w) => w.id === fid);
        if (f?.stats && 'totalCount' in f.stats) {
          updateWatchFolderStats(fid, {
            totalCount: Math.max(0, f.stats.totalCount - delta.count),
            totalBytes: Math.max(0, f.stats.totalBytes - delta.bytes),
          });
        }
      });
    }

    syncRemoveNonExistent();
    const timer = setInterval(syncRemoveNonExistent, 15000);
    const handleVisible = () => {
      if (document.visibilityState === 'visible') syncRemoveNonExistent();
    };
    window.addEventListener('visibilitychange', handleVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener('visibilitychange', handleVisible);
    };
  }, []);

  useEffect(() => {
    const { watchFolders } = useCompressionStore.getState();
    r('watch_imp', { folder_count: watchFolders.length });
  }, []);

  return (
    <WatchContext.Provider value={{ startWatching, stopWatching }}>
      <div className='h-full overflow-hidden bg-neutral-100 dark:bg-neutral-900/50'>
        <WatchFolderList />
      </div>
    </WatchContext.Provider>
  );
}

export default CompressionWatch;
