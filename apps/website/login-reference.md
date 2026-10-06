# Login design reference

Inspected https://vvd.world/login on 6 October 2026, including the provider screen, email screen and phone presentation. Rawan implementation: `/login`.

## Layout and type

At 1280 × 720 the reference fills the viewport with a muted navy/purple background and fine dotted texture. Its artwork occupies the left portion; the form panel centers around x=992. The form width is 400px, beginning at x=792. The brand link is a 60 × 60px target, 33.6px from the top. Footer text sits 16.8px above the bottom.

| Element          | Observed reference                                                             |
| ---------------- | ------------------------------------------------------------------------------ |
| Heading          | “Step back into creation”, Arizona Sans, 37.8px, approximately 50.4px line box |
| Provider buttons | Google, Discord, Apple, Email; 400 × 46.2px; 10.5px gaps; 18.6px radius        |
| Button type      | Space Grotesk, 14.7px, centered icon and label                                 |
| Button surface   | White at 10% opacity, subtle border and translucent background                 |
| Signup prompt    | 14.7px, muted text with brighter action, 16.8px below providers                |
| Footer           | Help · Terms · Privacy · EN, 12.6px, muted                                     |
| Color controls   | Five 21px circles, 8.4px gaps, x/y=33.6px                                      |

The five reference colors are #f3e6d0, #f4b23e, #d94a33, #b18bd4 and #2c4a68. A closer inspection confirmed these controls **copy the color code** and display a dark rounded “COPIED!” tooltip; they do not recolor the background. Rawan now implements that behavior. The left edge has vertical artist credit and year. The artwork changes its composition over time while the login UI stays fixed.

Email selection replaces provider buttons with email/password fields, a password visibility control, Sign In, recovery/signup actions and Back. Recovery has only an email field, Send Reset Email, Back to sign in and Back. Signup changes the heading to “Your imagination’s new home” with a typing cursor, wraps it onto two lines, and uses Create Account. Rawan reproduces these views with accessible field labels and fade/slide transitions. Provider, recovery and submission actions explicitly report that account integration is pending; no credentials are transmitted or stored by this design preview.

The reference remembers the previously chosen provider, places it first and gives it a 25%-white surface, 30%-white border and medium weight. Rawan stores only the selected Email method, highlights and reorders it on return, and labels it “Last selected method” because the preview has not completed a real login. Regular providers use 10%-white surfaces, 20%-white borders, 8px backdrop blur and regular weight. Their measured color transitions last 150ms with cubic-bezier(.4,0,.2,1). Rawan removed the earlier hover translation. The footer language control now opens an upward dark rounded menu; only Rawan’s currently supported English is offered.

## Detailed background layers

The following values were read from the reference’s rendered styles and applied to Rawan, replacing the earlier approximate gradient:

| Layer                   | Measured value                                                           |
| ----------------------- | ------------------------------------------------------------------------ |
| Base                    | 160° linear gradient, #1d2c50 → #263e63                                  |
| Upper-right purple glow | 90% × 70% ellipse at 80% 15%, rgba(177,141,212,.35) → transparent at 60% |
| Upper-left teal glow    | 80% × 80% ellipse at 15% 20%, rgba(64,140,160,.4) → transparent at 55%   |
| Lower-right warm glow   | 100% × 80% ellipse at 70% 90%, rgba(217,74,51,.18) → transparent at 55%  |
| Shade                   | Black at 25% opacity                                                     |
| Dots                    | White at 10%, 1px radius, 15px grid                                      |
| Grain                   | Procedural fractal noise, .9 frequency, four octaves, 30% overlay blend  |

The yellow artwork backdrop changes position and orientation over time. White flowers with green stems and neon paper pieces drift and rotate across the full desktop viewport, behind the translucent form controls. Rawan recreates these decorative elements procedurally in the same Three.js canvas as the supplied sculpture. They cannot intercept login clicks. Mobile hides the full artwork layer while retaining the exact background layers.

On the observed 390 × 844 phone layout, the reference hides 3D artwork, swatches and artist credit. It centers a roughly 322px-wide panel with a 28px heading and keeps the brand at the top and utility footer at the bottom. Rawan follows this layout, allows short screens to scroll and has no horizontal overflow at sampled phone/tablet sizes.

## Rawan artwork and motion

The supplied 35MB GLB is stored unchanged at `public/models/login/dragonspire-library-monk.glb`. Its embedded metadata identifies Miniature Collectors Club as author and CC BY 4.0 as license. Attribution is displayed and recorded beside the asset. It contains no animation clips; gentle rotation, floating movement and pointer response are applied to the rendered sculpture. Its native texture and materials are retained.

Three.js and GLTFLoader load dynamically only when the desktop artwork mounts. Pixel ratio is capped at 1.5. Rendering pauses when the document is hidden; shared geometries, materials and textures are released on unmount. Reduced-motion preferences stop sculpture, flower, confetti, backdrop and heading movement. WebGL/load failures retain the usable login panel with an artwork status message.

Heading text types at 32ms per character with a blinking cursor; its complete accessible label stays stable. Provider/email/recovery views use 180ms fade/slide transitions and 300ms layout movement. Sculpture sway follows a slow sinusoidal cycle with damped pointer response; flower and paper movement use separate slower cycles. The backdrop moves through a 24-second alternating cycle. These timings are Rawan approximations of observed reference movement: the reference’s internal 3D animation curves were not available through the rendered UI. Its original animated dragon rig was not included in the supplied static monk model.

The supplied Rawan feather replaces VVD's brand and floats gently. The licensed Arizona Sans font was not supplied: the existing self-hosted Inter approximates the heading at weight 500, while the actual self-hosted Space Grotesk is used for controls. VVD's dragon is replaced by the requested monk; flowers and paper pieces are original procedural geometry. Signup, social providers, additional languages and legal/help destinations require a separate integration step.

## Validation

Website production build, TypeScript and lint pass. Browser checks cover desktop model rendering, palette selection, email view, password visibility, phone layout and home → login navigation. No authentication service is invoked by this page.
