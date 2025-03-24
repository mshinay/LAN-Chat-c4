let uploadToPinata: (file: File) => Promise<string>;

if (typeof window === 'undefined') {
  // Node.js 环境
  uploadToPinata = (await import('./pinataNode')).uploadToPinata;
} else {
  // 浏览器环境
  uploadToPinata = (await import('./pinataBrowser')).uploadToPinata;
}

export { uploadToPinata };
