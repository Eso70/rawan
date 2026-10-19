# Author Studio backgrounds

Ten original AI-generated landscape artworks for Rawan Author Studio, created with the built-in image-generation tool on 2026-10-19. No stock image downloads or external image services are used at runtime.

The full artwork is preserved in optimized WebP format (about 1672 × 941 pixels per scene). All ten full-size files together are approximately 2.7 MB. Only the backend-selected full-size image loads. Smaller WebP previews remain in `thumbnails/` for asset documentation. Studio applies blur and a dark translucent overlay to keep writing controls readable.

| Asset | Season | Time / weather |
| --- | --- | --- |
| `spring-dawn.webp` | Spring | Dawn, blossom and mist |
| `spring-rain.webp` | Spring | Rainy afternoon garden |
| `summer-noon.webp` | Summer | Sunlit coast |
| `summer-golden-hour.webp` | Summer | Meadow at sunset |
| `summer-night.webp` | Summer | Starry lake |
| `autumn-morning.webp` | Autumn | Misty morning woodland |
| `autumn-evening.webp` | Autumn | Rainy reading room at evening |
| `winter-dawn.webp` | Winter | Snowy forest at dawn |
| `winter-night.webp` | Winter | Moonlight and a distant cabin |
| `blue-hour-valley.webp` | All seasons | Mountain valley at twilight |

The final prompt for every scene is recorded verbatim in [prompts.json](prompts.json). Shared direction: cinematic painterly realism, a wide landscape composition, natural seasonal light, calm central space for controls, no people, text, branding or UI. Each scene was generated separately. Encoding and preview sizing preserve the artwork; originals remain in the image-generation tool's output folder.

The backend automatically applies a scene. `GET /api/v1/studio/background` chooses it using the API server's UTC hour and northern-hemisphere calendar season. Studio reads it through its same-origin `/api/studio/background` bridge on opening and every five minutes. There is no background picker, user override or stored appearance preference; the old local preference is ignored. If the API or image fails, the current view stays usable, with the original navy-and-sage atmosphere as the initial fallback. The endpoint is public because it returns only an artwork ID and refresh interval; no account or location information is involved.
