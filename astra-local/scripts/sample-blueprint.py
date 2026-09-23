# Offline regeneration: requires Pillow and PyAV (no runtime dependency).
from pathlib import Path
import av
from PIL import Image, ImageFilter
import random,json,math
root = Path(__file__).resolve().parents[1]
with av.open(str(root / 'public/video/blueprint-to-house.mp4')) as source:
 im = next(source.decode(video=0)).to_image().convert('RGB')
r=im.getchannel('R'); blur=r.filter(ImageFilter.GaussianBlur(2))
a=list(r.getdata()); b=list(blur.getdata()); rng=random.Random(721)
candidates=[]
for y in range(2,718):
 for x in range(125,1180):
  i=y*1280+x
  contrast=max(0,a[i]-b[i])
  if a[i]<75 or contrast<3: continue
  house=350<x<1080 and 165<y<515
  weight=(contrast**.65)*(1.8 if house else .65)
  candidates.append((rng.random()**(1/weight),x,y,a[i],house))
samples=sorted(candidates,reverse=True)[:32768]
points=[]
for _,x,y,v,house in samples:
 # Draw the architecture first, then the surrounding site; continuous diagonal reveal.
 order=((x-350)/730*.55+(y-165)/350*.45)*.72 if house else .72+((x-125)/1055*.4+y/720*.6)*.28
 points.append([round((x+.5)/1280-.5,6),round(((y+.5)/720-.5)*9/16,6),round(min(1,v/210),3),round(max(0,min(.999,order)),4)])
with open(root / 'app/blueprint-points.json','w') as f: json.dump(points,f,separators=(',',':'))
print('Sampled points:',len(points))
