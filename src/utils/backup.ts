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
  'musicFavoriteTracks',
  'musicCommentThreads',
  'worldBooks',
  'stickerGroups',
  'stickers',
  'conversationSettings',
  'conversationMemories',
  'generatedImages'
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

function normalizeBackupSnapshot(value: unknown): AppSnapshot {
  if (!isRecord(value)) throw new Error('备份文件结构不正确。');

  const snapshot: Record<string, unknown> = {
    ...value,
    settings: isRecord(value.settings) ? value.settings : {}
  };

  for (const key of snapshotArrayKeys) {
    snapshot[key] = Array.isArray(value[key]) ? value[key] : [];
  }

  return snapshot as unknown as AppSnapshot;
}

function toLinkBackupFile(value: unknown): LinkBackupFile {
  if (isRecord(value) && isRecord(value.snapshot)) {
    return {
      app: value.app === 'LINK' ? 'LINK' : 'LINK',
      backupVersion: value.backupVersion === 1 ? 1 : 1,
      exportedAt: Math.max(0, Number(value.exportedAt ?? 0) || 0),
      snapshot: normalizeBackupSnapshot(value.snapshot)
    };
  }

  return {
    app: 'LINK',
    backupVersion: 1,
    exportedAt: 0,
    snapshot: normalizeBackupSnapshot(value)
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
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 0);
}