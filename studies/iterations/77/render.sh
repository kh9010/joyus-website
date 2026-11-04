#!/usr/bin/env bash
# Renders shots one at a time, measuring the GPU first and resting after each so the machine stays usable.
#   render.sh <src> <outdir> <width> <samples> shot [shot...]
# Duty = 100 - load - 15 reserve, clamped to 10-80 (Divya's rule): rest = render time * (100/duty - 1).
SRC=$1; OUT=$2; W=$3; SAMPLES=$4; shift 4
BLENDER="/c/Program Files/Blender Foundation/Blender 4.1/blender.exe"
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$OUT"
for SHOT in "$@"; do
  LOAD=0
  for i in 1 2 3 4; do
    U=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits | tr -d ' \r')
    [ "$U" -gt "$LOAD" ] && LOAD=$U
    sleep 1
  done
  DUTY=$((100 - LOAD - 15)); [ $DUTY -lt 10 ] && DUTY=10; [ $DUTY -gt 80 ] && DUTY=80
  T0=$(date +%s)
  "$BLENDER" -b -noaudio -P "$HERE/scene.py" -- --shot "$SHOT" --src "$SRC" --out "$OUT/$SHOT.png" --w "$W" --samples "$SAMPLES" $EXTRA 2>&1 | grep -E "RENDERED|Error|Traceback|error:|LABEL|FERN|DROPS" | cut -c1-220
  T=$(( $(date +%s) - T0 ))
  REST=$(( T * (100 - DUTY) / DUTY ))
  echo "$SHOT: ${T}s at load ${LOAD}%, duty ${DUTY}%, resting ${REST}s"
  sleep "$REST"
done
