export type ChatMode = 'online' | 'offline';

export type AppTab = 'home' | 'chats' | 'voom' | 'music' | 'fanfic';

export interface VisualProfileStats {
  posts: number;
  postsLabel: string;
  followers: string;
  followersLabel: string;
  following: number;
  followingLabel: string;
}

export interface VisualProfileLink {
  id: string;
  label: string;
  url: string;
}

export interface VisualProfileHighlight {
  id: string;
  title: string;
  image: string;
}

export interface VisualProfileMoment {
  id: string;
  title: string;
  image: string;
}

export interface VisualProfile {
  nickname: string;
  handle: string;
  avatar: string;
  bio: string;
  backgroundImage: string;
  location: string;
  mood: string;
  archiveLabel: string;
  editLabel: string;
  editorTitle: string;
  messageLabel: string;
  momentsLabel: string;
  accentColor: string;
  stats: VisualProfileStats;
  tags: string[];
  chips: string[];
  links: VisualProfileLink[];
  highlights: VisualProfileHighlight[];
  moments: VisualProfileMoment[];
}

export interface UserProfile {
  id: string;
  nickname: string;
  name: string;
  avatar: string;
  description: string;
  signature: string;
  boundCharacterIds: string[];
  profile: VisualProfile;
}

export interface CharacterMindState {
  lines: string[];
  updatedAt: number;
  readAt: number;
  sourceConversationId?: string;
}

export interface CharacterProfile {
  id: string;
  nickname: string;
  name: string;
  avatar: string;
  description: string;
  signature: string;
  userNote: string;
  boundUserId: string;
  subtitle: string;
  lastSeen: string;
  localWorldBookIds: string[];
  voomFrequency: VoomFrequency;
  profile?: VisualProfile;
  mindState?: CharacterMindState;
}

export type VoomFrequency = 'very-low' | 'low' | 'medium' | 'high' | 'very-high' | 'always';

export type ChatModelScope = 'online' | 'offline' | 'voom';

export interface ChatModelOverrides {
  online: string;
  offline: string;
  voom: string;
}

export interface ChatAppearanceSettings {
  backgroundImage: string;
  backgroundImages: string[];
  backgroundColor: string;
  userBubbleColor: string;
  userTextColor: string;
  characterBubbleColor: string;
  characterTextColor: string;
  showMessageTime: boolean;
  showReadStatus: boolean;
  showOnlyFirstAvatarInReply: boolean;
  hideVoomNarration: boolean;
}

export interface ChatMemorySettings {
  enabled: boolean;
  autoSummarize: boolean;
  summarizeEvery: number;
  summaryModel: string;
  summaryPrompt: string;
  mergeSummaryPrompt: string;
  vectorMemoryEnabled: boolean;
  hideSummarizedMessages: boolean;
}

export interface ConversationTimeAwarenessSettings {
  enabled: boolean;
}

export interface ConversationSettings {
  conversationId: string;
  memory: ChatMemorySettings;
  modelOverrides: ChatModelOverrides;
  appearance: ChatAppearanceSettings;
  narrationModeEnabled: boolean;
  autoGenerateVoom: boolean;
  voomFrequency: VoomFrequency;
  stickerVisionEnabled: boolean;
  characterStickerGroupIds: string[];
  timeAwareness: ConversationTimeAwarenessSettings;
}

export interface ConversationMemoryRecord {
  id: string;
  conversationId: string;
  mode: ChatMode;
  kind: 'short-term' | 'long-term';
  startFloor: number;
  endFloor: number;
  hiddenStartFloor: number;
  hiddenEndFloor: number;
  summary: string;
  tokenCount: number;
  vector: number[];
  sourceMessageIds: string[];
  model: string;
  isMergedSummary?: boolean;
  mergedFrom?: ConversationMemoryRecord[];
  createdAt: number;
  updatedAt: number;
  compressedAt?: number;
}

export interface Conversation {
  id: string;
  userId: string;
  charId: string;
  title: string;
  activeMode: ChatMode;
  updatedAt: number;
  unreadCount: number;
  summary: string;
}

export type StickerSourceType = 'url' | 'local-image' | 'text-file' | 'doc-file' | 'json-file' | 'manual';

export interface StickerGroup {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface Sticker {
  id: string;
  description: string;
  imageUrl: string;
  groupIds: string[];
  sourceType: StickerSourceType;
  createdAt: number;
  updatedAt: number;
}

export interface ChatStickerAttachment {
  stickerId: string;
  description: string;
  imageUrl: string;
}

export interface ChatMessageQuote {
  messageId: string;
  sender: 'user' | 'char' | 'system';
  authorName: string;
  content: string;
  sticker?: ChatStickerAttachment;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'char' | 'system';
  mode: ChatMode;
  content: string;
  translation?: string;
  createdAt: number;
  displayStyle?: 'default' | 'narration';
  voomPostId?: string;
  voomCommentId?: string;
  voomEventType?: 'post' | 'like' | 'unlike' | 'comment' | 'reply';
  sticker?: ChatStickerAttachment;
  quote?: ChatMessageQuote;
  replyBatchId?: string;
  status?: 'sending' | 'sent' | 'failed';
  editedAt?: number;
}

export type VoomPostAuthorType = 'character' | 'user';

export type VoomPostVisibility = 'public' | 'selected';

export type VoomImageProviderType = ImageProviderType | 'mock' | 'local';

export interface VoomPost {
  id: string;
  charId: string;
  conversationId?: string;
  conversationIds?: string[];
  authorType?: VoomPostAuthorType;
  userId?: string;
  visibility?: VoomPostVisibility;
  visibleCharacterIds?: string[];
  authorName: string;
  authorAvatar: string;
  content: string;
  contentTranslation?: string;
  image?: string;
  imageDescription?: string;
  imageProvider?: VoomImageProviderType;
  createdAt: number;
  comments: VoomComment[];
  likes: string[];
}

export interface VoomComment {
  id: string;
  authorName: string;
  content: string;
  contentTranslation?: string;
  authorId?: string;
  parentId?: string;
  createdAt?: number;
}

export type WorldBookScope = 'global-online' | 'global-offline' | 'local';

export type WorldBookEntryActivation = 'keyword' | 'constant' | 'priority';

export type WorldBookInsertionPosition = 'before-chat' | 'after-chat';

export interface WorldBookLoreEntry {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  activation: WorldBookEntryActivation;
  keys: string[];
  secondaryKeys: string[];
  position: WorldBookInsertionPosition;
  order: number;
  depth: number;
  probability: number;
  caseSensitive: boolean;
}

export interface WorldBookEntry {
  id: string;
  title: string;
  content: string;
  entries: WorldBookLoreEntry[];
  scope: WorldBookScope;
  enabled: boolean;
  coverImage: string;
  coverPrompt: string;
  coverNegativePrompt: string;
  coverProvider: ImageProviderType | '';
}

export type ImageProviderType = 'openai' | 'novelai' | 'pollinations';

export type ImageModuleId = ImageProviderType;

export interface ApiVendorModel {
  id: string;
  nickname: string;
  selected: boolean;
}

export interface ApiVendor {
  id: string;
  enabled: boolean;
  name: string;
  apiUrl: string;
  apiPath: string;
  apiKey: string;
  avatar: string;
  models: ApiVendorModel[];
}

export interface OpenAiImageSettings {
  activeVendorId: string;
  size: string;
  positivePrompt: string;
  negativePrompt: string;
  lastImageUrl: string;
  vendors: ApiVendor[];
}

export interface NovelAiImageSettings {
  apiUrl: string;
  proxyUrl: string;
  apiKey: string;
  model: string;
  positivePrompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  guidance: number;
  steps: number;
  sampler: string;
  seed: string;
  lastImageUrl: string;
}

export interface PollinationsImageSettings {
  apiKey: string;
  referrer: string;
  model: string;
  positivePrompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  seed: string;
  enhance: boolean;
  nologo: boolean;
  private: boolean;
  lastImageUrl: string;
}

export interface AppSettings {
  activeUserId: string;
  apiEndpoint: string;
  apiKey: string;
  model: string;
  apiVendors: ApiVendor[];
  autoGenerateVoom: boolean;
  disclaimerAccepted: boolean;
  ttsEnabled: boolean;
  ttsVoice: string;
  ttsPlaybackMode: 'manual' | 'auto';
  imageModel: string;
  imageSize: string;
  imagePromptPrefix: string;
  imageOpenAi: OpenAiImageSettings;
  imageNovelAi: NovelAiImageSettings;
  imagePollinations: PollinationsImageSettings;
  voomImageProvider: ImageProviderType | '';
  voomImageModel: string;
  imagePrivateOnly: boolean;
}

export interface AppSnapshot {
  users: UserProfile[];
  characters: CharacterProfile[];
  conversations: Conversation[];
  messages: ChatMessage[];
  voomPosts: VoomPost[];
  worldBooks: WorldBookEntry[];
  stickerGroups: StickerGroup[];
  stickers: Sticker[];
  conversationSettings: ConversationSettings[];
  conversationMemories: ConversationMemoryRecord[];
  settings: AppSettings;
}

export interface PromptContext {
  user: UserProfile;
  character: CharacterProfile;
  boundUser: UserProfile;
  mode: ChatMode;
  messages: ChatMessage[];
  worldBooks: WorldBookEntry[];
  conversationSummary: string;
  memorySummary?: string;
  stickerVisionEnabled?: boolean;
  narrationModeEnabled?: boolean;
  availableStickers?: ChatStickerAttachment[];
  timeAwareness?: ConversationTimeAwarenessSettings;
}

export interface GenerateReplyInput extends PromptContext {
  userMessage: string;
  settings?: AppSettings;
  modelOverride?: string;
}