# 15 — Responsive Design

## 1. Overview

The blog must work well on both desktop and mobile. All responsive behavior is implemented using **Tailwind CSS breakpoint prefixes** — no custom media queries needed unless absolutely necessary.

### Breakpoint reference

```
Default (no prefix): mobile-first base styles — applies to ALL screen sizes
sm:   640px+   — larger phones, small tablets
md:   768px+   — tablets, show desktop navbar
lg:   1024px+  — laptops, show sidebar
xl:   1280px+  — desktops, show TOC on post detail
```

### General principle
Design mobile-first: write the base styles for the smallest screen, then override upward with breakpoint prefixes. Never write desktop-only styles and try to "undo" them on mobile.

---

## 2. Navbar

### Desktop (md+)
```
┌─────────────────────────────────────────────┐
│ [Logo]   [Contributors] [About]   [🔍] [☀️] [avatar▾] │
└─────────────────────────────────────────────┘
```

### Mobile (< md)
```
┌─────────────────────────────┐
│ [Logo]              [☀️] [≡] │
└─────────────────────────────┘
```
- Nav links hidden → replaced by hamburger `[≡]`
- SearchBar hidden → accessible via search icon inside mobile drawer
- WriterMenu avatar hidden → shown inside mobile drawer when logged in
- Hamburger opens a Sheet drawer from the right

### Mobile drawer content
```
┌─────────────────┐
│  Contributors   │
│  About          │
│  ─────────────  │
│  🔍 Search...   │
│  ─────────────  │  ← shown only when logged in
│  My posts       │
│  Edit profile   │
│  Sign out       │
└─────────────────┘
```

### Implementation notes
```typescript
// Navbar.tsx — hide/show logic
<nav className="hidden md:flex items-center gap-1">  {/* desktop nav links */}
  {NAV_LINKS.map(...)}
</nav>

<div className="hidden md:block">  {/* desktop search */}
  <SearchBar />
</div>

<div className="hidden md:block">  {/* desktop writer menu */}
  <WriterMenu />
</div>

<MobileNav links={NAV_LINKS} />  {/* always rendered, internally hidden on md+ */}
```

---

## 3. Homepage Layout

### Desktop (lg+)
```
┌──────────────────────────────┬────────────┐
│  Post list (flex: 1)         │  Sidebar   │
│                              │  (240px)   │
│  [PostCard]                  │            │
│  [PostCard]                  │  Newsletter│
│  [PostCard]                  │  Categories│
│  ...                         │  Recent    │
│                              │            │
│  [Pagination]                │            │
└──────────────────────────────┴────────────┘
```

### Mobile (< lg)
```
┌──────────────────────────┐
│  [PostCard]              │
│  [PostCard]              │
│  [PostCard]              │
│  ...                     │
│  [Pagination]            │
│                          │
│  ── Newsletter ──        │  ← Sidebar sections stacked below post list
│  [subscribe form]        │
│                          │
│  ── Categories ──        │
│  ...                     │
└──────────────────────────┘
```

- Sidebar hidden on mobile as a column → content stacked below the post list instead
- Categories and Newsletter still accessible, just repositioned

### Implementation notes
```typescript
// app/(public)/page.tsx
<div className="flex flex-col lg:flex-row gap-8">
  <main className="flex-1 min-w-0">
    <PostList posts={posts} pagination={...} />
  </main>
  {/* On mobile this renders below the post list naturally */}
  <aside className="w-full lg:w-60 xl:w-72 shrink-0">
    <Sidebar ... />
  </aside>
</div>
```

---

## 4. PostCard

### Desktop
```
┌──────────────────────────────────────────┐
│  [Cover image — 16:9]                    │
├──────────────────────────────────────────┤
│  CATEGORY                                │
│  Title (2 lines max)                     │
│  Excerpt (3 lines max)                   │
│  [avatars] Author · Date · N comments   │
│  [tag] [tag] [tag]                       │
└──────────────────────────────────────────┘
```

### Mobile
- Same structure, full width
- Cover image still 16:9
- Font sizes slightly smaller: title `text-lg` (not `text-xl`)
- Excerpt hidden on very small screens (< sm) if space is tight — use `hidden sm:block`
- Tag row wraps naturally

```typescript
// PostCard.tsx
<h2 className="text-lg sm:text-xl font-bold leading-snug ...">
  {post.title}
</h2>
<p className="hidden sm:block mt-2 text-sm text-muted-foreground line-clamp-3 ...">
  {post.excerpt}
</p>
```

---

## 5. Post Detail Page

### Desktop (xl+)
```
┌──────────────────────────────────────────┐
│  PostHeader (full width, max 720px)      │
├───────────────────────────┬──────────────┤
│  PostBody (flex: 1)       │  TOC (200px) │
│  max-width: 68ch          │  sticky      │
└───────────────────────────┴──────────────┘
│  CommentSection                          │
└──────────────────────────────────────────┘
```

### Mobile / Tablet (< xl)
```
┌──────────────────────────┐
│  PostHeader              │
│  PostBody (full width)   │
│  CommentSection          │
└──────────────────────────┘
```
- TOC hidden below xl — `hidden xl:block`
- On mobile, consider adding a collapsible TOC button at the top of the article as an optional enhancement (backlog)
- Post title: `text-2xl` on mobile → `text-3xl` on md+
- Body font: `text-base` on mobile → `text-lg` on md+ (slightly larger for reading comfort on desktop)

```typescript
// app/(public)/[slug]/page.tsx
<div className="mt-8 flex gap-8">
  <div className="flex-1 min-w-0">
    <PostBody content={post.content} />
  </div>
  <aside className="hidden xl:block w-52 shrink-0">
    <TableOfContents content={post.content} />
  </aside>
</div>
```

```typescript
// PostHeader.tsx
<h1 className="mt-2 text-2xl md:text-3xl font-bold leading-tight tracking-tight">
  {post.title}
</h1>
```

---

## 6. PostHeader Cover Image

```typescript
// PostHeader.tsx
<div className="mt-6 relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
  <img
    src={post.coverUrl}
    alt={post.coverAlt ?? post.title}
    className="w-full h-full object-cover"
  />
</div>
```

- `aspect-video` (16:9) works on all screen sizes automatically
- `w-full` ensures it never overflows the container
- No fixed height — let aspect-ratio handle it

---

## 7. Post Editor (Writer Dashboard)

### Desktop
Full layout with toolbar at top, content area below, sticky footer bar with Save/Publish buttons.

### Mobile
The editor is primarily a desktop feature — writing long articles on mobile is uncommon. However it must not break on mobile:

- Toolbar wraps onto multiple rows — `flex flex-wrap` already handles this
- Title input: full width, font size `text-xl` (not `text-3xl`) on mobile
- Cover upload: tap to upload works the same
- Sticky footer: always visible at bottom, buttons full width on mobile
- Metadata panel (category, tags, co-authors): stack vertically on mobile

```typescript
// PostEditor.tsx
<input
  type="text"
  placeholder="Post title..."
  className="w-full text-xl md:text-3xl font-bold bg-transparent border-none outline-none ..."
/>

// Footer bar
<div className="sticky bottom-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-4 ...">
  <SaveStatusIndicator status={saveStatus} />
  <div className="flex gap-3 w-full sm:w-auto">
    <button className="flex-1 sm:flex-none ...">Save draft</button>
    <button className="flex-1 sm:flex-none ...">Publish</button>
  </div>
</div>
```

---

## 8. CommentForm

### Desktop
```
┌──────────────────┬──────────────────┐
│  Name            │  Email           │
└──────────────────┴──────────────────┘
┌────────────────────────────────────┐
│  Comment textarea                  │
└────────────────────────────────────┘
[✓ Notify me]          [Post comment]
```

### Mobile
```
┌────────────────────────────┐
│  Name                      │
└────────────────────────────┘
┌────────────────────────────┐
│  Email                     │
└────────────────────────────┘
┌────────────────────────────┐
│  Comment textarea          │
└────────────────────────────┘
[✓ Notify me]
[Post comment — full width]
```

```typescript
// CommentForm.tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div>Name input</div>
  <div>Email input</div>
</div>

// Submit button
<button className="w-full sm:w-auto px-4 py-2 ...">
  Post comment
</button>
```

---

## 9. SearchBar

### Desktop
Inline in Navbar, expands on focus, shows dropdown.

### Mobile
Hidden in Navbar. Accessible via the mobile drawer as a link to `/search` page.

The full `/search` results page works fine on mobile — single column, standard layout.

```typescript
// Navbar.tsx
<div className="hidden md:block">
  <SearchBar />
</div>
```

---

## 10. Admin Panel

Admin panel is desktop-oriented — it does not need to be fully optimized for mobile, but must not break.

### Tables on mobile
Tables with many columns become hard to read on small screens. Use these strategies:

- Hide non-critical columns on small screens with `hidden md:table-cell` or `hidden lg:table-cell`
- Always show: title/name, status, action buttons
- Hide on mobile: date, email, detailed counts

```typescript
// AdminPostsTable.tsx — already implemented with:
<td className="hidden md:table-cell">  {/* Author */}
<td className="hidden lg:table-cell">  {/* Date */}
```

### Admin nav
On mobile, the `AdminNav` horizontal links may overflow. Add `overflow-x-auto` to the nav container:

```typescript
// AdminNav.tsx
<div className="container mx-auto px-4 max-w-6xl h-14 flex items-center justify-between overflow-x-auto">
```

---

## 11. Sidebar on Mobile

As described in section 3, the Sidebar is not hidden on mobile — it is rendered below the post list as stacked sections. This ensures newsletter subscription and categories remain accessible.

However, on very small screens the sidebar sections should have simpler styling:

```typescript
// Sidebar.tsx
<aside className="w-full lg:w-60 xl:w-72 shrink-0 space-y-8">
  {/* On mobile: full width, stacks below post list */}
  {/* On lg+: fixed-width column beside post list */}
```

---

## 12. Writer Dashboard

### Desktop
Two-column potential: nav links in a row at top, content below.

### Mobile
Nav links wrap or scroll horizontally:

```typescript
// app/(writer)/dashboard/layout.tsx
<nav className="flex items-center gap-4 mb-8 pb-4 border-b text-sm overflow-x-auto whitespace-nowrap">
  <Link href="/dashboard">My posts</Link>
  <Link href="/dashboard/profile">Edit profile</Link>
  <Link href={`/authors/${username}`} target="_blank" className="ml-auto text-xs">
    View public profile →
  </Link>
</nav>
```

---

## 13. Profile Page

### Desktop
Form at max-width `xl` (centered), avatar on left, fields on right.

### Mobile
Everything stacks vertically, full width. Avatar upload above fields.

```typescript
// AvatarUpload.tsx
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
```

---

## 14. Newsletter Form (Sidebar)

Already single-column — works on all screen sizes without changes. Input and button are full width within the sidebar.

---

## 15. Pagination

Already centered with `flex items-center justify-center`. On very small screens, hide the ellipsis and show fewer page numbers:

```typescript
// Pagination.tsx — the delta variable controls how many pages to show
const delta = window.innerWidth < 640 ? 1 : 2
// Or simply always use delta = 1 to keep it compact on all screens
const delta = 1
```

---

## 16. Typography on Mobile

Post body text should be slightly smaller on mobile for comfortable reading:

```css
/* globals.css — add to post-content */
.post-content {
  font-size: 1rem;        /* mobile: 16px */
}

@media (min-width: 768px) {
  .post-content {
    font-size: 1.125rem;  /* desktop: 18px */
  }
}
```

Or with Tailwind in `PostBody`:
```typescript
<div className="post-content text-base md:text-lg">
```

---

## 17. Touch Targets

All interactive elements must have a minimum tap target of **44×44px** on mobile. Check these:

- Navbar buttons: `p-2` gives 40px — add `p-2.5` on mobile if needed
- Tag remove buttons `<X>`: currently 10px icon — wrap in a larger tap area:
  ```typescript
  <button className="p-1.5 -m-1.5 ...">  {/* expand tap area */}
    <X size={10} />
  </button>
  ```
- Comment reply button: currently `text-xs` — add `py-1` for a taller tap target
- Pagination buttons: currently `36×36px` — acceptable, but `40×40px` is better on mobile

---

## 18. Images

All images use `max-w-full` or `w-full` — they never overflow their container. Cover images use `aspect-video` which scales correctly on all screen sizes.

GIFs embedded in post content: the `img` tag inside Tiptap renders with `max-w-full` class configured in the Image extension — no overflow.

---

## 19. Checklist

- [ ] Verify homepage on mobile: sidebar appears below post list, not beside it
- [ ] Verify Navbar on mobile: hamburger visible, nav links hidden
- [ ] Verify mobile drawer opens and contains search link, nav links, and writer menu (when logged in)
- [ ] Verify post detail page on mobile: TOC hidden, content full width
- [ ] Verify post title is `text-2xl` on mobile and `text-3xl` on desktop
- [ ] Verify body font is `text-base` on mobile and `text-lg` on desktop
- [ ] Verify CommentForm name/email fields are single column on mobile
- [ ] Verify PostEditor toolbar wraps correctly on mobile without overflow
- [ ] Verify PostEditor sticky footer buttons are full width on mobile
- [ ] Verify admin tables hide secondary columns on small screens
- [ ] Verify dashboard nav scrolls horizontally on mobile without breaking layout
- [ ] Verify all touch targets are at least 44×44px
- [ ] Verify cover images scale correctly on all screen sizes (16:9 maintained)
- [ ] Verify no horizontal scroll on any page at 375px width (iPhone SE)
- [ ] Test on real device or Chrome DevTools device emulation at: 375px (iPhone SE), 390px (iPhone 14), 768px (iPad), 1280px (desktop)
