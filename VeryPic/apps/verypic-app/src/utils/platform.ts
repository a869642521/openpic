/**
 * 轻量级平台工具，无 Sentry/Aptabase 依赖，避免 Vite 转换 500
 */
export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;

function getPlatformSafe(): string {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (ua.includes('android')) return 'android';
  if (ua.includes('macintosh') || ua.includes('mac os x')) return 'macos';
  if (ua.includes('windows nt')) return 'windows';
  if (ua.includes('linux')) return 'linux';
  return '';
}

export const isMac = getPlatformSafe() === 'macos';
export const isWindows = getPlatformSafe() === 'windows';
export const isLinux = getPlatformSafe() === 'linux';
