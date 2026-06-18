import type { AppSnapshot } from '@/types/domain';

export interface LinkBackupFile {
  app: 'LINK';
  backupVersion: 1;
  exportedAt: number;
  snapshot: AppSnapshot;
}

const snapshotArrayKeys: Array<keyof Omit<AppSnapshot, 'settings'>> = [
  'users',
  'characters',
  'conversations',
  'messages',
  'voomPosts',
  'worldBooks',
  'stickerGroups',
  'stickers',
  'conversationSettings',
  'conversationMemories'
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function cloneSnapshot(snapshot: AppSnapshot): AppSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as AppSnapshot;
}

function sanitizeSnapshotForBackup(snapshot: AppSnapshot): AppSnapshot {
  const safeSnapshot = cloneSnapshot(snapshot);
  safeSnapshot.settings.githubBackup = {
    ...safeSnapshot.settings.githubBackup,
    enabled: false,
    token: '',
    lastBackupStatus: 'idle',
    lastBackupError: ''
  };
  return safeSnapshot;
}

function assertSnapshot(value: unknown): asserts value is AppSnapshot {
  if (!isRecord(value)) throw new Error('备份文件结构不正确。');

  for (const key of snapshotArrayKeys) {
    if (!Array.isArray(value[key])) throw new Error(`备份文件缺少 ${key} 数据。`);
  }

  if (!isRecord(value.settings)) throw new Error('备份文件缺少 settings 数据。');
}

function toLinkBackupFile(value: unknown): LinkBackupFile {
  if (isRecord(value) && isRecord(value.snapshot)) {
    assertSnapshot(value.snapshot);
    return {
      app: value.app === 'LINK' ? 'LINK' : 'LINK',
      backupVersion: value.backupVersion === 1 ? 1 : 1,
      exportedAt: Math.max(0, Number(value.exportedAt ?? 0) || 0),
      snapshot: value.snapshot
    };
  }

  assertSnapshot(value);
  return {
    app: 'LINK',
    backupVersion: 1,
    exportedAt: 0,
    snapshot: value
  };
}

export function createLinkBackupFile(snapshot: AppSnapshot): LinkBackupFile {
  return {
    app: 'LINK',
    backupVersion: 1,
    exportedAt: Date.now(),
    snapshot: sanitizeSnapshotForBackup(snapshot)
  };
}

export function parseLinkBackupFileText(text: string): LinkBackupFile {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('备份文件不是有效 JSON。');
  }

  return toLinkBackupFile(parsed);
}

export function parseLinkBackupText(text: string): AppSnapshot {
  return parseLinkBackupFileText(text).snapshot;
}

export function createBackupFilename(userId: string) {
  const suffix = new Date().toISOString().replace(/[:.]/g, '-');
  const safeUserId = userId.trim() || 'local';
  return `link-backup-${safeUserId}-${suffix}.json`;
}

export function downloadLinkBackupFile(backup: LinkBackupFile, filename: string) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}