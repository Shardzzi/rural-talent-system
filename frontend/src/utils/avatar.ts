const AVATAR_COLORS = [
  '#2E7D32', '#F57C00', '#1976D2', '#7B1FA2', '#C62828',
  '#00838F', '#558B2F', '#E65100', '#1565C0', '#6A1B9A',
  '#AD1457', '#00695C', '#9E9D24', '#BF360C', '#283593',
  '#4527A0', '#D84315', '#1B5E20', '#0D47A1', '#880E4F'
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getInitials(name: string): string {
  if (!name) return '?'
  if (/[\u4e00-\u9fff]/.test(name)) {
    return name.length >= 2 ? name.slice(-2) : name
  }
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function generateAvatarSvg(name: string, size: number = 40): string {
  const hash = hashString(name)
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length]
  const initials = getInitials(name)
  const fontSize = size * 0.4
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${color}"/><text x="50%" y="50%" dy="0.35em" text-anchor="middle" fill="white" font-size="${fontSize}" font-family="system-ui, sans-serif" font-weight="500">${initials}</text></svg>`
}

export function avatarDataUrl(name: string, size: number = 40): string {
  return `data:image/svg+xml,${encodeURIComponent(generateAvatarSvg(name, size))}`
}
