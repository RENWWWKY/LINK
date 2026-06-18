/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_GITHUB_OAUTH_WORKER_URL?: string;
	readonly VITE_GITHUB_OAUTH_CLIENT_ID?: string;
	readonly VITE_GITHUB_OAUTH_REDIRECT_URI?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}