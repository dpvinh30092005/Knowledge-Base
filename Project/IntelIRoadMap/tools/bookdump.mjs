/**
 * Pull the exact pages of the reference books a topic page cites, so the
 * examples on the sheet can be checked against the source rather than
 * remembered. Written as a tool, not a scratch script: every future page that
 * cites a book has to be able to re-run this.
 *
 *   node tools/bookdump.mjs schildt 165-168 190-196
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const BOOKS = {
  schildt: "D:/TaiLieu/Favorite-Book/java the complete reference, 7th edition -herbert schildt.pdf",
  servlet: "D:/TaiLieu/Favorite-Book/Servlet and JSP.pdf",
  j2ee: "D:/TaiLieu/Favorite-Book/Java-j2EE-Interview-Questions-pdf.pdf",
  dsa: "D:/TaiLieu/DSA/DSA.pdf",
};

const [book, ...ranges] = process.argv.slice(2);
const path = BOOKS[book];
if (!path) throw new Error(`unknown book: ${book}. one of ${Object.keys(BOOKS)}`);

const pages = ranges.flatMap((r) => {
  const [a, b = a] = r.split("-").map(Number);
  return Array.from({ length: b - a + 1 }, (_, k) => a + k);
});

// PyMuPDF via a one-liner — the alternative is a JS pdf parser that would be a
// dependency for something run by hand a few times.
const py = `
import fitz, json, sys
d = fitz.open(r"${path}")
out = []
for n in ${JSON.stringify(pages)}:
    try:
        out.append("===== p%d =====\\n" % n + d[n-1].get_text())
    except Exception as e:
        out.append("===== p%d ERROR %s" % (n, e))
sys.stdout.buffer.write("\\n".join(out).encode("utf-8"))
`;
const text = execFileSync("python", ["-c", py], { maxBuffer: 64 << 20 });
const out = `D:/Project/IntelIRoadMap/tools/.book-${book}.txt`;
writeFileSync(out, text);
console.log(`${text.length} chars → ${out}`);
