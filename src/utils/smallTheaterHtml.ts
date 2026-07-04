function escapeHtmlText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getBodyContent(html: string) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch?.[1] ?? html;
}

function stripInvisibleHtml(html: string) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ');
}

function compactText(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function countTag(html: string, tagName: string, closing = false) {
  const pattern = closing ? `</${tagName}\\s*>` : `<${tagName}\\b[^>]*>`;
  return html.match(new RegExp(pattern, 'gi'))?.length ?? 0;
}

function createScriptStringLiteral(value: string) {
  return JSON.stringify(value || '小剧场')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function createSmallTheaterRuntimeGuard(fallbackTitle: string) {
  const titleLiteral = createScriptStringLiteral(fallbackTitle);
  return `<script data-link-theater-runtime-guard="true">
(function () {
  var fallbackTitle = ${titleLiteral};
  var fallbackShown = false;

  function getVisibleText() {
    if (!document.body) return '';
    return (document.body.innerText || document.body.textContent || '').replace(/\s+/g, '').trim();
  }

  function showFallback(message) {
    if (fallbackShown || !document.body || getVisibleText()) return;
    fallbackShown = true;
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.style.background = '#0f172a';
    document.body.style.color = '#f8fafc';
    document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif';

    var panel = document.createElement('main');
    panel.setAttribute('data-link-theater-error', 'true');
    panel.style.cssText = 'min-height:100vh;display:grid;place-content:center;gap:10px;padding:24px;text-align:center;box-sizing:border-box;';

    var title = document.createElement('h1');
    title.textContent = fallbackTitle || '小剧场';
    title.style.cssText = 'margin:0;font-size:18px;line-height:1.35;font-weight:900;';

    var copy = document.createElement('p');
    copy.textContent = message || '这个小剧场没有渲染出可见内容，可能是生成结果被截断或脚本运行失败。';
    copy.style.cssText = 'max-width:280px;margin:0;color:#cbd5e1;font-size:13px;line-height:1.6;';

    panel.appendChild(title);
    panel.appendChild(copy);
    document.body.appendChild(panel);
  }

  function checkBlank() {
    if (!getVisibleText()) showFallback('这个小剧场没有渲染出可见内容，可能是生成结果被截断或脚本运行失败。');
  }

  window.addEventListener('error', function () {
    window.setTimeout(function () {
      showFallback('这个小剧场的页面脚本运行失败，已拦截空白页。');
    }, 0);
  });

  window.addEventListener('unhandledrejection', function () {
    window.setTimeout(function () {
      showFallback('这个小剧场的异步脚本运行失败，已拦截空白页。');
    }, 0);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.setTimeout(checkBlank, 700);
    });
  } else {
    window.setTimeout(checkBlank, 700);
  }
  window.addEventListener('load', function () {
    window.setTimeout(checkBlank, 1200);
  });
})();
</script>`;
}

function injectRuntimeScript(html: string, script: string) {
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${script}\n</body>`);
  return `${html}\n${script}`;
}

function removeSmallTheaterActionRuntime(html: string) {
  return html.replace(/<script\b[^>]*data-link-theater-action-runtime="true"[\s\S]*?<\/script>\s*/gi, '');
}

export function getSmallTheaterVisibleText(html: string) {
  return compactText(stripInvisibleHtml(getBodyContent(html)));
}

export function getSmallTheaterRenderIssue(html: string) {
  const trimmedHtml = html.trim();
  if (!trimmedHtml) return '小剧场模型没有返回 HTML 内容。';
  if (countTag(trimmedHtml, 'script') !== countTag(trimmedHtml, 'script', true)) return '小剧场 HTML 可能被截断：script 标签没有完整闭合。';
  if (countTag(trimmedHtml, 'style') !== countTag(trimmedHtml, 'style', true)) return '小剧场 HTML 可能被截断：style 标签没有完整闭合。';
  if (/^\s*(?:<!doctype\s+html|<html[\s>])/i.test(trimmedHtml) && !/<\/html>\s*$/i.test(trimmedHtml)) return '小剧场 HTML 文档没有完整闭合，可能是模型输出被截断。';

  const bodyWithoutScripts = stripInvisibleHtml(getBodyContent(trimmedHtml));
  const visibleText = compactText(bodyWithoutScripts);
  const hasVisualFallback = /<(?:img|svg|canvas)\b/i.test(bodyWithoutScripts);
  if (visibleText.length < 12 && !hasVisualFallback) return '小剧场 HTML 缺少可见正文，可能完全依赖脚本渲染而导致白屏。';
  return '';
}

export function assertRenderableSmallTheaterHtml(html: string) {
  const issue = getSmallTheaterRenderIssue(html);
  if (issue) throw new Error(issue);
}

export function withSmallTheaterRuntimeGuard(html: string, fallbackTitle = '小剧场') {
  const trimmedHtml = removeSmallTheaterActionRuntime(html.trim()).trim();
  const guard = createSmallTheaterRuntimeGuard(fallbackTitle);
  if (!trimmedHtml) {
    const title = escapeHtmlText(fallbackTitle || '小剧场');
    const emptyDocument = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${title}</title>
</head>
<body></body>
</html>`;
    return injectRuntimeScript(emptyDocument, guard);
  }

  let output = trimmedHtml;
  if (!output.includes('data-link-theater-runtime-guard="true"')) output = injectRuntimeScript(output, guard);
  return output;
}