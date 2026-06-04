export function getContentType(filename: string): string {
  if (filename.endsWith('.ts')) return 'text/plain'
  if (filename.endsWith('.html')) return 'text/html'
  if (filename.endsWith('.css')) return 'text/css'
  if (filename.endsWith('.json')) return 'application/json'
  return 'application/octet-stream'
}