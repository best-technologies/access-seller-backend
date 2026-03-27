/**
 * Derives the storage delete id from a stored asset URL (Cloudinary public_id or S3 object key).
 * Returns null if the URL cannot be parsed (skip delete; non-fatal).
 */
export function extractStoragePublicIdFromUrl(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null;
  const u = url.trim().split('?')[0];

  const cloudinaryIdx = u.indexOf('/upload/');
  if (cloudinaryIdx !== -1) {
    let rest = u.slice(cloudinaryIdx + '/upload/'.length);
    const segments = rest.split('/').filter(Boolean);
    if (!segments.length) return null;
    let i = 0;
    if (segments[0]?.includes(',')) i += 1;
    if (i < segments.length && /^v\d+$/i.test(segments[i])) i += 1;
    const pathSegs = segments.slice(i);
    if (!pathSegs.length) return null;
    const last = pathSegs[pathSegs.length - 1] ?? '';
    pathSegs[pathSegs.length - 1] = last.replace(/\.[a-zA-Z0-9]+$/, '');
    return decodeURIComponent(pathSegs.join('/'));
  }

  const s3Match = u.match(/amazonaws\.com\/(.+)$/);
  if (s3Match?.[1]) {
    return decodeURIComponent(s3Match[1]);
  }

  return null;
}
