#!/usr/bin/env bash
# Builds web media from the sources in assets/hero. Re-run after replacing transition.mp4.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=assets/hero/transition.mp4
OUT=public/media
mkdir -p "$OUT"

# Ping-pong: forward + reversed (first reversed frame dropped) so `loop` never shows a cut.
pingpong() { # width crf outfile
  ffmpeg -v error -y -i "$SRC" -filter_complex \
    "[0:v]scale=$1:-2,split[a][b];[b]reverse,trim=start_frame=1,setpts=PTS-STARTPTS[r];[a][r]concat=n=2:v=1:a=0[v]" \
    -map "[v]" -c:v libx264 -crf "$2" -preset slow -pix_fmt yuv420p -movflags +faststart -an "$3"
}
pingpong 1600 28 "$OUT/hero-loop.mp4"
pingpong 1280 30 "$OUT/hero-loop-720.mp4"

# Poster = first frame of the video, so nothing jumps when playback starts.
ffmpeg -v error -y -i "$SRC" -frames:v 1 -vf scale=1600:-2 -q:v 3 "$OUT/poster.jpg"

# Open Graph image: crop around the bust (right side of the frame), 1200x630.
ffmpeg -v error -y -i assets/hero/image-2.png -vf "crop=1254:658:418:0,scale=1200:630" -q:v 3 public/og.jpg

echo "OK"; ls -la "$OUT" public/og.jpg
