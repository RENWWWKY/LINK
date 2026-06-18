import type { AppSettings, CharacterProfile, ChatMessage, Conversation, Sticker, StickerGroup, UserProfile, VoomPost, WorldBookEntry } from '@/types/domain';
import { createVisualProfile } from '@/utils/profile';

const now = Date.now();

export const defaultUsers: UserProfile[] = [
  {
    id: '1008600001',
    nickname: 'Linker',
    name: 'momo',
    avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=momo&backgroundColor=06c755',
    description: '该用户很懒，什么也没留下',
    signature: 'link to your excutive character',
    boundCharacterIds: [],
    profile: createVisualProfile({
      id: '1008600001',
      nickname: 'Linker',
      name: 'momo',
      signature: 'link to your excutive character'
    })
  }
];

export const defaultCharacters: CharacterProfile[] = [];

export const defaultConversations: Conversation[] = [];

export const defaultStickerGroups: StickerGroup[] = [
  {
    id: 'sticker_group_default',
    name: 'ganadi',
    createdAt: now,
    updatedAt: now
  }
];

export const defaultStickers: Sticker[] = [
  {
    id: 'sticker_ganadi_stare',
    description: '紧盯着你',
    imageUrl: 'https://img.heliar.top/file/1781413300001_IMG_20260614_125939.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'sticker_ganadi_speechless',
    description: '无语',
    imageUrl: 'https://img.heliar.top/file/1781413305538_IMG_20260614_125924.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 1,
    updatedAt: now - 1
  },
  {
    id: 'sticker_ganadi_like',
    description: '小狗点赞',
    imageUrl: 'https://img.heliar.top/file/1781413297430_IMG_20260614_125856.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 2,
    updatedAt: now - 2
  },
  {
    id: 'sticker_ganadi_love',
    description: '小狗示爱',
    imageUrl: 'https://img.heliar.top/file/1781413298387_IMG_20260614_125848.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 3,
    updatedAt: now - 3
  },
  {
    id: 'sticker_ganadi_wronged',
    description: '小狗委屈',
    imageUrl: 'https://img.heliar.top/file/1781413294473_IMG_20260614_125839.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 4,
    updatedAt: now - 4
  },
  {
    id: 'sticker_ganadi_cry',
    description: '小狗哭泣',
    imageUrl: 'https://img.heliar.top/file/1781413299876_IMG_20260614_125825.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 5,
    updatedAt: now - 5
  },
  {
    id: 'sticker_ganadi_negotiate',
    description: '我需要谈判',
    imageUrl: 'https://img.heliar.top/file/1781413294947_IMG_20260614_125808.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 6,
    updatedAt: now - 6
  },
  {
    id: 'sticker_ganadi_escape',
    description: '就这样狗溜溜的逃离',
    imageUrl: 'https://img.heliar.top/file/1781413295195_IMG_20260614_125749.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 7,
    updatedAt: now - 7
  },
  {
    id: 'sticker_ganadi_court',
    description: '告到小狗法庭',
    imageUrl: 'https://img.heliar.top/file/1781413282665_IMG_20260614_125742.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 8,
    updatedAt: now - 8
  },
  {
    id: 'sticker_ganadi_losing_water',
    description: '正在大量流失水分。',
    imageUrl: 'https://img.heliar.top/file/1781413288631_IMG_20260614_125734.jpg',
    groupIds: ['sticker_group_default'],
    sourceType: 'url',
    createdAt: now - 9,
    updatedAt: now - 9
  }
];

export const defaultMessages: ChatMessage[] = [];

export const defaultWorldBooks: WorldBookEntry[] = [];

export const defaultVoomPosts: VoomPost[] = [];

export const defaultSettings: AppSettings = {
  activeUserId: '1008600001',
  apiEndpoint: '',
  apiKey: '',
  model: 'gpt-compatible-model',
  autoGenerateVoom: true,
  disclaimerAccepted: false,
  ttsEnabled: false,
  ttsVoice: 'alloy',
  ttsPlaybackMode: 'manual',
  imageModel: 'gpt-image-1',
  imageSize: '1024x1024',
  imagePromptPrefix: '',
  imageOpenAi: {
    activeVendorId: '',
    size: '1024x1024',
    positivePrompt: '',
    negativePrompt: '',
    lastImageUrl: '',
    vendors: []
  },
  imageNovelAi: {
    apiUrl: 'https://image.novelai.net',
    proxyUrl: '',
    apiKey: '',
    model: 'nai-diffusion-4-5-curated-preview',
    positivePrompt: '',
    negativePrompt: '',
    width: 832,
    height: 1216,
    guidance: 6.5,
    steps: 28,
    sampler: 'k_euler_ancestral',
    seed: '',
    lastImageUrl: ''
  },
  imagePollinations: {
    apiKey: '',
    referrer: 'link-pwa',
    model: 'flux',
    positivePrompt: '',
    negativePrompt: '',
    width: 1024,
    height: 1024,
    seed: '',
    enhance: true,
    nologo: true,
    private: true,
    lastImageUrl: ''
  },
  voomImageProvider: '',
  voomImageModel: '',
  imagePrivateOnly: true,
  githubBackup: {
    enabled: false,
    token: '',
    owner: '',
    repo: 'link-private-backups',
    branch: 'main',
    path: 'link-backup.json',
    intervalMinutes: 30,
    lastBackupAt: 0,
    lastBackupStatus: 'idle',
    lastBackupError: '',
    latestRemoteBackupAt: 0,
    latestRemoteBackupSha: '',
    pendingRestoreSha: '',
    pendingRestoreAt: 0,
    history: [],
    progress: {
      phase: 'idle',
      label: '',
      percent: 0,
      updatedAt: 0
    }
  },
  apiVendors: []
};