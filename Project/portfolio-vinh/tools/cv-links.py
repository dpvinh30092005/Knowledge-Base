"""
Make the CV's URLs clickable.

The CV is exported from a builder that prints the URLs as plain text, so a
recruiter reading it on screen has to retype `github.com/InteliRoadMap` by hand.
This walks the text, finds each one, and lays a link annotation over it.

## Two rules this obeys

**Nothing about the page's appearance changes.** No blue, no underline, no
border. The text already reads as a URL; restyling it would be editing his CV
under the guise of adding a link, and the design is his.

**An anchor that is not found is a hard failure.** The CV gets re-exported every
time he edits it, and a wording change would otherwise make this script quietly
produce a PDF with three links instead of ten — which nobody would notice until
a recruiter clicked nothing. `search_for` returning 0 hits, or more than one
inside the band, stops the run.

Ambiguity is resolved by a y-band rather than by taking the first hit: two lines
say `intelipath.online` and two say `FPT University`, and "first" is whichever
one the builder happened to lay down first.

    python tools/cv-links.py in.pdf out.pdf
"""

import sys
import fitz

GH = "https://github.com/InteliRoadMap"

# anchor text, target, and the y-band it must be found in (None = anywhere).
#
# The Contributions figure points at a commit search across the org rather than
# one repo's contributor graph, because the claim it evidences — 223 of 332 —
# spans both repos. Note this is the link that reads low while the commit email
# is unverified: GitHub can only attribute what it can match to the account.
LINKS = [
    ("0903-617-704",                 "tel:+84903617704",                      None),
    ("dpvinh30092005@gmail.com",     "mailto:dpvinh30092005@gmail.com",       None),
    ("github.com/dpvinh30092005",    "https://github.com/dpvinh30092005",     None),
    ("linkedin.com/in/vinhdpse2005", "https://www.linkedin.com/in/vinhdpse2005/", None),
    ("vinh.intelipath.online",       "https://vinh.intelipath.online",        None),
    ("InteliRoadMap",                GH,                                      (680, 700)),
    ("intelipath-backend",           GH + "/intelipath-backend",              None),
    ("intelipath-frontend",          GH + "/intelipath-frontend",             None),
    ("223 of 332 commits",
     "https://github.com/search?q=org%3AInteliRoadMap+author%3Adpvinh30092005&type=commits",
     None),
    ("intelipath.online",            "https://intelipath.online",             (700, 725)),
]

# The click target is grown half a line in each direction. A URL's glyph box is
# ~9pt tall and a mouse aimed at the middle of the text still lands outside it.
PAD_Y = 2.0
PAD_X = 1.0


def main(src, dst):
    doc = fitz.open(src)
    page = doc[0]
    n = 0

    for text, uri, band in LINKS:
        hits = page.search_for(text)
        if band:
            lo, hi = band
            hits = [r for r in hits if lo <= r.y0 <= hi]
        if len(hits) != 1:
            raise SystemExit(
                f"anchor {text!r}: expected exactly 1 hit, got {len(hits)}"
                f"{' in band ' + str(band) if band else ''}. "
                "The CV wording changed — fix the anchor, do not loosen the check."
            )

        r = hits[0]
        box = fitz.Rect(r.x0 - PAD_X, r.y0 - PAD_Y, r.x1 + PAD_X, r.y1 + PAD_Y)
        page.insert_link({"kind": fitz.LINK_URI, "from": box, "uri": uri})
        n += 1
        print(f"  {text:<30} -> {uri}")

    doc.save(dst, garbage=3, deflate=True)
    print(f"\n{n} links written to {dst}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
