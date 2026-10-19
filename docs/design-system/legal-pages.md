# Terms and Privacy

`/terms` and `/privacy` exist and use the same `components/legal/legal-page.tsx` shell and `legal.module.css` in `apps/website/src/`. The legal content remains in each route's `page.tsx`, preserving twelve Terms sections and ten Privacy sections. Both route sources were compared byte-for-byte against the pre-consolidation baseline and are unchanged. No legal policy or consent behavior was changed.

## Shared composition

```text
TermsPage / PrivacyPage — metadata and original policy children
└─ LegalPage({ title, current, children })
   └─ LandingScroll
      └─ dotted navy .landing-surface
         ├─ LandingNavigation
         ├─ main
         │  ├─ heading: h1 + Last updated: October 2026 · Preview draft
         │  └─ article labelled with title → sections/h2/h3/p/ul/links
         └─ SiteFooter({ current })
```

`LegalPage` props are `title: string`, `current: "terms" | "privacy"`, and `children: ReactNode`. `current` sets the matching footer link's `aria-current="page"`. The shell is already shared with two real consumers; no second legal layout, policy tab bar, side navigation or table of contents was introduced.

## Typography and geometry

- Outer content width: `min(768px, 100% - 48px)` with 128px top/96px bottom padding.
- Heading: centered Inter semibold, 36px/40px with -1px tracking; 30px/36px at ≤360px. Date/draft line is 14px/20px muted text.
- Article: Space Grotesk 14px/20px, translucent white fill and 20% white 1px border, 18px corners, 32px padding and 8px backdrop blur. Values now resolve from the same shared tokens where repeated.
- Section gaps: 24px; h2 is Inter 500 16px/24px; h3 is 14px/20px semibold. Paragraph/list rhythm stays 4/8/12px as originally implemented.
- At ≤767px, top/bottom spacing becomes 112/64px and article padding 24px. Long content wraps with `overflow-wrap:anywhere`; there is no horizontal text scroller.
- Links are underlined with a 3px offset, white foreground and the existing light-blue hover. Shared focus treatment remains visible.

## Accessibility and navigation

One page h1 precedes ordered section h2s and contextual h3s. The named article contains real paragraphs/lists/anchors. Navigation/footer are the same reusable components as the public site. Auth/onboarding links point to the real `/terms` and `/privacy` routes. Disabled promotional links remain disabled; legal text does not silently become a registration acceptance checkbox.

Metadata intentionally disables indexing on both draft pages. The displayed October 2026 value is a last-updated display, not an approved effective date or versioned binding policy. There is no separate policy-version UI. The pages identify themselves as drafts and leave operating-company/jurisdiction/final terms unspecified. Approved production legal text remains a release requirement requiring the appropriate owner; this phase does not supply it.

## Future maintenance

Change layout in `LegalPage` and its CSS; change policy wording only with explicit authorization. Keep content text outside the generic UI layer. Pass an accurate title/current route when reusing the shell. Re-check all legal links, heading order, focus, mobile wrapping and exact approved content after any future extraction. Preserve the common navy surface and shared header/footer; do not copy a whole legal route to build another shell.
