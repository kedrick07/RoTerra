import rasterio, numpy as np

path = "data/raw/cdl/cdl_clip/CDL_2025_clip_20261114005110_443564209.tif"
with rasterio.open(path) as src:
    arr = src.read(1)
    print(src.crs, src.bounds, src.res, arr.shape)

# TODO: count pixels equal to 3 (rice)
# TODO: count all non-zero pixels
# TODO: convert pixels to acres: pixels * 900 / 4046.86