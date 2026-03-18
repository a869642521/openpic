import { useEffect, useRef, useContext } from 'react';
import { UnlistenFn } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { parsePaths } from '@/utils/fs';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { Upload } from 'lucide-react';
import useConvertStore from '@/store/convert';
import { ConvertContext } from '.';
import { isValidArray } from '@/utils';
import { useNavigate } from '@/hooks/useNavigate';
import { VALID_IMAGE_EXTS } from '@/constants';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import message from '@/components/message';
import { ConvertStatus } from '@/store/convert';
import UploadWidget from '@/components/animated-icon/upload-widget';
import FormatsTips from '@/pages/compression/formats-tips';

function ConvertGuide() {
  const { progressRef } = useContext(ConvertContext);
  const dragDropController = useRef<UnlistenFn | null>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const t = useI18n();

  const handleFiles = async (paths: string[] | null) => {
    if (!isValidArray(paths)) return;
    progressRef.current?.show(true);
    const files = await parsePaths(paths!, VALID_IMAGE_EXTS);
    if (!isValidArray(files)) {
      progressRef.current?.done();
      message.info({ title: t('convert.no_image') });
      return;
    }
    const tagged = files.map((f) => ({ ...f, batchId: 0, status: ConvertStatus.Pending }));
    useConvertStore.getState().setWorking(true);
    useConvertStore.getState().setFiles(tagged);
    navigate('/convert/workspace');
    setTimeout(() => progressRef.current?.done(), 100);
  };

  const handleSelectFile = async () => {
    const files = await open({
      multiple: true,
      directory: false,
      filters: [{ name: 'Image Files', extensions: VALID_IMAGE_EXTS }],
    });
    handleFiles(files);
  };

  useEffect(() => {
    const setupDragDrop = async () => {
      dragDropController.current = await getCurrentWebview().onDragDropEvent(async (event) => {
        if (!dropzoneRef.current) return;
        if (event.payload.type === 'enter') dropzoneRef.current.classList.add('drag-active');
        else if (event.payload.type === 'leave') dropzoneRef.current.classList.remove('drag-active');
        else if (event.payload.type === 'drop') {
          dropzoneRef.current.classList.remove('drag-active');
          handleFiles(event.payload.paths);
        }
      });
    };
    setupDragDrop();
    return () => {
      if (typeof dragDropController.current === 'function') dragDropController.current();
      dragDropController.current = null;
    };
  }, []);

  return (
    <div
      ref={dropzoneRef}
      className='group relative flex h-full flex-col items-center justify-center p-6 transition-all duration-300 [&.drag-active]:from-indigo-50/50 [&.drag-active]:to-indigo-100/50'
    >
      <UploadWidget />
      <div className='relative mt-4 text-center'>
        <p className='mx-auto max-w-2xl text-lg'>{t('convert.upload_description')}</p>
      </div>
      <div className='relative w-full max-w-5xl'>
        <div className='flex flex-col gap-8 md:flex-row'>
          <div className='flex-1'>
            <div className='group relative flex flex-col items-center justify-center gap-6 p-5'>
              <div className='text-center'>
                <div className='flex flex-col items-center justify-center gap-3 sm:flex-row'>
                  <Button
                    onClick={handleSelectFile}
                    variant='secondary'
                    className='h-12 w-[220px] rounded-full border border-neutral-300 bg-transparent text-base shadow-none transition-colors hover:bg-black hover:text-white hover:border-black dark:border-neutral-600 dark:bg-transparent dark:hover:bg-black dark:hover:text-white dark:hover:border-black'
                  >
                    <Upload size={22} />
                    {t('convert.upload_file')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='absolute bottom-2 right-2'>
        <FormatsTips />
      </div>
      <div className='pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-neutral-100/80 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 dark:bg-neutral-800/80 [.drag-active_&]:opacity-100'></div>
    </div>
  );
}

export default ConvertGuide;
