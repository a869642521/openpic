import { WatermarkPosition } from '@/constants';

/** 与预览 / Sidecar 锚点一致：九宫格预设的归一化坐标 */
export const WATERMARK_PRESET_NORMS: Array<{
  position: WatermarkPosition;
  xRatio: number;
  yRatio: number;
}> = [
  { position: WatermarkPosition.TopLeft, xRatio: 0.02, yRatio: 0.02 },
  { position: WatermarkPosition.Top, xRatio: 0.5, yRatio: 0.02 },
  { position: WatermarkPosition.TopRight, xRatio: 0.98, yRatio: 0.02 },
  { position: WatermarkPosition.Left, xRatio: 0.02, yRatio: 0.5 },
  { position: WatermarkPosition.Center, xRatio: 0.5, yRatio: 0.5 },
  { position: WatermarkPosition.Right, xRatio: 0.98, yRatio: 0.5 },
  { position: WatermarkPosition.BottomLeft, xRatio: 0.02, yRatio: 0.98 },
  { position: WatermarkPosition.Bottom, xRatio: 0.5, yRatio: 0.98 },
  { position: WatermarkPosition.BottomRight, xRatio: 0.98, yRatio: 0.98 },
];

const PRESET_SNAP_THRESHOLD = 0.06;

export function normsForWatermarkPosition(position: WatermarkPosition): { x: number; y: number } | null {
  if (position === WatermarkPosition.Custom) return null;
  const row = WATERMARK_PRESET_NORMS.find((p) => p.position === position);
  return row ? { x: row.xRatio, y: row.yRatio } : null;
}

/** 拖拽后：若靠近某预设则对齐并返回该预设，否则 Custom */
export function resolvePositionAfterDrag(normX: number, normY: number): {
  watermarkPosition: WatermarkPosition;
  positionNormX: number;
  positionNormY: number;
} {
  let best: (typeof WATERMARK_PRESET_NORMS)[0] | null = null;
  let bestD = Infinity;
  for (const p of WATERMARK_PRESET_NORMS) {
    const d = Math.hypot(normX - p.xRatio, normY - p.yRatio);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  if (best && bestD <= PRESET_SNAP_THRESHOLD) {
    return {
      watermarkPosition: best.position,
      positionNormX: best.xRatio,
      positionNormY: best.yRatio,
    };
  }
  return {
    watermarkPosition: WatermarkPosition.Custom,
    positionNormX: clamp01(normX),
    positionNormY: clamp01(normY),
  };
}

export function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}
