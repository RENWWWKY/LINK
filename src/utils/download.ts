import { isNativeImageSaveAvailable, saveNativeImage } from '@/services/nativeMedia';

function extensionFromMimeType(mimeType: string) {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('gif')) return 'gif';
  if (mimeType.includes('svg')) return 'svg';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  return '';
}

function extensionFromUrl(url: string) {
  const path = url.split('?')[0]?.split('#')[0] ?? '';
  const extension = path.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase();
  return extension && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extension) ? extension : '';
}

function safeDownloadName(name: string) {
  return name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    || 'link-image';
}

function clickDownload(url: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

async function fetchImage(source: string) {
  try {
    const response = await fetch(source, { mode: 'cors' });
    if (response.ok) return response;
  } catch {
    // Retry remote images through the authenticated same-origin proxy.
  }
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(`/__image-download?url=${encodeURIComponent(source)}`);
    if (response.ok) return response;
    throw new Error(`HTTP ${response.status}`);
  }
  throw new Error('图片读取失败。');
}

export async function downloadImageUrl(source: string, filenameBase: string) {
  const imageUrl = source.trim();
  if (!imageUrl) throw new Error('没有可下载的图片。');
  const baseName = safeDownloadName(filenameBase);
  const nativeSave = isNativeImageSaveAvailable();

  if (imageUrl.startsWith('data:')) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const fileName = `${baseName}.${extensionFromMimeType(blob.type) || 'jpg'}`;
    if (nativeSave) await saveNativeImage(blob, fileName);
    else clickDownload(imageUrl, fileName);
    return;
  }

  try {
    const response = await fetchImage(imageUrl);
    const blob = await response.blob();
    const extension = extensionFromMimeType(blob.type || '') || extensionFromUrl(imageUrl) || 'jpg';
    const fileName = `${baseName}.${extension}`;
    if (nativeSave) {
      await saveNativeImage(blob, fileName);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    try {
      clickDownload(objectUrl, fileName);
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
  } catch (error) {
    if (nativeSave) throw error;
    clickDownload(imageUrl, `${baseName}.${extensionFromUrl(imageUrl) || 'jpg'}`);
  }
}
