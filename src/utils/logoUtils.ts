import type { SyntheticEvent } from 'react';

export const DEFAULT_COLLEGE_LOGO = '/college_logo.jpg';
export const LOGO_CACHE_STORAGE_KEY = 'sporttrack_college_logo_cache_v1';

const MAX_RAW_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_COMPRESSED_DATA_URL_BYTES = 200 * 1024; // 200 KB
const MAX_DIMENSION_PX = 256;

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const ALLOWED_EXTENSIONS = /\.(png|jpe?g|webp)$/i;

export const getCachedCollegeLogo = (): string => {
  try {
    const val = localStorage.getItem(LOGO_CACHE_STORAGE_KEY);
    return val && val.trim() ? val.trim() : '';
  } catch {
    return '';
  }
};

export const setCachedCollegeLogo = (logoUrl?: string): void => {
  try {
    const clean = (logoUrl || '').trim();
    if (!clean || clean === DEFAULT_COLLEGE_LOGO) {
      localStorage.removeItem(LOGO_CACHE_STORAGE_KEY);
      return;
    }
    localStorage.setItem(LOGO_CACHE_STORAGE_KEY, clean);
  } catch {
    // Ignore storage quota / restricted storage errors
  }
};

export const clearCachedCollegeLogo = (): void => {
  try {
    localStorage.removeItem(LOGO_CACHE_STORAGE_KEY);
  } catch {
    // Ignore storage access errors
  }
};

export const handleLogoImgError = (e: SyntheticEvent<HTMLImageElement>): void => {
  const img = e.currentTarget;
  if (img.getAttribute('src') !== DEFAULT_COLLEGE_LOGO) {
    img.src = DEFAULT_COLLEGE_LOGO;
  }
};

export interface ProcessedLogoResult {
  dataUrl: string;
  byteLength: number;
  width: number;
  height: number;
  mimeType: string;
}

const getByteLength = (str: string): number => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).length;
  }
  return str.length;
};

const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (!img.naturalWidth || !img.naturalHeight) {
        reject(new Error('Could not read image dimensions. Please choose another PNG, JPG, or WebP file.'));
        return;
      }
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Invalid or corrupted image file. Please choose a valid PNG, JPG, or WebP image.'));
    };
    img.src = objectUrl;
  });
};

const renderToCanvasDataUrl = (
  img: HTMLImageElement,
  maxSide: number,
  outputMime: 'image/png' | 'image/jpeg' | 'image/webp',
  quality?: number
): { dataUrl: string; width: number; height: number } => {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser canvas is unavailable to process the image.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (outputMime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl =
    outputMime === 'image/png'
      ? canvas.toDataURL('image/png')
      : canvas.toDataURL(outputMime, quality);

  return { dataUrl, width, height };
};

export const processLogoImageFile = async (file: File): Promise<ProcessedLogoResult> => {
  const mime = (file.type || '').toLowerCase();
  const fileName = (file.name || '').toLowerCase();

  if (mime === 'image/svg+xml' || fileName.endsWith('.svg')) {
    throw new Error('SVG files are not allowed. Please select a PNG, JPG, or WebP image.');
  }

  const isAllowedMime = ALLOWED_MIME_TYPES.has(mime);
  const isAllowedExt = ALLOWED_EXTENSIONS.test(fileName);
  if (!isAllowedMime && !(mime === '' && isAllowedExt)) {
    throw new Error('Unsupported file type. Please select a PNG, JPG, or WebP image.');
  }

  if (file.size > MAX_RAW_FILE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`Image file is ${sizeMb} MB. Please choose an image smaller than 5 MB.`);
  }

  const img = await loadImageFromFile(file);

  const isPng = mime === 'image/png' || (mime === '' && fileName.endsWith('.png'));
  const isWebp = mime === 'image/webp' || (mime === '' && fileName.endsWith('.webp'));

  const dimensionSteps = [MAX_DIMENSION_PX, 224, 192, 160, 128, 96, 64];
  const qualitySteps = [0.88, 0.78, 0.68, 0.56, 0.44, 0.32];

  if (isPng) {
    // First try lossless PNG across dimension steps to preserve PNG format & full transparency
    for (const maxSide of dimensionSteps) {
      const rendered = renderToCanvasDataUrl(img, maxSide, 'image/png');
      const bytes = getByteLength(rendered.dataUrl);
      if (bytes < MAX_COMPRESSED_DATA_URL_BYTES) {
        return {
          dataUrl: rendered.dataUrl,
          byteLength: bytes,
          width: rendered.width,
          height: rendered.height,
          mimeType: 'image/png',
        };
      }
    }

    // If PNG still exceeds 200 KB even at smaller sizes, try WebP with alpha transparency
    for (const maxSide of [MAX_DIMENSION_PX, 192, 160, 128, 96]) {
      for (const quality of qualitySteps) {
        const rendered = renderToCanvasDataUrl(img, maxSide, 'image/webp', quality);
        const bytes = getByteLength(rendered.dataUrl);
        if (rendered.dataUrl.startsWith('data:image/webp') && bytes < MAX_COMPRESSED_DATA_URL_BYTES) {
          return {
            dataUrl: rendered.dataUrl,
            byteLength: bytes,
            width: rendered.width,
            height: rendered.height,
            mimeType: 'image/webp',
          };
        }
      }
    }

    throw new Error('Could not compress this PNG below 200 KB. Please choose a simpler or smaller image.');
  }

  const targetMime: 'image/jpeg' | 'image/webp' = isWebp ? 'image/webp' : 'image/jpeg';

  for (const maxSide of dimensionSteps) {
    for (const quality of qualitySteps) {
      const rendered = renderToCanvasDataUrl(img, maxSide, targetMime, quality);
      const bytes = getByteLength(rendered.dataUrl);
      if (bytes < MAX_COMPRESSED_DATA_URL_BYTES) {
        return {
          dataUrl: rendered.dataUrl,
          byteLength: bytes,
          width: rendered.width,
          height: rendered.height,
          mimeType: targetMime,
        };
      }
    }
  }

  throw new Error('Could not compress this image below 200 KB. Please choose a smaller image.');
};
