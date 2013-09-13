import json
import math
import os

from matplotlib.pyplot import imshow, show
from matplotlib import cm

from numpy import arange, zeros

from scipy import ndimage
from scipy import misc



def pixelate_image(img_fn,bins=20) :

    img = misc.imread(img_fn)

    print "img is [h,w]:",img.shape

    # convert to single channel
    img = img.mean(axis=2)

    h,w = img.shape
    box_width = 1.*w/bins
    h_bins = math.ceil(1.*h/box_width)
    pixel_img = zeros(shape=(h_bins,bins))
    print "binned to",pixel_img.shape,"by",bins,"columns, box width",box_width

    pixel_img_d = []
    for i,x in enumerate(arange(0,h,box_width)) :
        for j,y in enumerate(arange(0,w,box_width)) :
            pixel_img[i,j] = img[x:x+box_width,y:y+box_width].mean()
            pixel_img_d.append({"x":j,"y":i,"v":pixel_img[i,j]})

    imshow(pixel_img,cmap=cm.gray,interpolation='none')
    show()

    base,ext = os.path.splitext(img_fn)
    json.dump(pixel_img_d,open('%s.json'%base,'w'))

if __name__ == '__main__' :

    pixelate_image('mona_lisa.jpg')
    pixelate_image('C-3PO_droid.jpg',bins=50)
