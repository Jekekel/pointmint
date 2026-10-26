// Client helper: digital twin avatar URLs (human photo + sunglasses).
// Server is source of truth — Worker serves /avatars/twin/<agentId>.svg and /api/twin-avatar/<humanId>.
export function twinAvatarUrl(agentId, bust) {
  const id = String(agentId || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 48);
  if (!id) return '/avatars/twin-placeholder.svg';
  const q = bust ? `?v=${encodeURIComponent(String(bust).slice(0, 48))}` : '';
  return `/avatars/twin/${id}.svg${q}`;
}
export function twinAvatarByHuman(humanId, bust) {
  const id = String(humanId || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 48);
  if (!id) return '/avatars/twin-placeholder.svg';
  const q = bust ? `?v=${encodeURIComponent(String(bust).slice(0, 48))}` : '';
  return `/api/twin-avatar/${id}${q}`;
}
