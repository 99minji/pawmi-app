export function createId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}
