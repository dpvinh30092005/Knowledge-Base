export default function SharedAppBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        // Flat, neutral base — no tint, no aurora, just the blueprint grid.
        background: "#f8fafc" // slate-50
      }}
    >
      {/* Even blueprint grid across the whole page. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e2e8f0 1px, transparent 1px),
            linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
          `,
          backgroundSize: "20px 30px"
        }}
      />
    </div>
  )
}
