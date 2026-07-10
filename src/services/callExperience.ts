import type { RingtoneAsset } from '@/types/domain';
import { createId } from '@/utils/id';

export const callAudioAccept = 'audio/*,.mp3,.mpeg,.mpga,.m4a,.aac,.wav,.wave,.ogg,.oga,.opus,.webm,.flac,.caf,.aif,.aiff';

const supportedAudioExtensions = ['mp3', 'mpeg', 'mpga', 'm4a', 'aac', 'wav', 'wave', 'ogg', 'oga', 'opus', 'webm', 'flac', 'caf', 'aif', 'aiff'];
const mimeByExtension: Record<string, string> = {
  mp3: 'audio/mpeg',
  mpeg: 'audio/mpeg',
  mpga: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  wave: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/ogg',
  webm: 'audio/webm',
  flac: 'audio/flac',
  caf: 'audio/x-caf',
  aif: 'audio/aiff',
  aiff: 'audio/aiff'
};

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.trim().toLowerCase() ?? '';
}

function inferMimeType(file: File) {
  return file.type || mimeByExtension[getFileExtension(file.name)] || 'audio/mpeg';
}

function isSupportedAudioFile(file: File) {
  if (file.type.startsWith('audio/')) return true;
  return supportedAudioExtensions.includes(getFileExtension(file.name));
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')));
    reader.addEventListener('error', () => reject(reader.error ?? new Error('读取音频失败')));
    reader.readAsDataURL(file);
  });
}

export async function createCallAudioAsset(file: File, fallbackName: string): Promise<RingtoneAsset> {
  if (!isSupportedAudioFile(file)) throw new Error('请选择 MP3、M4A、AAC、WAV、OGG、WEBM 或 FLAC 音频。');
  return {
    id: createId('call-audio'),
    name: file.name || fallbackName,
    url: await readFileAsDataUrl(file),
    mimeType: inferMimeType(file),
    size: file.size,
    source: 'imported',
    updatedAt: Date.now()
  };
}