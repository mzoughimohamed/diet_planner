export function useToday(): string {
  return new Date().toISOString().split('T')[0];
}
