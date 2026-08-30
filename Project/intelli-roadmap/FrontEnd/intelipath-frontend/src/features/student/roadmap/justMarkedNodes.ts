/**
 * Nodes the server just marked, handed from wherever that happened to the canvas
 * that has to show it.
 *
 * <p><b>Why a handoff at all.</b> The two things that mark nodes do not happen on
 * the roadmap. Declaring skills happens in onboarding and the graded assessment
 * happens in a modal that unmounts before the canvas refetches; in both cases the
 * ids exist for a moment on a page that cannot draw them. Without somewhere to
 * put them the student supplies their skills, lands on the roadmap, and reads a
 * board that looks exactly like the one they left — which is indistinguishable
 * from the feature not working.
 *
 * <p><b>Why sessionStorage and not a store.</b> Onboarding navigates, so the
 * value has to survive a route change and a remount, and it must not survive a
 * new tab or tomorrow: a tick animation replayed on next week's visit would be a
 * lie about when it happened. sessionStorage is exactly that lifetime.
 *
 * <p><b>Read once.</b> {@link consumeJustMarkedNodes} clears as it reads, so a
 * refresh of the roadmap page does not replay the animation. Seeing it a second
 * time would say "this just happened again", and nothing happened.
 */

const KEY = 'intelipath.justMarkedNodes'

/** How long a handoff stays valid, in ms. */
const TTL_MS = 60_000

type Payload = {
  ids: string[]
  /** Epoch ms, so a handoff nobody collected expires instead of waiting forever. */
  at: number
  /** Where it came from, shown in the toast: "assessment" | "skills". */
  source: 'assessment' | 'skills'
}

export function rememberJustMarkedNodes(ids: string[], source: Payload['source']): void {
  if (!ids?.length) return
  try {
    const payload: Payload = { ids: ids.map(String), at: Date.now(), source }
    sessionStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    // A blocked or full sessionStorage costs the animation, nothing else. The
    // marking already happened on the server and the refetch still shows it.
  }
}

/** Reads and clears. Returns null when there is nothing fresh to show. */
export function consumeJustMarkedNodes(): Payload | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    sessionStorage.removeItem(KEY)
    const payload = JSON.parse(raw) as Payload
    if (!Array.isArray(payload?.ids) || payload.ids.length === 0) return null
    // Stale means the student went somewhere else and came back much later. The
    // nodes are still marked; announcing it as news is what expires.
    if (typeof payload.at !== 'number' || Date.now() - payload.at > TTL_MS) return null
    return payload
  } catch {
    return null
  }
}
