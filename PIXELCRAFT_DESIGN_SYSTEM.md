# PIXELCRAFT — Retro Developer Portfolio & Blog
## Implementation-Ready Token-Driven UI Guidance & Component System Specification

---

## 1. Context and Goals

### Design Intent
> Deliver a rugged, high-contrast 8-bit retro aesthetic inspired by early arcade and terminal computing that marries nostalgic monospace typography and chunky hard-drop shadows with modern, WCAG 2.2 AA accessible dashboard usability.

### Surface & Audience
- **Product & Brand:** PIXELCRAFT — Retro Developer Portfolio & Blog
- **Live Reference URL:** `https://pixelcraft-retro-pixel-art-portfolio-v1.21st.app/`
- **Primary Audience:** Technical readers, software engineers, retro enthusiasts, and knowledge seekers.
- **Product Surface:** Dashboard web application featuring content feeds, tech stack matrices, metric scoreboards, and interactive devlogs.
- **Core Engineering Mission:** Provide token-governed, accessible, and implementation-ready UI rules that eliminate design ambiguity, streamline frontend delivery, and guarantee visual and functional consistency across all viewport densities.

---

## 2. Design Tokens and Foundations

All components **must** consume semantic design tokens exclusively. Hardcoded hex values, arbitrary pixel values, and untokenized transitions are strictly prohibited.

### 2.1 Color Tokens

```css
:root {
  /* Surfaces */
  --color-surface-base:    #000000; /* Deep terminal backdrop */
  --color-surface-muted:   #ffffff; /* Clean high-contrast card background */
  --color-surface-raised:  #ffca2d; /* Retro amber/gold interactive accent */
  
  /* Text & Ink */
  --color-text-primary:    #0a0a0a; /* High-contrast foreground ink on light surfaces */
  --color-text-tertiary:   #737373; /* Subdued metadata / timestamp ink */
  --color-text-inverse:    #374151; /* Dark-slate text on muted/secondary backgrounds */

  /* Borders */
  --color-border-default:  #e5e5e5; /* Structural perimeter divider */
}
```

#### Contrast Matrix & Compliance Checks
- `--color-text-primary` (`#0a0a0a`) on `--color-surface-muted` (`#ffffff`): **19.8:1** (Passes WCAG AAA).
- `--color-text-primary` (`#0a0a0a`) on `--color-surface-raised` (`#ffca2d`): **13.5:1** (Passes WCAG AAA).
- `--color-surface-raised` (`#ffca2d`) on `--color-surface-base` (`#000000`): **14.2:1** (Passes WCAG AAA).
- Text elements **must not** render text below a 4.5:1 contrast ratio against their immediate parent surface.

### 2.2 Typography Tokens

The primary typographical voice is pixelated, monospaced, and reminiscent of CRT displays. The base reading size is fixed at 18px to preserve legibility for dot-matrix glyphs.

```css
:root {
  /* Font Family Stacks */
  --font-family-primary:   "VT323", monospace;
  --font-family-stack:     "VT323", monospace;

  /* Base Typography */
  --font-size-base:        18px;
  --font-weight-base:      400;
  --font-lineHeight-base:  28.8px; /* 1.6 relative ratio */

  /* Modular Typographic Scale */
  --font-size-xs:          14px;   /* Micro-labels, system badges */
  --font-size-sm:          16px;   /* Secondary metadata, captions */
  --font-size-md:          18px;   /* Default body copy, table values */
  --font-size-lg:          20px;   /* Prominent body, card subheadings */
  --font-size-xl:          24px;   /* Section headers, widget titles */
  --font-size-2xl:         36px;   /* Hero sub-headlines, major metric values */
  --font-size-3xl:         60px;   /* Hero display titles, brand header */
}
```

### 2.3 Spacing Scale Tokens

Layout geometry snaps to an 8-step modular grid. All paddings, margins, and gaps **must** resolve to these tokens.

```css
:root {
  --space-1: 6px;   /* Micro-offsets, badge paddings */
  --space-2: 8px;   /* Compact gap, button vertical padding */
  --space-3: 12px;  /* Icon gaps, table cell padding */
  --space-4: 16px;  /* Standard component interior padding */
  --space-5: 24px;  /* Card padding, grid gaps */
  --space-6: 32px;  /* Card grouping spacing, sub-section breaks */
  --space-7: 48px;  /* Major section margins */
  --space-8: 64px;  /* Page canvas padding, layout margins */
}
```

### 2.4 Radius, Elevation & Motion Tokens

PIXELCRAFT utilizes hard, zero-blur brutalist shadows to simulate 8-bit depth. Rounded borders are completely prohibited (`border-radius: 0px`).

```css
:root {
  /* Corner Radii */
  --radius-none:           0px;

  /* Hard Pixel Shadows (X-offset Y-offset Blur Spread Color) */
  --shadow-1:              rgba(10, 10, 10, 0.8) 8px 8px 0px 0px; /* Primary card / button elevation */
  --shadow-2:              rgba(10, 10, 10, 0.8) 4px 4px 0px 0px; /* Active / compact element elevation */

  /* Timing & Motion */
  --motion-duration-instant: 150ms; /* Button depresses, toggle switches */
  --motion-duration-fast:    200ms; /* Hover color transitions, dropdowns */
  --motion-duration-normal:  300ms; /* Drawer slides, toast popups */
  --motion-ease-default:     cubic-bezier(0.25, 1, 0.5, 1);
}
```

---

## 3. Component-Level Rules

Based on the known dashboard page component density:
- **Navigation Components (2):** `TopBarNav` (1), `SidebarNav` (1)
- **Button Components (9):** `ButtonPrimary` (3), `ButtonSecondary` (3), `ButtonIcon` (3)
- **Card Components (11):** `StatCard` (4), `DevlogCard` (4), `ProjectCard` (3)
- **Link Components (19):** `BreadcrumbLink` (3), `InlineTextLink` (6), `FilterTagLink` (6), `FooterMetaLink` (4)

---

### 3.1 Navigation Components (Density: 2)

#### 3.1.1 Global Top Bar Navigation (`TopBarNav`)
- **Anatomy:** 
  1. Outer Banner Container
  2. Retro Brand Glyph & Wordmark (`font.size.2xl`)
  3. Status Ticker / System Pulse Indicator
  4. Desktop Navigation Link Array
  5. Terminal Status Action Button
- **Tokens Required:**
  - Background: `--color-surface-base`
  - Border Bottom: `3px solid var(--color-surface-raised)`
  - Padding: `--space-3` `--space-6`
  - Typography: `--font-family-stack`, `--font-size-md`
- **States:**
  - *Default:* Black bar, gold border baseline, amber text highlights.
  - *Hover (Links):* Inverted pill highlight (`background: var(--color-surface-raised)`, `color: var(--color-text-primary)`).
  - *Focus-Visible:* Inset focus ring: `outline: 2px solid var(--color-surface-raised); outline-offset: 4px;`.
  - *Active:* Navigation link depressed by 2px (`transform: translate(2px, 2px)`).
  - *Loading:* Ticker text displays running ASCII spinner `[ / ] [ - ] [ \ ] [ | ]`.
- **Keyboard, Pointer & Touch:**
  - Top level links **must** be sequential <kbd>Tab</kbd> stops.
  - Touch target size **must** be at least 44px × 44px on viewport widths below 768px.
- **Responsive & Overflow:**
  - Viewports ≤ 768px **must** collapse the horizontal navigation link list into a retro dropdown menu triggered by a `<button aria-expanded="false" aria-controls="mobile-nav">`.

#### 3.1.2 Dashboard Category Rail / Breadcrumb Navigation (`SubCategoryNav`)
- **Anatomy:**
  1. Track Container
  2. Category Badge Array
  3. Active Path Breadcrumb Label
- **Tokens Required:**
  - Background: `--color-surface-muted`
  - Border: `2px solid var(--color-text-primary)`
  - Box Shadow: `--shadow-2`
  - Padding: `--space-2` `--space-4`
- **States:**
  - *Default:* Border `#0a0a0a`, white interior, text `#0a0a0a`.
  - *Hover:* Background tint to `--color-surface-raised`.
  - *Active:* Shadow collapses to `0px 0px 0px 0px`, `transform: translate(4px, 4px)`.
- **Responsive:**
  - Category row **must** support smooth horizontal scrolling (`overflow-x: auto`) with hidden scrollbars on mobile viewports.

---

### 3.2 Button Components (Density: 9)

All buttons in PIXELCRAFT **must** convey mechanical tactile feedback. They utilize hard 8-bit shadows that collapse onto the canvas when pressed.

```
+------------------------------------+
|  [>] ACTION BUTTON TEXT            |--+
+------------------------------------+  |  <- --shadow-1 (8px offset)
  +-------------------------------------+
```

#### 3.2.1 Primary Action Button (`btn-primary` — Count: 3)
- **Anatomy:** Label Text, Leading Retro Icon/Glyph, Hard Shadow Container.
- **Tokens Required:**
  - Background: `--color-surface-raised` (`#ffca2d`)
  - Text Color: `--color-text-primary` (`#0a0a0a`)
  - Border: `2px solid var(--color-text-primary)`
  - Box Shadow: `--shadow-1`
  - Font: `--font-family-stack`, `--font-size-lg`, `--font-weight-base`
  - Padding: `--space-2` `--space-5`
- **State Specifications:**
  - **Default:** `--color-surface-raised` background, `--shadow-1` applied, `transform: none`.
  - **Hover:** Background remains `--color-surface-raised`, cursor: `pointer`. Brightness increases by 5% (`filter: brightness(1.05)`).
  - **Focus-Visible:** `outline: 3px solid var(--color-surface-base); outline-offset: 3px;`.
  - **Active / Pressed:** `transform: translate(4px, 4px); box-shadow: var(--shadow-2);` (or translate 8px with 0px shadow).
  - **Disabled:** Background: `--color-border-default`, text: `--color-text-tertiary`, border: `2px solid var(--color-text-tertiary)`, box-shadow: `none`, cursor: `not-allowed`, `pointer-events: none`.
  - **Loading:** Label replaced with animated ASCII bracket `[ PROCESSING... ]`, `aria-busy="true"`.
  - **Error State:** Border shifts to red accent (`#dc2626`), button shakes horizontally via 150ms keyframe animation.
- **Keyboard & Touch:**
  - Must activate on <kbd>Enter</kbd> and <kbd>Space</kbd>.
  - Mobile touch hit area **must** meet or exceed 48px height.

#### 3.2.2 Secondary Outline Button (`btn-secondary` — Count: 3)
- **Tokens Required:**
  - Background: `--color-surface-muted` (`#ffffff`)
  - Text Color: `--color-text-primary` (`#0a0a0a`)
  - Border: `2px solid var(--color-text-primary)`
  - Box Shadow: `--shadow-2`
  - Padding: `--space-2` `--space-4`
- **States:**
  - *Hover:* Background swaps to `--color-surface-raised`.
  - *Active:* `transform: translate(2px, 2px); box-shadow: 2px 2px 0px 0px rgba(10,10,10,0.8);`.
  - *Disabled:* Opacity 50%, no shadow.

#### 3.2.3 Retro Icon Button (`btn-icon` — Count: 3)
- **Tokens Required:**
  - Width: `44px`, Height: `44px`
  - Border: `2px solid var(--color-text-primary)`
  - Box Shadow: `--shadow-2`
  - Display: `grid`, `place-items: center`
- **States:**
  - Identical mechanical press displacement: active state drops shadow to 0 and translates 4px down-right.

---

### 3.3 Card Components (Density: 11)

Cards serve as retro arcade cartridges or CRT monitor panes. Cards **must** possess a solid border and brutalist offset shadow.

#### 3.3.1 Metric & Stat Cards (`StatCard` — Count: 4)
- **Anatomy:**
  1. Top Window Bar with retro minimize/close glyphs `[_][X]`
  2. Metric Micro-Label (`font.size.sm`, `--color-text-tertiary`)
  3. Metric Giant Value (`font.size.2xl` or `font.size.3xl`, `--color-text-primary`)
  4. Delta Pill Indicator (`font.size.xs`)
- **Tokens Required:**
  - Background: `--color-surface-muted`
  - Border: `2px solid var(--color-text-primary)`
  - Shadow: `--shadow-1`
  - Padding: `--space-4`
- **States:**
  - *Default:* Static presentation.
  - *Hover:* If card is clickable, translates `-2px, -2px` with expanded shadow (`10px 10px 0px 0px`).
  - *Loading:* Value replaced by skeleton blocks `██████`.
  - *Empty:* Value renders `---`, Delta displays `NO DATA RECORDED`.

#### 3.3.2 Devlog Feed Cards (`DevlogCard` — Count: 4)
- **Anatomy:**
  1. Publication Timestamp & Reading Time
  2. Article Headline (`font.size.xl`, font-weight: 400)
  3. Excerpt Paragraph (`font.size.md`, line-height: `font.lineHeight.base`)
  4. Tag Array (`FilterTagLink`)
  5. Read Devlog Action Button
- **Tokens Required:**
  - Background: `--color-surface-muted`
  - Border: `2px solid var(--color-text-primary)`
  - Shadow: `--shadow-1`
  - Padding: `--space-5`
- **Overflow & Long Content:**
  - Headlines exceeding 2 lines **must** wrap naturally without text clipping.
  - Excerpt **must** clamp to 3 lines (`-webkit-line-clamp: 3; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;`).

#### 3.3.3 Project Portfolio Showcase Cards (`ProjectCard` — Count: 3)
- **Anatomy:**
  1. Pixel Art Banner Preview / Canvas Frame (Aspect ratio 16:9)
  2. Project Title (`font.size.xl`)
  3. Tech Stack Chips Container
  4. Dual Action Links: `Live Demo`, `Source Code`
- **Tokens Required:**
  - Background: `--color-surface-muted`
  - Border: `3px solid var(--color-text-primary)`
  - Shadow: `--shadow-1`
  - Margin Bottom: `--space-5`
- **Empty State:**
  - When no preview image is available, render an 8-bit placeholder grid pattern using CSS radial dots with text `[ NO MEDIA FOUND ]`.

---

### 3.4 Link Components (Density: 19)

Links in PIXELCRAFT **must** never be ambiguous or lack clear visual affordance.

#### 3.4.1 Breadcrumb Links (`BreadcrumbLink` — Count: 3)
- **Tokens:** `--font-size-sm`, `--color-text-tertiary`.
- **States:** Hover transitions to `--color-text-primary` with `text-decoration: underline 2px`.
- **Separator:** Visual delimiter **must** be an ASCII glyph: ` / ` or ` > `.

#### 3.4.2 Inline Text Links (`InlineTextLink` — Count: 6)
- **Tokens:** `--font-size-md`, `--color-text-primary`.
- **Anatomy:** Permanent bottom border `border-bottom: 2px solid var(--color-surface-raised)`.
- **States:**
  - *Hover:* Background highlights with `--color-surface-raised`, color shifts to `--color-text-primary`.
  - *Focus-Visible:* `outline: 2px solid var(--color-text-primary); outline-offset: 2px;`.

#### 3.4.3 Filter Tag Links (`FilterTagLink` — Count: 6)
- **Tokens:**
  - Background: `--color-surface-muted`
  - Border: `1px solid var(--color-text-primary)`
  - Padding: `--space-1` `--space-3`
  - Font: `--font-size-xs`
- **States:**
  - *Active / Selected:* Background `--color-surface-raised`, font-weight bold, border width `2px`.
  - *Focus-Visible:* `outline: 2px solid var(--color-text-primary)`.

#### 3.4.4 Footer Metadata Links (`FooterMetaLink` — Count: 4)
- **Tokens:** `--font-size-xs`, `--color-text-tertiary`.
- **States:**
  - *Hover:* Color `--color-surface-muted` (when on black footer) or `--color-text-primary`.

---

## 4. Accessibility Requirements & Acceptance Criteria

Target standard: **WCAG 2.2 Level AA**.

### 4.1 Testable Acceptance Criteria

| Criteria ID | Requirement | Test Verification Method | Pass Condition |
|---|---|---|---|
| **A11Y-01** | Color Contrast | Automated axe-core / Lighthouse audit | Normal text ≥ 4.5:1, UI components & borders ≥ 3.0:1 |
| **A11Y-02** | Keyboard Navigability | Manual keyboard sequence test (<kbd>Tab</kbd>, <kbd>Shift+Tab</kbd>) | All interactive elements (19 links, 9 buttons, 2 navs) reachable without traps |
| **A11Y-03** | Visible Focus Rings | Visual inspection on keyboard focus | Every focused element displays a high-contrast focus outline ≥ 2px wide |
| **A11Y-04** | Touch Target Size | Mobile device simulation (Chrome DevTools) | Interactive hit targets measure ≥ 44px × 44px |
| **A11Y-05** | Screen Reader Semantics | VoiceOver / NVDA screen reader test | All cards, buttons, and custom controls possess valid ARIA roles and accessible names |
| **A11Y-06** | Reduced Motion Support | Emulate `prefers-reduced-motion: reduce` | All translates, shakes, and transitions drop to 0ms or instant state |
| **A11Y-07** | Text Resize & Zoom | Browser zoom test up to 200% | Layout reorganizes without horizontal text truncation or collision |

### 4.2 Mandatory Reduced Motion Overrides

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 5. Content and Tone Standards

### Tone of Voice
- **Concise:** Say it with terminal economy. Strip corporate fluff.
- **Confident:** Speak as a seasoned developer who builds durable software.
- **Implementation-Focused:** Provide practical specifications, commands, and actionable data.

### Copywriting Examples: Do vs. Don't

| Context | Do (Compliant) | Don't (Prohibited) |
|---|---|---|
| **Button Action** | `[ RUN TEST SUITE ]` | `Click here to begin testing our platform` |
| **Status Message** | `BUILD: PASSED [0 ERRORS, 2 WARNINGS]` | `Everything looks great and went smoothly!` |
| **Error Feedback** | `ERR 404: MODULE NOT FOUND IN SECTOR` | `Oopsie! We couldn't find what you were looking for :(` |
| **Empty State** | `NO COMMITS LOGGED FOR CURRENT REPO` | `Nothing here yet, check back soon!` |
| **Devlog Action** | `READ LOG FILE [8 MIN]` | `Learn more` |

---

## 6. Anti-Patterns & Prohibited Implementations

Teams and implementers **must not** deploy any of the following:

1. **No Gaussian Blur Shadows:** Prohibited from using soft, feathered CSS box shadows (`box-shadow: 0 4px 20px rgba(0,0,0,0.15)`). Only hard-offset, 0px-blur shadows (`--shadow-1`, `--shadow-2`) are permitted.
2. **No Rounded Radii:** Prohibited from applying `border-radius > 0px`. All borders, badges, buttons, cards, and image viewports **must** remain crisp, sharp right angles (`0px`).
3. **No Decorative Gradients:** Background gradients, shiny glassmorphism, or modern mesh overlays are strictly banned. Color surfaces **must** be flat, opaque, and token-governed.
4. **No Raw Color Hex In Components:** Directly typing `#ffca2d` or `#0a0a0a` in component CSS is prohibited. Use `var(--color-surface-raised)` and `var(--color-text-primary)`.
5. **No Outlines Removed Without Replacement:** `outline: none` or `outline: 0` without a corresponding `:focus-visible` replacement is a critical build-failing defect.
6. **No Non-Monospace Font Injections:** Prohibited from mixing sans-serif (e.g., Arial, Inter) into body content unless strictly providing fallback stacks behind `VT323, monospace`.

---

## 7. QA Checklist & Verification Matrix

Engineering, Design, and QA **must** sign off on this checklist prior to production deployment:

### Visual & Token Fidelity
- [ ] Typography renders in `VT323` across all browser engines (Chrome, Firefox, Safari, Edge).
- [ ] Base font size measures exactly 18px with 28.8px line-height.
- [ ] All 11 cards display `--shadow-1` (`8px 8px 0px 0px rgba(10,10,10,0.8)`).
- [ ] All 9 buttons execute mechanical down-right translation on `:active`.
- [ ] No rounded corners exist on any element across the viewport.

### Interaction & Keyboard Flow
- [ ] Sequential <kbd>Tab</kbd> navigation hits all 19 links, 9 buttons, and navigation landmarks.
- [ ] <kbd>Space</kbd> and <kbd>Enter</kbd> trigger button clicks without scrolling anomalies.
- [ ] Modals and dropdowns trap focus and dismiss cleanly via the <kbd>Esc</kbd> key.
- [ ] All focus rings are clearly visible against both black (`#000000`) and white (`#ffffff`) canvases.

### Responsiveness & Edge Cases
- [ ] Layout scales seamlessly at 320px, 375px, 768px, 1024px, 1440px.
- [ ] Cards with long headlines wrap without breaking the rigid 8-bit border box.
- [ ] Empty state renders correctly when zero data items exist in feeds.
- [ ] Loading states display animated retro ASCII brackets.

### Accessibility Validation
- [ ] Automated scan with axe DevTools reports **0 violations** of WCAG 2.2 AA.
- [ ] All images and icons possess informative `alt` text or `aria-hidden="true"`.
- [ ] High contrast mode (Windows Contrast Themes) preserves component boundaries.
- [ ] Reduced motion simulation verifies complete cessation of animations.
