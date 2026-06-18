import type { ApiVendor, ApiVendorModel, AppSettings, GitHubBackupSettings, ImageProviderType, NovelAiImageSettings, OpenAiImageSettings, PollinationsImageSettings } from '@/types/domain';
import { createId } from './id';

const imageProviderOrder: ImageProviderType[] = ['openai', 'novelai', 'pollinations'];

const defaultVendorAvatar = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#fff8fb" />
      <stop offset="100%" stop-color="#e7f6eb" />
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="32" fill="url(#g)" />
  <circle cx="60" cy="48" r="24" fill="#111111" opacity="0.08" />
  <path d="M35 86c6-13 18-20 25-20s19 7 25 20" fill="#111111" opacity="0.12" />
  <circle cx="60" cy="48" r="18" fill="#111111" opacity="0.82" />
  <path d="M42 86c5-10 12-15 18-15s13 5 18 15" fill="#111111" opacity="0.82" />
</svg>
`)}`;

function normalizeVendorAvatar(avatar: string | null | undefined) {
  const trimmed = String(avatar ?? '').trim();
  if (!trimmed || trimmed === 'https://api.dicebear.com/9.x/shapes/svg?seed=OpenAI&backgroundColor=e8f5e9') {
    return defaultVendorAvatar;
  }
  return trimmed;
}

export const defaultAppSettings: AppSettings = {
  activeUserId: '',
  apiEndpoint: '',
  apiKey: '',
  model: 'gpt-compatible-model',
  apiVendors: [],
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
  }
};

function normalizeImageProvider(provider: string | null | undefined): ImageProviderType | '' {
  const normalized = String(provider ?? '').trim();
  return imageProviderOrder.includes(normalized as ImageProviderType) ? normalized as ImageProviderType : '';
}

function normalizeOpenAiImageSettings(
  settings: Partial<OpenAiImageSettings> | null | undefined,
  fallback: Pick<AppSettings, 'imageModel' | 'imageSize' | 'imagePromptPrefix'>
): OpenAiImageSettings {
  const vendors = Array.isArray(settings?.vendors)
    ? settings.vendors.map((vendor) => normalizeVendor(vendor)).filter((vendor) => vendor.name)
    : [];

  const activeVendorId = String(settings?.activeVendorId ?? '').trim();

  return {
    activeVendorId,
    size: String(settings?.size ?? fallback.imageSize ?? defaultAppSettings.imageOpenAi.size).trim() || defaultAppSettings.imageOpenAi.size,
    positivePrompt: String(settings?.positivePrompt ?? fallback.imagePromptPrefix ?? '').trim(),
    negativePrompt: String(settings?.negativePrompt ?? '').trim(),
    lastImageUrl: String(settings?.lastImageUrl ?? '').trim(),
    vendors
  };
}

function normalizeNovelAiImageSettings(settings: Partial<NovelAiImageSettings> | null | undefined): NovelAiImageSettings {
  return {
    apiUrl: String(settings?.apiUrl ?? defaultAppSettings.imageNovelAi.apiUrl).trim() || defaultAppSettings.imageNovelAi.apiUrl,
    proxyUrl: String(settings?.proxyUrl ?? '').trim(),
    apiKey: String(settings?.apiKey ?? '').trim(),
    model: String(settings?.model ?? defaultAppSettings.imageNovelAi.model).trim() || defaultAppSettings.imageNovelAi.model,
    positivePrompt: String(settings?.positivePrompt ?? '').trim(),
    negativePrompt: String(settings?.negativePrompt ?? '').trim(),
    width: Math.max(320, Number(settings?.width ?? defaultAppSettings.imageNovelAi.width) || defaultAppSettings.imageNovelAi.width),
    height: Math.max(320, Number(settings?.height ?? defaultAppSettings.imageNovelAi.height) || defaultAppSettings.imageNovelAi.height),
    guidance: Math.max(1, Number(settings?.guidance ?? defaultAppSettings.imageNovelAi.guidance) || defaultAppSettings.imageNovelAi.guidance),
    steps: Math.max(1, Math.round(Number(settings?.steps ?? defaultAppSettings.imageNovelAi.steps) || defaultAppSettings.imageNovelAi.steps)),
    sampler: String(settings?.sampler ?? defaultAppSettings.imageNovelAi.sampler).trim() || defaultAppSettings.imageNovelAi.sampler,
    seed: String(settings?.seed ?? '').trim(),
    lastImageUrl: String(settings?.lastImageUrl ?? '').trim()
  };
}

function normalizePollinationsImageSettings(settings: Partial<PollinationsImageSettings> | null | undefined): PollinationsImageSettings {
  return {
    apiKey: String(settings?.apiKey ?? '').trim(),
    referrer: String(settings?.referrer ?? defaultAppSettings.imagePollinations.referrer).trim() || defaultAppSettings.imagePollinations.referrer,
    model: String(settings?.model ?? defaultAppSettings.imagePollinations.model).trim() || defaultAppSettings.imagePollinations.model,
    positivePrompt: String(settings?.positivePrompt ?? '').trim(),
    negativePrompt: String(settings?.negativePrompt ?? '').trim(),
    width: Math.max(320, Number(settings?.width ?? defaultAppSettings.imagePollinations.width) || defaultAppSettings.imagePollinations.width),
    height: Math.max(320, Number(settings?.height ?? defaultAppSettings.imagePollinations.height) || defaultAppSettings.imagePollinations.height),
    seed: String(settings?.seed ?? '').trim(),
    enhance: settings?.enhance ?? defaultAppSettings.imagePollinations.enhance,
    nologo: settings?.nologo ?? defaultAppSettings.imagePollinations.nologo,
    private: settings?.private ?? defaultAppSettings.imagePollinations.private,
    lastImageUrl: String(settings?.lastImageUrl ?? '').trim()
  };
}

function normalizeGitHubBackupSettings(settings: Partial<GitHubBackupSettings> | null | undefined): GitHubBackupSettings {
  const intervalMinutes = Math.min(1440, Math.max(1, Math.round(Number(settings?.intervalMinutes ?? defaultAppSettings.githubBackup.intervalMinutes) || defaultAppSettings.githubBackup.intervalMinutes)));
  const status = ['idle', 'running', 'success', 'failed'].includes(String(settings?.lastBackupStatus))
    ? settings?.lastBackupStatus as GitHubBackupSettings['lastBackupStatus']
    : defaultAppSettings.githubBackup.lastBackupStatus;

  return {
    enabled: Boolean(settings?.enabled),
    token: String(settings?.token ?? '').trim(),
    owner: String(settings?.owner ?? '').trim(),
    repo: String(settings?.repo ?? defaultAppSettings.githubBackup.repo).trim() || defaultAppSettings.githubBackup.repo,
    branch: String(settings?.branch ?? defaultAppSettings.githubBackup.branch).trim() || defaultAppSettings.githubBackup.branch,
    path: String(settings?.path ?? defaultAppSettings.githubBackup.path).trim().replace(/^\/+/, '') || defaultAppSettings.githubBackup.path,
    intervalMinutes,
    lastBackupAt: Math.max(0, Number(settings?.lastBackupAt ?? 0) || 0),
    lastBackupStatus: status,
    lastBackupError: String(settings?.lastBackupError ?? '').trim(),
    latestRemoteBackupAt: Math.max(0, Number(settings?.latestRemoteBackupAt ?? 0) || 0),
    latestRemoteBackupSha: String(settings?.latestRemoteBackupSha ?? '').trim(),
    pendingRestoreSha: String(settings?.pendingRestoreSha ?? '').trim(),
    pendingRestoreAt: Math.max(0, Number(settings?.pendingRestoreAt ?? 0) || 0),
    history: Array.isArray(settings?.history)
      ? settings.history
          .map((entry) => ({
            sha: String(entry?.sha ?? '').trim(),
            committedAt: Math.max(0, Number(entry?.committedAt ?? 0) || 0),
            exportedAt: Math.max(0, Number(entry?.exportedAt ?? 0) || 0),
            message: String(entry?.message ?? '').trim()
          }))
          .filter((entry) => entry.sha)
          .slice(0, 3)
      : [],
    progress: {
      phase: ['idle', 'checking', 'uploading', 'downloading', 'restoring', 'completed', 'failed'].includes(String(settings?.progress?.phase))
        ? String(settings?.progress?.phase) as GitHubBackupSettings['progress']['phase']
        : 'idle',
      label: String(settings?.progress?.label ?? '').trim(),
      percent: Math.min(100, Math.max(0, Number(settings?.progress?.percent ?? 0) || 0)),
      updatedAt: Math.max(0, Number(settings?.progress?.updatedAt ?? 0) || 0)
    }
  };
}

function normalizeVendorModel(model: Partial<ApiVendorModel> | null | undefined): ApiVendorModel | null {
  const id = String(model?.id ?? '').trim();
  if (!id) return null;
  return {
    id,
    nickname: String(model?.nickname ?? '').trim(),
    selected: Boolean(model?.selected)
  };
}

function splitLegacyEndpoint(endpoint: string) {
  const trimmed = endpoint.trim();
  if (!trimmed) {
    return {
      apiUrl: 'https://api.openai.com/v1',
      apiPath: '/chat/completions'
    };
  }

  const normalized = trimmed.replace(/\/+$/, '');
  if (normalized.endsWith('/chat/completions')) {
    return {
      apiUrl: normalized.slice(0, -'/chat/completions'.length) || 'https://api.openai.com/v1',
      apiPath: '/chat/completions'
    };
  }

  return {
    apiUrl: normalized,
    apiPath: '/chat/completions'
  };
}

function normalizeVendor(vendor: Partial<ApiVendor> | null | undefined, fallbackId?: string): ApiVendor {
  const models = Array.isArray(vendor?.models)
    ? vendor.models
        .map((model) => normalizeVendorModel(model))
        .filter((model): model is ApiVendorModel => Boolean(model))
    : [];

  return {
    id: String(vendor?.id ?? fallbackId ?? createId('vendor')).trim() || createId('vendor'),
    enabled: Boolean(vendor?.enabled),
    name: String(vendor?.name ?? 'OpenAI').trim() || 'OpenAI',
    apiUrl: String(vendor?.apiUrl ?? 'https://api.openai.com/v1').trim() || 'https://api.openai.com/v1',
    apiPath: String(vendor?.apiPath ?? '/chat/completions').trim() || '/chat/completions',
    apiKey: String(vendor?.apiKey ?? '').trim(),
    avatar: normalizeVendorAvatar(vendor?.avatar),
    models
  };
}

export function createApiVendor(overrides: Partial<ApiVendor> = {}): ApiVendor {
  return normalizeVendor(overrides);
}

export function buildApiEndpoint(apiUrl: string, apiPath: string) {
  const url = apiUrl.trim().replace(/\/+$/, '');
  const path = `/${apiPath.trim().replace(/^\/+/, '')}`;
  return `${url}${path}`;
}

export function getSelectedVendorModels(vendor: ApiVendor) {
  return vendor.models.filter((model) => model.selected);
}

export function getSelectedVendorModelCount(vendor: ApiVendor) {
  return getSelectedVendorModels(vendor).length;
}

export function mergeVendorModels(vendor: ApiVendor, modelIds: string[]) {
  const existingModels = new Map(vendor.models.map((model) => [model.id, model]));
  const hadSelectedModel = vendor.models.some((model) => model.selected);

  return normalizeVendor({
    ...vendor,
    models: modelIds
      .map((id) => String(id).trim())
      .filter(Boolean)
      .map((id, index) => {
        const existing = existingModels.get(id);
        return {
          id,
          nickname: existing?.nickname ?? '',
          selected: existing?.selected ?? (!hadSelectedModel && index === 0)
        };
      })
  }, vendor.id);
}

export function getPreferredApiVendor(settings?: AppSettings | null) {
  const vendors = settings?.apiVendors ?? [];
  return vendors.find((vendor) => vendor.enabled && vendor.models.length > 0)
    ?? vendors.find((vendor) => vendor.enabled)
    ?? vendors.find((vendor) => vendor.models.length > 0)
    ?? vendors[0]
    ?? null;
}

export function getPreferredImageVendor(settings?: AppSettings | null) {
  const vendors = settings?.imageOpenAi.vendors ?? [];
  const activeVendorId = settings?.imageOpenAi.activeVendorId?.trim();

  if (activeVendorId) {
    const activeVendor = vendors.find((vendor) => vendor.id === activeVendorId);
    if (activeVendor) return activeVendor;
  }

  return vendors.find((vendor) => vendor.enabled && vendor.models.length > 0)
    ?? vendors.find((vendor) => vendor.enabled)
    ?? vendors.find((vendor) => vendor.models.length > 0)
    ?? vendors[0]
    ?? null;
}

export function getResolvedApiConfig(settings?: AppSettings | null) {
  const preferredVendor = getPreferredApiVendor(settings);
  if (preferredVendor) {
    const preferredModel = preferredVendor.models.find((model) => model.selected)
      ?? preferredVendor.models[0]
      ?? null;
    return {
      endpoint: buildApiEndpoint(preferredVendor.apiUrl, preferredVendor.apiPath),
      apiKey: preferredVendor.apiKey,
      model: preferredModel?.id ?? settings?.model ?? ''
    };
  }

  return {
    endpoint: settings?.apiEndpoint?.trim() ?? '',
    apiKey: settings?.apiKey?.trim() ?? '',
    model: settings?.model?.trim() ?? ''
  };
}

export function getResolvedOpenAiImageConfig(settings?: AppSettings | null) {
  const preferredVendor = getPreferredImageVendor(settings);
  const imageSettings = settings?.imageOpenAi ?? defaultAppSettings.imageOpenAi;

  if (preferredVendor) {
    const preferredModel = preferredVendor.models.find((model) => model.selected)
      ?? preferredVendor.models[0]
      ?? null;

    return {
      endpoint: buildApiEndpoint(preferredVendor.apiUrl, preferredVendor.apiPath || '/images/generations'),
      apiKey: preferredVendor.apiKey,
      model: preferredModel?.id ?? settings?.imageModel?.trim() ?? defaultAppSettings.imageModel,
      size: imageSettings.size
    };
  }

  return {
    endpoint: '',
    apiKey: '',
    model: settings?.imageModel?.trim() ?? defaultAppSettings.imageModel,
    size: imageSettings.size
  };
}

export function isImageProviderConfigured(provider: ImageProviderType, settings?: AppSettings | null) {
  if (!settings) return false;

  if (provider === 'openai') {
    return settings.imageOpenAi.vendors.some((vendor) => {
      const model = vendor.models.find((item) => item.selected)?.id || vendor.models[0]?.id || settings.imageModel;
      return Boolean(vendor.apiUrl.trim() && vendor.apiPath.trim() && vendor.apiKey.trim() && model.trim());
    });
  }

  if (provider === 'novelai') {
    return Boolean((settings.imageNovelAi.proxyUrl.trim() || settings.imageNovelAi.apiUrl.trim()) && settings.imageNovelAi.apiKey.trim() && settings.imageNovelAi.model.trim());
  }

  return Boolean(settings.imagePollinations.apiKey.trim() && settings.imagePollinations.model.trim());
}

export function getConfiguredImageProviders(settings?: AppSettings | null) {
  return imageProviderOrder.filter((provider) => isImageProviderConfigured(provider, settings));
}

export function getPreferredVoomImageProvider(settings?: AppSettings | null): ImageProviderType | null {
  const configuredProviders = getConfiguredImageProviders(settings);
  const selectedProvider = normalizeImageProvider(settings?.voomImageProvider);
  if (selectedProvider && configuredProviders.includes(selectedProvider)) return selectedProvider;
  return configuredProviders[0] ?? null;
}

export function normalizeAppSettings(settings?: Partial<AppSettings> | null): AppSettings {
  const legacyImageModel = String((settings as { imageModel?: string } | null | undefined)?.imageModel ?? '').trim();
  const legacyImageSize = String((settings as { imageSize?: string } | null | undefined)?.imageSize ?? '').trim();
  const legacyImagePromptPrefix = String((settings as { imagePromptPrefix?: string } | null | undefined)?.imagePromptPrefix ?? '').trim();

  const merged = {
    ...defaultAppSettings,
    ...settings
  };

  const normalizedVendors = Array.isArray(settings?.apiVendors)
    ? settings.apiVendors.map((vendor) => normalizeVendor(vendor)).filter((vendor) => vendor.name)
    : [];

  if (!normalizedVendors.length && (merged.apiEndpoint.trim() || merged.apiKey.trim())) {
    const legacyEndpoint = splitLegacyEndpoint(merged.apiEndpoint);
    normalizedVendors.push(normalizeVendor({
      id: 'vendor_legacy',
      enabled: true,
      name: 'Default Provider',
      apiUrl: legacyEndpoint.apiUrl,
      apiPath: legacyEndpoint.apiPath,
      apiKey: merged.apiKey,
      avatar: defaultVendorAvatar,
      models: merged.model.trim()
        ? [{ id: merged.model.trim(), nickname: '', selected: true }]
        : []
    }, 'vendor_legacy'));
  }

  const normalized = {
    ...merged,
    apiVendors: normalizedVendors,
    imageOpenAi: normalizeOpenAiImageSettings(settings?.imageOpenAi, {
      imageModel: legacyImageModel || merged.imageModel,
      imageSize: legacyImageSize || merged.imageSize,
      imagePromptPrefix: legacyImagePromptPrefix || merged.imagePromptPrefix
    }),
    imageNovelAi: normalizeNovelAiImageSettings(settings?.imageNovelAi),
    imagePollinations: normalizePollinationsImageSettings(settings?.imagePollinations),
    githubBackup: normalizeGitHubBackupSettings(settings?.githubBackup)
  };

  const resolvedApiConfig = getResolvedApiConfig(normalized);
  const resolvedImageConfig = getResolvedOpenAiImageConfig(normalized);

  return {
    ...normalized,
    activeUserId: String(normalized.activeUserId ?? '').trim(),
    apiEndpoint: resolvedApiConfig.endpoint,
    apiKey: resolvedApiConfig.apiKey,
    model: resolvedApiConfig.model || normalized.model,
    imageModel: resolvedImageConfig.model || normalized.imageModel,
    imageSize: normalized.imageOpenAi.size || normalized.imageSize,
    imagePromptPrefix: normalized.imageOpenAi.positivePrompt || normalized.imagePromptPrefix,
    voomImageProvider: normalizeImageProvider(normalized.voomImageProvider),
    voomImageModel: String(normalized.voomImageModel ?? '').trim(),
    imageOpenAi: {
      ...normalized.imageOpenAi,
      activeVendorId: normalized.imageOpenAi.activeVendorId
        || normalized.imageOpenAi.vendors.find((vendor) => vendor.enabled)?.id
        || normalized.imageOpenAi.vendors[0]?.id
        || ''
    }
  };
}