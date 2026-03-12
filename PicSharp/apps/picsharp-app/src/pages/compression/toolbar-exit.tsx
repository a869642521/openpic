import { memo, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowLeft } from 'lucide-react';
import useCompressionStore from '@/store/compression';
import useSelector from '@/hooks/useSelector';
import { useNavigate } from '@/hooks/useNavigate';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useI18n } from '@/i18n';
import { AppContext } from '@/routes';
import message from '@/components/message';

function ToolbarClear(props: { mode: 'classic' | 'watch'; variant?: 'ghost' | 'button' }) {
  const navigate = useNavigate();
  const { inCompressing, reset, resetWatchOnly } = useCompressionStore(
    useSelector(['inCompressing', 'reset', 'resetWatchOnly']),
  );
  const t = useI18n();
  const { messageApi } = useContext(AppContext);

  const doClear = () => {
    if (props.mode === 'classic') {
      reset();
      navigate('/compression/classic/guide');
    } else {
      resetWatchOnly();
      navigate('/compression/watch/guide');
    }
    toast.dismiss();
    messageApi?.destroy();
  };

  const handleClear = async () => {
    const isWatch = props.mode === 'watch';
    const result = await message.confirm({
      title: isWatch ? t('compression.toolbar.watch_back_confirm_title') : t('compression.toolbar.clear_confirm_title'),
      description: isWatch
        ? t('compression.toolbar.watch_back_confirm_description')
        : t('compression.toolbar.clear_confirm_description'),
      confirmText: isWatch ? t('compression.toolbar.watch_back') : t('compression.toolbar.clear'),
      cancelText: t('cancel'),
    });
    if (result) {
      doClear();
    }
  };

  const label = props.mode === 'watch' ? t('compression.toolbar.watch_back') : t('compression.toolbar.clear');
  const icon = props.mode === 'watch' ? <ArrowLeft className='h-4 w-4' /> : <Trash2 className='h-4 w-4' />;

  if (props.variant === 'button') {
    return (
      <Button
        size='sm'
        variant='ghost'
        onClick={handleClear}
        disabled={inCompressing}
        className='relative h-full min-h-0 w-full flex-1 rounded-none border-0 px-3 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100'
      >
        {icon}
        <span>{label}</span>
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          onClick={handleClear}
          disabled={inCompressing}
          className='dark:hover:bg-neutral-700/50'
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export default memo(ToolbarClear);
