import type { VisualProfileHighlight, VoomPost } from '@/types/domain';

export const profileHighlightLabels = ['MOOD', 'VOOM', 'NOTE'] as const;

const profileHighlightIds = ['profile_highlight_mood', 'profile_highlight_voom', 'profile_highlight_note'] as const;
const bundledHighlightIds = ['profile_highlight_cafe', 'profile_highlight_look', 'profile_highlight_diary'] as const;
const bundledHighlightAssetNames = ['momo-highlight-cafe', 'momo-highlight-look', 'momo-highlight-diary'] as const;

function normalizeHighlightImage(value: string | undefined) {
  return value?.trim() ?? '';
}

function isBundledDefaultHighlight(highlight: VisualProfileHighlight | undefined, index: number) {
  const image = normalizeHighlightImage(highlight?.image);
  return Boolean(
    highlight &&
    highlight.id === bundledHighlightIds[index] &&
    image.includes(bundledHighlightAssetNames[index])
  );
}

export function createProfileHighlightSlots(highlights: VisualProfileHighlight[] = []): VisualProfileHighlight[] {
  return profileHighlightLabels.map((title, index) => {
    const highlight = highlights[index];
    return {
      id: highlight?.id || profileHighlightIds[index],
      title,
      image: isBundledDefaultHighlight(highlight, index) ? '' : normalizeHighlightImage(highlight?.image)
    };
  });
}

export function createProfileHighlightItems(posts: VoomPost[], fallbackHighlights: VisualProfileHighlight[]) {
  const items = posts
    .filter((post) => normalizeHighlightImage(post.image))
    .slice()
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, profileHighlightLabels.length)
    .map((post, index) => ({
      id: post.id,
      title: profileHighlightLabels[index] ?? `VOOM ${index + 1}`,
      image: normalizeHighlightImage(post.image)
    }));

  for (const highlight of createProfileHighlightSlots(fallbackHighlights)) {
    if (items.length >= profileHighlightLabels.length) break;
    const image = normalizeHighlightImage(highlight.image);
    if (!image) continue;
    items.push({
      id: `fallback-${highlight.id}`,
      title: profileHighlightLabels[items.length] ?? highlight.title,
      image
    });
  }

  return items;
}