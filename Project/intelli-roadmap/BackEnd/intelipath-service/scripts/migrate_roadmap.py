"""
Migrate the old roadmap.sh seed CSVs to the new, richer schema.

Old (3 files, messy):
    RoadmapDataTemplate.csv   - flat node rows, tree encoded by name refs
    SkillDataTemplate.csv     - separate skill catalog (inconsistent categories)
    CareerDataTemplate.csv    - careers

New (in ./v2/):
    careers.csv        - career_id, name, prerequisites, description
    roadmap_nodes.csv  - the tree + selection semantics + visual hints
    skills.csv         - skill catalog DERIVED from nodes (single source of truth)

What the new schema adds
    selection / choose_count : a parent that is "pick one of these" (e.g. a language,
                               a database, a framework) -> CHOOSE_ONE. Everything else
                               is ALL (learn them all). This is what stops a Java
                               student being forced to also learn C#.
    node_kind                : CORE | ALTERNATIVE | OPTIONAL  -> drives colour/shape
    axis                     : MAIN (on the spine) | BRANCH (rendered off to the side)
    is_optional / is_checkpoint : dashed "nice to have" nodes / milestone gates
    stable node_id + parent_id/previous_id : id refs instead of fragile name refs

`evidence_keywords` + `completion_policy=EVIDENCE_ALLOWED` are kept as-is: they are
how an input/assessed skill auto-completes a node (the "smart" roadmap).

One-off data tool (not backend runtime). Reads/writes the backend's data folder.
Run:  python intelipath-service/scripts/migrate_roadmap.py
"""
import csv
import os
import pathlib
import re
from collections import defaultdict

# CSVs live in the Java backend's data folder; this tool only reads/writes there.
DATA_DIR = pathlib.Path(__file__).resolve().parents[2] / "intelipath-backend" / "data"
SRC_ROADMAP = str(DATA_DIR / "RoadmapDataTemplate.csv")
SRC_SKILL = str(DATA_DIR / "SkillDataTemplate.csv")
SRC_CAREER = str(DATA_DIR / "CareerDataTemplate.csv")
OUT_DIR = str(DATA_DIR / "v2")

# Parents whose children are ALTERNATIVES (pick one), not all-required.
# Curated from the current data; any parent named "Pick ..." is auto-included.
CHOICE_ONE_PARENTS = {
    # Backend
    "Pick a Language", "Pick a Database", "Web Servers", "Password Hashing",
    "Event-Driven Architecture", "Caching",
    # Frontend
    "Pick a Framework", "Package Managers", "Build Tools", "Cross-Platform Apps",
    "Server-Side Rendering", "Static Site Generation", "Writing CSS", "GraphQL",
}


def slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return s or "x"


def read_csv(path: str) -> list[dict]:
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def is_choice_parent(name: str) -> bool:
    n = (name or "").strip()
    return n in CHOICE_ONE_PARENTS or n.lower().startswith("pick ")


def importance_from_weight(weight: str) -> str:
    try:
        w = int(float(weight))
    except (ValueError, TypeError):
        return "AVG"
    return "HIGH" if w >= 3 else "AVG" if w == 2 else "LOW"


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    roadmap = read_csv(SRC_ROADMAP)
    careers_src = read_csv(SRC_CAREER)

    # --- careers.csv -------------------------------------------------------
    careers = []
    for c in careers_src:
        careers.append(
            {
                "career_id": slug(c.get("Career", "")),
                "name": c.get("Career", "").strip(),
                "prerequisites": (c.get("Prerequisite", "") or "").strip(),
                "description": (c.get("Description", "") or "").strip(),
            }
        )

    # --- assign stable node ids + resolve name refs per career -------------
    # (career, name) -> node_id ; warn on collisions
    id_by_name: dict[tuple[str, str], str] = {}
    used_ids: set[str] = set()
    for r in roadmap:
        career = r["Roadmap"].strip()
        name = (r["NodeName"] or r["Skill"] or "").strip()
        key = (career, name)
        if key in id_by_name:
            print(f"WARN duplicate node name in {career!r}: {name!r} (refs may be ambiguous)")
            continue
        nid = f"{slug(career)}-{slug(name)}"
        base, i = nid, 2
        while nid in used_ids:
            nid = f"{base}-{i}"
            i += 1
        used_ids.add(nid)
        id_by_name[key] = nid

    def ref(career: str, name: str) -> str:
        name = (name or "").strip()
        if not name:
            return ""
        nid = id_by_name.get((career, name))
        if nid is None and name:
            print(f"WARN {career!r}: ref to unknown node {name!r}")
        return nid or ""

    # count children per (career, parent-name) so "choose one" only applies to a
    # node that actually has options.
    child_count: dict[tuple[str, str], int] = defaultdict(int)
    for r in roadmap:
        p = (r["ParentNode"] or "").strip()
        if p:
            child_count[(r["Roadmap"].strip(), p)] += 1

    def is_choice_group(career: str, name: str) -> bool:
        return is_choice_parent(name) and child_count.get((career, name), 0) >= 2

    # which parents are choice-one -> tag on the parent node
    choice_report = defaultdict(list)

    nodes_out = []
    for r in roadmap:
        career = r["Roadmap"].strip()
        name = (r["NodeName"] or r["Skill"] or "").strip()
        parent_name = (r["ParentNode"] or "").strip()

        parent_is_choice = is_choice_group(career, parent_name)
        this_is_choice = is_choice_group(career, name)
        if this_is_choice:
            choice_report[career].append(name)

        node_kind = "ALTERNATIVE" if parent_is_choice else "CORE"
        axis = "MAIN" if not parent_name else "BRANCH"
        selection = "CHOOSE_ONE" if this_is_choice else "ALL"
        choose_count = "1" if this_is_choice else ""

        nodes_out.append(
            {
                "node_id": ref(career, name),
                "career_id": slug(career),
                "skill_group": (r["Skill"] or "").strip(),
                "name": name,
                "node_level": (r["NodeLevel"] or "").strip(),
                "stage": (r["Stage"] or "").strip(),
                "axis": axis,
                "node_kind": node_kind,
                "is_optional": "",          # reserved: dashed "nice to have"
                "is_checkpoint": "",        # reserved: milestone gate
                "selection": selection,
                "choose_count": choose_count,
                "weight": (r["Weight"] or "").strip(),
                "completion_policy": (r["CompletionPolicy"] or "").strip(),
                "required_proficiency": (r.get("RequiredProficency") or "").strip(),
                "evidence_keywords": (r["EvidenceKeywords"] or "").strip(),
                "parent_id": ref(career, parent_name),
                "previous_id": ref(career, (r["PreviousNode"] or "")),
                "description": (r["Description"] or "").strip(),
                "link1": (r.get("link1") or "").strip(),
                "link2": (r.get("link2") or "").strip(),
                "link3": (r.get("link3") or "").strip(),
            }
        )

    # --- skills.csv : catalog derived from the roadmap, one row per skill group
    # per career (e.g. "Java", "Relational Databases", "Web & Networking"). Single
    # source of truth -> replaces the old, inconsistent SkillDataTemplate.csv.
    group_weight: dict[tuple[str, str], int] = {}
    for n in nodes_out:
        g = n["skill_group"]
        if not g:
            continue
        try:
            w = int(float(n["weight"]))
        except (ValueError, TypeError):
            w = 0
        key = (n["career_id"], g)
        group_weight[key] = max(group_weight.get(key, 0), w)
    skills_out = [
        {"name": g, "career_id": cid, "importance": importance_from_weight(str(w))}
        for (cid, g), w in sorted(group_weight.items())
    ]

    # --- write -------------------------------------------------------------
    def write(path: str, rows: list[dict], fields: list[str]) -> None:
        with open(os.path.join(OUT_DIR, path), "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fields)
            w.writeheader()
            w.writerows(rows)

    write("careers.csv", careers, ["career_id", "name", "prerequisites", "description"])
    write(
        "roadmap_nodes.csv",
        nodes_out,
        [
            "node_id", "career_id", "skill_group", "name", "node_level", "stage",
            "axis", "node_kind", "is_optional", "is_checkpoint", "selection",
            "choose_count", "weight", "completion_policy", "required_proficiency",
            "evidence_keywords", "parent_id", "previous_id", "description",
            "link1", "link2", "link3",
        ],
    )
    write("skills.csv", skills_out, ["name", "career_id", "importance"])

    # --- report ------------------------------------------------------------
    print(f"\nWrote {OUT_DIR}/careers.csv ({len(careers)}), "
          f"roadmap_nodes.csv ({len(nodes_out)}), skills.csv ({len(skills_out)})")
    print("\nCHOOSE_ONE groups detected (review these):")
    for career, groups in choice_report.items():
        print(f"  {career}: {sorted(set(groups))}")
    kinds = defaultdict(int)
    for n in nodes_out:
        kinds[n["node_kind"]] += 1
    print(f"\nnode_kind: {dict(kinds)}")


if __name__ == "__main__":
    main()
