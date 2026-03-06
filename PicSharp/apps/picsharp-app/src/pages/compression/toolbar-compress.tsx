import { memo, useRef, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, LoaderPinwheel } from 'lucide-react';
import useAppStore from '@/store/app';
import useCompressionStore from '@/store/compression';
import useSelector from '@/hooks/useSelector';
import { SettingsKey, CompressionMode, CompressionOutputMode, ResizeMode } from '@/constants';
import { isValidArray, correctFloat, calProgress } from '@/utils';
import Compressor from '@/utils/compressor';
import { humanSize } from '@/utils/fs';
import { isString } from 'radash';
import { useI18n } from '@/i18n';
import useSettingsStore from '@/store/settings';
import { sendTextNotification } from '@/utils/notification';
import { ICompressor } from '@/utils/compressor';
import { cn } from '@/lib/utils';
import { convertFileSrc } from '@tauri-apps/api/core';
import message from '@/components/message';
import { AppContext } from '@/routes';
import { openSettingsWindow } from '@/utils/window';
import { useReport } from '@/hooks/useReport';
import { exists } from '@tauri-apps/plugin-fs';
import { captureError } from '@/utils';

function ToolbarCompress() {
  const { sidecar, imageTempDir } = useAppStore(useSelector(['sidecar', 'imageTempDir']));
  const { selectedFiles, fileMap, files, setInCompressing, inCompressing, eventEmitter } =
    useCompressionStore(
      useSelector([
        'selectedFiles',
        'fileMap',
        'files',
        'setInCompressing',
        'inCompressing',
        'eventEmitter',
      ]),
    );
  const { setCurrentBatchTimestamp } = useCompressionStore.getState();
  const { [SettingsKey.TinypngApiKeys]: tinypngApiKeys } = useSettingsStore(
    useSelector([SettingsKey.TinypngApiKeys]),
  );
  const {
    compressionMode,
    outputMode,
    saveToFolder,
    saveAsFileSuffix,
    thresholdEnable,
    thresholdValue,
    sizeFilterEnable,
    sizeFilterValue,
    convertEnable,
    compressionType,
    compressionLevel,
    convertTypes,
    convertAlpha,
    resizeDimensions,
    resizeEnable,
    resizeMode,
    resizeScale,
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
  } = useCompressionStore((s) => s.classicSettings);
  const t = useI18n();
  const r = useReport();
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const { messageApi } = useContext(AppContext);

  const pendingFiles = selectedFiles.filter(
    (path) => {
      const status = fileMap.get(path)?.status;
      return (
        status === ICompressor.Status.Pending ||
        status === ICompressor.Status.Failed ||
        status === ICompressor.Status.Undone
      );
    }
  );
  const pendingCount = pendingFiles.length;
  const hasCompleted = files.some((f) => f.status === ICompressor.Status.Completed);

  const disabledCompress =
    !files.length ||
    inCompressing ||
    pendingCount === 0;

  const handleCompress = async () => {
    r('classic_compress_start', {
      files_num: selectedFiles.length,
    });
    let fulfilled = 0;
    let rejected = 0;
    const rejectedList = [];
    let startTime = Date.now();
    try {
      if (compressionMode !== CompressionMode.Local && !isValidArray(tinypngApiKeys)) {
        r('tinypng_api_keys_not_configured');
        const result = await message.confirm({
          title: t('tips.tinypng_api_keys_not_configured'),
          confirmText: t('goToSettings'),
          cancelText: t('cancel'),
        });
        if (result) {
          openSettingsWindow({
            subpath: 'tinypng',
            hash: 'tinypng-api-keys',
          });
        }
        return;
      }

      if (outputMode === CompressionOutputMode.SaveToNewFolder && !saveToFolder) {
        r('save_to_folder_not_configured');
        messageApi?.error(t('tips.save_to_folder_not_configured'));
        return;
      }

      if (
        outputMode === CompressionOutputMode.SaveToNewFolder &&
        saveToFolder &&
        !(await exists(saveToFolder))
      ) {
        r('save_to_folder_not_exists');
        messageApi?.error(t('tips.save_to_folder_not_exists', { path: saveToFolder }));
        return;
      }

      setInCompressing(true);
      const sizeFilterBytes = sizeFilterEnable ? sizeFilterValue * 1024 : 0;
      const seenPaths = new Set<string>();
      const files = selectedFiles
        .map<FileInfo>((id) => {
          const file = fileMap.get(id);
          if (
            file &&
            (file.status === ICompressor.Status.Pending ||
              file.status === ICompressor.Status.Failed ||
              file.status === ICompressor.Status.Undone ||
              file.status === ICompressor.Status.Skipped)
          ) {
            if (seenPaths.has(file.path)) return null;
            seenPaths.add(file.path);
            if (sizeFilterBytes > 0 && file.bytesSize < sizeFilterBytes) {
              file.status = ICompressor.Status.Skipped;
              eventEmitter.emit('update_file_item', file.path);
              return null;
            }
            file.status = ICompressor.Status.Processing;
            return file;
          }
        })
        .filter(Boolean);

      if (files.length === 0) {
        setInCompressing(false);
        const skipped = selectedFiles.length;
        messageApi?.info(
          t('compression.options.size_filter.all_skipped', { count: skipped }),
        );
        return;
      }

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
        resizeScale: resizeMode === ResizeMode.Scale ? (resizeScale ?? 50) : 0,
        resizeFit,
        watermarkType,
        watermarkPosition,
        watermarkText,
        watermarkTextColor,
        watermarkFontSize,
        watermarkImagePath,
        watermarkImageOpacity,
        watermarkImageScale,
        preserveMetadata: preserveMetadata ?? [],
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
              targetFile.ssim = res.ssim;
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
          if (indicatorRef.current) {
            indicatorRef.current.textContent = `${calProgress(fulfilled + rejected, files.length)}%`;
          }
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
          if (indicatorRef.current) {
            indicatorRef.current.textContent = `${calProgress(fulfilled + rejected, files.length)}%`;
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
    } finally {
      if (indicatorRef.current) {
        indicatorRef.current.textContent = '0%';
      }
      setInCompressing(false);
      setCurrentBatchTimestamp(Date.now());
    }
  };

  return (
    <Button
      size='sm'
      disabled={disabledCompress}
      onClick={handleCompress}
      className='relative h-full min-h-0 w-full flex-1 rounded-none border-0 bg-blue-600 px-4 text-white transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 disabled:opacity-50 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700'
    >
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-300',
          inCompressing && 'opacity-100',
        )}
      >
        <LoaderPinwheel className='h-4 w-4 animate-spin' />
        <span ref={indicatorRef}>0%</span>
      </div>
      <div
        className={cn(
          'flex items-center justify-center gap-2 transition-opacity duration-300',
          inCompressing && 'opacity-0',
        )}
      >
        <Sparkles className='h-4 w-4' />
        <span>
          {hasCompleted
            ? t('page.compression.classic.compress_new', { count: pendingCount })
            : t('common.start')}
        </span>
      </div>
    </Button>
  );
}

export default memo(ToolbarCompress);
