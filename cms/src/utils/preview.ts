/**
 * Preview URL Generator - Step 26
 * Generates preview URLs for CMS documents
 */

export function getPreviewUrl(collection: string, slug: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://jpsrealtor.com";
  return `${base}/api/preview?collection=${collection}&slug=${slug}`;
}
