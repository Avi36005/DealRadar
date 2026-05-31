---
name: Surgical Precision Retailer
colors:
  surface: '#fbf9f9'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#4c4546'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1b1b'
  on-tertiary-container: '#858383'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#fbf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e3e2e2'
typography:
  display-lg:
    fontFamily: DM Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: DM Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: DM Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-bold:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: '0'
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The brand personality is clinical, efficient, and hyper-focused. This design system targets a sophisticated consumer who values clarity over decoration. The UI should evoke an emotional response of absolute confidence and technical mastery.

The design style is **High-Contrast Minimalism**. It utilizes a strict grayscale palette and razor-thin strokes to create a sense of digital "sharpness." Every element must earn its place on the canvas, with generous whitespace used to direct the eye toward product data and functional actions. There are no decorative gradients or soft blurs; the interface is defined by structural integrity and typographic authority.

## Colors
The palette is strictly achromatic to ensure maximum contrast and zero visual noise. 

- **Primary & Secondary:** Pure Black (#000000) and Pure White (#FFFFFF) form the core of the experience. White is used for the primary background to maintain a clinical feel.
- **Grayscale:** Intermediate grays are used only for secondary metadata and hair-line borders.
- **Functional Accents:** Color is reserved exclusively for utility. A vivid Green highlights "Best Deals" and value propositions, while a technical Blue identifies AI-driven features and insights. These colors should never be used for backgrounds; they appear only as text, small icons, or thin indicators.

## Typography
The system uses **DM Sans** for all levels to maintain a clean, geometric, and modern appearance. The typographic hierarchy is driven by dramatic shifts in scale and weight rather than color. 

Large displays and headlines use heavy weights and tight letter spacing for a "commanding" presence. Labels and utility text use wide tracking and uppercase transformations to distinguish them from body copy. All text must adhere to pure black on white or pure white on black for maximum legibility.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop (1280px max-width) and a **Fluid Grid** on mobile. 

- **Desktop:** 12-column grid with 24px gutters. Content is centered with wide 64px margins to emphasize the minimalist aesthetic.
- **Mobile:** 4-column grid with 16px gutters and 16px side margins.
- **Rhythm:** Spacing is strictly based on a 4px baseline. Use `lg` (24px) for component grouping and `xl` (40px) for section headers to create clear vertical "breathing room."

## Elevation & Depth
This system rejects shadows in favor of **Low-Contrast Outlines**. Depth is conveyed through structural stacking rather than simulated light.

- **Surface Levels:** All containers sit on a #FFFFFF base. 
- **Borders:** Depth is defined by 1px borders using #E0E0E0 for inactive states and #000000 for active or high-priority states.
- **Overlays:** Modals and menus use a solid 1px black border with a subtle white-on-white stacking effect (using a 10% black overlay on the background to dim the content behind the modal).

## Shapes
The shape language is **Sharp**. A 0px border radius is applied to all buttons, input fields, cards, and containers. This reinforces the "Surgical" and "Precision" aspects of the brand, creating a digital environment that feels engineered and exacting.

## Components
- **Buttons:** Primary buttons are solid #000000 with #FFFFFF text. Secondary buttons are #FFFFFF with a 1px #000000 border. No rounded corners.
- **Input Fields:** 1px #E0E0E0 bottom border only for a "minimalist form" look, or a full 1px square border. Focus state is a 1px #000000 border.
- **Cards:** No shadows. Defined by a 1px #E0E0E0 border. On hover, the border thickness remains 1px but the color changes to #000000.
- **Chips/Badges:** For "Best Deal," use a 1px #008A2E border with Green text. For "AI Insights," use a 1px #0057FF border with Blue text.
- **Lists:** Separated by 1px #F0F0F0 horizontal hair-lines. High-contrast black text for primary list items and #757575 for secondary descriptors.
- **Data Grids:** Essential for this system. Use 1px borders for both rows and columns to create a technical, spreadsheet-like precision.