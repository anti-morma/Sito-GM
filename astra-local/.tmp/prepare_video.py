import sys
sys.path.insert(0, '.tmp/video-tools')
import av
from fractions import Fraction
from pathlib import Path
Path('public/video').mkdir(parents=True, exist_ok=True)
source = av.open('C:/Users/morma/Desktop/blueprient-to-house.mp4')
target = av.open('public/video/blueprint-to-house.mp4', 'w', options={'movflags': '+faststart'})
stream = target.add_stream('libx264', rate=24)
stream.width, stream.height, stream.pix_fmt = 1280, 720, 'yuv420p'
stream.options = {'crf': '22', 'preset': 'fast', 'g': '12', 'bf': '0'}
for i, frame in enumerate(source.decode(video=0)):
    frame = frame.reformat(width=1280, height=720, format='yuv420p')
    frame.pts, frame.time_base = i, Fraction(1,24)
    for packet in stream.encode(frame): target.mux(packet)
for packet in stream.encode(): target.mux(packet)
target.close()
print(Path('public/video/blueprint-to-house.mp4').stat().st_size)
