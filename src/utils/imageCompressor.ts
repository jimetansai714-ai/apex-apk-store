/**
 * High-performance client-side image compressor for App Logos & Screenshots.
 * Converts any image format into highly compressed WebP format (or JPEG if WebP not supported).
 * Reduces multi-megabyte camera photos into ~20KB - ~60KB with stunning visual clarity.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
}

export const compressImage = (
  file: File,
  maxDimension = 800,
  quality = 0.8
): Promise<CompressionResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-preserving dimensions
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to create canvas context'));
          return;
        }

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP format
        let mimeType = 'image/webp';
        let compressedDataUrl = canvas.toDataURL(mimeType, quality);

        // Fallback to JPEG if browser doesn't export WebP
        if (!compressedDataUrl.startsWith('data:image/webp')) {
          mimeType = 'image/jpeg';
          compressedDataUrl = canvas.toDataURL(mimeType, quality);
        }

        // Estimate size in bytes
        const head = compressedDataUrl.indexOf(',') + 1;
        const compressedBytes = Math.round((compressedDataUrl.length - head) * 0.75);
        const savings = Math.max(0, Math.round(((file.size - compressedBytes) / file.size) * 100));

        resolve({
          dataUrl: compressedDataUrl,
          originalSize: file.size,
          compressedSize: compressedBytes,
          savingsPercent: savings,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const compressLogo = (file: File): Promise<CompressionResult> => {
  return compressImage(file, 192, 0.85);
};

export const compressScreenshot = (file: File): Promise<CompressionResult> => {
  return compressImage(file, 800, 0.75);
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
