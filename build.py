"""
Roti Bank Website 2.0 — demo build.

Assembles src/pages/*.html with the shared partials (head, header, footer)
and fills every {{fact:...}} token from src/data/facts.json, so one fact
sheet drives every figure on every page. Output goes to site/, which is
what gets deployed to Vercel.

    python build.py
"""
import json, re, shutil
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent
SRC, OUT = ROOT / "src", ROOT / "site"
FACTS = json.loads((SRC / "data" / "facts.json").read_text(encoding="utf-8"))
F = FACTS["facts"]


def fmt_int(n):
    return f"{int(n):,}"


def fmt(key, field="value"):
    if key not in F:
        raise KeyError(f"Unknown fact: {key}")
    f = F[key]
    if field != "value":
        return str(f.get(field, ""))
    v, kind = f["value"], f.get("fmt")
    if kind == "int":
        return fmt_int(v)
    if kind == "inr":
        return "₹" + fmt_int(v)
    return str(v)


def src_line(key):
    f = F[key]
    return f"{f['source']}" + (f", {f['as_of']}" if f.get("as_of") else "")


# ---------- charts (rendered at build time, so they work without JS) ----------

def chart_record():
    pts = FACTS["record"]
    def months(d):
        y, m = map(int, d.split("-"))
        return y * 12 + m
    x0, x1 = months("2019-06"), months("2026-12")
    W, H, L, R, T, B = 760, 340, 56, 20, 24, 40
    ymax = 32_000_000
    X = lambda d: L + (months(d) - x0) / (x1 - x0) * (W - L - R)
    Y = lambda v: T + (1 - v / ymax) * (H - T - B)
    grid = []
    for v in range(0, 32_000_001, 8_000_000):
        y = Y(v)
        grid.append(f'<line x1="{L}" x2="{W-R}" y1="{y:.1f}" y2="{y:.1f}" class="g"/>'
                    f'<text x="{L-10}" y="{y+4:.1f}" class="ax" text-anchor="end">{v//1_000_000}M</text>')
    for yr in range(2020, 2027):
        x = X(f"{yr}-01")
        grid.append(f'<text x="{x:.1f}" y="{H-14}" class="ax" text-anchor="middle">{yr}</text>')
    line = " ".join(f"{X(p['date']):.1f},{Y(p['meals']):.1f}" for p in pts)
    area = f"{X(pts[0]['date']):.1f},{Y(0):.1f} {line} {X(pts[-1]['date']):.1f},{Y(0):.1f}"
    dots = []
    for p in pts:
        x, y = X(p["date"]), Y(p["meals"])
        dots.append(f'<g class="pt" tabindex="0"><circle cx="{x:.1f}" cy="{y:.1f}" r="5"/>'
                    f'<title>{p["label"]}: {fmt_int(p["meals"])} meals (Samachar)</title></g>')
        if p.get("note"):
            dots.append(f'<text x="{x-12:.1f}" y="{y-12:.1f}" class="lbl" text-anchor="end">{p["note"]}</text>')
    return (f'<svg class="chart-record" viewBox="0 0 {W} {H}" role="img" '
            f'aria-label="Cumulative meals served, from 1 million in December 2019 to {fmt_int(pts[-1]["meals"])} in October 2026">'
            f'{"".join(grid)}<polygon points="{area}" class="area"/><polyline points="{line}" class="line"/>{"".join(dots)}</svg>')


def chart_cities():
    cities = FACTS["cities"]
    top = max(c["meals"] for c in cities)
    total = sum(c["meals"] for c in cities)
    rows = []
    for c in cities:
        pct = c["meals"] / top * 100
        share = c["meals"] / total * 100
        rows.append(
            f'<li><span class="city">{c["name"]}<small>{c["state"]}</small></span>'
            f'<span class="bar"><i style="--w:{pct:.1f}%"></i></span>'
            f'<span class="num">{fmt_int(c["meals"])}<small>{share:.1f}%</small></span></li>')
    return f'<ol class="city-bars">{"".join(rows)}</ol><p class="fine">Total {fmt_int(total)} meals. {src_line("meals_served")}.</p>'


def facts_table():
    groups = {}
    for k, f in F.items():
        groups.setdefault(f.get("group", "Other"), []).append((k, f))
    html = []
    for g, items in groups.items():
        html.append(f'<h3 class="fs-group">{g}</h3><div class="table-wrap"><table class="fs-table"><thead><tr>'
                    '<th>Figure</th><th>What it means</th><th>As of</th><th>Source</th><th>Key</th></tr></thead><tbody>')
        for k, f in items:
            html.append(f'<tr><td class="v">{fmt(k)}</td><td>{f["label"]}</td><td>{f.get("as_of","")}</td>'
                        f'<td>{f["source"]}</td><td><code>{k}</code></td></tr>')
        html.append("</tbody></table></div>")
    return "".join(html)


TOKENS = {
    "edition": lambda: FACTS["edition"],
    "approved_on": lambda: FACTS["approved_on"],
    "year": lambda: str(date.today().year),
}


def render(text):
    text = re.sub(r"\{\{chart:record\}\}", lambda m: chart_record(), text)
    text = re.sub(r"\{\{chart:cities\}\}", lambda m: chart_cities(), text)
    text = re.sub(r"\{\{facts_table\}\}", lambda m: facts_table(), text)
    text = re.sub(r"\{\{src:([a-z_]+)\}\}", lambda m: src_line(m.group(1)), text)
    text = re.sub(r"\{\{fact:([a-z_]+)(?:\|([a-z_]+))?\}\}", lambda m: fmt(m.group(1), m.group(2) or "value"), text)
    text = re.sub(r"\{\{(edition|approved_on|year)\}\}", lambda m: TOKENS[m.group(1)](), text)
    left = re.findall(r"\{\{[^}]+\}\}", text)
    if left:
        raise ValueError(f"Unresolved tokens: {left}")
    return text


def main():
    partial = lambda n: (SRC / "partials" / f"{n}.html").read_text(encoding="utf-8")
    head, header, footer = partial("head"), partial("header"), partial("footer")
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SRC / "assets", OUT / "assets")
    (OUT / "assets" / "data").mkdir(parents=True, exist_ok=True)
    (OUT / "assets" / "data" / "facts.json").write_text(json.dumps(FACTS, ensure_ascii=False), encoding="utf-8")
    i18n = OUT / "assets" / "js" / "i18n.js"
    i18n.write_text(render(i18n.read_text(encoding="utf-8")), encoding="utf-8")

    for page in sorted((SRC / "pages").glob("*.html")):
        raw = page.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--(\{.*?\})-->\s*", raw, re.S)
        meta = json.loads(m.group(1)) if m else {}
        body = raw[m.end():] if m else raw
        nav = meta.get("nav", "")
        hdr = header.replace(f'data-nav="{nav}"', f'data-nav="{nav}" aria-current="page"') if nav else header
        html = (head.replace("%TITLE%", meta.get("title", "Roti Bank Foundation"))
                    .replace("%DESC%", meta.get("desc", "Mumbai Roti Bank feeds children, patients and families. ₹40 feeds a child a fresh, nutritious meal."))
                    .replace("%BODYCLASS%", meta.get("body", "")))
        html += hdr + "\n<main id=\"main\">\n" + body + "\n</main>\n" + footer
        (OUT / page.name).write_text(render(html), encoding="utf-8")
        print("built", page.name)

    (OUT / "vercel.json").write_text(json.dumps({"cleanUrls": True, "trailingSlash": False}, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
