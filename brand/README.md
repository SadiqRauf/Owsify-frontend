# Brand source assets

`logo-source.png` is the supplied Owsify lockup — mark, wordmark and tagline, on a
transparent background at 1408×768 with wide margins.

It lives here rather than in `public/` because everything in `public/` is copied
verbatim into the build and served: the full-resolution source is 356 KB that no
page ever requests. The assets the app does use are derived from it and committed
to `public/`.

To regenerate them after the source changes:

```bash
python3 -m venv /tmp/imgtool && /tmp/imgtool/bin/pip install Pillow
/tmp/imgtool/bin/python - <<'PY'
from PIL import Image

src = Image.open('brand/logo-source.png').convert('RGBA')

# Alpha bounds of the two regions, measured rather than eyeballed.
MARK = (172, 226, 525, 542)
LOCKUP = (172, 226, 1237, 542)

mark = src.crop(MARK)
side = max(mark.size)
square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
square.paste(mark, ((side - mark.size[0]) // 2, (side - mark.size[1]) // 2))

square.resize((192, 192), Image.LANCZOS).save('public/logo-mark.png', optimize=True)
square.resize((32, 32), Image.LANCZOS).save('public/favicon-32.png', optimize=True)
square.resize((180, 180), Image.LANCZOS).save('public/apple-touch-icon.png', optimize=True)

lockup = src.crop(LOCKUP)
h = round(640 * lockup.size[1] / lockup.size[0])
lockup.resize((640, h), Image.LANCZOS).save('public/logo-lockup.png', optimize=True)
PY
```

If the source artwork's proportions change, re-measure the crop boxes first — the
constants above are specific to this file.
