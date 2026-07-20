import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FilePicker } from '@capawesome/capacitor-file-picker';

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .slice(-160)
    || 'BabyLink-export';
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const result = String(reader.result ?? '');
      const commaIndex = result.indexOf(',');
      if (commaIndex < 0) {
        reject(new Error('导出文件编码失败。'));
        return;
      }
      resolve(result.slice(commaIndex + 1));
    });
    reader.addEventListener('error', () => reject(reader.error ?? new Error('导出文件读取失败。')));
    reader.readAsDataURL(blob);
  });
}

export function isNativeFileShareAvailable() {
  return Capacitor.isNativePlatform()
    && Capacitor.isPluginAvailable('Filesystem')
    && Capacitor.isPluginAvailable('Share');
}

export function isNativeFilePickerAvailable() {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('FilePicker');
}

function base64File(data: string, fileName: string, mimeType: string, modifiedAt?: number) {
  const binary = window.atob(data.replace(/\s+/g, ''));
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([buffer], fileName || 'BabyLink-theme.png', {
    type: mimeType || 'image/png',
    lastModified: modifiedAt || Date.now()
  });
}

export async function pickNativePngFile(): Promise<File | null | undefined> {
  if (!isNativeFilePickerAvailable()) return undefined;
  const result = await FilePicker.pickFiles({ types: ['image/png'], readData: true });
  const pickedFile = result.files[0];
  if (!pickedFile) return null;
  if (pickedFile.blob) {
    return new File([pickedFile.blob], pickedFile.name || 'BabyLink-theme.png', {
      type: pickedFile.mimeType || pickedFile.blob.type || 'image/png',
      lastModified: pickedFile.modifiedAt || Date.now()
    });
  }
  if (!pickedFile.data) throw new Error('系统文件选择器没有返回 PNG 内容。');
  return base64File(pickedFile.data, pickedFile.name, pickedFile.mimeType, pickedFile.modifiedAt);
}

export async function shareNativeDataUrl(dataUrl: string, fileName: string) {
  if (!isNativeFileShareAvailable()) return false;
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error('分享文件转换失败。');
  return await shareNativeFile(await response.blob(), fileName);
}

export async function shareNativeFile(blob: Blob, fileName: string) {
  if (!isNativeFileShareAvailable()) return false;
  const safeFileName = sanitizeFileName(fileName);
  const path = `exports/${Date.now()}-${safeFileName}`;
  const writtenFile = await Filesystem.writeFile({
    path,
    data: await blobToBase64(blob),
    directory: Directory.Cache,
    recursive: true
  });

  try {
    await Share.share({
      title: safeFileName,
      files: [writtenFile.uri],
      dialogTitle: '导出 BabyLink 文件'
    });
    return true;
  } finally {
    await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => undefined);
  }
}
