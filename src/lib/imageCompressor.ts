/**
 * Utility to compress and optimize image files client-side.
 * Converts large multi-megabyte camera photos and screenshots into high-clarity,
 * lightweight images (< 300KB) that upload instantaneously and fit smoothly
 * within database and storage payloads.
 */

export interface CompressedImageResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  name: string;
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1400,
    maxHeight = 1400,
    quality = 0.85,
    mimeType = 'image/jpeg'
  } = options;

  const originalSize = file.size;
  const fileName = file.name || 'image.jpg';

  // If already SVG or tiny image (< 50KB), just read as DataURL without alteration
  if (file.type === 'image/svg+xml' || (file.size < 50 * 1024 && file.type.startsWith('image/'))) {
    const dataUrl = await readFileAsDataURL(file);
    return {
      file,
      dataUrl,
      originalSize,
      compressedSize: file.size,
      width: 0,
      height: 0,
      name: fileName
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaled dimensions maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas context fails
          const fallbackDataUrl = readerEvent.target?.result as string;
          resolve({
            file,
            dataUrl: fallbackDataUrl,
            originalSize,
            compressedSize: originalSize,
            width: img.width,
            height: img.height,
            name: fileName
          });
          return;
        }

        // Fill background white for transparent PNGs converted to JPEG
        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const targetMime = mimeType;
        const dataUrl = canvas.toDataURL(targetMime, quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newExt = targetMime === 'image/webp' ? '.webp' : targetMime === 'image/png' ? '.png' : '.jpg';
              const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
              const newFileName = `${baseName}${newExt}`;
              const compressedFile = new File([blob], newFileName, { type: targetMime });

              resolve({
                file: compressedFile,
                dataUrl,
                originalSize,
                compressedSize: blob.size,
                width,
                height,
                name: newFileName
              });
            } else {
              resolve({
                file,
                dataUrl,
                originalSize,
                compressedSize: Math.round(dataUrl.length * 0.75),
                width,
                height,
                name: fileName
              });
            }
          },
          targetMime,
          quality
        );
      };

      img.onerror = () => {
        // Fallback on image decode error
        const fallbackDataUrl = readerEvent.target?.result as string;
        resolve({
          file,
          dataUrl: fallbackDataUrl,
          originalSize,
          compressedSize: originalSize,
          width: 0,
          height: 0,
          name: fileName
        });
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      // Fallback
      resolve({
        file,
        dataUrl: '',
        originalSize,
        compressedSize: 0,
        width: 0,
        height: 0,
        name: fileName
      });
    };

    reader.readAsDataURL(file);
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
