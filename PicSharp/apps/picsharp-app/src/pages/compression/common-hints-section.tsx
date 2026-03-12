import { memo, useState, useRef, useLayoutEffect } from 'react';
import { useI18n } from '@/i18n';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const COMMON_HINTS_WRAPPER_CLASS = 'px-6 pb-5 pt-0';

function CommonHintsSection() {
  const t = useI18n();
  const [hintsExpanded, setHintsExpanded] = useState(false);
  const [commonHints, setCommonHints] = useState(
    '亚马逊平台：<500KB\n邮件：首图<300kb、其他<150kb',
  );
  const hintsRef = useRef<HTMLTextAreaElement>(null);

  const resizeHints = () => {
    const el = hintsRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  useLayoutEffect(() => {
    if (hintsExpanded) resizeHints();
  }, [hintsExpanded, commonHints]);

  return (
    <div className={COMMON_HINTS_WRAPPER_CLASS}>
      <div className='flex w-full flex-col overflow-hidden rounded-lg bg-neutral-100/80'>
        <button
          type='button'
          className='flex h-9 shrink-0 items-center justify-between px-3 text-left'
          onClick={() => setHintsExpanded(!hintsExpanded)}
        >
          <span className='text-xs font-normal'>{t('compression.options.common_hints.title')}</span>
          {hintsExpanded ? (
            <ChevronUp className='h-4 w-4 shrink-0' />
          ) : (
            <ChevronDown className='h-4 w-4 shrink-0' />
          )}
        </button>
        {hintsExpanded && (
          <div onClick={(e) => e.stopPropagation()}>
            <Textarea
              ref={hintsRef}
              value={commonHints}
              onChange={(e) => setCommonHints(e.target.value)}
              placeholder={t('compression.options.common_hints.placeholder')}
              className='min-h-[60px] w-full overflow-hidden border-0 bg-transparent shadow-none focus-visible:ring-0'
              style={{ resize: 'none', fontSize: 12, lineHeight: '200%' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(CommonHintsSection);
export { COMMON_HINTS_WRAPPER_CLASS };
