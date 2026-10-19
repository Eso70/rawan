# Rawan onboarding atmospheres

Original artwork generated on 18 October 2026 with the built-in OpenAI image-generation tool for this project. Generation used text only, no reference images, existing website assets, recognizable branded environments or third-party stock. These images are decorative and carry no information needed to complete setup. Generation is not a legal guarantee of exclusivity.

## Files and use

| Scene                                  | Steps                  | Desktop / mobile width | Approximate transfer size |
| -------------------------------------- | ---------------------- | ---------------------- | ------------------------- |
| `archive.webp` / `archive-mobile.webp` | Welcome, Purpose       | 1600 / 900px           | 70 / 29 KiB               |
| `garden.webp` / `garden-mobile.webp`   | Interests, Preferences | 1600 / 900px           | 124 / 50 KiB              |
| `horizon.webp` / `horizon-mobile.webp` | Begin                  | 1600 / 900px           | 55 / 20 KiB               |

All six files are WebP, optimized with the existing Next/Sharp dependency (quality 72 desktop / 65 mobile, effort 5, no enlargement). Responsive source changes at 767px; CSS object-fit covers the viewport. Only the requested scene and already loaded scenes are mounted. No video, external host, package or font was added. If replacing artwork, keep low-contrast centers, verify both crops/readability and preserve the static fallback.

## Exact generation prompts

Each generation used this common prefix followed by its scene text below:

> Generate an original cinematic environment photograph, landscape 16:9, for a premium literary onboarding background in Rawan. No UI, text, lettering, logos, recognizable copyrighted architecture, people, legible books or watermarks. Quiet editorial photography, softly defocused natural detail, restrained desaturated navy and slate, tiny warm parchment light accents. Understated, calm, rich depth without fantasy spectacle. Center 60 percent low contrast with no bright focal object; interesting environmental shapes at edges, readable behind centered white serif questions, also safe to crop to a vertical mobile viewport. Avoid neon, purple gradients, stars, space, illustration, oversaturation or glass UI. Scene:

Archive:

> a secluded reading room at blue hour, softly arched stone openings, tall shelves receding at the edges, one warm distant window, soft haze and quiet architectural depth.

Garden:

> a misty woodland garden seen through an old stone pavilion, elegant dark tree silhouettes around the edges, muted blue foliage and a faint warm path receding into fog; soft painterly photographic depth, no bright center.

Horizon:

> a quiet mountain lake at the last light of evening, layered navy hills and barely visible distant stone terrace framing one edge, still water and faint silvery mist, expansive calm horizon and very soft light.

Original PNGs (1672×941) remain in the local generation folder `C:/Users/esma3/.codex/generated_images/01a1393d-58d5-7071-9971-f5af8e96a08c/`: archive `exec-94e8ac05-fc15-4385-8955-6bd89703fb65.png`, garden `exec-c08ecb35-007c-4887-ab94-7183db03c2ef.png`, horizon `exec-b65c7550-7e1c-48ff-bb30-07e05cfaef5c.png`. Only optimized assets are needed at runtime.
