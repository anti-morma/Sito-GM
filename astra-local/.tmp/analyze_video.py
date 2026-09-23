import sys
sys.path.insert(0, '.tmp/video-tools')
import av
from PIL import Image, ImageDraw
clip = av.open('C:/Users/morma/Desktop/blueprient-to-house.mp4')
stream = clip.streams.video[0]
duration = float(stream.duration * stream.time_base)
print({'seconds': duration, 'width': stream.width, 'height': stream.height})
sheet = Image.new('RGB', (1280, 4 * 265), '#161616')
draw = ImageDraw.Draw(sheet)
for i in range(12):
    t = duration * i / 12
    clip.seek(int(t / stream.time_base), stream=stream)
    for frame in clip.decode(stream):
        if float(frame.pts * stream.time_base) >= t:
            im = frame.to_image()
            im.thumbnail((420, 235))
            x, y = i % 3 * 426, i // 3 * 265
            sheet.paste(im, (x, y + 24))
            draw.text((x + 8, y + 6), f'{t:.1f}s', fill='white')
            break
sheet.save('.tmp/video-reference.jpg')
