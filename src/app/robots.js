export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/dashboard/',
    },
    sitemap: 'https://tournadash.vercel.app/sitemap.xml',
  }
}
