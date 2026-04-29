import sharp, { Gravity, Metadata, Sharp } from 'sharp';
import { pxToPangoSize } from '../utils';

export async function addTileWatermark(payload: {
  stream: Sharp;
  /** 'text' or 'image' */
  contentType: 'text' | 'image';
  text?: string;
  color?: string;
  fontSize?: number;
  imagePath?: string;
  opacity?: number;
  /** 旋转角度（度）*/
  rotation?: number;
  /** 单块水印宽（含间距）*/
  tileGapX?: number;
  /** 单块水印高（含间距）*/
  tileGapY?: number;
  container: Metadata | { width: number; height: number };
}) {
  const {
    stream,
    contentType,
    text = '',
    color = '#FFFFFF',
    fontSize = 16,
    imagePath = '',
    opacity = 0.5,
    rotation = 0,
    tileGapX = 0,
    tileGapY = 0,
    container,
  } = payload;

  const imgWidth = container.width || 800;
  const imgHeight = container.height || 600;

  let singleBuffer: Buffer;

  if (contentType === 'text') {
    singleBuffer = await sharp({
      text: {
        text: `<span foreground="${color}" size="${pxToPangoSize(Number(fontSize))}">${text}</span>`,
        font: 'sans',
        rgba: true,
      },
    })
      .png()
      .toBuffer();
  } else {
    const rawW = Math.max(1, Math.floor(imgWidth * 0.15));
    singleBuffer = await sharp(imagePath)
      .ensureAlpha(0)
      .resize({ width: rawW, fit: 'inside', withoutEnlargement: true })
      .composite([
        {
          input: Buffer.from([255, 255, 255, Math.floor(255 * opacity)]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: 'dest-in',
        },
      ])
      .png({ force: true })
      .toBuffer();
  }

  if (rotation !== 0) {
    singleBuffer = await sharp(singleBuffer).rotate(rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  }

  const singleMeta = await sharp(singleBuffer).metadata();
  const unitW = (singleMeta.width || 100) + tileGapX;
  const unitH = (singleMeta.height || 30) + tileGapY;

  const cols = Math.ceil(imgWidth / unitW) + 1;
  const rows = Math.ceil(imgHeight / unitH) + 1;

  const composites: sharp.OverlayOptions[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      composites.push({
        input: singleBuffer,
        left: c * unitW,
        top: r * unitH,
        limitInputPixels: false,
      });
    }
  }

  return stream.composite(composites);
}

export async function addTextWatermark(payload: {
  stream: Sharp;
  text: string;
  color: string;
  fontSize: number;
  position: Gravity;
  /** 与前端一致：锚点为水印包围盒中心，0–1 相对原图宽高 */
  positionNorm?: { x: number; y: number };
  container: Metadata | { width: number; height: number };
}) {
  const { stream, text, color, fontSize, position, positionNorm, container } = payload;
  const watermarkImage = sharp({
    text: {
      text: `<span foreground="${color}" size="${pxToPangoSize(Number(fontSize))}">${text}</span>`,
      font: 'sans',
      rgba: true,
    },
  });

  const watermarkBuffer = await watermarkImage.png().toBuffer();
  const watermarkMeta = await sharp(watermarkBuffer).metadata();

  const shouldResize =
    (watermarkMeta.width || 0) > (container.width || 0) ||
    (watermarkMeta.height || 0) > (container.height || 0);

  const watermarkInput = shouldResize
    ? await sharp(watermarkBuffer)
        .resize({
          width: container.width,
          height: container.height,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toBuffer()
    : watermarkBuffer;

  const cw = container.width || 0;
  const ch = container.height || 0;
  if (positionNorm && cw > 0 && ch > 0) {
    const placedMeta = await sharp(watermarkInput).metadata();
    const wmW = placedMeta.width || 0;
    const wmH = placedMeta.height || 0;
    const anchorX = Math.round(positionNorm.x * cw);
    const anchorY = Math.round(positionNorm.y * ch);
    const left = Math.max(0, Math.min(Math.max(0, cw - wmW), anchorX - Math.floor(wmW / 2)));
    const top = Math.max(0, Math.min(Math.max(0, ch - wmH), anchorY - Math.floor(wmH / 2)));
    return stream.composite([
      {
        input: watermarkInput,
        left,
        top,
        limitInputPixels: false,
        animated: true,
      },
    ]);
  }

  return stream.composite([
    {
      input: watermarkInput,
      gravity: position,
      limitInputPixels: false,
      animated: true,
    },
  ]);
}

export async function addImageWatermark(payload: {
  stream: Sharp;
  imagePath: string;
  opacity: number;
  scale: number;
  position: Gravity;
  positionNorm?: { x: number; y: number };
  container: Metadata | { width: number; height: number };
}) {
  const { stream, imagePath, opacity = 0, scale, position, positionNorm, container } = payload;

  const watermarkWidth = Math.floor((container.width || 0) * scale);
  const watermarkBuffer = await sharp(imagePath)
    .ensureAlpha(0)
    .resize({
      width: watermarkWidth,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .composite([
      {
        input: Buffer.from([255, 255, 255, Math.floor(255 * opacity)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: 'dest-in',
      },
    ])
    .png({
      quality: 90,
      force: true,
    })
    .toBuffer();

  const cw = container.width || 0;
  const ch = container.height || 0;
  if (positionNorm && cw > 0 && ch > 0) {
    const placedMeta = await sharp(watermarkBuffer).metadata();
    const wmW = placedMeta.width || 0;
    const wmH = placedMeta.height || 0;
    const anchorX = Math.round(positionNorm.x * cw);
    const anchorY = Math.round(positionNorm.y * ch);
    const left = Math.max(0, Math.min(Math.max(0, cw - wmW), anchorX - Math.floor(wmW / 2)));
    const top = Math.max(0, Math.min(Math.max(0, ch - wmH), anchorY - Math.floor(wmH / 2)));
    return stream.composite([
      {
        input: watermarkBuffer,
        left,
        top,
        limitInputPixels: false,
        animated: true,
      },
    ]);
  }

  return stream.composite([
    {
      input: watermarkBuffer,
      gravity: position,
      limitInputPixels: false,
      animated: true,
    },
  ]);
}
