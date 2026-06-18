interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  OAUTH_STATE_SECRET: string;
  APP_ORIGIN: string;
  DEFAULT_REPO_NAME?: string;
}

interface SignedStatePayload {
  origin: string;
  nonce: string;
  exp: number;
}

const githubAuthorizeUrl = 'https://github.com/login/oauth/authorize';
const githubTokenUrl = 'https://github.com/login/oauth/access_token';
const githubUserUrl = 'https://api.github.com/user';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json;charset=utf-8',
      ...(init.headers ?? {})
    }
  });
}

function textResponse(text: string, init: ResponseInit = {}) {
  return new Response(text, {
    ...init,
    headers: {
      'content-type': 'text/html;charset=utf-8',
      ...(init.headers ?? {})
    }
  });
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importSigningKey(secret: string) {
  return await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signPayload(payload: string, secret: string) {
  const key = await importSigningKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifyPayload(payload: string, signature: string, secret: string) {
  const key = await importSigningKey(secret);
  return await crypto.subtle.verify('HMAC', key, base64UrlToBytes(signature), new TextEncoder().encode(payload));
}

function getAllowedOrigins(env: Env) {
  return env.APP_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
}

function resolveAppOrigin(request: Request, env: Env) {
  const url = new URL(request.url);
  const requestedOrigin = url.searchParams.get('app_origin')?.trim() || getAllowedOrigins(env)[0] || '';
  const allowedOrigins = getAllowedOrigins(env);
  if (!requestedOrigin) throw new Error('Missing app origin.');
  if (allowedOrigins.length && !allowedOrigins.includes(requestedOrigin)) throw new Error('App origin is not allowed.');
  return requestedOrigin;
}

async function createSignedState(origin: string, env: Env) {
  const payload: SignedStatePayload = {
    origin,
    nonce: crypto.randomUUID(),
    exp: Date.now() + 10 * 60 * 1000
  };
  const payloadText = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${payloadText}.${await signPayload(payloadText, env.OAUTH_STATE_SECRET)}`;
}

async function readSignedState(state: string, env: Env): Promise<SignedStatePayload> {
  const [payloadText, signature] = state.split('.');
  if (!payloadText || !signature) throw new Error('Invalid OAuth state.');
  if (!await verifyPayload(payloadText, signature, env.OAUTH_STATE_SECRET)) throw new Error('Invalid OAuth signature.');
  const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadText))) as SignedStatePayload;
  if (!payload.origin || payload.exp < Date.now()) throw new Error('OAuth state has expired.');
  return payload;
}

function createCallbackUrl(request: Request) {
  return `${new URL(request.url).origin}/github/callback`;
}

async function exchangeCodeForToken(code: string, request: Request, env: Env) {
  const body = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    client_secret: env.GITHUB_CLIENT_SECRET,
    code,
    redirect_uri: createCallbackUrl(request)
  });
  const response = await fetch(githubTokenUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body
  });
  const tokenBody = await response.json() as { access_token?: string; error_description?: string; error?: string };
  if (!response.ok || !tokenBody.access_token) {
    throw new Error(tokenBody.error_description || tokenBody.error || 'GitHub token exchange failed.');
  }
  return tokenBody.access_token;
}

async function fetchViewer(token: string) {
  const response = await fetch(githubUserUrl, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'user-agent': 'LINK-PWA'
    }
  });
  const viewer = await response.json() as { login?: string; message?: string };
  if (!response.ok || !viewer.login) throw new Error(viewer.message || 'Unable to read GitHub user.');
  return viewer.login;
}

function callbackPage(origin: string, payload: Record<string, unknown>) {
  const message = JSON.stringify(payload).replace(/</g, '\\u003c');
  const targetOrigin = JSON.stringify(origin).replace(/</g, '\\u003c');
  return textResponse(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GitHub 登录</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f7f6; color: #111; }
    main { width: min(320px, calc(100vw - 32px)); padding: 24px; border-radius: 18px; background: #fff; box-shadow: 0 16px 40px rgba(16, 24, 20, 0.12); }
    h1 { margin: 0 0 8px; font-size: 20px; }
    p { margin: 0; color: #6b716d; line-height: 1.6; }
  </style>
</head>
<body>
  <main>
    <h1>GitHub 登录完成</h1>
    <p>正在返回 LINK，请稍等。</p>
  </main>
  <script>
    const message = ${message};
    const targetOrigin = ${targetOrigin};
    if (window.opener) {
      window.opener.postMessage(message, targetOrigin);
      window.setTimeout(() => window.close(), 240);
    }
  </script>
</body>
</html>`);
}

async function handleLogin(request: Request, env: Env) {
  const origin = resolveAppOrigin(request, env);
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: createCallbackUrl(request),
    scope: 'repo',
    state: await createSignedState(origin, env)
  });
  return Response.redirect(`${githubAuthorizeUrl}?${params.toString()}`, 302);
}

async function handleCallback(request: Request, env: Env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') ?? '';
  const state = url.searchParams.get('state') ?? '';
  const payload = await readSignedState(state, env);

  try {
    if (!code) throw new Error('Missing GitHub OAuth code.');
    const token = await exchangeCodeForToken(code, request, env);
    const owner = await fetchViewer(token);
    return callbackPage(payload.origin, {
      type: 'link:github-oauth',
      token,
      owner,
      repo: env.DEFAULT_REPO_NAME || 'link-private-backups',
      branch: 'main'
    });
  } catch (error) {
    return callbackPage(payload.origin, {
      type: 'link:github-oauth',
      error: error instanceof Error ? error.message : 'GitHub OAuth failed.'
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (url.pathname === '/github/login') return await handleLogin(request, env);
      if (url.pathname === '/github/callback') return await handleCallback(request, env);
      if (url.pathname === '/health') return jsonResponse({ ok: true });
      return jsonResponse({ error: 'Not found' }, { status: 404 });
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : 'Worker error' }, { status: 400 });
    }
  }
};