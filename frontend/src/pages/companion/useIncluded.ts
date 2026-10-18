import { useStore } from '../../store'

/** What the next message will include, derived from the same flags the composer chips and panel switches share. */
export function useIncluded() {
  const { shareProfile, attachTwin, attachCompare, twinContext, compareContext, memoryEnabled } = useStore()
  const items: string[] = []
  if (shareProfile) items.push('Profile')
  if (attachTwin && twinContext) items.push('Twin results')
  if (attachCompare && compareContext) items.push('Marketplace comparison')
  return { items, memoryEnabled }
}
