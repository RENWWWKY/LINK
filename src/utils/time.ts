const minuteMs = 60_000;
const dayMs = 24 * 60 * minuteMs;
const chatTimeDividerIntervalMs = 5 * minuteMs;
const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function isValidTimestamp(timestamp: number) {
  return Number.isFinite(timestamp) && timestamp > 0;
}

function padTwoDigits(value: number) {
  return String(value).padStart(2, '0');
}

function localDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function previousLocalDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1).getTime();
}

function shouldUseTwelveHourClock() {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12 === true;
  } catch {
    return false;
  }
}

function chineseDayPeriod(hour: number) {
  if (hour < 6) return '凌晨';
  if (hour < 12) return '上午';
  if (hour < 18) return '下午';
  return '晚上';
}

function formatDividerClock(timestamp: number) {
  const date = new Date(timestamp);
  const hour = date.getHours();
  const minute = padTwoDigits(date.getMinutes());
  if (shouldUseTwelveHourClock()) {
    const twelveHour = hour % 12 || 12;
    return `${chineseDayPeriod(hour)}${twelveHour}:${minute}`;
  }
  return `${padTwoDigits(hour)}:${minute}`;
}

export function formatChatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(timestamp);
}

export function formatListTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return formatChatTime(timestamp);
  }
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatRelativeDate(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  return formatListTime(timestamp);
}

export function shouldShowChatTimeDivider(timestamp: number, previousTimestamp?: number): boolean {
  if (!isValidTimestamp(timestamp)) return false;
  if (!isValidTimestamp(previousTimestamp ?? 0)) return true;
  return timestamp - (previousTimestamp ?? 0) >= chatTimeDividerIntervalMs;
}

export function formatChatTimeDivider(timestamp: number, nowTimestamp = Date.now()): string {
  if (!isValidTimestamp(timestamp)) return '';

  const date = new Date(timestamp);
  const now = new Date(nowTimestamp);
  const messageDayStart = localDayStart(date);
  const todayStart = localDayStart(now);
  const clock = formatDividerClock(timestamp);

  if (messageDayStart === todayStart) return clock;
  if (messageDayStart === previousLocalDayStart(now)) return `昨天 ${clock}`;
  if (nowTimestamp - timestamp < 7 * dayMs) return `${weekdayLabels[date.getDay()]} ${clock}`;
  if (date.getFullYear() === now.getFullYear()) return `${date.getMonth() + 1}月${date.getDate()}日 ${clock}`;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}