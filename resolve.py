import json
import sys

with open('build/static/js/main.185e0004.chunk.js.map', 'r') as f:
    data = json.load(f)

# A crude VLQ decoder to find the source for line 1, column 19874
# But wait, Python doesn't have a built-in VLQ decoder for source maps.
# Let's just grep the map file for "Dashboard" or "App"
print("Sources:", data.get('sources'))
