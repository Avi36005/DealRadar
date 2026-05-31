---
name: Surgical Precision
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4c4546'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfdf'
  on-secondary-container: '#626262'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1b1b'
  on-tertiary-container: '#848484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e4e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: DM Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: DM Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: DM Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: DM Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: DM Sans
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: DM Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1280px
---

## Brand & Style

This design system is built upon the principles of **Surgical Minimalism** and high-utility premium design. It prioritizes clarity, objective hierarchy, and an uncompromising focus on content. The aesthetic is inspired by high-end precision instruments and modern Swiss editorial design.

The target audience consists of power users and professionals who require speed and focus. The emotional response is one of absolute reliability, calm under pressure, and technical sophistication. By utilizing a stripped-back monochrome foundation, the interface recedes to allow user data and functional accents to take center stage.

**Style Guidelines:**
- **Minimalism:** Use generous, intentional whitespace to group elements without relying on lines where possible.
- **High-Contrast:** Use pure black and pure white to create a sharp, authoritative visual rhythm.
- **Surgical Accents:** Color is never decorative. It is used only as a functional beacon for status, AI interaction, or value propositions.

## Colors

The color palette of this design system is strictly monochromatic to ensure the "surgical" feel. The primary canvas is **Pure White (#FFFFFF)**, providing maximum contrast and a laboratory-clean environment.

- **Monochrome Core:** Black (#000000) is used for primary text, icons, and active selection states. Grays are used sparingly for secondary information and subtle borders.
- **Active States:** Selection and active focus states must use a solid Black background with White text, creating an unmistakable visual "hit."
- **Functional Accents:**
    - **Green:** Reserved strictly for "Deals" or positive financial indicators.
    - **Blue:** Reserved strictly for "AI" features or intelligent automated insights.
    - **Amber:** Reserved strictly for "Alerts" or items requiring immediate cognitive attention.
- **Surface Tiers:** Use #F2F2F2 for subtle container backgrounds to differentiate content modules from the main white canvas.

## Typography

This design system utilizes **DM Sans** exclusively. Its geometric clarity and low-contrast stroke weights reinforce the professional, modern-utilitarian aesthetic.

**Scale and Hierarchy:**
- **Headlines:** Set in Bold (700) weights with slightly tighter letter-spacing to create a "dense" and authoritative feel.
- **Body:** Standard body text is optimized for readability with a 1.5x line-height.
- **Labels:** Small labels use uppercase styling and increased letter-spacing to distinguish them as metadata or UI controls rather than narrative content.
- **Contrast:** Maintain a high contrast ratio between text and background. Secondary text should never drop below a medium gray (#666666).

## Layout & Spacing

The layout is governed by a strict 4px baseline grid. All spacing, padding, and margins must be increments of this unit.

**Grid Model:**
- **Desktop:** A 12-column fixed grid (1280px max) with 24px gutters. Content should be centered with 40px minimum side margins.
- **Tablet:** A 6-column fluid grid with 24px margins.
- **Mobile:** A 2-column fluid grid with 16px margins.

**Rhythm:**
- Use **Vertical Rhythm** to create hierarchy. Group related items with 8px or 12px; separate distinct sections with 48px or 64px. 
- Layouts should feel "airy" but structured. Avoid boxing every element; use alignment and white space to define containers.

## Elevation & Depth

To maintain a surgical, flat aesthetic, this design system avoids traditional drop shadows. Depth is communicated through **Tonal Layering** and **Ghost Borders**.

- **Tiers:** Elements on the base layer are #FFFFFF. Elevated elements (like popovers or modals) may use a subtle 1px border in #E5E5E5 or a very soft, diffused 2% black shadow to lift from the background without looking "heavy."
- **Ghost Borders:** Use 1px solid borders in #F2F2F2 or #E5E5E5 to define card boundaries.
- **Active Depth:** Active selections do not use depth; they use a color inversion (Solid Black background) to signify "System Focus."

## Shapes

The shape language is **Soft (0.25rem)**. This provides a subtle bridge between the aggressive sharp-edge brutalism and overly soft consumer apps.

- **Standard Elements:** Buttons, input fields, and tags use a 4px corner radius.
- **Large Containers:** Cards and modals use an 8px (rounded-lg) radius.
- **Strictness:** Do not use fully rounded "pill" shapes unless they are specifically for small, decorative tags. All primary UI housing remains rectangular with soft corners.

## Components

**Buttons:**
- **Primary:** Solid #000000 background with #FFFFFF text. No border.
- **Secondary:** White background with #000000 1px border.
- **Ghost:** No background, #000000 text. Use for low-priority actions.

**Inputs:**
- Background is #FFFFFF with a 1px #E5E5E5 border. 
- On focus, the border becomes #000000.
- Labels are always positioned above the input in `label-md` style.

**Chips & Tags:**
- Default: #F2F2F2 background with #666666 text.
- Functional: Use the accent colors (Green/Blue/Amber) with 10% opacity backgrounds and 100% opacity text for status indicators.

**Cards:**
- White background with a 1px #F2F2F2 border. No shadow.
- Hover state: Border shifts to #E5E5E5 or adds a very subtle 2px blur shadow.

**Selection States:**
- In lists or navigation, selected items are #000000 with #FFFFFF text. This is a non-negotiable signature of the design system.