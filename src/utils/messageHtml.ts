const allowedMessageHtmlTags = [
  'a',
  'abbr',
  'b',
  'blockquote',
  'br',
  'code',
  'del',
  'details',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'ins',
  'kbd',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  's',
  'section',
  'small',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'time',
  'u',
  'ul'
] as const;

const allowedMessageHtmlTagSet = new Set<string>(allowedMessageHtmlTags);
const allowedMessageHtmlTagPattern = new RegExp(`<\\s*/?\\s*(?:${allowedMessageHtmlTags.join('|')})(?:\\s|/?>)`, 'i');
const blockedMessageHtmlTagSet = new Set([
  'applet',
  'audio',
  'base',
  'button',
  'canvas',
  'embed',
  'form',
  'frame',
  'frameset',
  'iframe',
  'input',
  'link',
  'math',
  'meta',
  'object',
  'picture',
  'script',
  'select',
  'source',
  'style',
  'svg',
  'textarea',
  'track',
  'video'
]);
const globalMessageHtmlAttributes = new Set(['aria-hidden', 'aria-label', 'class', 'role', 'title']);
const messageHtmlAttributesByTag: Record<string, Set<string>> = {
  a: new Set(['href', 'rel', 'target', 'title']),
  details: new Set(['open']),
  li: new Set(['value']),
  ol: new Set(['start', 'type']),
  time: new Set(['datetime'])
};
const safeUrlProtocols = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const renderedHtmlCache = new Map<string, string>();
const maxRenderedHtmlCacheSize = 200;

function hasAllowedMessageHtmlTag(value: string) {
  return allowedMessageHtmlTagPattern.test(value);
}

function sanitizeCssClassList(value: string) {
  return value
    .split(/\s+/)
    .map((token) => token.replace(/[^A-Za-z0-9_:-]/g, ''))
    .filter(Boolean)
    .slice(0, 32)
    .join(' ');
}

function isSafeHtmlUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('#')) return true;

  try {
    const baseUrl = typeof window === 'undefined' ? 'https://link.local/' : window.location.href;
    const url = new URL(trimmed, baseUrl);
    return safeUrlProtocols.has(url.protocol);
  } catch {
    return false;
  }
}

function isAllowedAttribute(tagName: string, attributeName: string) {
  if (attributeName.startsWith('on')) return false;
  if (attributeName.startsWith('data-') || attributeName.startsWith('aria-')) return true;
  return globalMessageHtmlAttributes.has(attributeName) || Boolean(messageHtmlAttributesByTag[tagName]?.has(attributeName));
}

function copySafeAttributes(source: Element, target: Element, tagName: string) {
  Array.from(source.attributes).forEach((attribute) => {
    const attributeName = attribute.name.toLowerCase();
    if (!isAllowedAttribute(tagName, attributeName)) return;

    if (attributeName === 'class') {
      const classList = sanitizeCssClassList(attribute.value);
      if (classList) target.setAttribute('class', classList);
      return;
    }

    if (attributeName === 'href') {
      if (!isSafeHtmlUrl(attribute.value)) return;
      target.setAttribute('href', attribute.value.trim());
      return;
    }

    if (attributeName === 'target') {
      const targetValue = attribute.value.trim();
      if (targetValue === '_blank' || targetValue === '_self') target.setAttribute('target', targetValue);
      return;
    }

    if (attributeName === 'rel') {
      const relValue = attribute.value
        .split(/\s+/)
        .map((token) => token.replace(/[^A-Za-z-]/g, '').toLowerCase())
        .filter(Boolean)
        .slice(0, 8)
        .join(' ');
      if (relValue) target.setAttribute('rel', relValue);
      return;
    }

    if ((attributeName === 'start' || attributeName === 'value') && !/^\d+$/.test(attribute.value.trim())) return;
    if (attributeName === 'type' && !/^[1AaIi]$/.test(attribute.value.trim())) return;
    if (attributeName === 'open') {
      target.setAttribute('open', '');
      return;
    }

    target.setAttribute(attributeName, attribute.value);
  });

  if (tagName === 'a' && target.getAttribute('target') === '_blank') {
    const relTokens = new Set((target.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    relTokens.add('noopener');
    relTokens.add('noreferrer');
    target.setAttribute('rel', [...relTokens].join(' '));
  }
}

function sanitizeHtmlNode(node: Node, ownerDocument: Document): Node | null {
  if (node.nodeType === Node.TEXT_NODE) return ownerDocument.createTextNode(node.textContent ?? '');
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();
  if (blockedMessageHtmlTagSet.has(tagName)) return null;

  const safeChildren = Array.from(element.childNodes)
    .map((child) => sanitizeHtmlNode(child, ownerDocument))
    .filter((child): child is Node => Boolean(child));

  if (!allowedMessageHtmlTagSet.has(tagName)) {
    const fragment = ownerDocument.createDocumentFragment();
    safeChildren.forEach((child) => fragment.appendChild(child));
    return fragment;
  }

  const safeElement = ownerDocument.createElement(tagName);
  copySafeAttributes(element, safeElement, tagName);
  safeChildren.forEach((child) => safeElement.appendChild(child));
  return safeElement;
}

export function renderSafeMessageHtml(value: string) {
  if (!value.trim() || !hasAllowedMessageHtmlTag(value) || typeof DOMParser === 'undefined') return '';
  const cached = renderedHtmlCache.get(value);
  if (cached !== undefined) return cached;

  const parsedDocument = new DOMParser().parseFromString(value, 'text/html');
  const output = parsedDocument.createElement('div');
  Array.from(parsedDocument.body.childNodes).forEach((node) => {
    const safeNode = sanitizeHtmlNode(node, parsedDocument);
    if (safeNode) output.appendChild(safeNode);
  });

  const html = output.innerHTML.trim();
  renderedHtmlCache.set(value, html);
  if (renderedHtmlCache.size > maxRenderedHtmlCacheSize) {
    const oldestKey = renderedHtmlCache.keys().next().value;
    if (oldestKey !== undefined) renderedHtmlCache.delete(oldestKey);
  }
  return html;
}