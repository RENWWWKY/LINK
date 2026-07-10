import type { CharacterPhotoRecord, CharacterProfile, ChatImageProviderType, ChatMessage, Conversation, VoomPost } from '@/types/domain';
import { createId } from '@/utils/id';

const generatedImageProviders = new Set<ChatImageProviderType>(['openai', 'novelai', 'pollinations']);

export type CharacterPhotoItemSource = 'stored' | 'chat' | 'voom';

export interface CharacterPhotoItem {
  key: string;
  imageUrl: string;
  title: string;
  source: CharacterPhotoItemSource;
  sourceLabel: string;
  createdAt: number;
  photoId?: string;
  messageId?: string;
  postId?: string;
  canDelete: boolean;
}

export function normalizeCharacterPhotoRecord(photo: Partial<CharacterPhotoRecord> | null | undefined): CharacterPhotoRecord | null {
  const imageUrl = String(photo?.imageUrl ?? '').trim();
  if (!imageUrl) return null;
  const now = Date.now();
  const createdAt = Number.isFinite(photo?.createdAt) ? Number(photo?.createdAt) : now;
  return {
    id: String(photo?.id ?? '').trim() || createId('character-photo'),
    imageUrl,
    source: photo?.source === 'manual-local' || photo?.source === 'call-generated' ? photo.source : 'manual-url',
    title: String(photo?.title ?? '').trim() || '角色照片',
    prompt: String(photo?.prompt ?? '').trim() || undefined,
    negativePrompt: String(photo?.negativePrompt ?? '').trim() || undefined,
    provider: isGeneratedImageProvider(photo?.provider) ? photo.provider : undefined,
    model: String(photo?.model ?? '').trim() || undefined,
    size: String(photo?.size ?? '').trim() || undefined,
    createdAt,
    updatedAt: Number.isFinite(photo?.updatedAt) ? Number(photo?.updatedAt) : createdAt
  };
}

export function normalizeCharacterPhotoRecords(photos: unknown): CharacterPhotoRecord[] {
  if (!Array.isArray(photos)) return [];
  const seen = new Set<string>();
  return photos
    .map((photo) => normalizeCharacterPhotoRecord(photo as Partial<CharacterPhotoRecord>))
    .filter((photo): photo is CharacterPhotoRecord => Boolean(photo))
    .filter((photo) => {
      if (seen.has(photo.id)) return false;
      seen.add(photo.id);
      return true;
    });
}

export function normalizeHiddenSourcePhotoKeys(keys: unknown): string[] {
  if (!Array.isArray(keys)) return [];
  return [...new Set(keys.map((key) => String(key ?? '').trim()).filter(Boolean))];
}

export function createCharacterPhotoRecord(input: Pick<CharacterPhotoRecord, 'imageUrl'> & Partial<Omit<CharacterPhotoRecord, 'id' | 'imageUrl' | 'createdAt' | 'updatedAt'>>): CharacterPhotoRecord {
  const now = Date.now();
  return {
    id: createId('character-photo'),
    imageUrl: input.imageUrl.trim(),
    source: input.source ?? 'manual-url',
    title: input.title?.trim() || '角色照片',
    prompt: input.prompt?.trim() || undefined,
    negativePrompt: input.negativePrompt?.trim() || undefined,
    provider: isGeneratedImageProvider(input.provider) ? input.provider : undefined,
    model: input.model?.trim() || undefined,
    size: input.size?.trim() || undefined,
    createdAt: now,
    updatedAt: now
  };
}

export function isGeneratedImageProvider(provider: unknown): provider is ChatImageProviderType {
  return generatedImageProviders.has(provider as ChatImageProviderType);
}

function isUsableGeneratedImage(imageUrl: string | undefined, provider: unknown) {
  const normalizedUrl = String(imageUrl ?? '').trim();
  if (!normalizedUrl || normalizedUrl === '/load.jpg') return false;
  return isGeneratedImageProvider(provider);
}

function chatPhotoKey(message: ChatMessage) {
  return `chat:${message.id}`;
}

function voomPhotoKey(post: VoomPost) {
  return `voom:${post.id}`;
}

function sortPhotoItems(left: CharacterPhotoItem, right: CharacterPhotoItem) {
  return right.createdAt - left.createdAt || left.key.localeCompare(right.key);
}

function addPhotoItem(items: CharacterPhotoItem[], hiddenKeys: Set<string>, item: CharacterPhotoItem) {
  if (hiddenKeys.has(item.key)) return;
  items.push(item);
}

export function collectCharacterPhotoItems(input: {
  character: CharacterProfile;
  conversations: Conversation[];
  messages: ChatMessage[];
  voomPosts: VoomPost[];
}): CharacterPhotoItem[] {
  const hiddenKeys = new Set(normalizeHiddenSourcePhotoKeys(input.character.imageProfile?.hiddenSourcePhotoKeys));
  const conversationIds = new Set(input.conversations.filter((conversation) => conversation.charId === input.character.id).map((conversation) => conversation.id));
  const items: CharacterPhotoItem[] = [];

  for (const photo of normalizeCharacterPhotoRecords(input.character.imageProfile?.photos)) {
    items.push({
      key: `stored:${photo.id}`,
      imageUrl: photo.imageUrl,
      title: photo.title || '角色照片',
      source: 'stored',
      sourceLabel: photo.source === 'call-generated' ? '视频生图' : '角色照片',
      createdAt: photo.createdAt,
      photoId: photo.id,
      canDelete: true
    });
  }

  for (const message of input.messages) {
    if (!conversationIds.has(message.conversationId)) continue;
    const image = message.image;
    const imageUrl = image?.url?.trim() ?? '';
    const usedMessageImageUrls = new Set<string>();
    if (image?.kind === 'generated' && isUsableGeneratedImage(imageUrl, image.provider)) {
      usedMessageImageUrls.add(imageUrl);
      addPhotoItem(items, hiddenKeys, {
        key: chatPhotoKey(message),
        imageUrl,
        title: image.description || '聊天配图',
        source: 'chat',
        sourceLabel: '聊天配图',
        createdAt: message.createdAt,
        messageId: message.id,
        canDelete: true
      });
    }
    for (const candidate of image?.candidates ?? []) {
      const candidateUrl = candidate.image.trim();
      if (!isUsableGeneratedImage(candidateUrl, candidate.provider) || usedMessageImageUrls.has(candidateUrl)) continue;
      usedMessageImageUrls.add(candidateUrl);
      addPhotoItem(items, hiddenKeys, {
        key: `${chatPhotoKey(message)}:candidate:${candidate.id}`,
        imageUrl: candidateUrl,
        title: candidate.description || image?.description || '聊天配图',
        source: 'chat',
        sourceLabel: '聊天配图',
        createdAt: candidate.createdAt || message.createdAt,
        messageId: message.id,
        canDelete: true
      });
    }
  }

  for (const post of input.voomPosts) {
    const imageUrl = post.image?.trim() ?? '';
    if (post.charId !== input.character.id) continue;
    const usedPostImageUrls = new Set<string>();
    if (isUsableGeneratedImage(imageUrl, post.imageProvider)) {
      usedPostImageUrls.add(imageUrl);
      addPhotoItem(items, hiddenKeys, {
        key: voomPhotoKey(post),
        imageUrl,
        title: post.imageDescription || post.content || 'VOOM 配图',
        source: 'voom',
        sourceLabel: 'VOOM 配图',
        createdAt: post.createdAt,
        postId: post.id,
        canDelete: true
      });
    }
    for (const candidate of post.imageCandidates ?? []) {
      const candidateUrl = candidate.image.trim();
      if (!isUsableGeneratedImage(candidateUrl, candidate.provider) || usedPostImageUrls.has(candidateUrl)) continue;
      usedPostImageUrls.add(candidateUrl);
      addPhotoItem(items, hiddenKeys, {
        key: `${voomPhotoKey(post)}:candidate:${candidate.id}`,
        imageUrl: candidateUrl,
        title: candidate.description || post.imageDescription || post.content || 'VOOM 配图',
        source: 'voom',
        sourceLabel: 'VOOM 配图',
        createdAt: candidate.createdAt || post.createdAt,
        postId: post.id,
        canDelete: true
      });
    }
  }

  return items.sort(sortPhotoItems);
}

export function collectCharacterPhotoImages(input: Parameters<typeof collectCharacterPhotoItems>[0]) {
  const seen = new Set<string>();
  return collectCharacterPhotoItems(input)
    .map((item) => item.imageUrl.trim())
    .filter((imageUrl) => {
      if (!imageUrl || seen.has(imageUrl)) return false;
      seen.add(imageUrl);
      return true;
    });
}
