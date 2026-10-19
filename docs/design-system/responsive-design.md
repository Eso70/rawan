# Responsive design

Breakpoints remain literal CSS media queries because CSS custom properties cannot be substituted into media-query conditions. There is no universal grid or mobile menu in this version; preserve each real composition.

| Surface            | Implemented rule                                                                                                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing navigation | Max 1613px inner width, 34px desktop gutters; information links hide below 768px, Login link hides below 640px. Library/building entry remains. Hidden-on-scroll header is inert.                                            |
| Hero               | Desktop/phone typography and vertical offset differ; ≤600px-height desktop has a separate adjustment. Supplied mobile video is selected below 768px.                                                                         |
| Toolkit            | Max 1075px composition; below 1024px desktop feature selectors disappear and each preview receives its own heading/copy.                                                                                                     |
| Community          | Horizontal reel strip is locally clipped; page must not gain horizontal overflow. Keyboard/click selection remains.                                                                                                          |
| Manifesto/Creators | Long sticky stages have narrow/reduced-motion alternatives. Creators stack below 1024px, with local art clipping rather than viewport overflow.                                                                              |
| Footer/closing     | Footer wraps below 960px; assurances stack below 640px. No fabricated hamburger menu.                                                                                                                                        |
| Login              | Art and palette hide below 768px; form max 400px, 33.6px side gutters, 22px at ≤360px. Scroll on short displays.                                                                                                             |
| Onboarding         | Centered stage max 780px; inputs 440px, category chips 640px. Purpose cards have 3 columns then stack at ≤600px. Chips wrap; narrow/coarse-pointer targets are 44px high. Fixed backgrounds and naturally scrolling content. |
| Legal              | Main max 768px with 24px gutters; article padding 32px → 24px below 768px; h1 reduces at ≤360px.                                                                                                                             |
| Library            | Existing responsive book grid and sample cover proportions remain in `components/library/library.module.css`; dialog width is min(560px, 100% - 32px), with viewport-bounded results scrolling.                              |

Prefer native wrapping, flex/grid min-width handling and an explicit content measure. Avoid fixed-height forms or overflow that hides submit/error content. Keep `overflow-wrap:anywhere` for legal/setup long strings. Do not change media breakpoints simply to unify numbers; they represent different existing compositions.

Verification should include 320/390/1280px, short desktop height, real browser zoom, scrolling and keyboard focus near the bottom. This phase records 390/1280px public-page baselines and narrow authenticated checks in `verification.md`. Dynamic video/typewriter/spring frames require contextual visual comparison, not a claim of deterministic pixels.
