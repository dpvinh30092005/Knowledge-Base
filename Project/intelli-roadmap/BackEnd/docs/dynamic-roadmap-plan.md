# Implementation Plan: Dynamic Roadmap & Market-Driven Targets

> Topic: **SU26SWP02 — Personalized Career Orientation & Learning Roadmap Platform for SE Students**
> Type: RBL Topic (the Research Questions are graded separately)
> This document is written to be implementable: it carries DDL, formulas,
> service signatures and endpoints rather than prose.

---

## 0. Alignment with the assignment

### 0.1 Research Questions — the most heavily weighted part

| RQ | Question | Phase |
|---|---|---|
| **RQ1** | How can AI identify a student's latent talent through their **coding patterns**? | Phase 7 |
| **RQ2** | How effective is a dynamic roadmap that updates from **real-time job trend analysis**? | Phases 2–3–6 |

Neither is answered by the current codebase. Both are answerable with data the
project already collects.

### 0.2 Functional Requirements

| FR | Requirement | Status | Phase |
|---|---|---|---|
| FR1.1–1.2 | LLM chat for career advice | Done | — |
| FR1.3 | Analyse **transcripts** + GitHub to personalise answers | Partial: GitHub only | Phase 8 |
| FR2.1 | Select a Target Career Role | Done | — |
| FR2.2 | Generate a hierarchical Skill Tree in a **prioritised** sequence | Tree yes, priority no | Phase 6 |
| FR2.3 | **At least 2 resource links per node** | **131 of 739 nodes violate this** | Phase 0 |
| FR2.4 | Mark nodes complete, update progress | Done | — |
| FR3.1 | Manually input or select current skills from a list | Exists, but **carries no level** | Phase 4 |
| FR3.2 | Map current skills against target role requirements | Missing | Phase 5 |
| FR3.3 | **Generate a visual report or PDF** of missing skills and priorities | Missing | Phase 5 |
| FR4.1 | Scrape job portals on a daily schedule | Done (ITviec) | — |
| FR4.2 | Keyword frequency analysis over job descriptions | Exists, but **not split by role/level** | Phases 2–3 |
| FR4.3 | Interactive trend charts | Done | — |
| FR5.1–5.3 | E-Portfolio and shareable URL | Done | — |
| FR6.1–6.2 | Auth and persistent history | Done | — |

**Known deviation.** FR4.1 names "LinkedIn, TopCV"; the system scrapes
**ITviec**. Same intent (a major Vietnamese IT job portal) but the report must
justify it: ITviec exposes schema.org structured data so parsing is stable,
while LinkedIn actively blocks scraping.

### 0.3 Deliberately out of scope

Considered during design and rejected as outside the assignment. Recorded here
so the decision can be defended rather than looking like an oversight.

- Bayesian Knowledge Tracing / a continuous mastery score with a separate
  confidence term. FR3.1 asks only for skills selected from a list.
- A spiral stage model. FR2.2 explicitly asks for a *hierarchical skill tree*.
- Mapping FPT specialisation combos to careers. The topic targets SE students
  generally, not one university.

One item moved **back into scope** after the data import: **checkpoints**.
roadmap.sh ships 14 checkpoint nodes ("Checkpoint - Simple CRUD Apps",
"Checkpoint - Complete App") and `skill_nodes.is_checkpoint` already exists in
the schema. It is imported data, not an invention, so it costs nothing to keep.

---

## 1. Verified current state

### 1.1 Present and usable

| Component | Location | Note |
|---|---|---|
| `Recruitment` | `domain/entity/Recruitment.java` | `recruitmentInfos` jsonb `{link,title,salary,location,experience}`, plus `postedDate`, `applicationDeadline` |
| Skill extraction from JDs | `services/impl/SkillExtractionServiceImpl.java` | Calls the AI service, groups by `(skill, postedDate)`, writes `SkillTrend` |
| `Skill` catalog | `domain/entity/Skill.java` | ~300 skills; **138 map to no roadmap node** |
| `SkillNode` | `domain/entity/SkillNode.java` | Has `skillGroup`, `nodeLevel`, `stage`, `selection`, `chooseCount`, `requiredProficiency`, `evidenceKeywords` |
| `StudentSkillEvidence` | `domain/entity/StudentSkillEvidence.java` | Already carries `confidence`, `sourceType`, `status`, `nodeId` |
| `CareerRequiredSkill` | `domain/entity/CareerRequiredSkill.java` | `career ↔ skill + importanceLevel` — reused as the target table |
| `GithubApiClient` | `clients/GithubApiClient.java` | Only 2 endpoints: repo metadata and contents |

### 1.2 Data that exists but is never read

| Data | Where | Problem |
|---|---|---|
| `Recruitment.postedDate` | Stored by the scraper | **No service reads it** — new and stale postings are indistinguishable |
| `recruitment_infos->>'experience'` | Parsed from ITviec | Read by `JobMarketTool` but **never used to filter salary** |
| `SkillNode.evidenceKeywords` | Seeded from CSV | **No logic reads it** |
| `SkillNode.requiredProficiency` | Seeded from CSV | Passes through DTOs only |
| `NodeType.stageUnlockKey` | Read at `RoadmapServiceImpl:672` | Seeded empty at `DatabaseSeeder:368` |

### 1.3 Measured data defects

```
roadmap_nodes.csv       739 valid nodes (758 lines; some broken by unescaped commas)
  0 links                10 nodes
  1 link                121 nodes   -> 131 nodes (18%) VIOLATE FR2.3
  >=2 links             608 nodes

Nodes per career:
  qa 149 · game-developer 143 · devops 143 · software-architect 115
  frontend 85 · backend 83 · full-stack 21 · data-science 0  <- BLANK PAGE

Backend: only 2 nodes match Java  ->  "Java", "JavaScript (Node.js)"
Catalog duplicates: CSS/CSS3, Go/Golang, ...
```

### 1.4 `findAllSalaries()` has no WHERE clause

```java
// repositories/RecruitmentRepository.java — current
@Query(value = "SELECT recruitment_infos->>'salary' FROM recruitments "
             + "WHERE recruitment_infos->>'salary' IS NOT NULL "
             + "AND recruitment_infos->>'salary' != ''", nativeQuery = true)
List<String> findAllSalaries();
```
A fresher therefore sees senior salaries. Fixed in Phase 3.

---

## 2. Target architecture

```
+- LAYER 1: SKILL GRAPH ------------------------------------+
|  skill_nodes (exists)  +  skill_edges (new)               |
|  Prerequisite edges: objective, fixed, human-approved     |
+-----------------------------------------------------------+
                          |
+- LAYER 2: TARGET -------+---------------------------------+
|  career_targets (new)                                     |
|  MARKET   <- computed from recruitments   (RQ2)           |
|  ACADEMIC <- curated foundations the market omits         |
+-----------------------------------------------------------+
                          |
+- LAYER 3: STATE --------+---------------------------------+
|  student_skills (exists) + proficiency (new column)       |
|  student_skill_evidence (exists)                          |
+-----------------------------------------------------------+
                          |
+- LAYER 4: ROUTE --------+---------------------------------+
|  Computed, not stored. Cached on a hash of the state.     |
|  route = topoSort(closure(target) - satisfied(state))     |
+-----------------------------------------------------------+
```

**Invariant.** Prerequisite edges are objective knowledge and never vary per
student. What is personalised is the *path across the graph*, never the graph.

### 2.1 Why PostgreSQL and not a graph database

Recorded as a design decision, since it is a predictable defence question.

The graph is roughly **1,200 published nodes and under 2,000 edges** — it fits
in memory, so a graph database buys no traversal advantage. Against that, the
graph has to join tightly against student progress, evidence and recruitment
data, all of which are relational; splitting it across two stores would replace
those joins with application-level merging and give up foreign keys and
transactions. It would also add a third database to a single VPS already
running Spring Boot, PostgreSQL with pgvector and FastAPI.

The one demanding query — the full prerequisite closure — is a recursive CTE,
and PostgreSQL 16's `CYCLE` clause handles cycle safety for free:

```sql
WITH RECURSIVE closure AS (
    SELECT node_id, 0 AS depth
    FROM   skill_nodes
    WHERE  node_id = ANY(:seedIds)

    UNION ALL

    SELECT e.from_node, c.depth + 1
    FROM   closure c
    JOIN   skill_edges e ON e.to_node = c.node_id
    WHERE  e.kind = 'PREREQUISITE'
      AND  e.approved_at IS NOT NULL
      AND  c.depth < 20
)
CYCLE node_id SET is_cycle USING path
SELECT DISTINCT node_id FROM closure WHERE NOT is_cycle;
```

Revisit if the graph passes ~100k edges, or if weighted shortest-path or
graph-neighbourhood recommendations become requirements. Neither is true today.

---

## 3. Content acquisition (done)

### 3.1 Licensing

roadmap.sh is **not** open source. Its license permits personal use only and
requires prior written consent for anything else. That consent has been
obtained; **keep it on file for the report appendix**, because both the
deployed site and the submitted project redistribute derived content.

### 3.2 How the import works

The data lives in two places since roadmap.sh restructured its repository:

| Part | Source |
|---|---|
| Content: title, summary, typed links | `nilbuild/developer-roadmap`, `roadmaps/{slug}/content/{title}@{nodeId}.md` |
| Structure: nodes, positions | `GET https://roadmap.sh/api/v1-official-roadmap/{slug}` |

They join on the `nodeId` after the `@` in the filename — 86 of 88 matched on
the java roadmap.

The repository no longer ships the tree, and the graph's 29 edges are drawing
connectors rather than a real DAG. **Hierarchy is therefore derived from
geometry.** Nearest-topic-by-distance fails badly (it put `Arrays` and `Loops`
under *Exception Handling*). The reliable signal is that a `section` node is a
rectangle and the `label` inside it names the group; bounding-box containment
cut the nodes needing human review from 39 to 13 on the java roadmap.

Scripts: `scripts/import_roadmapsh.py`, `scripts/make_review_sheet.py`.

### 3.3 Result

```
91 roadmaps imported -> 10,561 nodes  (2,312 MAIN / 8,249 BRANCH)
   backend 3,064 · data-science 1,178 · devops 1,174 · frontend 1,114
   software-architect 815 · mobile 657 · ... · full-stack 38

duplicate node_id : 0
needs parent review : 3,200 nodes across 1,728 groups
fewer than 2 links  : 3,106 nodes
missing summary     : 517 nodes
```

Backend went from 83 to 3,064 nodes; `data-science` is no longer empty.

### 3.4 Consequence: publication gating

Importing everything multiplied the FR2.3 debt from 131 to 3,106 nodes. Every
node is an FR2.3 obligation, so the pool cannot be exposed as-is.

```sql
ALTER TABLE skill_nodes ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';
-- DRAFT     : imported, unreviewed, never appears in a route
-- PUBLISHED : >=2 links, has a summary, parent confirmed -> visible
```

The route builder reads `PUBLISHED` only. The pool stays large — which makes
the extensibility claim real rather than aspirational — while what students see
stays compliant.

Crucially, **`career_targets` decides what to review**: only nodes the market
actually asks for ever reach a route. Java/backend postings in Vietnam touch
perhaps 150–250 nodes, not 8,249. That is also a point in favour of RQ2 — the
market does not merely order the roadmap, it decides which part of the
knowledge base is worth editing first.

### 3.5 Open decisions from the import

1. **Eight new career ids appeared** — `mobile` 657, `product` 580, `ai` 540,
   `cyber-security` 316, `design` 213, `shared` 168, `blockchain` 129,
   `other` 122. Create them, or keep everything `DRAFT` and leave them out?
2. **`full-stack` has only 38 nodes.** roadmap.sh treats full-stack as an
   opinionated 20-step curriculum with 13 project checkpoints, not a skill tree.
   In the pooled model it should be `frontend ∪ backend` for knowledge, with the
   full-stack roadmap contributing *sequence* and *checkpoints*.
3. **`shared` (git-github)** applies to every career and is the natural first
   case for dropping `career_id`.

---

## Phase 0 — Compliance fixes (1–2 days, first)

Cheapest work available, and it closes defects a reviewer can count by opening
the CSV.

### 0.1 Fill the missing links (FR2.3)

For each node under two links, source in priority order: the matching
roadmap.sh node, official documentation, then MDN / freeCodeCamp. **A human
approves every link** — never let a model generate URLs, they hallucinate 404s.

Regression guard:

```java
// src/test/java/.../RoadmapDataComplianceTest.java
@Test
void everyPublishedNodeHasAtLeastTwoResourceLinks() {
    List<SkillNode> nodes = skillNodeRepository.findByStatus(PUBLISHED);
    List<String> violations = nodes.stream()
            .filter(n -> countLinks(n.getResource()) < 2)
            .map(SkillNode::getNodeName)
            .toList();
    assertThat(violations)
        .as("FR2.3: every published node needs >=2 resource links")
        .isEmpty();
}
```

Scoping the test to `PUBLISHED` is what makes the large pool tractable.

### 0.2 Repair the broken CSV rows

Unquoted commas inside descriptions spill into `career_id`, producing values
like `" e.g."` and `" such as Java"`.

```python
# scripts/fix_csv_quoting.py
import csv, io
rows = list(csv.DictReader(io.open('roadmap_nodes.csv', encoding='utf-8')))
VALID = {'frontend','backend','full-stack','data-science',
         'devops','game-developer','qa','software-architect'}
bad = [r for r in rows if r['career_id'] not in VALID]
# export for manual repair, then rewrite with csv.writer(quoting=csv.QUOTE_ALL)
```

### 0.3 Merge duplicate catalog skills

```sql
-- e.g. CSS3 -> CSS, Golang -> Go, after a manual pass over the 300 entries
UPDATE skill_trends  SET skill_id = :canonicalId WHERE skill_id = :duplicateId;
UPDATE student_skills SET skill_id = :canonicalId WHERE skill_id = :duplicateId;
DELETE FROM skills WHERE skill_id = :duplicateId;
```

---

## Phase 1 — Skill vocabulary normalisation (2–3 days)

Mandatory before Phase 3: if `Spring Boot` / `SpringBoot` / `spring` count as
three skills, every frequency figure is wrong.

### 1.1 Alias table

```sql
CREATE TABLE skill_aliases (
    alias_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id   UUID NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    alias      VARCHAR(120) NOT NULL,
    source     VARCHAR(20) NOT NULL DEFAULT 'CURATED',  -- CURATED|LIGHTCAST|AI
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_skill_aliases_norm ON skill_aliases (lower(alias));
```

### 1.2 Canonicalisation

```java
public String canonicalize(String raw) {
    if (raw == null) return "";
    return Normalizer.normalize(raw, Normalizer.Form.NFD)
                     .replaceAll("\\p{M}", "")        // strip diacritics
                     .toLowerCase(Locale.ROOT)
                     .replaceAll("[^a-z0-9+#]", "");  // keep + and # for C++/C#
}
// "Spring Boot" -> "springboot"
// "SpringBoot"  -> "springboot"   match
// "C#"          -> "c#"           preserved
// "Node.js"     -> "nodejs"
```

Resolution order:

```
1. exact skills.skill_name (case-insensitive)
2. canonicalize(skill_name)
3. canonicalize(skill_aliases.alias)
4. no match -> skill_unresolved for admin triage (do NOT mint a new skill)
```

> **Behaviour change.** `SkillExtractionServiceImpl:135` currently calls
> `save()` on every unmatched name — that is how 138 orphan skills appeared.
> Replace it with the queue below.

```sql
CREATE TABLE skill_unresolved (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_name    VARCHAR(200) NOT NULL,
    occurrences INT NOT NULL DEFAULT 1,
    first_seen  TIMESTAMP NOT NULL DEFAULT now(),
    last_seen   TIMESTAMP NOT NULL DEFAULT now(),
    resolved_to UUID REFERENCES skills(skill_id),
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING'  -- PENDING|MAPPED|IGNORED
);
CREATE UNIQUE INDEX ux_skill_unresolved_raw ON skill_unresolved (lower(raw_name));
```

### 1.3 Seed aliases

Use **Lightcast Open Skills** (32k skills mined from real postings, free) as an
alias dictionary — not as a replacement catalog. Generate a candidate CSV from
its alternative-names field and have a human approve before import.

---

## Phase 2 — Classify postings by role and level (3–4 days)

The missing dimension that stops `SkillExtractionServiceImpl` from serving RQ2.

### 2.1 Schema

```sql
ALTER TABLE recruitments
    ADD COLUMN career_id     UUID REFERENCES career_roles(career_id),
    ADD COLUMN seniority     VARCHAR(20),   -- FRESHER|JUNIOR|MID|SENIOR|UNKNOWN
    ADD COLUMN location_norm VARCHAR(60),   -- HANOI|DANANG|HCMC|REMOTE|OTHER
    ADD COLUMN dedup_key     VARCHAR(300),
    ADD COLUMN classified_at TIMESTAMP;

CREATE INDEX ix_recruit_class
    ON recruitments (career_id, seniority, location_norm, posted_date);
CREATE INDEX ix_recruit_dedup ON recruitments (dedup_key, posted_date DESC);
```

### 2.2 Seniority

Source: `recruitment_infos->>'experience'`, parsed by `itviec_parser.py:206`
from schema.org `experienceRequirements`. Real values look like `"1 năm"`,
`"2-3 years"`, `"Không yêu cầu kinh nghiệm"`, `"Fresher"`, `"5+ years"`.

```java
private static final Pattern YEARS = Pattern.compile("(\\d+)\\s*[-–+]?\\s*(\\d+)?");

public Seniority seniorityOf(String experienceRaw, String titleRaw) {
    String s = experienceRaw == null ? "" : experienceRaw.toLowerCase(Locale.ROOT);
    String combined = s + " " + (titleRaw == null ? "" : titleRaw.toLowerCase(Locale.ROOT));

    if (combined.contains("intern") || combined.contains("thực tập")) return Seniority.FRESHER;
    if (combined.contains("fresher") || combined.contains("không yêu cầu")
        || combined.contains("no experience"))                        return Seniority.FRESHER;
    if (combined.contains("senior") || combined.contains("lead")
        || combined.contains("principal") || combined.contains("architect"))
                                                                      return Seniority.SENIOR;
    if (combined.contains("junior"))                                  return Seniority.JUNIOR;

    Matcher m = YEARS.matcher(s);
    if (m.find()) {
        int lo = Integer.parseInt(m.group(1));
        int hi = m.group(2) != null ? Integer.parseInt(m.group(2)) : lo;
        double avg = (lo + hi) / 2.0;
        if (avg < 1) return Seniority.FRESHER;
        if (avg < 3) return Seniority.JUNIOR;
        if (avg < 5) return Seniority.MID;
        return Seniority.SENIOR;
    }
    return Seniority.UNKNOWN;
}
```

Title deliberately outranks the experience field: a posting titled *Senior Java
Developer* with `experience: 3 years` is still a senior role.

### 2.3 Career

Weighted keyword rules rather than an LLM, so the classification is
reproducible and explainable in the report.

```sql
CREATE TABLE career_title_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_id  UUID NOT NULL REFERENCES career_roles(career_id),
    keyword    VARCHAR(80) NOT NULL,
    weight     NUMERIC(3,2) NOT NULL DEFAULT 1.00
);
```

```java
public Optional<UUID> careerOf(String title) {
    String t = canonicalizeTitle(title);
    Map<UUID, Double> score = new HashMap<>();
    for (CareerTitlePattern p : patterns) {
        if (t.contains(p.getKeyword())) {
            score.merge(p.getCareerId(), p.getWeight().doubleValue(), Double::sum);
        }
    }
    // Winner must score >= 0.8 AND beat the runner-up by >= 0.3, so vague
    // titles ("Software Engineer") stay NULL instead of being guessed.
    return topScoreIfClear(score, 0.8, 0.3);
}
```

### 2.4 Deduplication

The primary key is the source's id, so a re-posted job appears twice.

```java
// dedup_key = canon(company) + "|" + canon(title) + "|" + location_norm
```

Statistics then use `SELECT DISTINCT ON (dedup_key) ... ORDER BY dedup_key,
posted_date DESC`, counting each job once at its latest posting.

### 2.5 Genuinely new postings

```sql
SELECT r.* FROM recruitments r
WHERE r.posted_date >= CURRENT_DATE - INTERVAL '7 days'
  AND NOT EXISTS (
      SELECT 1 FROM recruitments p
      WHERE p.dedup_key = r.dedup_key
        AND p.posted_date < r.posted_date
  );
```

This is what makes a "New" badge honest rather than decorative.

### 2.6 Scheduler

```java
@Scheduled(cron = "0 30 2 * * *")   // 02:30 daily, after the scrape job
public void classifyNewRecruitments() { ... }
```

---

## Phase 3 — `career_targets`: targets from the market (4–5 days) — RQ2

The core of RQ2 and the single biggest differentiator from roadmap.sh.

### 3.1 Schema

```sql
CREATE TABLE career_targets (
    target_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_id     UUID NOT NULL REFERENCES career_roles(career_id),
    seniority     VARCHAR(20) NOT NULL,
    location_norm VARCHAR(60) NOT NULL DEFAULT 'ALL',
    skill_id      UUID NOT NULL REFERENCES skills(skill_id),
    node_id       UUID REFERENCES skill_nodes(node_id),  -- null if no node yet
    frequency     NUMERIC(5,4) NOT NULL,                 -- 0.0000..1.0000
    job_count     INT NOT NULL,                          -- postings mentioning it
    sample_size   INT NOT NULL,                          -- postings in the group
    importance    VARCHAR(20) NOT NULL,                  -- REQUIRED|PREFERRED|OPTIONAL
    source        VARCHAR(20) NOT NULL,                  -- MARKET|ACADEMIC
    window_days   INT NOT NULL DEFAULT 90,
    computed_at   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ux_career_targets
    ON career_targets (career_id, seniority, location_norm, skill_id, source);
CREATE INDEX ix_career_targets_lookup
    ON career_targets (career_id, seniority, location_norm, importance);
```

### 3.2 Formula

```
For group G = (career, seniority, location) over window W = 90 days:

  J(G) = deduplicated postings with career_id = career, seniority = seniority,
         matching location_norm, posted_date >= today - W
  N    = |J(G)|                                        -> sample_size
  n(s) = postings in J(G) mentioning normalised skill s -> job_count

  frequency(s) = n(s) / N

  importance(s) = REQUIRED   if frequency >= 0.50
                  PREFERRED  if 0.20 <= frequency < 0.50
                  OPTIONAL   if 0.08 <= frequency < 0.20
                  (dropped)  if frequency < 0.08
```

**Minimum sample size — mandatory:**

```
If N < 30, do not compute. Widen in this order:
    1. location  -> 'ALL'
    2. seniority -> adjacent band (FRESHER<->JUNIOR, MID<->SENIOR)
    3. window    -> 90 to 180 days
Still < 30 -> emit nothing; the UI says "not enough market data".
```

Without this, `frontend + SENIOR + CANTHO` might rest on three postings and
report 33% as if it meant something. An RBL panel will ask about exactly this.

### 3.3 Service sketch

```java
@Transactional
public CareerTargetRebuildResult rebuildAll(int windowDays) {
    LocalDate from = LocalDate.now().minusDays(windowDays);
    List<CareerTarget> out = new ArrayList<>();

    for (CareerRole career : careerRoleRepository.findAll()) {
        for (Seniority sen : EnumSet.complementOf(EnumSet.of(Seniority.UNKNOWN))) {
            for (String loc : LOCATIONS) {
                List<Recruitment> jobs = recruitmentRepository
                        .findDeduplicatedFor(career.getCareerId(), sen, loc, from);
                if (jobs.size() < MIN_SAMPLE) continue;      // MIN_SAMPLE = 30

                Map<UUID, Integer> counts = new HashMap<>();
                for (Recruitment r : jobs) {
                    // The DISTINCT skills of one posting: a job naming "Java"
                    // five times still counts once, otherwise this measures
                    // term frequency rather than posting frequency and no
                    // longer answers FR4.2.
                    Set<UUID> inThisJob = extractSkillIds(r);
                    for (UUID sid : inThisJob) counts.merge(sid, 1, Integer::sum);
                }

                int n = jobs.size();
                for (var e : counts.entrySet()) {
                    double freq = (double) e.getValue() / n;
                    if (freq < 0.08) continue;
                    out.add(/* ... */);
                }
            }
        }
    }
    careerTargetRepository.deleteBySource("MARKET");   // never touch ACADEMIC
    careerTargetRepository.saveAll(out);
    return new CareerTargetRebuildResult(out.size(), /* skipped */ 0);
}
```

### 3.4 The ACADEMIC layer

The market does not advertise "Data Structures and Algorithms", but omitting it
produces a bad engineer. This layer is curated by mentors and admins:

```
source = 'ACADEMIC', frequency = 1.0000, importance = REQUIRED
sample_size = 0, job_count = 0        -- signals "not derived from data"
```

Resolution takes the **union**; where both layers name a node, the higher
importance wins.

### 3.5 Scheduler

```java
@Scheduled(cron = "0 0 3 * * SUN")   // weekly is enough; the market is not daily
public void rebuildTargets() { careerTargetService.rebuildAll(90); }
```

### 3.6 Filter salaries by level

```java
@Query(value = """
    SELECT recruitment_infos->>'salary'
    FROM recruitments
    WHERE recruitment_infos->>'salary' IS NOT NULL
      AND recruitment_infos->>'salary' != ''
      AND (:careerId  IS NULL OR career_id = :careerId)
      AND (:seniority IS NULL OR seniority = :seniority)
      AND posted_date >= :from
    """, nativeQuery = true)
List<String> findSalariesFor(@Param("careerId") UUID careerId,
                             @Param("seniority") String seniority,
                             @Param("from") LocalDate from);
```

### 3.7 Endpoints

```
GET /api/market/targets?careerId={}&seniority={}&location={}
GET /api/market/new-jobs?days=7&careerId={}
```

---

## Phase 4 — Proficiency on student skills (2–3 days) — FR3.1

> **Depends on Phase 3.** The denominator for the seniority label comes from
> `career_targets`, so this cannot run in parallel with it.

FR3.1 mandates manual skill selection, so **the selection screen stays**. What
it lacks is a level.

### 4.1 Schema

```sql
ALTER TABLE student_skills
    ADD COLUMN proficiency   SMALLINT,       -- 1..4
    ADD COLUMN self_declared BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN verified_by   VARCHAR(30),    -- TRANSCRIPT|GITHUB|MENTOR|null
    ADD COLUMN updated_at    TIMESTAMP NOT NULL DEFAULT now();
```

```java
public enum ProficiencyLevel {
    AWARE(1),        // read about it, never used it
    PRACTICED(2),    // followed a tutorial
    APPLIED(3),      // used it in my own project
    PROFESSIONAL(4); // used it in something real users touched
}
```

Behaviourally anchored options, not a bare 1–5 scale — a concrete description
is far harder to inflate than a number.

### 4.2 Objective sources override self-declaration

```
transcript grade >= 8.0            -> APPLIED,    verified_by = TRANSCRIPT
transcript grade 6.5-7.9           -> PRACTICED,  verified_by = TRANSCRIPT
technology confirmed in a repo     -> APPLIED,    verified_by = GITHUB
mentor confirms in feedback        -> mentor's choice, verified_by = MENTOR
```

Objective always beats self-declared; among objective sources the highest wins.

### 4.3 Onboarding and the displayed seniority

The skill list at signup is drawn **from `career_targets`** — roughly 15–20
skills the market actually asks for, not all 300. That keeps the form short and
makes coverage meaningful.

```
R        = number of REQUIRED targets for (career, JUNIOR, location)
verified = |{ t in REQUIRED : proficiency(t) >= 3 AND verified_by IS NOT NULL }|
declared = |{ t in REQUIRED : proficiency(t) >= 3 AND verified_by IS NULL }|

ratioAll      = (verified + declared) / R
ratioVerified = verified / R

raw band by ratioAll:  >= 0.80 MID · >= 0.50 JUNIOR · else FRESHER
CEILING: if ratioVerified < 0.30, cap at JUNIOR
```

**Self-declaration alone can never exceed JUNIOR.** A student who has connected
nothing therefore starts at FRESHER or JUNIOR, which is realistic and needs no
special-casing for new accounts. It also gives a concrete reason to connect
GitHub and upload a transcript, which is what makes FR1.3 and FR5.1 used in
practice rather than merely present.

`JUNIOR` is always the denominator, whatever the student's own level, so that
readiness is comparable across students — otherwise the counselor dashboard
compares numbers computed against different baselines.

**Students cannot edit this label.** It is a function over their skill rows, not
a stored field; raising it means adding evidence. Mentors can override, with an
audit trail.

Edge cases:

| Situation | Behaviour |
|---|---|
| Skips the skill step | FRESHER, full roadmap |
| Career has no targets (low sample, or data-science) | Fall back to `CareerRequiredSkill`; still empty -> FRESHER plus a "not enough market data" notice |
| Phase 3 not yet shipped | Use existing `CareerRequiredSkill` rows as the denominator |
| Marks PROFESSIONAL on everything | `ratioAll = 1.0` but `ratioVerified = 0` -> capped at JUNIOR |

---

## Phase 5 — Gap analysis and PDF export (3–4 days) — FR3.2, FR3.3

### 5.1 Formula

```
For each target t:
    p    = current proficiency of t.skill (0 if absent)
    pReq = REQUIRED -> 3 (APPLIED) · PREFERRED -> 2 · OPTIONAL -> 1
    gap(t)     = max(0, pReq - p)
    urgency(t) = frequency(t) * gap(t) * w(importance)
                 w: REQUIRED 1.0 · PREFERRED 0.6 · OPTIONAL 0.3

readiness = sum(min(p, pReq)) / sum(pReq)      in [0,1]
```

All three factors matter: how much the market wants it, how far away it is, and
how mandatory it is. A skill in 90% of postings that the student already has
scores zero urgency, which is correct.

### 5.2 Response

```java
public record SkillGapResponse(
        UUID careerId, String careerName, Seniority targetSeniority, String location,
        int sampleSize,            // transparency: how many postings back this
        double readiness,
        List<GapItem> missing,     // gap > 0, ordered by urgency desc
        List<GapItem> satisfied,
        LocalDateTime computedAt
) {
    public record GapItem(
            UUID skillId, String skillName, UUID nodeId,
            double frequency, int jobCount,
            ImportanceLevel importance, String source,   // MARKET|ACADEMIC
            int currentProficiency, int requiredProficiency,
            double urgency
    ) {}
}
```

### 5.3 Endpoints

```
GET /api/students/me/skill-gap?careerId={}&location={}
GET /api/students/me/skill-gap/export?careerId={}&format=pdf     (FR3.3)
```

### 5.4 PDF

Use **Flying Saucer** (`flying-saucer-pdf-openpdf`): render a Thymeleaf
template to XHTML and print it. Easier to style and maintain than drawing with
the iText API directly.

```
SKILL GAP ANALYSIS
Nguyen Van A · Backend Developer · Junior
Da Nang · based on 214 postings over 90 days
---------------------------------------------
READINESS: 62%     ############------------
---------------------------------------------
MISSING SKILLS - by priority
  1. Spring Data JPA   71% of postings · Required
  2. Docker            61% of postings · Required
  3. Unit Testing      54% of postings · Required
  4. Kafka             23% of postings · Preferred
---------------------------------------------
ALREADY COVERED
  Java · SQL · Git · REST API
```

**Embed a Unicode font** (DejaVuSans or Roboto) or Vietnamese diacritics will
be dropped.

---

## Phase 6 — Market-prioritised routes (4–5 days) — FR2.2

FR2.2 asks for a hierarchical tree in a *prioritised learning sequence*. The
tree exists; the priority does not.

### 6.1 Edges

```sql
CREATE TABLE skill_edges (
    edge_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_node   UUID NOT NULL REFERENCES skill_nodes(node_id) ON DELETE CASCADE,
    to_node     UUID NOT NULL REFERENCES skill_nodes(node_id) ON DELETE CASCADE,
    kind        VARCHAR(20) NOT NULL,   -- PREREQUISITE|RELATED
    source      VARCHAR(20) NOT NULL,   -- MIGRATED|CURATED|AI_PROPOSED
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(user_id),
    CONSTRAINT ck_no_self_edge CHECK (from_node <> to_node)
);
CREATE UNIQUE INDEX ux_skill_edges ON skill_edges (from_node, to_node, kind);
CREATE INDEX ix_skill_edges_to
    ON skill_edges (to_node, kind) WHERE approved_at IS NOT NULL;
```

Migrate the existing implicit edges:

```sql
INSERT INTO skill_edges (from_node, to_node, kind, source, approved_at)
SELECT previous_node, node_id, 'PREREQUISITE', 'MIGRATED', now()
FROM skill_nodes WHERE previous_node IS NOT NULL;

INSERT INTO skill_edges (from_node, to_node, kind, source, approved_at)
SELECT parent_node, node_id, 'PREREQUISITE', 'MIGRATED', now()
FROM skill_nodes WHERE parent_node IS NOT NULL
ON CONFLICT DO NOTHING;
```

Only `approved_at IS NOT NULL` edges take part in routing.

**Review at group level, not node level.** Ordering does not need an edge
between every leaf — it needs to know that *Basics of OOP* precedes
*Collections*. Order inside a group falls out of `node_level` and market
frequency. That is what makes 1,728 groups tractable where 8,249 nodes are not.

### 6.2 Algorithm

```
compute(student, career, location):

 1. targets  <- careerTargetService.resolve(career, displaySeniority, location)
 2. seed     <- { t.nodeId : t in targets, t.nodeId != null, status = PUBLISHED }
 3. closure  <- seed + all ancestors over approved PREREQUISITE edges
 4. per node: COLLAPSED if p >= pReq · ACTIVE if reachable · LOCKED otherwise
 5. order    <- topologicalSort(closure)
        tie-break: importance (REQUIRED first), then frequency desc,
                   then nodeLevel asc
 6. return the order plus a reason string per node
```

```java
Comparator<NodeInRoute> PRIORITY = Comparator
        .comparing((NodeInRoute n) -> n.importance().ordinal())
        .thenComparing(NodeInRoute::frequency, Comparator.reverseOrder())
        .thenComparing(n -> n.nodeLevel() == null ? 99 : n.nodeLevel());
```

### 6.3 Cycles

Reject at approval time, not at routing time:

```java
public boolean wouldCreateCycle(UUID from, UUID to) {
    return pathExists(to, from);
}
```

```java
@Test void skillGraphHasNoCycles() {
    assertThat(detectCycles(allApprovedEdges())).isEmpty();
}
```

### 6.4 Cache

Key on `studentId + careerId + location + max(student_skills.updated_at) +
targets.computed_at`; TTL one hour, invalidated when skills change.

### 6.5 Endpoint

```
GET /api/students/me/roadmap/route?careerId={}&location={}
```

`reason` renders directly on the node and is the visible payoff of the whole
design:

```
"61% of Backend Junior postings in Da Nang require this"
"Foundation - required by the academic curriculum"
"Already covered: confirmed from repository intelipath-backend"
```

---

## Phase 7 — Coding patterns (5–6 days) — RQ1

### 7.1 Extend `GithubApiClient`

```java
List<ContributorStats> getContributorStats(String owner, String repo, String token);
List<CommitSummary>    listCommitsByAuthor(String owner, String repo, String author,
                                           int limit, String token);
CommitDetail           getCommitDetail(String owner, String repo, String sha, String token);
```

```
GET /repos/{owner}/{repo}/stats/contributors
GET /repos/{owner}/{repo}/commits?author={login}&per_page={n}
GET /repos/{owner}/{repo}/commits/{sha}
```

`/stats/contributors` returns **202 Accepted** while GitHub computes the
statistics — retry after a short delay.

### 7.2 Contribution share

```
linesOf(author)   = sum over weeks (additions + deletions)
contributionRatio = linesOf(student) / sum over all authors
coreRatio         = |files under src|,lib|,app| / |files touched|
```

Lines beat commit counts: 200 README commits are not 5 commits that built the
architecture, and this costs one API call.

### 7.3 AI reading diffs

Sample at most 15 commits, preferring those touching the most source files;
truncate each patch to 4,000 characters.

The prompt **requires citations** — this is what stops the model inventing
findings:

```
You are given diffs written by a student.
For each skill listed below answer PASS or FAIL.
REQUIRED: every PASS must cite evidence as "filename:line".
No citation means FAIL. Do not speculate.
```

```json
{ "skills": [
   { "skill": "Transactions", "verdict": "PASS",
     "evidence": "OrderService.java:52 uses @Transactional with rollbackFor" },
   { "skill": "Testing", "verdict": "FAIL", "evidence": null }
]}
```

### 7.4 Feed the existing evidence pipeline

`StudentSkillEvidence` already has `confidence`, `sourceUrl`, `evidenceText`
and `status`. No new table:

```java
skillEvidenceService.recordEvidence(
    userId, matchedSkills, EvidenceType.GITHUB_PROJECT, repoId);
// status = PENDING -> student or mentor accepts before proficiency moves
```

### 7.5 Cost control

Cache by commit SHA (never re-analyse the same SHA), cap at 15 commits per
repo, and run only on explicit user action — never on a schedule.

### 7.6 Mentors and private repositories

Mentors read the **stored analysis**, not the source. Private repositories
become reviewable without disclosing code.

```sql
ALTER TABLE portfolio_review_requests
    ADD COLUMN project_id     UUID REFERENCES portfolio_projects(project_id),
    ADD COLUMN analysis_json  JSONB,
    ADD COLUMN mentor_comment TEXT,
    ADD COLUMN verdict        VARCHAR(20);   -- APPROVED|NEEDS_WORK|REJECTED
```

---

## Phase 8 — Level-aware mentor (1 day) — FR1.3

Cheapest item in the plan with the most visible effect. Ship it early.

### 8.1 Inject context

Add to `src/main/resources/prompts/virtual-mentor-system.st`:

```
## Current learner profile
Target role : {careerName}
Level       : {seniority}   (readiness {readiness}%)
Known skills: {topSkillsWithProficiency}
Studying    : {activeNodeNames}
Missing     : {top5MissingSkills}

Pitch answers at this level. Do not re-explain anything already at APPLIED or
above. Do not jump to advanced topics while required skills are still missing —
connect back to them instead.
```

### 8.2 Transcript ingestion (FR1.3)

The PDF-to-markdown-to-vector pipeline already exists in
`DocumentIngestionServiceImpl`; it only lacks an entry point.

```
POST /api/students/me/transcript   multipart/form-data
  -> PdfToMarkdownService.convertToMarkdown()
  -> AI extracts { subjectCode, subjectName, grade }
  -> map subject -> skills via subject_skill_map
  -> update student_skills.proficiency, verified_by = TRANSCRIPT
  -> ingest into the vector store with scope = USER
```

```sql
CREATE TABLE subject_skill_map (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code VARCHAR(20) NOT NULL,
    skill_id     UUID NOT NULL REFERENCES skills(skill_id),
    weight       NUMERIC(3,2) NOT NULL DEFAULT 1.00
);
```

---

## 9. Testing

### 9.1 Assignment-compliance tests (run in CI)

```java
@Test void fr23_everyPublishedNodeHasTwoLinks()
@Test void everyCareerHasAtLeastOnePublishedNode()   // catches data-science
@Test void skillGraphHasNoCycles()
@Test void everyCsvRowHasValidCareerId()             // catches broken rows
```

### 9.2 Algorithm tests

```java
@Test void seniorityOf_parsesVietnameseAndEnglish() {
    assertThat(c.seniorityOf("Không yêu cầu kinh nghiệm", "Backend Dev")).isEqualTo(FRESHER);
    assertThat(c.seniorityOf("3 years", "Senior Java Developer")).isEqualTo(SENIOR);
    assertThat(c.seniorityOf("1-2 năm", "Java Developer")).isEqualTo(JUNIOR);
}

@Test void careerTargets_skipsGroupsBelowMinSample()   // N = 29 -> no rows
@Test void careerTargets_countsEachJobOnce()           // Java x5 in one post -> 1
@Test void gapUrgency_isZeroWhenAlreadyProficient()
@Test void route_placesPrerequisitesBeforeDependents()
@Test void seniority_cappedAtJuniorWithoutVerifiedEvidence()
```

### 9.3 RQ2 validation — required for the RBL grade

RQ2 asks *how effective*, which needs a number, not a description:

```
Hold out 20 random postings excluded from target computation.
For each, compare the skills it requires against the generated target:
    precision = |target ∩ posting| / |target|
    recall    = |target ∩ posting| / |posting|
Report the mean precision and recall.
```

Without this table RQ2 is a feature description rather than research.

---

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Thin sample for a narrow group | Meaningless percentages | `MIN_SAMPLE = 30` plus ordered widening |
| Poor skill normalisation | Every percentage wrong | Phase 1 precedes Phase 3; unresolved names queue for triage |
| Career misclassification | Targets attached to the wrong role | Explicit thresholds; ambiguous titles stay NULL |
| Malformed AI JSON | Broken flow | Validate and fall back; signup must never fail because of the model |
| GitHub rate limits | Commit analysis fails | Cache by SHA, cap at 15 commits, run on demand only |
| Token cost of diff review | Budget overrun | 4,000-character patch cap, on-demand only |
| Cycles in the graph | Topological sort hangs | Reject at approval time plus an invariant test |
| Missing PDF font | Vietnamese text mangled | Embed DejaVuSans/Roboto |
| Large DRAFT pool leaking into routes | FR2.3 violations reach users | Route builder filters on `status = PUBLISHED` |

---

## 11. Sequence and estimates

```
Phase 0  Compliance fixes (links, CSV, empty career)   1-2 days   <- FIRST
Phase 8  Level-aware mentor                            1 day      <- cheap, demos well
Phase 1  Skill vocabulary normalisation                2-3 days
Phase 2  Classify postings (career/level/dedup)        3-4 days
Phase 3  career_targets — core of RQ2                  4-5 days   *
Phase 4  Proficiency on student skills                 2-3 days
Phase 5  Gap analysis + PDF                            3-4 days
Phase 6  Market-prioritised routes                     4-5 days
Phase 7  Coding patterns — core of RQ1                 5-6 days   *
                                                       ---------
                                                       25-33 days
```

**Hard dependencies:** `1 -> 2 -> 3 -> 4 -> {5, 6}`. Phases 0 and 8 are
independent and can run alongside anything.

**If the schedule slips:** keep 0, 1, 2, 3, 5, 8. Dropping 6 and 7 loses RQ1 but
preserves RQ2 and the functional requirements.

**If only one thing survives:** Phase 3. It is RQ2, it is the only real
differentiator from roadmap.sh, and everything else builds on it.
