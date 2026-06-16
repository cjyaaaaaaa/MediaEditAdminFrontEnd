import { isExternal } from '@/utils/validate'
import type { UploadFileResult } from '@/types/api/common'

/**
 * Parse upload API response to a browser-loadable URL (object storage absolute or relative + API base).
 */
export function resolveUploadPublicUrl(res: Pick<UploadFileResult, 'url' | 'fileName'>): string {
  const raw = res.url || res.fileName
  if (!raw) {
    return ''
  }
  return resolveResourceUrl(raw)
}

/**
 * Normalize stored image/file URL for display (avatar, ImageUpload, ImagePreview, etc.).
 * Supports: full http(s) object storage URL, protocol-relative //, and backend relative paths.
 */
export function resolveResourceUrl(raw: string | undefined | null): string {
  if (raw == null) {
    return ''
  }
  let s = String(raw).trim()
  if (!s) {
    return ''
  }
  // Fix mistaken double prefix like "/dev-api/https://..."
  const dup = s.search(/https?:\/\//i)
  if (dup > 0) {
    s = s.slice(dup)
  }
  if (/^https?:\/\//i.test(s)) {
    return s
  }
  if (s.startsWith('//')) {
    if (typeof window !== 'undefined' && window.location?.protocol) {
      return `${window.location.protocol}${s}`
    }
    return `https:${s}`
  }
  const base = import.meta.env.VITE_APP_BASE_API || ''
  if (base && s.startsWith(base)) {
    return s
  }
  if (isExternal(s)) {
    return s
  }
  // RuoYi historical local paths served under API (e.g. /profile/upload/...)
  if (s.startsWith('/profile') || s.startsWith('profile/')) {
    return base + (s.startsWith('/') ? s : `/${s}`)
  }
  // Root paths like /assets/... (Vite default avatar import) ¡ª do not prefix API
  if (s.startsWith('/')) {
    return s
  }
  return base + (s.startsWith('/') ? s : `/${s}`)
}

/** True if URL should be persisted as-is (not strip API base). */
export function isAbsoluteHttpUrl(s: string): boolean {
  const t = s.trim()
  return /^https?:\/\//i.test(t) || t.startsWith('//')
}
