/**
 * The vocabulary the mentor is allowed to cite, mirrored from the backend system prompt
 * (`virtual-mentor-system.st`). These labels describe context at a conceptual level on
 * purpose — the student never sees file names, storage paths or tool names.
 */
export const SOURCE_LABELS = [
  "Your academic record",
  "Your roadmap progress",
  "FPT curriculum",
  "Market Pulse",
  "InteliPath knowledge base",
  "General industry knowledge"
] as const

export type SourceLabel = (typeof SOURCE_LABELS)[number]

const SOURCES_LINE = /^\s*\*\*Sources:\*\*\s*(.+?)\s*$/im

/**
 * Splits the trailing `**Sources:** A · B` footer off an AI reply so it can be rendered as
 * chips instead of raw markdown. Unknown labels are dropped rather than shown, so a model
 * that ignores the vocabulary can never leak a file name into the UI.
 */
export function splitSources(content: string): {
  body: string
  sources: SourceLabel[]
} {
  const match = content.match(SOURCES_LINE)
  if (!match) return { body: content, sources: [] }

  const sources = match[1]
    .split(/[·|,]/)
    .map((part) => part.trim())
    .filter((part): part is SourceLabel =>
      SOURCE_LABELS.includes(part as SourceLabel)
    )

  return {
    body: content.replace(SOURCES_LINE, "").trimEnd(),
    sources: [...new Set(sources)]
  }
}
