/**
 * 检测新路径是否与已有监听路径重叠（包含关系或完全相同）。
 * @returns 冲突的已有路径，无冲突则返回 null
 */
export function detectFolderOverlap(newPath: string, existingPaths: string[]): string | null {
  const norm = (p: string) => p.replace(/\\/g, '/').replace(/\/$/, '').toLowerCase();
  const n = norm(newPath);
  for (const e of existingPaths) {
    const en = norm(e);
    if (n === en || n.startsWith(en + '/') || en.startsWith(n + '/')) {
      return e;
    }
  }
  return null;
}
