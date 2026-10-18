export function ownerAccessStatus(
  userId: string | null,
  configuredOwner?: string,
): 200 | 401 | 403 | 503 {
  if (!userId) return 401;
  const ownerId = configuredOwner?.trim();
  if (
    !ownerId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ownerId)
  ) {
    return 503;
  }
  return userId.toLowerCase() === ownerId.toLowerCase() ? 200 : 403;
}
