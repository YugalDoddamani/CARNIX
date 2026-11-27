# Study Desk design system — dashboard direction

## Intent

A playful learning workspace inspired by the approved dashboard reference. Keep the interface clear and functional: dark rounded frame, light content area, pastel study cards and a compact floating bottom navigation. The reading experience should be quieter than the landing page while keeping the same typography, colours and controls. This updates the earlier notebook direction for the new Web Guide; it does not alter the original Drive study guides.

## Tokens

| Role | Token | Value |
|---|---|---|
| Canvas | `--canvas` | `#ddf5f6` |
| Content background | `--panel` | `#f5f6f4` |
| Reading surface | `--surface` | `#ffffff` |
| Primary text | `--ink` | `#17231f` |
| Secondary text | `--muted` | `#485852` |
| Frame and navigation | `--dark` | `#111916` |
| Accent | `--accent` | `#2a755e` |
| Border | `--border` | `#d3ddd7` |
| Pastel green | `--green` | `#cef4d6` |
| Pastel blue | `--blue` | `#daf3f7` |
| Pastel lavender | `--lavender` | `#edd4f1` |
| Pastel yellow | `--yellow` | `#fae9b3` |

Use solid colours. The dark frame is a structural element, not an all-dark theme. Pastels distinguish content groups; they are not a substitute for text or status. Check contrast for every new colour pair.

## Typography

- **Outfit** for display, headings and compact interface labels.
- **Source Sans 3** for body copy and extended reading. Both are locally hosted with licence files.
- Do not use Inter, Roboto, Arial or system-ui as the brand voice. Generic sans-serif may remain a fallback if a font fails.
- Prefer natural sentence case and short, informative labels. Body copy in reading pages is approximately 16px and uses a generous line-height.

## Layout and components

- On desktop use a rounded frame, a dark top bar and three dashboard columns: study guides, chapters/search and related tools. On tablet, the utility panel moves below the first two columns; on phones, all content stacks in reading order.
- Dotted lines may connect genuinely related material. They are decorative aids and must not imply an unverified relationship or carry essential information alone.
- Cards are rounded and have varied emphasis where useful; avoid perfectly identical card grids. One highlighted card is enough. Keep shadows subtle and avoid hover-scale or decorative animation.
- Bottom navigation is fixed, labelled and usable on both mobile and desktop. Use real destinations: Home, Guides, Chapters, Revise and Lab tour. Allow sufficient bottom spacing for it not to obscure the final content.
- The small-screen menu uses native `details`/`summary` so navigation works without JavaScript. Provide keyboard-visible focus and sufficiently large touch targets.
- Reading pages use an accessible contents menu, clear headings, notes, tables and redrawable flowcharts. Wide tables scroll in their own focusable region. Printing omits navigation and preserves text and diagrams.
- The dashboard search filters visible cards and gives a text result count. A future full-site search should clearly describe its scope and never claim to search material it has not indexed.

## Avoid

Invented progress, user profiles, analytics, event dates or buttons with no real action; purple gradients; tiny low-contrast labels; decorative rules used as a layout crutch; large numbers with no meaningful sequence; decorative blur; bounce and hover-scale. Do not add a promotional/Unslop footer. Maintain relevant attribution in project documentation and any required source notices.

## Implementation

Use a common design-system stylesheet (`styles.css`) and one shared stylesheet per category (`guides.css`, `chapters.css` for chapters and revision, and `lab.css`), plus the shared JavaScript file, separate HTML pages and relative paths. Use the dashboard palette, type, rounded surfaces and navigation across the site; preserve readable instructional diagrams and interactions. The five guides, five chapters and revision bank have been migrated; the 3D tour is integrated with its models in the single shared JavaScript bundle. The separate tour-view document isolates its specialised interface while using the lab category stylesheet. Keep all original learning content, citations and print features intact. Three lab-practice guides (diagnostic wax-up types, colour-coded FPD waxes, biomedical waste management) were added later from class notes; they use the guide category stylesheet and appear in the dashboard's Explore more column.

## Attribution

The earlier notebook direction was adapted from [Unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky, licensed CC BY 4.0. Font licence texts are in `fonts/`.
