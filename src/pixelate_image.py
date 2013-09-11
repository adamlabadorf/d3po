import json

from matplotlib.pyplot import imshow, show
from matplotlib import cm

from numpy import arange, zeros

from scipy import ndimage
from scipy import misc

mona = misc.imread('mona_lisa.jpg')

print "mona is [h,w]:",mona.shape

# convert to single channel
mona = mona.mean(axis=2)

h,w = mona.shape
bins = 20
box_width = w/bins
h_bins = h/box_width
pixel_mona = zeros(shape=(h_bins+1,bins+1))

pixel_mona_d = []
for i,x in enumerate(arange(0,h,box_width)) :
    for j,y in enumerate(arange(0,w,box_width)) :
        pixel_mona[i,j] = mona[x:x+box_width,y:y+box_width].mean()
        pixel_mona_d.append({"x":j,"y":i,"v":pixel_mona[i,j]})

imshow(pixel_mona,cmap=cm.gray,interpolation='none')
show()

json.dump(pixel_mona_d,open('pixel_mona.json','w'))
