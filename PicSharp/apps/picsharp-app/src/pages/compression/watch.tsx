import { useEffect, useRef, useContext } from 'react';
import { debounce } from 'radash';
import useCompressionStore from '@/store/compression';
import WatchFileManager from './watch-file-manager';
import WatchFolderCard from './watch-folder-card';
import { parsePaths, humanSize, normalizePathForCompare } from '@/utils/fs';
import { VALID_IMAGE_EXTS } from '@/constants';
import { isValidArray, correctFloat } from '@/utils';
import Compressor, { ICompressor } from '@/utils/compressor';
import { SettingsKey } from '@/constants';
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
import { cn } from '@/lib/utils';
import { exists } from '@tauri-apps/plugin-fs';
import { dirname } from '@tauri-apps/api/path';

function CompressionWatch() {
  const { progressRef } = useContext(CompressionContext);
  const navigate = useNavigate();
  const queueRef = useRef<string[]>([]);
  const t = useI18n();
  const { messageApi } = useContext(AppContext);
  const isFirstInit = useRef(true);
  const historys = useRef<Set<string>>(new Set());
  const ctrlRef = useRef<AbortController | null>(null);
  const r = useReport();

  const handleCompress = async (files: FileInfo[]) => {
    let fulfilled = 0;
    let rejected = 0;
    const rejectedList = [];
    let startTime = Date.now();
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
        [SettingsKey.CompressionConvertEnable]: convertEnable,
        [SettingsKey.CompressionConvert]: convertTypes,
        [SettingsKey.CompressionConvertAlpha]: convertAlpha,
        [SettingsKey.CompressionResizeEnable]: resizeEnable,
        [SettingsKey.CompressionResizeDimensions]: resizeDimensions,
        [SettingsKey.CompressionResizeFit]: resizeFit,
        [SettingsKey.CompressionWatermarkType]: watermarkType,
        [SettingsKey.CompressionWatermarkPosition]: watermarkPosition,
        [SettingsKey.CompressionWatermarkText]: watermarkText,
        [SettingsKey.CompressionWatermarkTextColor]: watermarkTextColor,
        [SettingsKey.CompressionWatermarkFontSize]: watermarkFontSize,
        [SettingsKey.CompressionWatermarkImagePath]: watermarkImagePath,
        [SettingsKey.CompressionWatermarkImageOpacity]: watermarkImageOpacity,
        [SettingsKey.CompressionWatermarkImageScale]: watermarkImageScale,
        [SettingsKey.CompressionKeepMetadata]: keepMetadata,
      } = useSettingsStore.getState();

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
        keepMetadata,
      }).compress(
        files,
        (res) => {
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
            historys.current.add(res.hash);
            if (isValidArray(res.convert_results)) {
              targetFile.convertResults = res.convert_results;
            }
          } else {
            rejected++;
            rejectedList.push(res);
            targetFile.status = ICompressor.Status.Failed;
            targetFile.errorMessage = 'Process failed,Please try again';
            r('file_not_found_after_compression', {
              success: true,
              data: res,
            });
          }
          eventEmitter.emit('update_file_item', targetFile.path);
        },
        (res) => {
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
            r('file_not_found_after_compression', {
              success: false,
              data: res,
            });
          }
        },
      );
      messageApi?.success(
        t('tips.compress_completed', {
          fulfilled,
          rejected,
          total: files.length,
        }),
      );
      sendTextNotification(
        t('common.compress_completed'),
        t('tips.compress_completed', {
          fulfilled,
          rejected,
          total: files.length,
        }),
      );
      r('classic_compress_completed', {
        fulfilled,
        rejected,
        total: files.length,
        rejectedList: rejectedList.slice(0, 10),
        costTime: Date.now() - startTime,
      });
    } catch (error) {
      captureError(error);
      r('classic_compress_failed', {
        fulfilled,
        rejected,
        total: files.length,
        error: error.toString(),
        rejectedList: rejectedList.slice(0, 10),
        costTime: Date.now() - startTime,
      });
      messageApi?.error(t('common.compress_failed_msg'));
      sendTextNotification(t('common.compress_failed'), t('common.compress_failed_msg'));
    }
  };

  const throttledProcessData = debounce({ delay: 1000 }, () => {
    if (isValidArray(queueRef.current)) {
      const {
        [SettingsKey.CompressionWatchSizeFilterEnable]: sizeFilterEnable,
        [SettingsKey.CompressionWatchSizeFilterValue]: sizeFilterValue,
      } = useSettingsStore.getState();

      parsePaths(queueRef.current, VALID_IMAGE_EXTS)
        .then((candidates) => {
          if (isValidArray(candidates)) {
            const sizeFilterBytes = sizeFilterEnable ? sizeFilterValue * 1024 : 0;
            const filtered =
              sizeFilterBytes > 0 ? candidates.filter((f) => (f.bytesSize || 0) >= sizeFilterBytes) : candidates;

            if (isValidArray(filtered)) {
              const { appendWatchFiles } = useCompressionStore.getState();
              appendWatchFiles(
                filtered.map((item) => ({
                  ...item,
                  status: ICompressor.Status.Processing,
                })),
              );
              handleCompress(filtered);
            }
          }
        })
        .catch((error) => {
          captureError(error);
        });
      queueRef.current = [];
    }
  });

  const alert = async (title: string, content: string = '') => {
    sendTextNotification(title, content);
    message?.error({
      title,
      description: content,
    });
  };

  function regain() {
    const { resetWatchOnly } = useCompressionStore.getState();
    ctrlRef.current?.abort();
    resetWatchOnly();
    navigate('/compression/watch/guide');
    progressRef.current?.done();
  }

  useEffect(() => {
    const { watchingFolder } = useCompressionStore.getState();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    async function handleWatch() {
      const { compression_watch_file_ignore: ignores = [] } = useSettingsStore.getState();
      const { sidecar } = useAppStore.getState();
      fetchEventSource(`${sidecar?.origin}/stream/watch/new-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer picsharp_sidecar`,
        },
        body: JSON.stringify({
          path: watchingFolder,
          ignores,
        }),
        signal: ctrl.signal,
        openWhenHidden: true,
        onopen: async (response) => {
          if (response.ok && response.headers.get('content-type') === 'text/event-stream') {
            console.log('[Sidecar] Watch EventSource opened');
            isFirstInit.current = false;
          } else {
            alert(t('tips.watch_service_startup_failed'));
          }
        },
        async onmessage(msg) {
          if (msg.event === 'ready') {
            console.log('[Sidecar] Watch EventSource ready');
            progressRef.current?.done();
          } else if (msg.event === 'add') {
            const payload = JSON.parse(msg.data);
            const path = payload.fullPath;
            const hash = payload.content_hash;
            const inHistory = historys.current.has(hash);

            if (!inHistory) {
              queueRef.current.push(path);
            } else {
              // 已压缩过的文件（如重命名后触发的 add）：仍加入列表展示，但不重复压缩
              parsePaths([path], VALID_IMAGE_EXTS)
                .then((candidates) => {
                  if (isValidArray(candidates)) {
                    const {
                      [SettingsKey.CompressionWatchSizeFilterEnable]: sizeFilterEnable,
                      [SettingsKey.CompressionWatchSizeFilterValue]: sizeFilterValue,
                    } = useSettingsStore.getState();
                    const sizeFilterBytes = sizeFilterEnable ? sizeFilterValue * 1024 : 0;
                    const filtered =
                      sizeFilterBytes > 0
                        ? candidates.filter((f) => (f.bytesSize || 0) >= sizeFilterBytes)
                        : candidates;
                    if (isValidArray(filtered)) {
                      useCompressionStore.getState().appendWatchFiles(
                        filtered.map((item) => ({
                          ...item,
                          status: ICompressor.Status.Pending,
                        })),
                      );
                      useCompressionStore.getState().eventEmitter.emit('update_file_item', 'all');
                    }
                  }
                })
                .catch((error) => captureError(error));
            }
            throttledProcessData();
          } else if (msg.event === 'rename') {
            const payload = JSON.parse(msg.data);
            const oldPath = payload.oldPath;
            const newPath = payload.newPath;
            const newData = payload.newData || payload.to;
            const newName = newData?.name || newPath?.split(/[/\\]/).filter(Boolean).pop() || '';
            if (!oldPath || !newPath) return;

            const { watchingFolder, fileMap, updateFilePath, eventEmitter } =
              useCompressionStore.getState();
            const watchNorm = normalizePathForCompare(watchingFolder);
            const newPathNorm = normalizePathForCompare(newPath);
            const isStillInWatch =
              newPathNorm === watchNorm || newPathNorm.startsWith(watchNorm + '/');

            const matchedPath = Array.from(fileMap.keys()).find(
              (p) => normalizePathForCompare(p) === normalizePathForCompare(oldPath),
            );
            if (matchedPath) {
              if (isStillInWatch) {
                updateFilePath(matchedPath, newPath, newName);
              } else {
                useCompressionStore.getState().removeFile(matchedPath);
              }
              eventEmitter.emit('update_file_item', 'all');
            }
          } else if (msg.event === 'remove') {
            const payload = JSON.parse(msg.data);
            const removedPath = payload.fullPath;
            if (!removedPath) return;
            const removedPathNorm = normalizePathForCompare(removedPath);
            const { removeFile, eventEmitter, fileMap, watchFolderStats, setWatchFolderStats } =
              useCompressionStore.getState();
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
              if (watchFolderStats && 'totalCount' in watchFolderStats) {
                setWatchFolderStats({
                  totalCount: Math.max(0, watchFolderStats.totalCount - totalCountDelta),
                  totalBytes: Math.max(0, watchFolderStats.totalBytes - totalBytesDelta),
                });
              }
            }
          } else if (msg.event === 'self-enoent') {
            console.log('[Sidecar] Watch EventSource self-enoent');
            ctrl.abort();
            regain();
            alert(t('tips.file_watch_target_changed'));
            getCurrentWebviewWindow().show();
            getCurrentWebviewWindow().setFocus();
          } else if (msg.event === 'fault') {
            console.log('[Sidecar] Watch EventSource fault', msg);
          }
        },
        onerror(error) {
          console.log('[Sidecar] Watch EventSource error', error);
          setTimeout(() => {
            if (!ctrl.signal.aborted) {
              regain();
              if (isFirstInit.current) {
                alert(t('tips.watch_service_startup_failed'));
              } else {
                alert(t('tips.file_watch_abort'));
              }
              getCurrentWebviewWindow().show();
              getCurrentWebviewWindow().setFocus();
            }
          }, 1000);
          captureError(error);
        },
        onclose() {
          console.log('[Sidecar] Watch EventSource closed');
          regain();
          if (isFirstInit.current) {
            alert(t('tips.watch_service_startup_failed'));
          } else {
            alert(t('tips.file_watch_abort'));
          }
          getCurrentWebviewWindow().show();
          getCurrentWebviewWindow().setFocus();
        },
      });
    }
    function handlePageVisible() {
      if (document.visibilityState === 'visible') {
        if (ctrl.signal.aborted && !isFirstInit.current) {
          regain();
          alert(t('tips.file_watch_abort'));
          getCurrentWebviewWindow().show();
          getCurrentWebviewWindow().setFocus();
        }
      }
    }
    if (!watchingFolder) {
      regain();
      alert(t('tips.file_watch_abort'));
      getCurrentWebviewWindow().show();
      getCurrentWebviewWindow().setFocus();
      return;
    }
    handleWatch();

    // 目录扫描：统计图片数量与大小，并将目录内已有图片加入列表（状态：待处理，排在已压缩之后）
    parsePaths([watchingFolder], VALID_IMAGE_EXTS)
      .then((files) => {
        const {
          setWatchFolderStats,
          setWatchFiles,
          watchFiles,
        } = useCompressionStore.getState();
        const {
          [SettingsKey.CompressionWatchSizeFilterEnable]: sizeFilterEnable,
          [SettingsKey.CompressionWatchSizeFilterValue]: sizeFilterValue,
        } = useSettingsStore.getState();

        const imageFiles = files.filter((f) =>
          f.ext && VALID_IMAGE_EXTS.includes(f.ext.toLowerCase()),
        );
        const sizeFilterBytes = sizeFilterEnable ? sizeFilterValue * 1024 : 0;
        const toAdd = sizeFilterBytes > 0
          ? imageFiles.filter((f) => (f.bytesSize || 0) >= sizeFilterBytes)
          : imageFiles;

        const totalCount = imageFiles.length;
        const totalBytes = imageFiles.reduce((s, f) => s + (f.bytesSize || 0), 0);
        setWatchFolderStats({ totalCount, totalBytes });

        const existingPaths = new Set(toAdd.map((f) => normalizePathForCompare(f.path)));
        const fromWatch = watchFiles.filter(
          (f) => !existingPaths.has(normalizePathForCompare(f.path)),
        );
        setWatchFiles([...fromWatch, ...toAdd]);
      })
      .catch((error) => {
        captureError(error);
        useCompressionStore.getState().setWatchFolderStats({ failed: true });
      });

    window.addEventListener('visibilitychange', handlePageVisible);
    return () => {
      ctrl.abort();
      ctrlRef.current = null;
      window.removeEventListener('visibilitychange', handlePageVisible);
    };
  }, []);

  useEffect(() => {
    const { watchingFolder } = useCompressionStore.getState();
    r('watch_imp', {
      has_folder: !!watchingFolder,
    });
  }, []);

  // 同步移除监听目录中已不存在的文件卡片
  useEffect(() => {
    const { watchingFolder } = useCompressionStore.getState();
    if (!watchingFolder) return;

    async function syncRemoveNonExistent() {
      const {
        watchFiles,
        removeFile,
        updateFilePath,
        eventEmitter,
        watchFolderStats,
        setWatchFolderStats,
        fileMap,
      } = useCompressionStore.getState();
      if (!isValidArray(watchFiles)) return;

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

      // 尝试识别重命名：扫描目录，查找可能由重命名产生的新路径（同目录、同大小）
      const matchedPaths = new Set<string>();
      try {
        const currentFiles = await parsePaths([watchingFolder], VALID_IMAGE_EXTS);
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
              normalizePathForCompare(fParent) === parentNorm && (f.bytesSize || 0) === bytesSize
            );
          });
          if (candidates.length === 1) {
            updateFilePath(path, candidates[0].path, candidates[0].name);
            matchedPaths.add(path);
            newFilesList.splice(newFilesList.indexOf(candidates[0]), 1);
          }
        }
      } catch (e) {
        captureError(e);
      }

      let totalCountDelta = 0;
      let totalBytesDelta = 0;
      for (const { path, bytesSize } of toRemove) {
        if (matchedPaths.has(path)) continue;
        const file = fileMap.get(path);
        if (file) {
          removeFile(path);
          totalCountDelta += 1;
          totalBytesDelta += bytesSize;
        }
      }
      if (matchedPaths.size > 0 || totalCountDelta > 0) {
        eventEmitter.emit('update_file_item', 'all');
      }
      if (totalCountDelta > 0 && watchFolderStats && 'totalCount' in watchFolderStats) {
        setWatchFolderStats({
          totalCount: Math.max(0, watchFolderStats.totalCount - totalCountDelta),
          totalBytes: Math.max(0, watchFolderStats.totalBytes - totalBytesDelta),
        });
      }
    }

    syncRemoveNonExistent();
    const timer = setInterval(syncRemoveNonExistent, 15000);

    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        syncRemoveNonExistent();
      }
    };
    window.addEventListener('visibilitychange', handleVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener('visibilitychange', handleVisible);
    };
  }, []);

  return (
    <div className='flex h-full flex-col gap-4 bg-neutral-100 p-4 dark:bg-neutral-900/50'>
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-neutral-200/80 bg-white/90',
          'dark:border-neutral-600/80 dark:bg-neutral-800/90',
        )}
      >
        <WatchFolderCard />
        <div
          className='shrink-0 border-t border-dashed border-neutral-200 dark:border-neutral-600'
          aria-hidden
        />
        <div className='min-h-0 flex-1'>
          <WatchFileManager />
        </div>
      </div>
    </div>
  );
}

export default CompressionWatch;
