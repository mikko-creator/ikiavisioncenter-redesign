# MEDIA: Icare Clinic (ikiavisioncenter.com) redesign pitch, "Iris Noir"

Lane MEDIA, 2026-10-20, 10:43 to 11:09 CST. Plan: `src/content/image-plan.json` (16 stills + 2 loops). Record:
`audit/generated-images.json` (every fal call, prompt, seed, request id, sha256; rejected attempts under `rejected[]`).
Each still has a sidecar `<file>.json` with `review.verdict` (all ACCEPT, written by `tmp/img/verdicts.mjs`).

## How it was made

- **Stills:** fal `fal-ai/flux-pro/v1.1-ultra` with safety tolerance 5. `plan.defaults.style` holds the shared look and
  is appended to every prompt by `tools/fal-gen.mjs`. The look: tenebrist Caravaggio chiaroscuro, a warm-black ground, one
  amber key light raking in from the side, and a teal rim light. Every prompt ends "no text, no letters, no numbers, no
  logos, no watermark".
- **Cut-outs:** flux ultra, then `fal-ai/birefnet/v2` (Matting, 2048). **Deviation:** the two CUT-* items were generated
  from a side plan, `tmp/img/plan-cutouts.json`. It has the same ids, files and prompts, but a light-grey product style
  replaces `defaults.style`. fal-gen appends the style unconditionally, and its "deep warm-black background" would defeat
  the matting of black frames. The brief asks for a plain light-grey ground for the cut-outs.
- **Loops:** Higgsfield REST `kling-video/v3.0-turbo/image-to-video` (`tools/hf-run.mjs`, the REST key worked; MCP
  not used), then `tools/make-loop.mjs`.
- **Review:** I read every image by eye. I zoomed into crops wherever text could hide (dials, spines, temples, fabric).
  Mean luma was measured for the black-frame check (`tmp/img/stats.mjs`, `tmp/img/verdicts.mjs`).
- **Rejected attempts:** they are archived in `tmp/img/rejected/` with their sidecars. None was deleted.

## Stills

Costs are fal list prices: $0.06 per ultra call and $0.005 per cut-out call. They are not checked against the invoice.

| Slot | File | Size px | Verdict | Attempts | Notes | Est. cost |
|---|---|---|---|---|---|---|
| G-HERO-HOME | assets/generated/g-hero-home.jpg | 2752x1536 | ACCEPT (attempt 2) | 2 | Face sits in the right third (centre about 0.67 of the width). The left half is deep black for the glass panel. The amber key light grazes the cheek, nose, lips and frame rims. Teal shows only in the lens reflections, with no visible teal rim on the hair. Eyes are sharp, with a calm closed-lip smile. Mean luma 14 (dark by design). REJECT attempt 1: the face was in the left half (the mirror of the brief) and the key light was teal. | $0.12 |
| G-EXAM | assets/generated/g-exam.jpg | 2368x1792 | ACCEPT | 1 | Phoropter under a single spotlight. Zoomed crops of the top wheel (knurling) and the lower knob (notches, blank window) show no numbers or letters. | $0.06 |
| G-OPTICAL | assets/generated/g-optical.jpg | 2368x1792 | ACCEPT | 1 | Frames on teal-edged glass shelves with warm pin spots. The placards are blank and there are no brand names. | $0.06 |
| G-CONTACT | assets/generated/g-contact.jpg | 2368x1792 | ACCEPT (attempt 2) | 2 | Lens on a fingertip with natural fingerprint ridges. The lens reads slightly thick and the skin has small glints. REJECT attempt 1: reptile-scale skin, and the lens read as a glass disc. | $0.12 |
| G-KIDS | assets/generated/g-kids.jpg | 2368x1792 | ACCEPT | 1 | Joyful child in rainbow frames in warm window light. No hands in frame, no text. Generic child model. | $0.06 |
| G-IRIS | assets/generated/g-iris.jpg | 2752x1536 | ACCEPT | 1 | Amber iris macro with a teal catchlight; it echoes the logo's orange iris. It is brighter than the brief (the skin is lit) and the lashes are slightly stylised. | $0.06 |
| G-LIBRARY | assets/generated/g-library.jpg | 2368x1792 | ACCEPT | 1 | Blank pages, reading glasses and a brass lamp. The closed book at the top right has out-of-focus gilt spine ornaments with no legible glyphs. Crop it off (`object-position: left bottom`) when the image is shown large. | $0.06 |
| G-SENIOR | assets/generated/g-senior.jpg | 2368x1792 | ACCEPT | 1 | Smiling older adult in round glasses, in warm window chiaroscuro. Natural face, no text. | $0.06 |
| G-SCREEN | assets/generated/g-screen.jpg | 2368x1792 | ACCEPT | 1 | Teal screen glow on the face and clear glasses, with an amber lamp behind. The screen is out of frame. The zip tape (zoomed) is plain. | $0.06 |
| G-SUN | assets/generated/g-sun.jpg | 2368x1792 | ACCEPT (attempt 2) | 2 | Round gold wire sunglasses on dark stone in a hard beam, with long amber lens shadows. No marks. REJECT attempt 1: pseudo-text on the inside of the temple. | $0.12 |
| G-CARE | assets/generated/g-care.jpg | 2368x1792 | ACCEPT | 1 | Hands polishing a lens with a cloth. The fingers look natural and the far hand is in soft focus. The lens reads tinted. | $0.06 |
| G-DROP | assets/generated/g-drop.jpg | 2368x1792 | ACCEPT | 1 | A droplet and jet over a dark liquid surface (not a glass lens), lit amber and teal. Mean luma 11.7 (dark by design). | $0.06 |
| G-LIGHT | assets/generated/g-light.jpg | 2752x1536 | ACCEPT | 1 | Abstract amber and teal ribbons and bokeh with no objects. It is the source of V-LIGHT. | $0.06 |
| G-TEAM-BG | assets/generated/g-team-bg.jpg | 2752x1536 | ACCEPT | 1 | Amber light shaft on a dark textured wall over a dark tiled floor. No people or objects. There is no teal edge glow. | $0.06 |
| CUT-FRAMES | assets/generated/cut-frames.png | 2048x2048 | ACCEPT (attempt 1, restored) | 2 | Clean black-and-tortoiseshell acetate. It is a **front view**, not the three-quarter view asked for. 94.5% of pixels are fully transparent and the lenses are see-through (mean alpha about 24/255). The alpha bbox is 273,766 to 1809,1241, so nothing is clipped. REJECT attempt 2 (three-quarter prompt): it came back folded with pseudo-text on both temples. The clean attempt 1 was put back with `tmp/img/restore.mjs`. | $0.13 |
| CUT-SUNGLASSES | assets/generated/cut-sunglasses.png | 2048x2048 | ACCEPT (attempt 3) | 3 | Round gold wire frame with amber gradient lenses in a three-quarter view, no marks. 88.1% of pixels are fully transparent and the lenses are an opaque tint. The alpha bbox is 167,716 to 1871,1523, so nothing is clipped. REJECT attempt 1: a pseudo-logo on the lens corner. REJECT attempt 2: a gold emblem on the far temple. | $0.195 |

None of the stills is a black frame; every one has content when viewed. The cut-out PNGs have low mean luma only because
their transparent pixels are stored as black.

## Loops

Both clips came from Higgsfield REST `kling-video/v3.0-turbo/image-to-video` at 1080p. The output was 1928x1072,
24 fps, with an AAC track that is dropped. Both are declared in the plan as `kind: "video"` and marked `optional`, so a
bare fal-gen run never sends them to fal.

| Loop | Source | Request id | Clip | Loop | Files (bytes) | Calmness YDIF (0-255) |
|---|---|---|---|---|---|---|
| V-HERO | G-HERO-HOME (accepted attempt 2) | 23653e20-6723-496e-a310-ad4d87aa47ad | 10.04 s | 19.54 s, 1920x1068 | v-hero.mp4 1,720,733 · v-hero.webm 952,929 · v-hero-phone.mp4 1,204,264 (720x1282, `--phone-x 0.70`, which keeps the eyes, nose and lips) · v-hero-poster.webp 40,530 | max 2.19, p95 1.66, mean 0.95, 0 frames over 20, seam 1.15 |
| V-LIGHT | G-LIGHT | 17b706c1-499e-4cf6-9141-1de17fd3df13 | 5.04 s | 9.54 s, 1920x1068 | v-light.mp4 1,334,452 · v-light.webm 686,183 · v-light-poster.webp 44,920 | max 1.82, p95 1.16, mean 1.07, 0 frames over 20, seam 1.82 |

- **V-HERO motion prompt:** a very subtle amber light drift, one gentle blink, a slight chin lift and a slow push-in,
  with no cuts.
- **V-LIGHT motion prompt:** slow drifting caustics and shimmering bokeh, with a static camera.
- **Loop method (deviation from the plain make-loop crossfade):**
  - The first V-HERO loop used the plain 1.5 s crossfade, and its YDIF was calm (max 1.92).
  - Even so, frames inside the crossfade showed **two superimposed faces**. The push-in makes the first and last frames
    differ in scale, and YDIF did not catch it.
  - Both loops were therefore rebuilt from a forward-then-reversed clip: `tmp/hf/v-hero-pingpong.mp4` and
    `tmp/hf/v-light-pingpong.mp4` (ffmpeg `reverse` + `concat`).
  - They then went through `make-loop --fade 0.5`, which blends frames less than 0.5 s apart.
  - Seven frames across the whole V-HERO loop were checked (0, 5, 9.5 turnaround, 14, 19.1, 19.35 and 19.5 s), and each
    shows a single clean face.
  - Side effect: at the turnaround the push-in reverses into a gentle pull-out.
- **AI label:** every mp4/webm carries it in the container tags, written by make-loop.
  - The two posters had no label, so I embedded the XMP with `webpmux -set xmp tools/ai-label.xmp`.
  - The two loop JSONs had no label field, so I added `iptcDigitalSourceType`, provenance and source.
  - `node tools/ai-label.mjs verify assets/generated --control` reports 41 files, 41 labelled, 0 missing, and the control
    fired for jpeg, png and video.
- **Records:** `tmp/hf/v-hero.mp4.json` and `tmp/hf/v-light.mp4.json` hold the raw clips' records.
  `assets/generated/video/v-*.json` hold the loop measurements and their sources.

## Calls and spend (running total)

| Provider | Calls | Estimated cost |
|---|---|---|
| fal flux-pro ultra | 22 of the 40 budget: 16 accepted, 6 rejected (hero 1, contact 1, sun 1, frames 1, sunglasses 2) | $1.32 |
| fal birefnet cut-out | 5 of the 6 budget: frames 2, sunglasses 3 | $0.025 |
| Higgsfield Kling 3.0 turbo i2v, 1080p | 2 of the 3 budget: V-HERO 10 s (estimate 22.4 credits, $1.40, under the $1.50 stop), V-LIGHT 5 s (estimate 11.2 credits, $0.70) | $2.10 |
| Higgsfield `/estimate` | 4 calls; 2 were refused with HTTP 400 for having no image_url. No generation was run, and I assume no charge (unverified). | $0 |
| **Total** | | **about $3.45** |

These are estimates only. fal is counted at list price by `tools/fal-gen.mjs`, and Higgsfield is counted at its own
`/estimate` figure. Neither is checked against an invoice or the credit balance.

## Checks

- `node src/build.mjs`: exit 0. The summary reads "images planned 408 made 8 failed 0 | missing 0 | videos 2 |
  warnings 0".
- AI label: 41 of 41 files labelled, and the positive control fired (above).
- Keys: neither API key is anywhere in the workspace. I scanned 3,269 files outside `.git` for every key part and found
  0 hits. A positive control on the keys folder flagged both key files. The keys were only ever read through
  `--key-file` from the session scratchpad.

## Left undone / notes for the template lanes

- CUT-FRAMES is a front view. One cut-out call remains in the budget for another three-quarter attempt. Flux printed
  pseudo-text on acetate temples twice, which is why the front view was kept.
- G-HERO-HOME and V-HERO put her face in the right third and leave the left half dark for the glass text panel. On
  phones use `v-hero-phone.mp4`.
- G-LIBRARY: crop off the top-right spine when the image is shown large. G-IRIS is the brightest still; give it a
  vignette if it sits beside the dark stages.
- Tools added in MEDIA's own area:
  - `tmp/img/stats.mjs`: luma, alpha coverage and bbox.
  - `tmp/img/restore.mjs`: puts an archived attempt back and patches the record.
  - `tmp/img/verdicts.mjs` and `tmp/img/verdicts.json`: sidecar and record verdicts.
  - `tmp/img/plan-cutouts.json`.
- Nothing is left running. No git commits and no memory notes were written.
