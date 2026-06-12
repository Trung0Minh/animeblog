# changes/03_layout_zoom.md — Layout Width & Zoom Adaptation

## Problem

Two related issues:

1. **At 100% zoom on wide monitors**, content feels too narrow — too much empty space on both sides. The container max-width is too conservative.
2. **When zooming out** (browser zoom < 100%), the layout doesn't take advantage of the extra space. When zooming in (> 100%), content clips or overflows.

The root cause: fixed `max-width` values in `px` and some layout measurements in absolute units that don't scale with zoom.

---

## How browser zoom works

Browser zoom scales the entire viewport. At 80% zoom, a 1440px monitor effectively becomes 1800px wide from CSS's perspective. At 125% zoom, it becomes 1152px wide.

This means:
- A `max-width: 1100px` container fills the full width at 125% zoom on a 1440px screen
- At 80% zoom, that same container only fills ~61% of the visible width

The fix: **increase max-width** and use **fluid typography** so content scales naturally with zoom.

---

## Fix 1 — Container max-width

Current containers are too narrow. Increase across the board:

**File to change:** `app/globals.css` and all layout components

```css
/* globals.css — add container utility */
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;   /* 24px */
  padding-right: 1.5rem;
}

/* Breakpoint-specific max-widths */
@media (min-width: 640px)  { .container { max-width: 640px; } }
@media (min-width: 768px)  { .container { max-width: 768px; } }
@media (min-width: 1024px) { .container { max-width: 1024px; } }
@media (min-width: 1280px) { .container { max-width: 1280px; } }
@media (min-width: 1536px) { .container { max-width: 1400px; } }  /* wider on large screens */
```

Or in `tailwind.config.ts`:

```typescript
// tailwind.config.ts
theme: {
  extend: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px',   // ← increase from default 1536px cap
      },
    },
  },
},
```

---

## Fix 2 — Homepage two-column layout proportions

The sidebar at `240px` fixed width feels too narrow when the total container is wider. Switch to percentage-based flex proportions:

**File to change:** `app/(public)/page.tsx`

```typescript
// Before
<div className="flex gap-8">
  <main className="flex-1 min-w-0">...</main>
  <aside className="hidden lg:block w-60 xl:w-72 shrink-0">...</aside>
</div>

// After — sidebar takes ~25% of container, main gets the rest
<div className="flex gap-10">
  <main className="flex-1 min-w-0">...</main>
  <aside className="hidden lg:block w-64 xl:w-80 2xl:w-96 shrink-0">...</aside>
</div>
```

---

## Fix 3 — Post detail page max-width

The post body `max-width: 720px` is appropriate for reading comfort but should expand slightly on very large screens:

**File to change:** `app/(public)/[slug]/page.tsx`

```typescript
// Before
<article className="container mx-auto px-4 py-8 max-w-3xl">

// After — slightly wider, with xl variant
<article className="container mx-auto px-4 py-8 max-w-3xl xl:max-w-4xl">
```

Post body text line length: keep `max-w-prose` (65ch) on the text content itself — this is optimal for reading. The wider container just gives more room for the TOC sidebar.

---

## Fix 4 — Fluid typography with clamp()

Use CSS `clamp()` for font sizes that scale smoothly between minimum and maximum values as the viewport (and zoom level) changes. This prevents text from being too small when zoomed out or too large when zoomed in.

**File to change:** `app/globals.css`

```css
/* globals.css — add fluid type scale */
:root {
  /* Fluid typography: scales from mobile (320px) to desktop (1280px) */
  --font-size-sm:   clamp(0.8rem,  0.17vw + 0.76rem, 0.875rem);
  --font-size-base: clamp(0.9rem,  0.34vw + 0.81rem, 1rem);
  --font-size-md:   clamp(1rem,    0.52vw + 0.87rem, 1.125rem);
  --font-size-lg:   clamp(1.1rem,  0.69vw + 0.93rem, 1.25rem);
  --font-size-xl:   clamp(1.2rem,  1.04vw + 0.96rem, 1.5rem);
  --font-size-2xl:  clamp(1.5rem,  1.56vw + 1.13rem, 2rem);
  --font-size-3xl:  clamp(1.75rem, 2.08vw + 1.29rem, 2.5rem);
}

/* Apply to post body for fluid reading size */
.post-content {
  font-size: clamp(1rem, 0.34vw + 0.91rem, 1.125rem);
}
```

---

## Fix 5 — Navbar max-width alignment

The Navbar container must match the page container width exactly, otherwise the nav content appears misaligned with the page content:

**File to change:** `components/layout/Navbar.tsx`

```typescript
// Ensure Navbar inner container uses same max-width as page containers
<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
    {/* nav content */}
  </div>
</header>
```

Use `container` class consistently across Navbar, Footer, and all pages so they always align.

---

## Fix 6 — Avoid fixed pixel widths in layout

Audit the codebase for any hardcoded pixel widths in layout-critical places and replace with relative units:

```typescript
// ❌ Fixed pixel — doesn't scale with zoom
<div className="w-[240px]">

// ✅ Relative — scales naturally
<div className="w-60">         // 15rem — scales with root font size
<div className="w-1/4">        // 25% of parent
<div className="max-w-xs">     // 20rem
```

Common offenders to check:
- Sidebar width
- Admin table columns
- Modal/dialog widths
- Avatar sizes (these can stay in px — they're intentionally fixed)

---

## Fix 7 — Zoom-aware meta viewport tag

Ensure the viewport meta tag does NOT prevent user zoom. Some setups accidentally disable zoom:

**File to change:** `app/layout.tsx`

```typescript
// app/layout.tsx — ensure this is NOT in the <head>:
// ❌ Never use this — it disables pinch-to-zoom on mobile
// <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />

// ✅ Next.js default is correct — do not override it:
// <meta name="viewport" content="width=device-width, initial-scale=1" />
// Next.js sets this automatically — no need to add it manually
```

---

## Fix 8 — Consistent horizontal padding

Pages should have consistent horizontal breathing room that scales with screen size:

**Apply to all page-level containers:**

```typescript
// Consistent padding across all public pages
className="container mx-auto px-4 sm:px-6 lg:px-8 py-8"

// Not a mix of:
// px-4 on some pages
// px-6 on others
// max-w-3xl on some, max-w-4xl on others
```

Create a shared layout wrapper to enforce consistency:

```typescript
// components/layout/PageContainer.tsx
interface PageContainerProps {
  children: React.ReactNode
  size?: 'default' | 'narrow' | 'wide'   // narrow = post detail, wide = homepage
  className?: string
}

export function PageContainer({ children, size = 'default', className }: PageContainerProps) {
  const maxWidth = {
    narrow: 'max-w-3xl xl:max-w-4xl',      // post detail, profile
    default: 'max-w-5xl xl:max-w-6xl',     // general pages
    wide: 'max-w-6xl xl:max-w-7xl',        // homepage with sidebar
  }[size]

  return (
    <div className={cn(
      'container mx-auto px-4 sm:px-6 lg:px-8 py-8',
      maxWidth,
      className
    )}>
      {children}
    </div>
  )
}
```

Then replace all manual container divs:

```typescript
// app/(public)/[slug]/page.tsx
<PageContainer size="narrow">
  {/* post content */}
</PageContainer>

// app/(public)/page.tsx
<PageContainer size="wide">
  {/* homepage with sidebar */}
</PageContainer>
```

---

## Checklist

- [x] Update `tailwind.config.ts` — increase container `2xl` max-width to `1400px`
- [x] Update homepage layout — widen sidebar to `w-64 xl:w-80 2xl:w-96`
- [x] Update post detail page — `max-w-3xl xl:max-w-4xl`
- [x] Add fluid typography CSS variables to `globals.css`
- [x] Apply `clamp()` font size to `.post-content`
- [x] Ensure Navbar uses `container` class matching page containers
- [x] Audit and replace hardcoded `w-[Npx]` pixel widths in layout components
- [x] Verify viewport meta tag does not disable user zoom
- [x] Create `components/layout/PageContainer.tsx`
- [x] Replace manual container divs on all public pages with `<PageContainer>`
- [x] Verify at 80% zoom: content fills most of the viewport, no excessive empty sides
- [x] Verify at 100% zoom: comfortable reading width, not too cramped
- [x] Verify at 125% zoom: content still readable, no horizontal overflow
- [x] Verify on 1920px wide monitor at 100% zoom: sidebar and content proportions look balanced
