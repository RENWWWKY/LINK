import type { ConversationTimeAwarenessSettings } from '@/types/domain';

interface UserTimeSnapshot {
  timeZone: string;
  utcOffset: string;
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
  weekday: string;
}

export const defaultTimeAwarenessSettings: ConversationTimeAwarenessSettings = {
  enabled: true
};

export function normalizeTimeAwarenessSettings(settings: Partial<ConversationTimeAwarenessSettings> | null | undefined): ConversationTimeAwarenessSettings {
  return {
    enabled: settings?.enabled ?? defaultTimeAwarenessSettings.enabled
  };
}

function getDatePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? '';
}

function getLocalTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || '本地时区';
}

function formatUtcOffset(now: Date) {
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, '0');
  const minutes = String(absoluteMinutes % 60).padStart(2, '0');
  return `UTC${sign}${hours}:${minutes}`;
}

export function createUserTimeSnapshot(now = new Date()): UserTimeSnapshot {
  const dateParts = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(now);
  const weekday = new Intl.DateTimeFormat('zh-CN', {
    weekday: 'long'
  }).format(now);

  return {
    timeZone: getLocalTimeZone(),
    utcOffset: formatUtcOffset(now),
    year: getDatePart(dateParts, 'year'),
    month: getDatePart(dateParts, 'month'),
    day: getDatePart(dateParts, 'day'),
    hour: getDatePart(dateParts, 'hour'),
    minute: getDatePart(dateParts, 'minute'),
    second: getDatePart(dateParts, 'second'),
    weekday
  };
}

export function formatUserTimePreview(now = new Date()) {
  const snapshot = createUserTimeSnapshot(now);
  return `${snapshot.year}年${snapshot.month}月${snapshot.day}日 ${snapshot.weekday} ${snapshot.hour}:${snapshot.minute}:${snapshot.second} (${snapshot.timeZone}, ${snapshot.utcOffset})`;
}

function renderSnapshot(snapshot: UserTimeSnapshot) {
  return [
    `当前日期：${snapshot.year}年${snapshot.month}月${snapshot.day}日 ${snapshot.weekday}`,
    `当前时间：${snapshot.hour}:${snapshot.minute}:${snapshot.second}`,
    `本地时区：${snapshot.timeZone}（${snapshot.utcOffset}）`
  ].join('\n');
}

export function renderTimeAwarenessPrompt(
  settings: ConversationTimeAwarenessSettings | null | undefined,
  names: { userName: string },
  now = new Date()
) {
  const normalizedSettings = normalizeTimeAwarenessSettings(settings);
  if (!normalizedSettings.enabled) return '';

  const userSnapshot = createUserTimeSnapshot(now);

  return [
    '现实时间感知：',
    `以下信息是${names.userName}当前设备/浏览器在本轮生成开始时读取到的本地实时日期与时间。用于判断此刻作息、日常节奏和当前日期，不要机械复述，也不要把未发生的事情当作剧情事实。`,
    '若聊天记录、VOOM、记忆或摘要里出现发送时间/发布时间，那些都是历史发生时间，只能用于计算时间间隔；判断“现在”时必须以本段现实时间感知为准。',
    `用户这边（${names.userName}）：\n${renderSnapshot(userSnapshot)}`
  ].join('\n');
}