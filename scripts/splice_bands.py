import re, sys, io
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "work-arr-2-tape-v2.html"
BANDS_OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/bands.html")

src = TARGET.read_text(encoding="utf-8")
new_bands = BANDS_OUT.read_text(encoding="utf-8")

# Find region to replace: from "<!-- =========== BAND 01" comment line
# down to (but not including) "<!-- =========== CLOSING =========== -->"
start_marker = "  <!-- =========== BAND 01"
end_marker = "  <!-- =========== CLOSING ==========="

start = src.find(start_marker)
end = src.find(end_marker)
if start == -1 or end == -1:
    print("MARKERS NOT FOUND", file=sys.stderr); sys.exit(1)

new_src = src[:start] + new_bands + "\n" + src[end:]
TARGET.write_text(new_src, encoding="utf-8")
print(f"Replaced bytes {start}-{end} with {len(new_bands)} bytes of new bands.")
