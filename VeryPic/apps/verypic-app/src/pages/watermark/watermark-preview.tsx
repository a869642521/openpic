import { useEffect, useRef, memo } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import useWatermarkStore from '@/store/watermark';
import { WatermarkType } from '@/constants';
import { useI18n } from '@/i18n';
import { clamp01, resolvePositionAfterDrag } from './watermark-position-map';

const CANVAS_W = 260;
const CANVAS_H = 160;

function computeContainLayout(
  canvasW: number,
  canvasH: number,
  imgW: number,
  imgH: number,
) {
  const imgAspect = imgW / imgH;
  const canvasAspect = canvasW / canvasH;
  let drawW: number;
  let drawH: number;
  let drawX: number;
  let drawY: number;
  if (imgAspect > canvasAspect) {
    drawW = canvasW;
    drawH = canvasW / imgAspect;
    drawX = 0;
    drawY = (canvasH - drawH) / 2;
  } else {
    drawH = canvasH;
    drawW = canvasH * imgAspect;
    drawX = (canvasW - drawW) / 2;
    drawY = 0;
  }
  return { drawX, drawY, drawW, drawH };
}

function drawWatermark(
  canvas: HTMLCanvasElement,
  baseImg: HTMLImageElement,
  opts: ReturnType<typeof useWatermarkStore.getState>['options'],
  wmImg: HTMLImageElement | null,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  const { drawX, drawY, drawW, drawH } = computeContainLayout(
    CANVAS_W,
    CANVAS_H,
    baseImg.naturalWidth,
    baseImg.naturalHeight,
  );
  ctx.drawImage(baseImg, drawX, drawY, drawW, drawH);

  if (opts.watermarkType === WatermarkType.None) return;

  const isTile = opts.watermarkType === WatermarkType.Tile;
  const isImage = opts.watermarkType === WatermarkType.Image;

  const nx = opts.positionNormX ?? 0.98;
  const ny = opts.positionNormY ?? 0.98;
  const ax = drawX + nx * drawW;
  const ay = drawY + ny * drawH;

  if (isTile) {
    const gapX = opts.tileGapX ?? 40;
    const gapY = opts.tileGapY ?? 40;
    const rot = ((opts.tileRotation ?? 0) * Math.PI) / 180;

    if (!isImage) {
      const fontSize = Math.max(8, opts.watermarkFontSize);
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = opts.watermarkTextColor || '#FFFFFF';
      const textW = ctx.measureText(opts.watermarkText || '').width;
      const unitW = textW + gapX;
      const unitH = fontSize + gapY;
      const cols = Math.ceil(CANVAS_W / unitW) + 2;
      const rows = Math.ceil(CANVAS_H / unitH) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.save();
          const cx = c * unitW + textW / 2;
          const cy = r * unitH + fontSize / 2;
          ctx.translate(cx, cy);
          ctx.rotate(rot);
          ctx.fillText(opts.watermarkText || '', -textW / 2, fontSize / 2);
          ctx.restore();
        }
      }
    }
    return;
  }

  if (!isImage) {
    const fontSize = Math.max(8, opts.watermarkFontSize);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = opts.watermarkTextColor || '#FFFFFF';
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.watermarkText || '', ax, ay);
    return;
  }

  if (wmImg && wmImg.complete && wmImg.naturalWidth > 0) {
    const wmW = drawW * opts.watermarkImageScale;
    const aspect = wmImg.naturalWidth / wmImg.naturalHeight;
    const wmH = wmW / aspect;
    ctx.save();
    ctx.globalAlpha = opts.watermarkImageOpacity;
    ctx.drawImage(wmImg, ax - wmW / 2, ay - wmH / 2, wmW, wmH);
    ctx.restore();
  }
}

function clientToCanvas(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;
  return {
    cx: (clientX - rect.left) * scaleX,
    cy: (clientY - rect.top) * scaleY,
  };
}

function hitTestText(
  cx: number,
  cy: number,
  ax: number,
  ay: number,
  text: string,
  fontSize: number,
  ctx: CanvasRenderingContext2D,
) {
  ctx.font = `${Math.max(8, fontSize)}px sans-serif`;
  const tw = ctx.measureText(text).width;
  const fs = Math.max(8, fontSize);
  const pad = 8;
  return Math.abs(cx - ax) < tw / 2 + pad && Math.abs(cy - ay) < fs / 2 + pad;
}

function hitTestImage(cx: number, cy: number, ax: number, ay: number, wmW: number, wmH: number) {
  const pad = 4;
  return (
    cx >= ax - wmW / 2 - pad &&
    cx <= ax + wmW / 2 + pad &&
    cy >= ay - wmH / 2 - pad &&
    cy <= ay + wmH / 2 + pad
  );
}

function WatermarkPreview() {
  const files = useWatermarkStore((s) => s.files);
  const options = useWatermarkStore((s) => s.options);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseImgRef = useRef<HTMLImageElement | null>(null);
  const wmImgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const t = useI18n();

  const firstFile = files[0];
  const isTile = options.watermarkType === WatermarkType.Tile;
  const canDrag =
    !isTile &&
    (options.watermarkType === WatermarkType.Text || options.watermarkType === WatermarkType.Image);

  useEffect(() => {
    if (!firstFile || !canvasRef.current) return;

    const src = convertFileSrc(firstFile.path);
    const img = new Image();
    img.onload = () => {
      baseImgRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) {
        drawWatermark(canvas, img, useWatermarkStore.getState().options, wmImgRef.current);
      }
    };
    img.src = src;
  }, [firstFile?.path]);

  useEffect(() => {
    if (options.watermarkType !== WatermarkType.Image || !options.watermarkImagePath) {
      wmImgRef.current = null;
      const canvas = canvasRef.current;
      const base = baseImgRef.current;
      if (canvas && base) {
        drawWatermark(canvas, base, useWatermarkStore.getState().options, null);
      }
      return;
    }
    const wm = new Image();
    wm.onload = () => {
      wmImgRef.current = wm;
      const canvas = canvasRef.current;
      const base = baseImgRef.current;
      if (canvas && base) {
        drawWatermark(canvas, base, useWatermarkStore.getState().options, wm);
      }
    };
    wm.src = convertFileSrc(options.watermarkImagePath);
  }, [options.watermarkType, options.watermarkImagePath]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const base = baseImgRef.current;
    if (!canvas || !base) return;
    drawWatermark(canvas, base, options, wmImgRef.current);
  }, [options]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDrag || !baseImgRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const { cx, cy } = clientToCanvas(canvas, e.clientX, e.clientY);
    const { drawX, drawY, drawW, drawH } = computeContainLayout(
      CANVAS_W,
      CANVAS_H,
      baseImgRef.current.naturalWidth,
      baseImgRef.current.naturalHeight,
    );
    if (cx < drawX || cx > drawX + drawW || cy < drawY || cy > drawY + drawH) return;

    const nx = options.positionNormX ?? 0.98;
    const ny = options.positionNormY ?? 0.98;
    const ax = drawX + nx * drawW;
    const ay = drawY + ny * drawH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let hit = false;
    if (options.watermarkType === WatermarkType.Text && options.watermarkText?.trim()) {
      hit = hitTestText(cx, cy, ax, ay, options.watermarkText, options.watermarkFontSize, ctx);
    } else if (options.watermarkType === WatermarkType.Image && wmImgRef.current?.complete) {
      const wmW = drawW * options.watermarkImageScale;
      const aspect =
        wmImgRef.current.naturalWidth / Math.max(1, wmImgRef.current.naturalHeight);
      const wmH = wmW / aspect;
      hit = hitTestImage(cx, cy, ax, ay, wmW, wmH);
    }

    if (!hit) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      offsetX: cx - ax,
      offsetY: cy - ay,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId || !baseImgRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const { cx, cy } = clientToCanvas(canvas, e.clientX, e.clientY);
    const { drawX, drawY, drawW, drawH } = computeContainLayout(
      CANVAS_W,
      CANVAS_H,
      baseImgRef.current.naturalWidth,
      baseImgRef.current.naturalHeight,
    );

    const newAx = cx - d.offsetX;
    const newAy = cy - d.offsetY;
    const normX = clamp01((newAx - drawX) / drawW);
    const normY = clamp01((newAy - drawY) / drawH);
    const resolved = resolvePositionAfterDrag(normX, normY);
    useWatermarkStore.getState().setOptions(resolved);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  if (!firstFile) return null;

  return (
    <div
      className={`mt-0 flex flex-col gap-1 ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <span className='text-[10px] text-neutral-400'>
        {t('watermark.preview.title')}
      </span>
      {isTile && (
        <span className='text-[10px] text-neutral-400'>{t('watermark.preview.tile_no_drag')}</span>
      )}
      {canDrag && (
        <span className='text-[10px] text-neutral-400'>{t('watermark.preview.drag_hint')}</span>
      )}
      <div
        className={`overflow-hidden rounded-lg border ${isTile ? 'pointer-events-none' : ''}`}
        style={{ borderColor: 'rgb(219,219,220)' }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className='block w-full touch-none'
          style={{ background: 'rgb(240,240,240)' }}
        />
      </div>
    </div>
  );
}

export default memo(WatermarkPreview);
