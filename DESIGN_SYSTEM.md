# Design System: CBD Tech Retail

## Philosophy
A premium, modern retail experience for a Nairobi CBD phone and accessories store. The visual language communicates trust, quality, and professionalism through deliberate minimalism, high-contrast typography, and strict structural spacing. It actively avoids generic AI styles (no blobs, no excessive gradients, no soft heavy shadows).

## Typography
- **Font Family**: `Inter` (sans-serif). Chosen for ultimate legibility, neutrality, and a serious, technical aesthetic.
- **Scale**:
  - Base: 16px (1rem) for body copy.
  - Secondary/Specs: 14px (0.875rem) for technical details and minor labels.
  - Headings: 1.125rem (18px) to 2.25rem (36px).
- **Weights**: Regular (400) for body, Medium (500) for secondary info/buttons, Semibold (600) for primary headings and prices.

## Color Palette
- **Background**: `#ffffff` (Pure White) - Ensures product images remain the central focus.
- **Surface**: `#f9fafb` (Gray 50) - Used for subtle separation (e.g., secondary page sections or image backgrounds).
- **Text Primary**: `#111827` (Gray 900) - High contrast for maximum readability.
- **Text Secondary**: `#6b7280` (Gray 500) - For technical specifications and supportive text.
- **Action Primary**: `#000000` (Pure Black) - Used for primary buttons and interactions. Conveys high-end luxury and premium technology.
- **Action Hover**: `#374151` (Gray 700).
- **Borders/Dividers**: `#e5e7eb` (Gray 200).
- **Status (In Stock)**: `#047857` (Emerald 700) for realistic availability indicators.

## Spacing Scale
- Strict adherence to an 8px baseline grid (using Tailwind's default spacing).
- **Component Padding**: `16px` (p-4) to `24px` (p-6).
- **Section Spacing**: `48px` (py-12) to `96px` (py-24).
- Sections must have deliberate whitespace. Components should not be claustrophobic.

## Form & Elevation
- **Border Radius**: `4px` (rounded-sm) to `6px` (rounded-md). Minimal rounding makes the interface feel structural, precise, and hardware-oriented, unlike soft/bubbly SaaS platforms.
- **Shadows**: None by default. We rely on 1px borders for structural definition. A very subtle `shadow-sm` is used on hover states for product cards to indicate interactivity without looking "floaty".

## Components
- **Buttons**: Sharp borders, solid black fill for primary, transparent with gray border for secondary. No gradients. No rounded-full pill shapes for main actions.
- **Product Cards**: Image-led. Fixed aspect ratio (1:1) image container with a Gray 50 background. Minimal text layout: Brand (small), Name (medium), Key Spec (small, gray), Price (semibold). Clear, structured hierarchy.
- **Navigation**: Sticky, pure white background, single 1px bottom border for crisp separation. No glassmorphism.
- **Icons**: Minimal usage. Only functional icons (Search, Cart, Menu) from Lucide. No emoji.
