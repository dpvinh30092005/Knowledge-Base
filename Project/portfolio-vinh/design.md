# Design — portfolio-vinh

Locked design system. Every page reads this file before emitting code. Extend or
amend it when the system needs to grow; do not regenerate it per page.

Replaces the previous system (atmospheric · studied-DNA from Vinh's ink drawings ·
Split Studio / Long Document / Catalogue). That system is retired, not paused.

## Genre

modern-minimal — technical, instrument-panel register.

## The idea

**Giấy ô li** — the quadrille paper every Vietnamese student writes on. The page is
drawn *on* that paper: an 8 px minor cell, a 40 px major rule every fifth cell,
faint blue like real notebook grid. Content does not sit on top of the grid; it
occupies cells. Cells that hold something wake up. Cells that hold nothing stay
faint.

The reference is a drafting sheet, not a dashboard. Everything aligns to the cell,
including the places where alignment is deliberately broken.

Pixel comes from the grid and from drawn marks — square bullets, stepped rules,
block cursors, corner ticks. **It does not come from a pixel typeface.** No pixel
face on Google Fonts carries Vietnamese diacritics; `ề`, `ữ` and `ậ` break or fall
back mid-line. Verified against the Google Fonts API, the same way the previous
system rejected Cinzel and Zen Old Mincho.

## Macrostructure family

Three sides, three shapes. A single shape reused three times would make them read
as tabs.

- **Profile (`home`)** — 19 · Map / Diagram. The person laid out as a system map on
  the sheet, addressed by coordinate rather than stacked in a column.
- **Project (`project`)** — 14 · Narrative Workflow. The three rooms become numbered
  stages `1.0 → 2.0 → 3.0`. Sequential content gets a sequential shape.
- **Notes (`notes`)** — 11 · Annotated Plate. A notebook of numbered pages `00 → 13`,
  opened from a contents rail. Page 00 is the six backend mechanisms as plates
  `P.01 → P.06`; pages 01–13 are theory, each a hand-authored SVG figure carrying the
  shape with prose beside it carrying the reason. Type is annotation on a drawing,
  which is the register the retired `art` side introduced and the only part of it
  worth keeping.

  Two things differ between page 00 and the theory pages, both on purpose. Page 00 is
  bilingual because it describes work a recruiter may read in either language; the
  theory pages are Vietnamese-only because they are study material for one reader.
  And page 00 draws its examples from the running system, because its claim is *this
  is what I built* — the theory pages use a cup, a wardrobe, a parking ticket, because
  their claim is *this is how the thing behaves*, and a reader holding a language rule
  and somebody else's domain model at once spends half their attention on the half
  that does not matter.
- **Drawings (`art`)** — 08 · Photographic. Retired with the drawings side. Kept here
  because the `notes` plates inherit its annotation register.

## Nav and footer

- **Nav — N3 side-rail.** A vertical rail pinned to the left gutter carrying the
  three sides plus the language toggle. Sides are addressed like sheet references
  (`01 profile / 02 project / 03 notes`). Collapses to a top bar under 768 px.

## Figures

Hand-authored inline SVG, no chart library. Every drawn coordinate is a multiple of
the 8 px cell, so a figure lands on the same grid as the page instead of floating
over it. One shared `<defs>` block per page carries the arrowheads.

Vermilion marks **one element per figure** — the thing the plate exists to point at —
and appears nowhere else inside a drawing. That is what keeps the accent under 3 %
on a side that is mostly drawings.

### Amendment — the figure legend (notes side only)

The rule above holds everywhere colour is **emphasis**: the profile, the project, and
any figure whose job is to say *look here*.

It does not hold on a **teaching** figure, where colour is **encoding**. A reader
working out a mechanism has to tell a step that succeeded from one that cost something
from one that broke. In one ink they must read every label to find out which box is the
bad one — which is the work the drawing was supposed to save them. So figures under
`.topic` carry a four-role legend:

```
ok    --fig-ok    oklch(50% 0.132 152)   this step succeeded, this path is cheap
warn  --fig-warn  oklch(56% 0.125 72)    this costs something, or is the second actor
info  --fig-info  oklch(50% 0.125 248)   data in motion, a copy, the first actor
bad   --color-accent                     it broke — the inherited vermilion, not a new hue
```

Four is a ceiling, not a starting point. A fifth hue stops being a legend a reader can
hold in their head and goes back to being decoration. All four sit at L≈52 % so none
outranks the others by weight alone.

Three mechanics make it one system rather than twenty-five classes:

- `data-c="ok"` on any mark — or on a `<g>` around several — sets `--c` and `--c-bed`.
  Every neutral mark reads `var(--c, «its own ink»)`, so a figure that declares no role
  renders **exactly** as it did before the legend existed.
- A `<marker>` paints in its own context and never sees `--c`, so arrowheads need one
  marker per role. `Defs` carries all four. A green line ending in a grey point reads as
  an unfinished drawing.
- A figure using the legend states it once, under the caption, via `<Key>`. Colour is
  only a legend if the legend is written down.

### Glyphs

Drawn in the lucide idiom — 24-unit box, 2-unit stroke, round caps, no fill — and placed
by the top-left of an `s`×`s` box like every other mark. Borrowed vocabulary, not a
borrowed package: a padlock outline is already understood, and a private symbol set
would need its own legend before any figure could be read. Twenty-eight glyphs live in
`parts.tsx`; a dependency plus the tree-shaking step to get back to twenty-eight buys
nothing.

**No emoji, ever.** An emoji renders as someone else's artwork at someone else's weight
and would be the only thing on the sheet not drawn in this ink.

### Amendment — coloured code (notes side only)

This reverses the earlier rule that a code block stays black. That rule reasoned that a
second colour would compete with the vermilion; it holds on the profile side, where
colour is emphasis, and it does not hold here for the same reason the figure legend
above does not: inside teaching material colour is an **encoding**. A reader scanning
`@Transactional public void saveOne(Car c)` for the thing that matters should not have
to read the line to find it.

The code palette is therefore **the same four roles as the figures**, not a new one —
blue for keywords, green for literal data, amber for numbers, ink for type names, grey
for comments and syntax. `tokens.css` names them `--code-*` as aliases so the two can
never drift.

Vermilion lands on **annotations and nothing else**. That keeps it under the 3 % rule and
spends it on the one mark these pages are about: on page 08, `@Transactional` *is* the
lesson.

Mechanically: `prism-react-renderer`, themed with `var()` rather than literals so the
colours stay reachable from `tokens.css`. Java, Dockerfile and shell grammars are written
in `notes/code.tsx` — the bundled Prism has neither, and three short grammars extending
`clike` cost less than a second dependency imported for its side effects. The chunk lands
in `parts`, which the profile side never loads.

Two rules learned by getting them wrong:

- A region drawn *around* marks (`.d-zone`) is painted **before** them. Painted after,
  its fill covers them, because a `fill="none"` presentation attribute loses to any
  CSS rule and the class wins.
- Sentences belong in the `figcaption`, not in the drawing. A label wider than its
  own `viewBox` is silently clipped; `tools/plates.mjs` checks every `<text>` against
  its `viewBox` in both languages and fails the ones that escape.
- **Footer — Ft5 Statement.** One closing line, hairline rule above, colophon small.

## Theme — custom · "Ô li"

Paper band **light** · display style **grotesk-sans** · accent hue **warm (32°)**.

The vermilion survives the rebuild. It was read from Vinh's own drawings and is the
only part of the old system that is *his* rather than the genre's; dropping it would
trade a fingerprint for a stock accent. On light paper it is the seal mark, used at
under 3 % of any viewport.

```
--color-paper      oklch(97.6% 0.005 95)    warm notebook white
--color-paper-2    oklch(94.8% 0.007 95)    raised cell
--color-paper-3    oklch(91.5% 0.009 95)    plate bed
--color-ink        oklch(21% 0.011 250)     near-black, faint blue cast
--color-ink-2      oklch(47% 0.011 250)
--color-ink-3      oklch(64% 0.009 250)
--color-grid       oklch(72% 0.055 245)     the ô li line, used at low alpha
--color-accent     oklch(52% 0.190 32)      朱 vermilion, carried over
--color-accent-ink oklch(98% 0.004 95)
--color-focus      oklch(45% 0.160 250)     deliberately not the accent

--fig-ok           oklch(50% 0.132 152)     figure legend — notes side only
--fig-warn         oklch(56% 0.125 72)      see Figures › Amendment
--fig-info         oklch(50% 0.125 248)     bad = --color-accent, not re-declared

--code-kw          → --fig-info             code colours are aliases of the four
--code-str         → --fig-ok               figure roles, never new hues
--code-num         → --fig-warn
--code-anno        → --color-accent         annotations only — the subject of 08/09
--code-type        → --color-ink
--code-comment     → --color-ink-3
```

## Typography

Verified for the `vietnamese` subset against the Google Fonts API before selection.

- **Display** — Space Grotesk 700, tracking `-0.02em`. Roman, never italic.
- **Body** — Be Vietnam Pro 400/500. Drawn for Vietnamese diacritics.
- **Mono** — JetBrains Mono 400/500. Coordinates, labels, stage numbers, figures.
- Type scale anchor: `--text-display: clamp(2.25rem, 5.5vw, 4.5rem)`.

## Spacing

4-point scale in `tokens.css`. **Every vertical rhythm value is a multiple of the
8 px cell** — the grid is load-bearing, so spacing that ignores it shows.

## Motion

GSAP, already a project dependency. Exactly three primitives:

1. **`cell-wake`** — grid cells around entering content raise opacity, then settle.
   The sheet draws itself as the reader descends.
2. **`stage-advance`** — the project's stage number counts up as its section takes
   the viewport.
3. **`plate-reveal`** — a drawing wipes in cell-by-cell from its top-left corner.
4. **`step-walk`** — a figure holds a sequence of frames and the reader drives it.

`step-walk` is the only one that is a control rather than a reveal. A reveal answers
"has the reader arrived"; this answers "which step are we on", which goes backwards,
is readable while paused, and belongs to the reader. That is why it is a primitive
and not a variation of `cell-wake`.

**No second animation library.** GSAP timelines are the right shape for a stepped
figure, and a second library would have added a dependency and its bundle to buy
nothing. If a future page needs physics or a spring, revisit this — not before.

Marks inside a stepped figure that should animate in carry `data-enter`. They rest
**visible**; the tween plays them in. A frame whose tween never runs is still a
correct picture of that step.

Easings: `--ease-out cubic-bezier(0.16, 1, 0.3, 1)`, `--ease-in-out
cubic-bezier(0.65, 0, 0.35, 1)`. No overshoot on UI state.

**Reduced motion** — all three collapse to a ≤150 ms opacity crossfade. The grid
renders at its resting opacity and never animates.

### Amendment — `lab`, the fifth primitive (notes side only)

A **lab** is a small machine with real state that the reader supplies input to. The
picture is *computed* from that state, not drawn ahead of it, so the reader can
reach a screen the author never saw.

**When a lab, when a walkthrough.** A walkthrough is right when the mechanism has
one true order — a request through the `DispatcherServlet` goes through those
stages in that order, and letting a reader shuffle them would teach a lie. A lab is
right when the lesson *is* that the order is not fixed. A drawing of one thread
interleaving says "this can happen"; the reader nods and learns nothing, because
the thing worth knowing is that a hundred other interleavings can happen and you do
not get to choose. No number of frames carries that.

Three rules, so a lab stays a lab and does not become a playground:

1. **Every control maps to something asked in an interview.** A slider that only
   makes the drawing prettier is decoration wearing an interaction.
2. **A lab keeps a button that reproduces the exact output printed in the book it
   cites.** The simulation has to be checkable against something that is not
   itself. If `lịch của sách` ever stops matching page 240, the machine is wrong.
3. **The tally is measured, never asserted.** "2 000 random schedules → 1 943
   broken" is a number this page computed on this device, not a claim copied from
   somewhere. It is the honest-copy rule applied to a simulation.

Marks: `.lab` shares `.walk`'s bed and rule but is ruled off at the top in accent,
so the eye registers "different kind of object" before it reads the contents. The
console is the one surface on the whole site that sits on ink rather than paper —
it is a terminal, and the four figure roles are re-mixed for the dark bed
(`color-mix(… 62%, white)`) because colours tuned for paper go muddy on black.

Still no second library. A lab is `useState` and a reducer-shaped step function.

## Microinteractions stance

- Silent success. No toasts.
- Hover tooltips delay 800 ms; focus tooltips 0 ms.
- Focus rings appear instantly and are never animated.
- Hover on a cell-bounded element shifts its background one paper step. It does not
  lift, scale, or glow.

## CTA voice

- **Primary** — filled ink, square corners, mono label, one cell of padding on the
  short axis. Vermilion is reserved for the single most important action per side.
- **Secondary** — hairline box, ink text, same geometry. Never a pill; pills are
  round and this system has no radius.

## Copy rule — inherited, non-negotiable

`src/content.ts` carries an HONEST-COPY rule from the previous system and it stands:
**every figure is measured from the IntelliPath repository or its database.** Voice
may be rewritten; numbers may not. Images stay Vinh's own files in `/public/art`.

The drawings carry no titles, no medium lines, no dates, on purpose. Captioning a
hobby turns it into a portfolio piece being sold.

## Voice

Rewritten in this pass. The previous copy was manifesto-shaped: clipped fragments,
stacked negation (*"Không phải dự án, không bán, chỉ treo ở đây"*), aphorisms
(*"dựng cho đúng trước, đẹp tính sau"*), and a closing move that told the reader what
to conclude.

The new voice is an engineer describing a system: full sentences, one claim each, no
aphorism, no summary line telling the reader what they just read. Where the old copy
argued, the new copy states and lets the measured figures argue.

Both languages carry the same voice. Vietnamese is the primary; English is a
translation of it, not a separate register.

**One documented exception.** On the notes side, page `00` (the six plates about
IntelliPath) is bilingual because it faces a hiring reader. The theory pages —
`01` onward — are Vietnamese-only with English technical terms left in place, which
is how the material is actually studied. Translating them would have halved the
depth per unit of effort for a reader who does not exist. The rail and every
chrome string stay bilingual, so nothing is stranded.

## What pages MUST share

Grid geometry (8 px cell / 40 px major). Type pairing. Accent placement (≤ 3 %).
Side-rail nav. CTA geometry. The `cell-wake` reveal.

## What pages MAY differ on

Macrostructure within the family above. Whether a fold is full-bleed. Density —
the profile is sparse, the project is dense, the drawings are almost empty.

## Exports

### tokens.css

Source of truth is `src/tokens.css`. It carries every `--color-*`, `--font-*`,
`--space-*`, `--text-*`, `--ease-*`, `--dur-*`, `--cell-*` and `--rule-*` token used
in the build. Page CSS references tokens by name and never inlines a raw value.
