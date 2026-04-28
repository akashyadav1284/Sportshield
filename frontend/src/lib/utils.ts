/** Tailwind CSS utility helper (cn function) */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a fully qualified absolute URL for media assets.
 * If the URL is relative (e.g. /uploads/...), it prepends the backend origin.
 */
export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    if (apiUrl && apiUrl.startsWith('http')) {
      const baseUrl = new URL(apiUrl).origin;
      return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    }
  } catch (e) {
    // Ignore URL parsing errors
  }
  
  return url;
}
