import type { RefObject } from 'react';
import type { PageProgressRef } from '@/components/fullscreen-progress';
import message from '@/components/message';
import { parsePaths, pathsIncludeArchive } from './fs';
import { isValidArray, yieldToPaint } from './index';

const EMPTY_MESSAGE_DELAY_MS = 480;

/** 引导页：显示导入进度 → 解析路径（含压缩包解压）→ 无图片时延迟提示 */
export async function parsePathsForGuideWithProgress(
  paths: string[],
  validExts: string[],
  options: {
    progressRef: RefObject<PageProgressRef | null>;
    t: (key: string) => string;
    emptyMessageKey: string;
  },
): Promise<FileInfo[] | null> {
  const { progressRef, t, emptyMessageKey } = options;
  progressRef.current?.setDescription(
    pathsIncludeArchive(paths) ? t('tips.import_archives') : t('tips.import_files'),
  );
  progressRef.current?.show(true);
  await yieldToPaint();
  const files = await parsePaths(paths, validExts);
  if (!isValidArray(files)) {
    progressRef.current?.done();
    window.setTimeout(() => {
      message.info({ title: t(emptyMessageKey) });
    }, EMPTY_MESSAGE_DELAY_MS);
    return null;
  }
  return files;
}
