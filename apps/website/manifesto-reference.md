# Creativity and planet reference

Inspected the section immediately following Community on [vvd.world](https://vvd.world/) on 6 October 2026, using the live layout, supplied screenshots and its public animation configuration.

The black stage occupies 400 viewport heights. A centered sticky text block occupies a viewport while scrolling reveals four lines. Scroll progress is measured from the stage entering the bottom of the viewport to its bottom leaving the top. Line reveal intervals are 0.05–0.20, 0.20–0.35, 0.35–0.50 and 0.50–0.65. Each line moves up 20px, fades from zero to full opacity and sharpens from 8px blur to zero. Scrolling backward reverses the reveal. Reduced motion shows all copy immediately and removes the extended sticky stage.

Desktop typography uses the reference's open-source Space Grotesk, locally hosted: 31.5px, 37.8px line height, weight 500; phone sizes are 25.2px / 33.6px. Lines have 25.2px spacing. The reference's handwritten raster lettering is represented by locally hosted Caveat; it is a substitute, not the identical handwriting asset. Both font licenses live alongside the files in `public/fonts/`.

Artists and planet have animated amber and green curved underlines. The user's spinning Earth video appears as a 25.2px circle on desktop and 21px on phones, enlarging 1.25 times on hover. It plays muted automatically while visible, without playback controls. Reduced motion uses the poster. Clicking the artists/palette offers colors and enables a simple mouse paint effect; this uses a continuous translucent brush rather than the reference's scattered bristle renderer.

Hovering or focusing planet shows eight fixed photographs. Tapping planet also opens them; leaving focus/the section dismisses them. Photos enter from scale 0.8 and opacity zero with a spring of 300 stiffness / 36 damping / 1 mass and 40ms stagger. Borders are 20% white, corners 12.6px. Desktop small/medium/large sizes are 218.4×168, 268.8×201.6 and 336×252px. Phone sizes are 151.2×117.6, 201.6×151.2 and 252×184.8px.

| Photo        | Position           |
| ------------ | ------------------ |
| Dog          | top 5%, left 3%    |
| Camping      | top 8%, left 28%   |
| Snow         | top 12%, right 18% |
| Trail        | top 38%, left 5%   |
| Grass        | top 42%, right 8%  |
| Flowers      | top 65%, left 22%  |
| Sleeping dog | top 70%, right 20% |
| Meadow       | top 88%, left 6%   |

The supplied AVIF images were moved unchanged into `public/images/planet/` with descriptive names. The duplicate `planet_07 (1)` is flowers, while `planet_07` is the trail. The original Earth video is retained in ignored `media-source/planet/`; its public silent copy is `public/videos/planet/earth-spinning.mp4`, with a local poster.

The reference text, including its 10% / 1% statement, is copied as requested design content. This section does not configure payments or actual revenue allocation.
