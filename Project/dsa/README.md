# DSA - LeetCode Practice

Every [LeetCode](https://leetcode.com/problemset/) problem, crawled into one folder per problem, per language.

```
dsa/
├── PROBLEMS.md                      # all problems + ✅ progress per language (generated)
├── problems.json                    # problem list metadata (generated)
├── tools/lc.py                      # crawler / helper
├── python/
│   └── 0001-two-sum/
│       ├── README.md                # description, examples, constraints, hints
│       └── solution.py              # starter code - solve here
├── java/0001-two-sum/Solution.java
├── cpp/0001-two-sum/solution.cpp
└── javascript/0001-two-sum/solution.js
```

## Workflow

1. Pick a problem: open `PROBLEMS.md`, or `python tools/lc.py random medium`
2. Read `<lang>/<problem>/README.md`, write your solution in the solution file
3. Run it locally:
   ```bash
   python python/0001-two-sum/solution.py
   java java/0001-two-sum/Solution.java
   ```
4. Submit on LeetCode, then `python tools/lc.py index` to refresh progress
   (a problem is ✅ once its solution file differs from the generated template)

## Commands

```bash
python tools/lc.py crawl                 # (re)crawl everything; never overwrites your solutions
python tools/lc.py crawl go rust         # add more languages
python tools/lc.py new 1 kotlin          # one problem, one language
python tools/lc.py random hard
python tools/lc.py index
```

Supported: python, java, cpp, javascript, typescript, go, csharp, kotlin, rust.
Premium (🔒) problems get a folder with a link only.

> Problem descriptions (`*/*/README.md`) are git-ignored - they're LeetCode's content,
> so they stay local and aren't pushed to GitHub. Your solutions are committed normally.
