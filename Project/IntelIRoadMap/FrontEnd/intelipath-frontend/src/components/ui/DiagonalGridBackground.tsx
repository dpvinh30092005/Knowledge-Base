export default function DiagonalGridBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: "#ffffff",
        backgroundImage: `
          radial-gradient(circle at top center, rgba(59, 130, 246, 0.5), transparent 70%)
        `
      }}
    />
  )
}
