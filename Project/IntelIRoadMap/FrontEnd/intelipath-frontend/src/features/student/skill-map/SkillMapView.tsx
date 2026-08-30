import { useMemo } from 'react'
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { ShieldCheck } from 'lucide-react'
import type { CoreSkill } from '../types'
import {
  MAX_PROFICIENCY,
  MAX_AREA,
  MIN_AREA,
  missingRankedByRelevance,
  toSkillBubbles,
  unmeasuredSkills,
  type SkillBubble,
  type UnmeasuredSkill,
} from './skillMapData'
import { initialForSkill, logoForSkill } from './skillLogos'

type Props = {
  coreSkills?: CoreSkill[] | null
  className?: string
}

const PROFICIENCY_TICKS = [0, 1, 2, 3, 4]
const PROFICIENCY_LABEL: Record<number, string> = {
  0: 'None',
  1: 'Aware',
  2: 'Practiced',
  3: 'Applied',
  4: 'Professional',
}

const VERIFIED_FILL = '#059669'
const DECLARED_FILL = '#0ea5e9'
const MISSING_STROKE = '#f43f5e'

/** Below this the scatter is unreadable and the same data reads better as a list. */
const LIST_BREAKPOINT = 640

/**
 * Logo size bounds, in pixels.
 *
 * A logo is only worth drawing if it can be recognised, so the floor is higher
 * than the equivalent dot would be — below roughly 18px a mark is a smudge and
 * the letter disc reads better. The ceiling stops one dominant skill from
 * covering its neighbours.
 */
const MIN_LOGO_PX = 24
const MAX_LOGO_PX = 44

/** How far the halo spreads past the ring. A Gaussian is spent by ~3σ. */
const GLOW_REACH = 10
const GLOW_BLUR = GLOW_REACH / 3

/**
 * Room the chart must leave so an edge logo is not sliced by its own frame.
 *
 * A dot sits inside its coordinate; a 44px logo hangs 22px past it in every
 * direction, plus the ring. The old margins were sized for dots, and the first
 * render clipped the student's strongest skill — top-right is where the best
 * ones land, so the bug hit exactly the point the chart exists to celebrate.
 *
 * The glow reaches further than the ring, so the margin has to cover that too, or
 * the halo gets sliced flat against the plot edge — the same clipping bug, one
 * layer out.
 */
const EDGE_ROOM = MAX_LOGO_PX / 2 + 4 + GLOW_REACH

/** Greys out logos for skills the student does not hold yet. */
const DESATURATE_FILTER_ID = 'skillmap-desaturate'

/** Softens the halo behind a held skill. */
const GLOW_FILTER_ID = 'skillmap-glow'

/** Trims a square logo to the circle its ring draws. */
const CLIP_FILTER_ID = 'skillmap-clip'

/**
 * One skill drawn at its coordinates.
 *
 * <p>Recharts sizes symbols by area (see `bubbleArea`), so the radius is derived
 * back out here rather than read from a prop — the eye reads area, and taking the
 * area straight to a side length would square every difference the data meant.
 *
 * <p>The three states stay legible without reading the legend: held skills show
 * their real colours inside a solid ring, missing ones are drawn desaturated
 * inside a dashed ring. Fading rather than omitting is deliberate — a gap the
 * student cannot see is a gap they cannot close.
 */
/**
 * Symbol area → drawn size in pixels.
 *
 * `bubbleArea` returns an area for recharts' own dot renderer, whose radius is
 * `sqrt(area/π)`. Reusing that formula here gave every logo on the chart a
 * diameter between 24 and 25.7 px: the smallest skill and the most in-demand one
 * came out the same size, while the legend went on claiming size meant postings.
 * Measured, not guessed — every rendered `<image>` had width="24".
 *
 * So the area is interpolated across the legible band instead. The interpolation
 * runs on `sqrt(area)` rather than area, which keeps the property that made
 * `bubbleArea` careful in the first place: the eye judges by area, so a skill
 * twice as wanted must not look four times as important.
 *
 * The band starts at 24px because a brand mark below that reads as a smudge —
 * the floor is a legibility constraint, and it does compress the low end. Size
 * is therefore an honest ordering, not a proportion, which is what the legend
 * says.
 */
function logoDiameter(area: number): number {
  const lo = Math.sqrt(MIN_AREA)
  const hi = Math.sqrt(MAX_AREA)
  const t = hi === lo ? 0 : (Math.sqrt(Math.max(area, MIN_AREA)) - lo) / (hi - lo)
  return MIN_LOGO_PX + Math.min(1, Math.max(0, t)) * (MAX_LOGO_PX - MIN_LOGO_PX)
}

function SkillLogoPoint(props: { cx?: number; cy?: number; payload?: SkillBubble }) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null || !payload) return null

  const bubble = payload
  const diameter = logoDiameter(bubble.z)
  const half = diameter / 2
  const ring = bubble.held ? (bubble.verified ? VERIFIED_FILL : DECLARED_FILL) : MISSING_STROKE
  const logo = logoForSkill(bubble.skillName)

  return (
    <g>
      {/* A halo in the ring's own colour, under everything else. It carries the same
          fact the ring does — verified glows hardest, self-declared softer, missing
          not at all — so it reads as emphasis rather than decoration, and the eye
          finds the student's real skills before it reads a single label. The plate
          on top means only the spill past the ring is visible. */}
      {bubble.held && (
        <circle
          cx={cx}
          cy={cy}
          /* Wider than the plate on purpose. The plate is opaque and sits at
             `half + 3`, so a halo drawn at that radius is entirely hidden except
             for whatever the blur spills past the edge — measured at the first
             attempt, that was nothing anyone could see. Starting wider puts the
             glow's own body outside the plate rather than under it. */
          r={half + 8}
          fill={ring}
          opacity={bubble.verified ? 0.55 : 0.3}
          filter={`url(#${GLOW_FILTER_ID})`}
        />
      )}
      {/* A plate behind the mark: most logos are drawn for light backgrounds, and
          the grid lines running underneath them break their silhouette. */}
      <circle cx={cx} cy={cy} r={half + 3} fill="#ffffff" fillOpacity={bubble.held ? 1 : 0.6} />
      <circle
        cx={cx}
        cy={cy}
        r={half + 3}
        fill="none"
        stroke={ring}
        strokeWidth={bubble.held ? 2 : 1.5}
        strokeDasharray={bubble.held ? undefined : '3 2'}
      />
      {logo ? (
        <image
          href={logo}
          x={cx - half}
          y={cy - half}
          width={diameter}
          height={diameter}
          /* Wordmarks (AWS) are far wider than tall; letting them fill the box
             would stretch the brand out of shape. */
          preserveAspectRatio="xMidYMid meet"
          clipPath={`url(#${CLIP_FILTER_ID})`}
          opacity={bubble.held ? 1 : 0.45}
          filter={bubble.held ? undefined : `url(#${DESATURATE_FILTER_ID})`}
        />
      ) : (
        /* Concepts — Agile, Microservices, Project Management — have no mark, and
           minting one would be decoration pretending to be information. */
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={Math.max(10, diameter * 0.5)}
          fontWeight={700}
          fill={bubble.held ? ring : '#94a3b8'}
        >
          {initialForSkill(bubble.skillName)}
        </text>
      )}
    </g>
  )
}

function BubbleTooltip({ active, payload }: { active?: boolean; payload?: { payload: SkillBubble }[] }) {
  if (!active || !payload?.length) return null
  const bubble = payload[0].payload
  return (
    <div className="rounded-xl bg-black/90 px-3 py-2 text-[11px] font-medium text-white shadow-lg">
      <p className="font-bold">{bubble.skillName}</p>
      <p className="mt-0.5 text-white/80">
        {bubble.held
          ? `You: ${PROFICIENCY_LABEL[bubble.y]}${bubble.verified ? ' (verified)' : ' (self-declared)'}`
          : 'You do not have this yet'}
      </p>
      {bubble.frequency != null && (
        <p className="text-white/60">{Math.round(bubble.frequency * 100)}% of recent postings ask for it</p>
      )}
    </div>
  )
}

/**
 * The student's core skills as bubbles: what the market wants across, what they
 * can do up.
 *
 * <p>The four corners read themselves. Top-right is what they have that is
 * wanted; bottom-right is the gap worth closing first, and it is the same
 * ordering `priorityScore` produces on the roadmap because it is the same two
 * facts pointing the same way — the map and the priority badges can be read
 * against each other without ever disagreeing.
 *
 * <p>Missing skills are drawn hollow rather than omitted. A gap the student
 * cannot see is a gap they cannot close.
 */
export default function SkillMapView({ coreSkills, className = '' }: Props) {
  const bubbles = useMemo(() => toSkillBubbles(coreSkills), [coreSkills])
  const missing = useMemo(() => missingRankedByRelevance(bubbles), [bubbles])
  const unmeasured = useMemo(() => unmeasuredSkills(coreSkills), [coreSkills])

  if (bubbles.length === 0) {
    return (
      <div className={className}>
        <p className="text-[11px] leading-relaxed text-slate-500">
          No market data behind your core skills yet, so there is nothing honest to plot.
        </p>
        {/* The skills still exist even when not one of them can be placed, and this
            is the case where saying so matters most. */}
        <UnmeasuredStrip skills={unmeasured} />
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Scatter on anything wide enough to read it; `sm:` is Tailwind's 640px,
          which is LIST_BREAKPOINT. Below that the same data in the same order as
          a list — cramming 29 bubbles into 360px does not make a chart, it makes
          a smudge. */}
      <div className="hidden sm:block">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: EDGE_ROOM, right: EDGE_ROOM, bottom: 28, left: 8 }}>
              <defs>
                <filter id={DESATURATE_FILTER_ID}>
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                {/* The region has to be oversized: a filter's default box is the
                    source bounds plus 10%, which would crop the blur into a square
                    and leave a visible seam around every glowing bubble. */}
                <filter id={GLOW_FILTER_ID} x="-75%" y="-75%" width="250%" height="250%">
                  <feGaussianBlur stdDeviation={GLOW_BLUR} />
                </filter>
                {/* Keeps a square mark inside its ring. A logo drawn edge-to-edge in a
                    box has corners at 1.41× the radius, so JavaScript's filled yellow
                    square covered the ring completely and the one bubble the student
                    had verified showed no verified state at all. Bounding-box units
                    make one clip path serve every diameter on the chart. */}
                <clipPath id={CLIP_FILTER_ID} clipPathUnits="objectBoundingBox">
                  <circle cx="0.5" cy="0.5" r="0.5" />
                </clipPath>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                dataKey="x"
                name="Share of postings"
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                tickFormatter={() => ''}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Market wants it more →',
                  position: 'insideBottom',
                  offset: -12,
                  style: { fontSize: 10, fill: '#94a3b8', fontWeight: 700 },
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, MAX_PROFICIENCY]}
                ticks={PROFICIENCY_TICKS}
                tickFormatter={(value: number) => PROFICIENCY_LABEL[value] ?? String(value)}
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                width={74}
              />
              {/* recharts sizes symbols by AREA, and this range is an area range.
                  skillMapData.bubbleArea returns area for exactly that reason:
                  the eye reads area, so scaling the radius linearly would square
                  every difference. */}
              <ZAxis type="number" dataKey="z" range={[MIN_AREA, MAX_AREA]} />
              <Tooltip content={<BubbleTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={bubbles} shape={<SkillLogoPoint />} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* The swatches are rings now, not filled dots — the legend has to show what
            is actually on the chart, or it teaches the wrong thing to look for. */}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Legend
            swatch={
              <span className="h-3 w-3 rounded-full border-2" style={{ borderColor: VERIFIED_FILL }} />
            }
          >
            Verified
          </Legend>
          <Legend
            swatch={
              <span className="h-3 w-3 rounded-full border-2" style={{ borderColor: DECLARED_FILL }} />
            }
          >
            Self-declared
          </Legend>
          <Legend
            swatch={
              <span
                className="h-3 w-3 rounded-full border border-dashed opacity-60"
                style={{ borderColor: MISSING_STROKE }}
              />
            }
          >
            Missing (greyed out)
          </Legend>
          <span className="text-[9px] font-medium text-slate-400">Logo size = postings mentioning it</span>
        </div>
      </div>

      {/* Narrow screens: same skills, same order, no scatter. */}
      <ul className="flex flex-col gap-1 sm:hidden">
        {missing.slice(0, 8).map(bubble => (
          <li
            key={bubble.skillId}
            className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 ring-1 ring-black/[0.04]"
          >
            {/* Same marks as the chart. These are all skills the student is missing,
                so they carry the same greyed-out treatment rather than full colour. */}
            {logoForSkill(bubble.skillName) ? (
              <img
                src={logoForSkill(bubble.skillName) as string}
                alt=""
                aria-hidden="true"
                className="size-4 shrink-0 opacity-50 grayscale"
              />
            ) : (
              <span className="grid size-4 shrink-0 place-items-center text-[9px] font-bold text-slate-400">
                {initialForSkill(bubble.skillName)}
              </span>
            )}
            <span className="flex-1 truncate text-[11px] font-semibold text-slate-800">{bubble.skillName}</span>
            {bubble.frequency != null && (
              <span className="shrink-0 text-[10px] font-bold tabular-nums text-slate-500">
                {Math.round(bubble.frequency * 100)}%
              </span>
            )}
          </li>
        ))}
        {missing.length === 0 && (
          <li className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
            <ShieldCheck className="size-3.5" />
            You hold every core skill for this career.
          </li>
        )}
      </ul>

      <UnmeasuredStrip skills={unmeasured} />
    </div>
  )
}

/**
 * Core skills no posting has named, shown outside the chart rather than dropped.
 *
 * They deliberately get no coordinates. Placing them would mean asserting a market
 * position the data does not support, which is the mistake the chart's own drop rule
 * exists to avoid — but dropping them silently made the student's own work disappear.
 * A strip beside the chart is the third option: present, credited, and honest that
 * the horizontal question has not been answered for them.
 */
function UnmeasuredStrip({ skills }: { skills: UnmeasuredSkill[] }) {
  if (skills.length === 0) return null
  const held = skills.filter(skill => skill.held)

  return (
    <div className="mt-4 border-t border-dashed border-slate-200 pt-3">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
        No posting data yet
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
        {held.length > 0
          ? `${held.length === 1 ? 'One core skill you hold is' : `${held.length} core skills you hold are`} not on the chart: no job posting we have read named ${held.length === 1 ? 'it' : 'them'} yet, so there is no market position to plot. That is a gap in our posting data, not in you.`
          : 'These core skills have no market measurement yet, so the chart cannot place them.'}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {skills.map(skill => (
          <span
            key={skill.skillId}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
              skill.held
                ? 'bg-white text-slate-800 ring-black/[0.08]'
                : 'bg-slate-50 text-slate-400 ring-black/[0.04]'
            }`}
          >
            {logoForSkill(skill.skillName) ? (
              <img
                src={logoForSkill(skill.skillName) as string}
                alt=""
                aria-hidden="true"
                className={`size-3.5 shrink-0 ${skill.held ? '' : 'opacity-50 grayscale'}`}
              />
            ) : (
              <span
                className="grid size-3.5 shrink-0 place-items-center text-[9px] font-bold"
                style={{ color: skill.held ? (skill.verified ? VERIFIED_FILL : DECLARED_FILL) : '#94a3b8' }}
              >
                {initialForSkill(skill.skillName)}
              </span>
            )}
            <span className="truncate">{skill.skillName}</span>
            {skill.held && (
              // The rung is the whole reason these are worth showing: without it the
              // strip reads as a list of things the student is missing.
              <span
                className="shrink-0 text-[9px] font-bold uppercase tracking-wide"
                style={{ color: skill.verified ? VERIFIED_FILL : DECLARED_FILL }}
              >
                {PROFICIENCY_LABEL[skill.proficiency]}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

function Legend({ swatch, children }: { swatch: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      {swatch}
      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{children}</span>
    </span>
  )
}
