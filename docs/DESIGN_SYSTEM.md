# Design system

The visual identity follows the official reference image. Tokens live in `src/config/design-tokens.ts`; CSS variables mirror them in `src/app/globals.css`.

| Token | Value |
|---|---|
| primary | `#8E3FA3` |
| primaryDark | `#5C285F` |
| primaryLight | `#EBD8EF` |
| veryLightPurple | `#F8EFF9` |
| gold | `#C99A4A` |
| goldLight | `#F0D49A` |
| background | `#FFFFFF` |
| text | `#3D3040` |
| textMuted | `#8A7C8D` |

Foundation components are in `src/components/ui`; `Logo` is in `src/components/app`. The first-screen model asset is mandatory and must follow the reference.

## Client reference composition

The ten-screen image is a specification, not a screenshot to embed in the UI.
Client-only styles live in `src/app/(client)/client-reference.css`; they do not
apply to Splash, Auth or Admin. Client typography uses self-hosted Roboto through
`next/font`, with title/body/caption/greeting tokens in `clientTypography` and CSS.
The source does not identify its original font; Roboto is a visual approximation,
not a claimed exact font match. Serif branding on Splash/Auth remains unchanged.

Home is composed as one purple hero containing the authenticated greeting and
daily-workout card, followed by three shortcuts and a motivational banner. The
empty workout state preserves the card footprint without an invented workout or
athlete. The existing official horizontal artwork supplies the hero atmosphere
and the tips banner; the logo and woman assets are never regenerated.

The second shortcut retains the functional nutrition destination and label from
the client audit. This differs from the reference's "Minha evolução" label and is
explicitly recorded rather than silently routing an evolution label to nutrition.
Plans use actual database descriptions/prices and detail links, not reference
example features or simulated subscriptions. Missing artwork and populated-data
limits must be reported before any complete visual-fidelity approval.
