# Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/sastrokucrit-creator/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/sastrokucrit-creator/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover Studio turns your own photo and a caption into a GTA 6-style poster cover. It is a fully offline static web app: choose one of seven collage layouts, load photos from your machine, crop and position each panel, write a big gradient title with a script subtitle, tagline and starburst badge, pick one of six colour grades (with an optional halftone finish), and export the result as a PNG ready to post.

## What it does

- Seven poster layouts: Showcase, Poster, Key art, Hero, Duo, Trio and Quad
- Your photos, cropped and positioned per panel, one photo or several
- Face-aware crop: a cast portrait keeps its face centred in its panel until you drag it by hand
- A title-block editor: title, script subtitle, tagline bar, badge text and badge on/off, fill, size and outline
- A five-star review strip, a cast billing line, and a production footer with two credit lines, COMING SOON and a barcode
- Colour grades: sunset (default), neon, noir, gold, vice and original, applied evenly across every panel
- Five badge styles: starburst, WANTED poster, EST. seal, VOL. ticket and Collector's ribbon
- Live preview while you edit
- PNG export in all three post sizes: 1080×1080, 1080×1350 and 1920×1080
- Eleven model-made sample photos are bundled — six cast portraits and five places — so you can try every layout and grade without uploading a photo first

Everything runs on your own machine. Photos are never uploaded anywhere, and the app makes no network request at all — fonts and sample photos are vendored files under `app/`.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. You can also open `app/index.html` directly in the browser — it works the same way, with no server and no network.

---

<sub>Entered on [make.fun](https://make.fun/?ref=q86j3tvd&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
