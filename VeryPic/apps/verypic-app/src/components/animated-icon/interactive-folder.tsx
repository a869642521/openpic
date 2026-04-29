import { useState } from 'react';
import { motion } from 'motion/react';

const SPRING = { type: 'spring' as const, stiffness: 260, damping: 28 };

// waike.svg 391×333 / qiangai.svg 432×271 的宽高比（以 waike 宽为基准）
const SHELL_H_RATIO = 333 / 391;   // folderH = folderW × ratio
const FLAP_W_RATIO  = 432 / 391;   // flapW   = folderW × ratio
const FLAP_H_RATIO  = 271 / 391;   // flapH   = folderW × ratio

// qiangai.svg 原始路径（viewBox 0 0 432 271）
const FLAP_PATH_D = 'M252.712 44.5366C259.166 51.8264 268.434 56 278.17 56H397.995C417.775 56 433.38 72.8203 431.899 92.5453L420.863 239.545C419.532 257.286 404.749 271 386.959 271H49.2424C31.4522 271 16.6697 257.286 15.3378 239.545L0.0973427 36.5455C-1.38354 16.8204 14.2214 0 34.0019 0H197.976C207.712 0 216.981 4.1736 223.434 11.4634L252.712 44.5366Z';

/** 方案 1：mask-image 用 qiangai 路径裁剪，viewBox 与元素尺寸一致时自动缩放 */
const FLAP_MASK_DATA_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 432 271'%3E%3Cpath fill='black' d='${encodeURIComponent(FLAP_PATH_D)}'/%3E%3C/svg%3E")`;

/** 背景模糊方案：1=mask-image 2=包裹层+overflow 3=模拟磨砂 4=isolation+clip-path */
const BLUR_APPROACH: 1 | 2 | 3 | 4 = 1;

/**
 * 将 qiangai 路径按 (sx, sy) 缩放，用于 CSS clip-path: path()（方案 2 包裹层用）
 */
function scaledFlapPath(sx: number, sy: number): string {
  const x = (n: number) => +(n * sx).toFixed(3);
  const y = (n: number) => +(n * sy).toFixed(3);
  return [
    `M${x(252.712)} ${y(44.5366)}`,
    `C${x(259.166)} ${y(51.8264)} ${x(268.434)} ${y(56)} ${x(278.17)} ${y(56)}`,
    `H${x(397.995)}`,
    `C${x(417.775)} ${y(56)} ${x(433.38)} ${y(72.8203)} ${x(431.899)} ${y(92.5453)}`,
    `L${x(420.863)} ${y(239.545)}`,
    `C${x(419.532)} ${y(257.286)} ${x(404.749)} ${y(271)} ${x(386.959)} ${y(271)}`,
    `H${x(49.2424)}`,
    `C${x(31.4522)} ${y(271)} ${x(16.6697)} ${y(257.286)} ${x(15.3378)} ${y(239.545)}`,
    `L${x(0.0973)} ${y(36.5455)}`,
    `C${x(-1.3835)} ${y(16.8204)} ${x(14.2214)} ${y(0)} ${x(34.0019)} ${y(0)}`,
    `H${x(197.976)}`,
    `C${x(207.712)} ${y(0)} ${x(216.981)} ${y(4.1736)} ${x(223.434)} ${y(11.4634)}`,
    `L${x(252.712)} ${y(44.5366)}Z`,
  ].join('');
}

// 固定参数（不再暴露）
const FIXED = {
  folderW: 245,
  docRadius: 15,
  docBottomOffset: 19,
  shellColorTop: '#4f4f4f',
  shellColorMid: '#121212',
  shellColorBot: '#111113',
  shellGradientAngle: 155,
  flapBlur: 30,
  doc1W: 81,
  doc1H: 113,
  doc1X: -47,
  doc1Y: 16,
  doc1OpenX: -13,
  doc1OpenY: -47,
  doc1OpenRotate: -7,
  doc1OpenDelay: 0.1,
  doc2W: 113,
  doc2H: 143,
  doc2X: 0,
  doc2Y: 16,
  doc2OpenX: 0,
  doc2OpenY: -42,
  doc2OpenRotate: 0,
  doc2OpenDelay: 0.04,
  doc3W: 95,
  doc3H: 122,
  doc3X: 38,
  doc3Y: 18,
  doc3OpenX: 4,
  doc3OpenY: -40,
  doc3OpenRotate: 11,
  doc3OpenDelay: 0.02,
} as const;

// ─── 可调参数 ─────────────────────────────────────────────────────
export interface FolderParams {
  doc1Color: string;
  doc2Color: string;
  doc3Color: string;
  flapColorTop: string;
  flapColorBot: string;
  flapOpacity: number;
  flapStrokeColor: string;
  flapStrokeWidth: number;
  blurApproach?: 1 | 2 | 3 | 4;
  flapBlur?: number;
}

export const DEFAULT_PARAMS: FolderParams = {
  doc1Color: '#5cff9a',
  doc2Color: '#ff94c2',
  doc3Color: '#75c3ff',
  flapColorTop: '#9c9c9c',
  flapColorBot: '#000000',
  flapOpacity: 0.64,
  flapStrokeColor: '#c9c9c9',
  flapStrokeWidth: 1.5,
  blurApproach: 1,
  flapBlur: 4,
};

// ─── 主组件 ──────────────────────────────────────────────────────
export default function InteractiveFolder({ p = DEFAULT_PARAMS }: { p?: FolderParams }) {
  const [isOpened, setIsOpened] = useState(false);
  const f = FIXED;
  const blurApproach = p.blurApproach ?? BLUR_APPROACH;
  const flapBlur = p.flapBlur ?? f.flapBlur;

  const folderH = Math.round(f.folderW * SHELL_H_RATIO);
  const flapW   = Math.round(f.folderW * FLAP_W_RATIO);
  const flapH   = Math.round(f.folderW * FLAP_H_RATIO);

  const shellRx = (34 * f.folderW) / 391;
  const shellRy = (34 * folderH) / 333;

  function gradCoords(deg: number) {
    const r = (deg * Math.PI) / 180;
    return {
      x1: `${((0.5 - 0.5 * Math.sin(r)) * 100).toFixed(1)}%`,
      y1: `${((0.5 + 0.5 * Math.cos(r)) * 100).toFixed(1)}%`,
      x2: `${((0.5 + 0.5 * Math.sin(r)) * 100).toFixed(1)}%`,
      y2: `${((0.5 - 0.5 * Math.cos(r)) * 100).toFixed(1)}%`,
    };
  }
  const shellG = gradCoords(f.shellGradientAngle);

  const docs = [
    { w: f.doc1W, h: f.doc1H, x: f.doc1X, y: f.doc1Y, openX: f.doc1OpenX, openY: f.doc1OpenY, openRotate: f.doc1OpenRotate, lines: [0.72, 0.5, 0.62], z: 1, openDelay: f.doc1OpenDelay, bg: `linear-gradient(175deg, ${p.doc1Color} 0%, #d8d8da 100%)` },
    { w: f.doc2W, h: f.doc2H, x: f.doc2X, y: f.doc2Y, openX: f.doc2OpenX, openY: f.doc2OpenY, openRotate: f.doc2OpenRotate, lines: [0.82, 0.6, 0.74, 0.5], z: 2, openDelay: f.doc2OpenDelay, bg: `linear-gradient(175deg, ${p.doc2Color} 0%, #d8d8da 100%)` },
    { w: f.doc3W, h: f.doc3H, x: f.doc3X, y: f.doc3Y, openX: f.doc3OpenX, openY: f.doc3OpenY, openRotate: f.doc3OpenRotate, lines: [0.54, 0.72, 0.44], z: 3, openDelay: f.doc3OpenDelay, bg: `linear-gradient(175deg, ${p.doc3Color} 0%, #d8d8da 100%)` },
  ];

  return (
    <div
      className='relative flex cursor-default select-none items-center justify-center p-12'
      onMouseEnter={() => setIsOpened(true)}
      onMouseLeave={() => setIsOpened(false)}
    >
      <div className='relative' style={{ width: f.folderW, height: folderH }}>

        {/* 外壳 — waike.svg 造型 */}
        <div
          className='absolute inset-0'
          style={{
            borderRadius: `${shellRx}px / ${shellRy}px`,
            boxShadow: '0 24px 64px rgba(0,0,0,0.32), 0 6px 20px rgba(0,0,0,0.2)',
          }}
        >
          <svg
            className='absolute inset-0'
            width={f.folderW}
            height={folderH}
            viewBox='0 0 391 333'
            preserveAspectRatio='none'
          >
            <defs>
              <linearGradient id='fld-shell' x1={shellG.x1} y1={shellG.y1} x2={shellG.x2} y2={shellG.y2} gradientUnits='objectBoundingBox'>
                <stop offset='0%' stopColor={f.shellColorTop} />
                <stop offset='50%' stopColor={f.shellColorMid} />
                <stop offset='100%' stopColor={f.shellColorBot} />
              </linearGradient>
              {/* 顶部微光边缘 */}
              <linearGradient id='fld-shell-hl' x1='0%' y1='0%' x2='0%' y2='100%' gradientUnits='objectBoundingBox'>
                <stop offset='0%' stopColor='rgba(255,255,255,0.10)' />
                <stop offset='8%' stopColor='rgba(255,255,255,0)' />
              </linearGradient>
            </defs>
            <rect width='391' height='333' rx='34' fill='url(#fld-shell)' />
            <rect width='391' height='333' rx='34' fill='url(#fld-shell-hl)' />
          </svg>
        </div>

        {/* 文档卡片 */}
        {docs.map((doc, i) => (
          <motion.div
            key={i}
            className='absolute'
            style={{
              width: doc.w,
              height: doc.h,
              bottom: f.docBottomOffset + doc.y,
              left: (f.folderW - doc.w) / 2 + doc.x,
              zIndex: doc.z,
              borderRadius: f.docRadius,
              background: doc.bg,
              boxShadow: '0 2px 16px rgba(0,0,0,0.13), inset 0 1px 0 rgba(255,255,255,0.9)',
              border: '1px solid rgba(0,0,0,0.07)',
              transformOrigin: 'bottom center',
            }}
            animate={
              isOpened
                ? { x: doc.openX, y: doc.openY, rotate: doc.openRotate, opacity: 1 }
                : { x: 0, y: 0, rotate: 0, opacity: 0.92 }
            }
            transition={{ ...SPRING, delay: isOpened ? doc.openDelay : (3 - doc.z) * 0.025 }}
          >
            <div className='flex flex-col gap-[7px] p-3 pt-4'>
              {doc.lines.map((w, j) => (
                <div key={j} className='h-[5px] rounded-full' style={{ width: `${w * 100}%`, background: 'rgba(0,0,0,0.1)' }} />
              ))}
            </div>
          </motion.div>
        ))}

        {/* 模糊层：按 blurApproach 切换方案 */}
        {blurApproach === 1 && (
          <motion.div
            className='pointer-events-none absolute bottom-0'
            style={{
              left: (f.folderW - flapW) / 2,
              width: flapW,
              height: flapH,
              backdropFilter: `blur(${flapBlur}px)`,
              WebkitBackdropFilter: `blur(${flapBlur}px)`,
              maskImage: FLAP_MASK_DATA_URI,
              WebkitMaskImage: FLAP_MASK_DATA_URI,
              maskSize: '100% 100%',
              maskRepeat: 'no-repeat',
              maskPosition: '0 0',
              zIndex: 4,
            }}
            animate={isOpened ? { y: 4 } : { y: 0 }}
            transition={SPRING}
          />
        )}
        {blurApproach === 2 && (
          <motion.div
            className='pointer-events-none absolute bottom-0 overflow-hidden'
            style={{
              left: (f.folderW - flapW) / 2,
              width: flapW,
              height: flapH,
              clipPath: `path('${scaledFlapPath(flapW / 432, flapH / 271)}')`,
              zIndex: 4,
            }}
            animate={isOpened ? { y: 4 } : { y: 0 }}
            transition={SPRING}
          >
            <div
              className='absolute inset-0'
              style={{
                backdropFilter: `blur(${flapBlur}px)`,
                WebkitBackdropFilter: `blur(${flapBlur}px)`,
              }}
            />
          </motion.div>
        )}
        {blurApproach === 4 && (
          <motion.div
            className='pointer-events-none absolute bottom-0'
            style={{
              left: (f.folderW - flapW) / 2,
              width: flapW,
              height: flapH,
              isolation: 'isolate',
              clipPath: `path('${scaledFlapPath(flapW / 432, flapH / 271)}')`,
              backdropFilter: `blur(${flapBlur}px)`,
              WebkitBackdropFilter: `blur(${flapBlur}px)`,
              zIndex: 4,
            }}
            animate={isOpened ? { y: 4 } : { y: 0 }}
            transition={SPRING}
          />
        )}

        {/* 前盖渐变层 — qiangai.svg 造型 */}
        <motion.svg
          className='absolute bottom-0'
          style={{ left: (f.folderW - flapW) / 2, zIndex: 5 }}
          width={flapW}
          height={flapH}
          viewBox='0 0 432 271'
          preserveAspectRatio='none'
          animate={isOpened ? { y: 4, opacity: p.flapOpacity * 0.9 } : { y: 0, opacity: p.flapOpacity }}
          transition={SPRING}
        >
          <defs>
            <linearGradient id='fld-flap' x1='39.6%' y1='1.1%' x2='60.4%' y2='98.9%' gradientUnits='objectBoundingBox'>
              <stop offset='0%' stopColor={p.flapColorTop} />
              <stop offset='100%' stopColor={p.flapColorBot} />
            </linearGradient>
            <linearGradient id='fld-flap-hl' x1='0%' y1='0%' x2='0%' y2='100%' gradientUnits='objectBoundingBox'>
              <stop offset='0%' stopColor='rgba(255,255,255,0.12)' />
              <stop offset='12%' stopColor='rgba(255,255,255,0)' />
            </linearGradient>
            {/* 方案 3 模拟磨砂：半透明白色叠加层 */}
            <linearGradient id='fld-flap-frost' x1='0%' y1='0%' x2='100%' y2='100%' gradientUnits='objectBoundingBox'>
              <stop offset='0%' stopColor='rgba(255,255,255,0.18)' />
              <stop offset='50%' stopColor='rgba(255,255,255,0.08)' />
              <stop offset='100%' stopColor='rgba(255,255,255,0)' />
            </linearGradient>
          </defs>
          <path d={FLAP_PATH_D} fill='url(#fld-flap)' stroke={p.flapStrokeColor} strokeWidth={p.flapStrokeWidth} />
          <path d={FLAP_PATH_D} fill='url(#fld-flap-hl)' stroke='none' />
          {blurApproach === 3 && <path d={FLAP_PATH_D} fill='url(#fld-flap-frost)' stroke='none' />}
        </motion.svg>
      </div>
    </div>
  );
}
