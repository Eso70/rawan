# Spark → place → world reference

Inspected [vvd.world](https://vvd.world/) on 6 October 2026, alongside the three supplied screenshots and the site's public animation configuration. This section follows the creativity/planet section on Rawan's root page.

## Layout and type

The section is 400 viewport heights long, with a sticky 100vh stage. Progress runs from the section top meeting the viewport top to the section bottom meeting the viewport bottom. The sequence reverses when scrolling upward; it is not a timed slideshow.

Desktop uses a centered two-column grid, a 1344px maximum width, 67.2px horizontal padding and a 33.6px gap. The heading occupies the left column. The right scene is scaled to 0.85. Below 1024px, the heading sits above the scene, which scales to 1.1 and shifts up 42px.

Space Grotesk is self-hosted. Desktop headings are 37.8px / 42px, weight 500; mobile headings are 25.2px / 33.6px. Card titles use italic weight 600, 25.2px / 33.6px on desktop and 21px / 29.4px on phones. Preview body copy is 14.7px with a relaxed 23.8875px line height; tree rows are 12.6px. The surface has a 16px dotted grid and moves from dark navy to a blue-gray finish. Surface color interpolation is a local approximation of the reference's page-wide background.

## Scroll choreography

| Element              | Progress interval     | Behavior                                                          |
| -------------------- | --------------------- | ----------------------------------------------------------------- |
| Spark heading        | 0 / .05 / .28 / .33   | Opacity 0 / 1 / 1 / 0                                             |
| Place heading        | .33 / .38 / .61 / .66 | Opacity 0 / 1 / 1 / 0                                             |
| World heading        | .66 / .71 / 1         | Opacity 0 / 1 / 1                                                 |
| Side images          | 0 → .42               | X ±120 → ±180px, Y 350 → −300px, rotation ±6 → ±12°, scale .8 → 1 |
| Side-image opacity   | 0 / .03 / .32 / .42   | 0 / .9 / .9 / 0                                                   |
| Center image opacity | .08 / .14 / .64 / .66 | 0 / 1 / 1 / 0                                                     |
| Center-image Y       | .08 / .20 / .38 / .50 | 300 / 0 / 0 / −152px; mobile ends at −175px                       |
| Center-image X       | .38 / .50 / .66 / .82 | 0 / 118 / 118 / 268px; mobile 0 / 85 / 85 / 195px                 |
| Center-image scale   | .38 → .50             | 1 → .5; mobile 1 → .54                                            |
| Detail card          | .35 → .48             | Y 400 → 0px; fades in over .35 → .40                              |
| Detail portrait      | .48 → .52             | Opacity 0 → 1                                                     |
| World arrangement    | .66 → .82             | Card X 0 → 150px; mobile X 0 → 90px and scale 1 → .38             |
| Tree/map arrival     | .66 → .82             | Y 300 → 0px; opacity 0 → 1 over .66 → .78; mobile scale 1 → .38   |

Spark images have 16.8px corners and a 20% white border. Before parent scene scaling they measure 302.4×403.2px on desktop, 268.8×336px on tablets and 218.4×302.4px on phones. The detail card is 540px tall and 420/380/320px wide across desktop/tablet/phone. The folder tree is 200px wide on desktop, 180px below 1024px. The map is 310px wide on desktop and 260px below 1024px. Both are 540px tall.

## Interaction and assets

The folder list expands and selects local sample entries. Six map markers select the same detail card and highlight both the marker and matching entry. Marker coordinates match the reference: harbor (12%,18%), Larkspire (65%,25%), Harrowdeep (30%,40%), outlook (62%,52%), camp (25%,72%) and coast (58%,78%). Search, New Document and the map toolbar are decorative parts of the illustration, as in the reference, rather than connected workspace features.

All five supplied AVIF files were moved unchanged into `public/images/creators/`:

| Supplied file             | Stored name     |
| ------------------------- | --------------- |
| card1.avif                | harbor.avif     |
| card2.avif                | larkspire.avif  |
| card3.avif                | outlook.avif    |
| location2.avif            | mirewalker.avif |
| World%20Map%20Normal.avif | world-map.avif  |

The initial outlook and harbor previews follow the supplied screenshots. Other sample descriptions are local illustrative text. The five supplied images are reused for entries whose separate reference portraits were not supplied; no remote portrait assets were added. This is a landing-page demonstration and does not write backend data.

Reduced-motion preferences show the completed world without the extended scrolling sequence. Hidden animation stages cannot receive folder/map focus. The website's hidden scrollbar remains in effect; scrolling still works normally.

Follow-up implementation: captions now use a single active heading with a short exit/entry transition. Phone visuals are clipped below the caption instead of translated upward. Preview content clips its overflow so wheel input continues the page. These corrections supersede the earlier caption and mobile positioning details above.
