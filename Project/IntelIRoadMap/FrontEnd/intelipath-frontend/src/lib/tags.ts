/**
 * The scraper stores each tag field as JSON — sometimes a plain string, an
 * array of strings, or an object of arrays (e.g. {"specializes": [...],
 * "requirements": [...]}). Flatten whatever shape arrives into a clean,
 * de-duplicated list of short chip labels. Legacy rows that hold non-JSON text
 * fall through untouched.
 */
export function normalizeTags(raw: unknown): string[] {
  const out: string[] = []
  const push = (v: unknown) => {
    if (v == null) return
    if (Array.isArray(v)) return void v.forEach(push)
    if (typeof v === "object") return void Object.values(v as Record<string, unknown>).forEach(push)
    const s = String(v).trim()
    if (!s) return
    if ((s[0] === "[" && s.endsWith("]")) || (s[0] === "{" && s.endsWith("}"))) {
      try {
        return void push(JSON.parse(s))
      } catch {
        /* not JSON, keep as text */
      }
    }
    out.push(s)
  }
  push(raw)
  return Array.from(new Set(out))
}
