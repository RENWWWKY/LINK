import type { AppSnapshot, SmallTheater, VoomPost } from '@/types/domain';

export const globalVoomNoticeSeenStorageKey = 'link:global-voom-notices:seen-posts';
export const globalSmallTheaterNoticeSeenStorageKey = 'link:global-small-theater-notices:seen-theaters';

function getLocalStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readGlobalNoticeIds(storageKey: string) {
  const storage = getLocalStorage();
  if (!storage) return new Set<string>();

  try {
    const parsed = JSON.parse(storage.getItem(storageKey) || '[]');
    return new Set(Array.isArray(parsed) ? parsed.map((id) => String(id)).filter(Boolean) : []);
  } catch {
    return new Set<string>();
  }
}

export function writeGlobalNoticeIds(storageKey: string, ids: Iterable<string>) {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    const normalizedIds = [...new Set([...ids].map((id) => String(id)).filter(Boolean))];
    storage.setItem(storageKey, JSON.stringify(normalizedIds));
  } catch {
    // Notice state is best-effort and should never block backup restore.
  }
}

export function createVoomPostNoticeKey(post: Pick<VoomPost, 'id'>) {
  return `post:${post.id}`;
}

export function createRestoredVoomNoticeKeys(posts: Array<Pick<VoomPost, 'id' | 'authorType'>>) {
  return posts
    .filter((post) => post.authorType !== 'user')
    .map((post) => createVoomPostNoticeKey(post));
}

function markGlobalNoticeIdsSeen(storageKey: string, ids: Iterable<string>) {
  const seenIds = readGlobalNoticeIds(storageKey);
  for (const id of ids) seenIds.add(id);
  writeGlobalNoticeIds(storageKey, seenIds);
}

export function markRestoredGlobalNoticesSeen(snapshot: Pick<AppSnapshot, 'voomPosts' | 'smallTheaters'>) {
  markGlobalNoticeIdsSeen(globalVoomNoticeSeenStorageKey, createRestoredVoomNoticeKeys(snapshot.voomPosts ?? []));
  markGlobalNoticeIdsSeen(globalSmallTheaterNoticeSeenStorageKey, (snapshot.smallTheaters ?? []).map((theater: SmallTheater) => theater.id));
}
