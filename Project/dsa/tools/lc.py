"""LeetCode workspace helper.

  python tools/lc.py crawl [lang ...]           # fetch ALL problems and scaffold a folder per problem per language
                                                #   (default langs: python java cpp javascript)
  python tools/lc.py new <id|slug> <lang>       # scaffold one problem for one language (e.g. new 1 go)
  python tools/lc.py index                      # rebuild PROBLEMS.md (marks solved problems per language)
  python tools/lc.py random [easy|medium|hard]  # pick a random unsolved free problem
  python tools/lc.py sync                       # refresh problem list only -> problems.json

A problem counts as solved once its solution file differs from the generated template.
Languages: python, java, cpp, javascript, typescript, go, csharp, kotlin, rust
"""
import hashlib
import html
import json
import random
import re
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "problems.json"
INDEX = ROOT / "PROBLEMS.md"
CACHE = ROOT / "tools" / ".cache"
TEMPLATES = ROOT / "tools" / "templates.json"  # sha1 of generated solution files -> used to detect "solved"
API = "https://leetcode.com/graphql"
DEFAULT_LANGS = ["python", "java", "cpp", "javascript"]

# folder -> (LeetCode langSlug, file name)
LANGS = {
    "python": ("python3", "solution.py"),
    "java": ("java", "Solution.java"),
    "cpp": ("cpp", "solution.cpp"),
    "javascript": ("javascript", "solution.js"),
    "typescript": ("typescript", "solution.ts"),
    "go": ("golang", "solution.go"),
    "csharp": ("csharp", "Solution.cs"),
    "kotlin": ("kotlin", "Solution.kt"),
    "rust": ("rust", "solution.rs"),
}
COMMENT = {"python": "#"}  # everything else uses //

LIST_QUERY = """
query list($skip: Int, $limit: Int) {
  questionList(categorySlug: "", skip: $skip, limit: $limit, filters: {}) {
    totalNum
    data {
      questionFrontendId title titleSlug difficulty isPaidOnly acRate
      topicTags { name }
    }
  }
}"""

DETAIL_QUERY = """
query detail($slug: String!) {
  question(titleSlug: $slug) { content hints codeSnippets { langSlug code } }
}"""


# ---------------------------------------------------------------- network

def gql(query, variables):
    req = urllib.request.Request(
        API,
        data=json.dumps({"query": query, "variables": variables}).encode(),
        headers={
            "Content-Type": "application/json",
            "Referer": "https://leetcode.com/problemset/",
            "User-Agent": "Mozilla/5.0",
        },
    )
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)["data"]
        except (TimeoutError, OSError) as e:
            if attempt == 5:
                raise
            time.sleep(3 * (attempt + 1) + (10 if "429" in str(e) else 0))


def detail(p):
    """Problem content + snippets, cached on disk."""
    f = CACHE / f"{p['slug']}.json"
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))
    q = gql(DETAIL_QUERY, {"slug": p["slug"]})["question"] or {}
    CACHE.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(q, ensure_ascii=False), encoding="utf-8")
    return q


def load():
    if not DATA.exists():
        cmd_sync()
    return json.loads(DATA.read_text(encoding="utf-8"))


def folder_name(p):
    return f"{int(p['id']):04d}-{p['slug']}" if p["id"].isdigit() else p["slug"]


def cmd_sync():
    problems, skip, step = [], 0, 100
    while True:
        res = gql(LIST_QUERY, {"skip": skip, "limit": step})["questionList"]
        if not res["data"]:
            break
        for q in res["data"]:
            problems.append({
                "id": q["questionFrontendId"],
                "title": q["title"],
                "slug": q["titleSlug"],
                "difficulty": q["difficulty"],
                "paid": q["isPaidOnly"],
                "acRate": round(q["acRate"], 1),
                "tags": [t["name"] for t in q["topicTags"]],
            })
        skip += len(res["data"])
        print(f"  list {len(problems)}/{res['totalNum']}")
        if skip >= res["totalNum"]:
            break
    problems.sort(key=lambda p: (not p["id"].isdigit(), int(p["id"]) if p["id"].isdigit() else 0, p["id"]))
    DATA.write_text(json.dumps(problems, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Saved {len(problems)} problems to problems.json")


# ---------------------------------------------------------------- rendering

def html_to_md(s):
    s = s.replace("\r", "")
    s = re.sub(r"<pre>(.*?)</pre>", lambda m: "\n```text\n" + re.sub(r"<[^>]+>", "", m.group(1)).strip("\n") + "\n```\n",
               s, flags=re.S)
    s = re.sub(r"<img[^>]*src=\"([^\"]+)\"[^>]*>", r"![](\1)", s)
    s = re.sub(r"<sup>(.*?)</sup>", r"^\1", s, flags=re.S)
    s = re.sub(r"<sub>(.*?)</sub>", r"_\1", s, flags=re.S)
    s = re.sub(r"<code>(.*?)</code>", lambda m: "`" + re.sub(r"<[^>]+>", "", m.group(1)) + "`", s, flags=re.S)
    s = re.sub(r"<(strong|b)[^>]*>(.*?)</\1>", r"**\2**", s, flags=re.S)
    s = re.sub(r"<(em|i)>(.*?)</\1>", r"*\2*", s, flags=re.S)
    s = re.sub(r"\s*<li>\s*", "\n- ", s)
    s = re.sub(r"</?(p|ul|ol|li|div)[^>]*>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s).replace("\xa0", " ")
    s = re.sub(r"\*\*[ ]*\*\*", "", s)                    # empty bold
    s = re.sub(r"\*\*([^*\n]*?)[ ]+\*\*", r"**\1** ", s)  # "**Follow-up: **" -> "**Follow-up:** "
    s = re.sub(r"\n\s*\n(- )", r"\n\1", s)                # tight lists
    s = re.sub(r"[ \t]+\n", "\n", s)
    return re.sub(r"\n{3,}", "\n\n", s).strip()


def readme(p, q):
    lines = [
        f"# {p['id']}. {p['title']}",
        "",
        f"**Difficulty:** {p['difficulty']} &nbsp;|&nbsp; **Acceptance:** {p['acRate']}% &nbsp;|&nbsp; "
        f"[Open on LeetCode](https://leetcode.com/problems/{p['slug']}/)",
        "",
        f"**Tags:** {', '.join(p['tags']) or '-'}",
        "",
        "---",
        "",
    ]
    if q.get("content"):
        lines.append(html_to_md(q["content"]))
    else:
        lines.append("🔒 Premium problem - read the description on LeetCode.")
    if q.get("hints"):
        lines += ["", "## Hints", ""]
        lines += [f"<details><summary>Hint {i}</summary>\n\n{html_to_md(h)}\n\n</details>\n"
                  for i, h in enumerate(q["hints"], 1)]
    return "\n".join(lines) + "\n"


def make_runnable(lang, code):
    """Turn the commented 'Definition for ...' blocks (ListNode, TreeNode...) into real code so it runs locally."""
    if lang == "python":
        out, active = [], False
        for line in code.splitlines():
            if line.startswith("# Definition"):
                active = True
                out.append(line)
            elif active and line.startswith("#"):
                out.append(line[2:] if line.startswith("# ") else line[1:])
            else:
                if active and line.strip():
                    out += ["", ""]
                active = False
                out.append(line)
        code = "\n".join(out).rstrip()
        if code.endswith(":"):
            code += "\n        pass"
        return "from typing import *\n\n" + code

    if lang == "java":
        defs = []

        def extract(m):
            if "Definition" not in m.group(1):
                return m.group(0)
            body = re.sub(r"^ \* ?", "", m.group(1), flags=re.M)
            defs.append("// " + re.sub(r"^public class", "class", body, flags=re.M).strip())
            return ""
        code = re.sub(r"/\*\*\s*\n((?: \*.*\n)*?) \*/\n", extract, code).rstrip()
        # main() lives inside Solution (first class in the file) so `java Solution.java` just works
        main = ("\n\n    public static void main(String[] args) {\n"
                "        Solution s = new Solution();\n"
                "        // System.out.println(s.method(...));\n    }\n}")
        if code.startswith("class Solution") and code.endswith("}"):
            code = code[:-1].rstrip() + main
        return "import java.util.*;\n\n" + code + "".join("\n\n" + d for d in defs)

    return code


def solution(p, q, lang):
    slug, _ = LANGS[lang]
    snippet = next((s["code"] for s in (q.get("codeSnippets") or []) if s["langSlug"] == slug), None)
    if snippet is None:
        return None  # premium or language not offered
    c = COMMENT.get(lang, "//")
    header = "\n".join(f"{c} {line}".rstrip() for line in [
        f"{p['id']}. {p['title']}  [{p['difficulty']}]",
        f"https://leetcode.com/problems/{p['slug']}/",
        "",
        "Approach:",
        "",
        "Complexity: Time O(?)  Space O(?)",
    ])
    footer = {"python": '\n\n\nif __name__ == "__main__":\n    s = Solution()\n    # print(s.method(...))\n'}.get(lang, "\n")
    return header + "\n\n" + make_runnable(lang, snippet).rstrip() + footer


def sha(text):
    text = text.replace("\r\n", "\n").replace("\r", "\n")  # some LeetCode snippets use CRLF
    return hashlib.sha1(text.encode("utf-8")).hexdigest()


def scaffold(p, q, langs, templates):
    """Write README + solution files; never overwrites an existing solution. Returns #files created."""
    created = 0
    for lang in langs:
        d = ROOT / lang / folder_name(p)
        d.mkdir(parents=True, exist_ok=True)
        (d / "README.md").write_text(readme(p, q), encoding="utf-8")
        code = solution(p, q, lang)
        f = d / LANGS[lang][1]
        if code is not None and not f.exists():
            f.write_text(code, encoding="utf-8")
            templates[f"{lang}/{folder_name(p)}"] = sha(code)
            created += 1
    return created


def load_templates():
    return json.loads(TEMPLATES.read_text()) if TEMPLATES.exists() else {}


def save_templates(t):
    TEMPLATES.write_text(json.dumps(t, indent=0, sort_keys=True))


# ---------------------------------------------------------------- commands

def cmd_crawl(langs):
    langs = langs or DEFAULT_LANGS
    bad = [l for l in langs if l not in LANGS]
    if bad:
        sys.exit(f"Unsupported language(s): {bad}. Choose from: {', '.join(LANGS)}")
    cmd_sync()
    problems, templates = load(), load_templates()
    done, created, t0 = 0, 0, time.time()
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(detail, p): p for p in problems}
        for fut in as_completed(futures):
            p = futures[fut]
            try:
                created += scaffold(p, fut.result(), langs, templates)
            except Exception as e:
                print(f"  ! {p['id']} {p['slug']}: {e}")
            done += 1
            if done % 100 == 0 or done == len(problems):
                save_templates(templates)
                print(f"  {done}/{len(problems)} problems  ({created} files, {time.time() - t0:.0f}s)", flush=True)
    save_templates(templates)
    cmd_index()


def cmd_new(pid, lang):
    if lang not in LANGS:
        sys.exit(f"Unsupported language. Choose one of: {', '.join(LANGS)}")
    p = next((x for x in load() if x["id"] == pid or x["slug"] == pid), None)
    if not p:
        sys.exit(f"Problem not found: {pid}")
    templates = load_templates()
    n = scaffold(p, detail(p), [lang], templates)
    save_templates(templates)
    print(f"{'Created' if n else 'Already exists / no starter code'}: {lang}/{folder_name(p)}")
    cmd_index()


def solved():
    """{id: [languages]} where the solution file was changed from its template."""
    templates, done = load_templates(), {}
    for lang, (_, filename) in LANGS.items():
        d = ROOT / lang
        if not d.is_dir():
            continue
        for sub in d.iterdir():
            m = re.match(r"0*(\d+)-", sub.name)
            f = sub / filename
            if m and f.exists() and sha(f.read_text(encoding="utf-8")) != templates.get(f"{lang}/{sub.name}"):
                done.setdefault(m.group(1), []).append(lang)
    return done


def cmd_index():
    problems, done = load(), solved()
    langs = [l for l in LANGS if (ROOT / l).is_dir()]
    count = {d: [0, 0] for d in ("Easy", "Medium", "Hard")}
    for p in problems:
        count[p["difficulty"]][1] += 1
        if p["id"] in done:
            count[p["difficulty"]][0] += 1
    lines = [
        "# LeetCode Problems",
        "",
        "> Generated by `python tools/lc.py index` - do not edit by hand.",
        "",
        "| Difficulty | Solved | Total |", "|---|---|---|",
        *[f"| {d} | {a} | {b} |" for d, (a, b) in count.items()],
        "",
        "| # | Problem | Difficulty | AC% | Tags | " + " | ".join(langs) + " |",
        "|---|---|---|---|---|" + "---|" * len(langs),
    ]
    icon = {"Easy": "🟢", "Medium": "🟡", "Hard": "🔴"}
    for p in problems:
        lock = " 🔒" if p["paid"] else ""
        marks = " | ".join(f"[✅]({l}/{folder_name(p)})" if l in done.get(p["id"], []) else "" for l in langs)
        lines.append(
            f"| {p['id']} | [{p['title']}](https://leetcode.com/problems/{p['slug']}/){lock} | "
            f"{icon[p['difficulty']]} {p['difficulty']} | {p['acRate']} | {', '.join(p['tags'])} | {marks} |"
        )
    INDEX.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Updated PROBLEMS.md ({sum(a for a, _ in count.values())}/{len(problems)} solved)")


def cmd_random(level=None):
    done = solved()
    pool = [p for p in load() if not p["paid"] and p["id"] not in done
            and (not level or p["difficulty"].lower() == level.lower())]
    p = random.choice(pool)
    print(f"{p['id']}. {p['title']} [{p['difficulty']}] - https://leetcode.com/problems/{p['slug']}/")
    print(f"  folder: <lang>/{folder_name(p)}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    a = sys.argv[1:]
    if a[:1] == ["crawl"]:
        cmd_crawl(a[1:])
    elif a[:1] == ["sync"]:
        cmd_sync()
        cmd_index()
    elif a[:1] == ["new"] and len(a) == 3:
        cmd_new(a[1], a[2])
    elif a[:1] == ["index"]:
        cmd_index()
    elif a[:1] == ["random"]:
        cmd_random(*a[1:2])
    else:
        print(__doc__)
