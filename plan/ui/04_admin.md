# Figma Prompt — Admin Panel (High Fidelity)

## Project Overview

Design a **high-fidelity admin panel** for the same anime analysis blog. The admin panel is a **private management interface** — only admins see it. It should feel distinctly different from the public blog (editorial, reader-focused) while sharing the same color tokens and typography.

The admin panel aesthetic should be: **utilitarian but refined**. Like a well-designed internal tool at a serious publication. Think Linear, Vercel dashboard, or Notion's settings pages — clean, information-dense, no decorative elements, but never ugly or cold.

Create **4 frames**:
1. Desktop Light Mode (1440 × 960px) — Dashboard overview page
2. Desktop Dark Mode (1440 × 960px) — Dashboard overview page
3. Desktop Light Mode (1440 × 900px) — Posts management page
4. Desktop Dark Mode (1440 × 900px) — Posts management page

Also create **2 mobile frames** (390px wide):
5. Mobile Light — Dashboard (condensed)
6. Mobile Dark — Dashboard (condensed)

Same color system and typography as all previous files.

---

## Admin Panel Structure

The admin panel has its own nav bar (replacing the public navbar entirely) and a max-width content area. There is no sidebar like the public blog — admin uses horizontal navigation tabs instead.

```
┌──────────────────────────────────────────────────────────────┐
│  ADMIN NAV BAR (56px, full width, sticky)                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  CONTENT AREA (max-width 1200px, centered, padding 32px)    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Admin Navigation Bar

**Full width, 56px height, sticky top**
**Background:** page background
**Border bottom:** 1px solid border-default
**Inner:** max-width 1200px, centered, horizontal padding 24px

**Left zone:**
- "← Blog" text link — 13px Inter weight 500 text-tertiary, hover: text-secondary
- Small vertical separator line (16px, border-default)
- "Admin" label — 13px Inter weight 600 text-primary

**Center zone — Navigation tabs:**
Each tab: 13px Inter weight 500, padding 6px 14px, border-radius 6px
- Active tab: bg subtle-bg, text-primary, weight 600
- Inactive tab: text-secondary, hover: text-primary, hover bg subtle-bg at 50%

Tab icons (14px, lucide-react style) + label:
- 📊 Dashboard (active on frame 1&2)
- 📝 Posts (active on frame 3&4)
- 👥 Writers
- 💬 Comments
- 📧 Newsletter
- 📈 Analytics

**Right zone:**
- Admin avatar: 30px circle, accent red background (#c0392b), white "A" initial
- Small chevron down icon beside it
- On click: dropdown with "View blog →" and "Sign out" options

---

## Frame 1 & 2 — Dashboard Overview Page

**Page title:**
"Dashboard" — 24px Inter weight 700 text-primary
Subtitle: "Overview of your blog's activity" — 14px Inter text-secondary, margin-top 4px
Margin bottom: 32px

---

### Section 1: Stats Grid

**5 stat cards in a row** (on desktop). Each card:
- Background: page-bg
- Border: 1px solid border-default
- Border-radius: 8px
- Padding: 20px
- Width: equal flex (roughly 220px each at 1200px container)

**Card anatomy (top to bottom):**

Top row: label text (left) + icon (right)
- Label: 12px Inter weight 500 text-secondary ALL CAPS letter-spacing 0.06em
- Icon: 14px lucide icon, text-tertiary

Value: 28px Inter weight 700 text-primary, margin-top 8px

Trend indicator below value: small icon (up arrow ▲ or down ▲ rotated) + percentage + "vs last month"
- Positive trend: green text (#4caf50 light / #66bb6a dark)
- Negative trend: red text (#e05c4a)
- Font: 11px Inter

**5 cards:**
1. Label: "PUBLISHED POSTS" / Icon: document icon / Value: "47" / Trend: "↑ 3 this month"
2. Label: "DRAFTS" / Icon: pencil icon / Value: "8" / Trend: neutral, no trend
3. Label: "WRITERS" / Icon: users icon / Value: "6" / Trend: "↑ 1 new"
4. Label: "COMMENTS" / Icon: chat bubble icon / Value: "284" / Trend: "↑ 12% vs last month" in green
5. Label: "SUBSCRIBERS" / Icon: mail icon / Value: "1,247" / Trend: "↑ 8% vs last month" in green

---

### Section 2: Analytics Widget

Margin top: 32px from stats grid

**Section header:**
- Left: "Analytics" — 18px Inter weight 600 text-primary
- Right: period selector dropdown — "Last 30 days" with chevron, 13px Inter, border 1px solid border-default, border-radius 5px, padding 5px 10px
- Separator line below header, margin 16px

**4 analytics metric cards in a row:**

Same card style as stats above but slightly different emphasis:

1. Label: "PAGE VIEWS" / Value: "18,420" / Change: "+14% vs prev period" green / Icon: eye
2. Label: "UNIQUE VISITORS" / Value: "6,831" / Change: "+9% vs prev period" green / Icon: users
3. Label: "VISITS" / Value: "9,205" / Change: "+11% vs prev period" green / Icon: cursor click
4. Label: "AVG. TIME ON SITE" / Value: "4m 12s" / Change: "+0.3min vs prev period" green / Icon: clock

**Top pages table below analytics cards:**
Margin top: 20px
Label: "Top pages — last 30 days" — 14px Inter weight 600 text-primary

Table rows (5 rows, no outer border — just row separators):
- Each row: flex row, space-between, padding 10px 0, border-bottom 1px solid border-default
- Left: page path — 13px Inter text-secondary (monospace-ish), e.g. "/frierens-animation-direction", "/ufotable-visual-language", "/vinland-saga-philosophy", "/mob-psycho-timing", "/chainsaw-man-sound"
- Right: view count — 13px Inter weight 600 text-primary: "4,821", "3,205", "2,891", "2,440", "1,973"

Below table: "View full analytics dashboard →" link — 13px Inter accent color, hover underline

---

### Section 3: Recent Activity Feed

Margin top: 32px
Two columns side by side, gap: 24px

**Left column: Recent Posts**
Section label: "RECENT POSTS" — 11px Inter weight 600 ALL CAPS text-tertiary letter-spacing 0.1em
Border bottom 1px solid border-default, padding-bottom 10px, margin-bottom 14px

5 post rows, each:
- Flex row, align-items: flex-start, gap: 12px, padding: 10px 0, border-bottom: 1px solid border-default (not last)
- Left: status badge — pill shaped, 10px Inter weight 600
  - Published: bg green-100 (#f0fdf4 light / #14532d20 dark), text green-700 (#15803d light / #4ade80 dark), "Published"
  - Draft: bg subtle-bg, text text-tertiary, "Draft"
  - Archived: bg orange-50, text orange-700, "Archived"
- Right block:
  - Post title: 13px Inter weight 500 text-primary, max 1 line truncated, hover: accent color
  - Below title: author name + "·" + date — 11px Inter text-tertiary

Posts to show:
1. Published — "The Sound Design of Chainsaw Man" — Haruki Tanaka · 2 hours ago
2. Draft — "Blue Eye Samurai: A Western Perspective" — Mei Yoshida · Yesterday
3. Published — "Hiroyuki Imaishi's Camera Philosophy" — Kenta Mori · Jan 12
4. Archived — "Seasonal Preview: Winter 2024" — Yuki Ishikawa · Jan 8
5. Draft — "The Background Art of Made in Abyss" — Sora Nakamura · Jan 5

**Right column: Recent Comments**
Section label: "RECENT COMMENTS" — same section label style

5 comment rows, each:
- Padding: 10px 0, border-bottom: 1px solid border-default (not last)
- Commenter name: 12px Inter weight 600 text-primary
- Post reference: "on [post title]" — 12px Inter text-tertiary, post title is truncated link
- Comment preview: 12px Inter text-secondary line-height 1.4, max 2 lines truncated, italic
- Time: 11px text-tertiary
- Right: small "Mark spam" button — 11px Inter text-tertiary, hover: text-destructive (#e05c4a)

Comments to show:
1. "Sora K." on "The Sound Design of Chainsaw Man" · "This is exactly the kind of analysis..." · 1 hour ago
2. "Anonymous Reader" on "Frieren's Animation Direction" · "The comparison to Dezaki is..." · 3 hours ago
3. "anime_critic_99" on "Ufotable's Visual Language" · "I'd argue Fate/Zero was actually..." · Yesterday
4. "Yuki I." on "Vinland Saga S2" · "As someone who worked in production..." · Jan 13
5. "M. Fujita" on "Science SARU's Approach" · "Yuasa's influence extends beyond..." · Jan 12

---

## Frame 3 & 4 — Posts Management Page

**Page title:** "Posts" — 24px Inter weight 700
**Subtitle:** "47 published · 8 drafts · 2 archived" — 14px Inter text-secondary
Margin bottom: 24px

---

### Filter & Action Bar

**Flex row, space-between, margin-bottom: 16px**

Left side — Status filter tabs:
- Tab group with subtle background container: border-radius 7px, border 1px solid border-default, padding 3px, display: inline-flex
- Each tab: 12px Inter weight 500, padding 5px 12px, border-radius 5px
- Active tab: bg page-bg, box-shadow: 0 1px 2px rgba(0,0,0,0.08), text-primary, weight 600
- Inactive tab: text-secondary, transparent bg, hover: text-primary
- Tabs: "All (57)", "Published (47)", "Drafts (8)", "Archived (2)"

Right side:
- Search input: 220px wide, 34px height, border 1px solid border-default, border-radius 5px, padding 0 10px 0 32px, font 13px, placeholder "Search posts...", magnifying glass icon inside left
- Gap: 8px
- "New post" button: 34px height, padding 0 14px, bg button-primary-bg, color button-primary-text, border-radius 5px, 13px Inter weight 600, "+" icon before text

---

### Posts Table

Full width, border: 1px solid border-default, border-radius: 8px, overflow: hidden

**Table header row:**
- Background: subtle-bg
- Height: 40px
- Font: 11px Inter weight 600 text-secondary ALL CAPS letter-spacing 0.05em
- Border-bottom: 1px solid border-default

Columns:
1. Title (flex: 1, min-width 0) — widest column
2. Author (140px) — hidden on < md
3. Status (100px)
4. Date (120px) — hidden on < lg
5. Comments (80px) — hidden on < lg, right-aligned
6. Actions (80px) — right-aligned

**Table rows (10 rows shown):**
- Row height: 52px
- Border-bottom: 1px solid border-default (except last)
- On hover: background subtle-bg transition 150ms
- Alternating subtle bg tint option (very subtle, ~2% difference) — or just hover state

**Column: Title**
- Post title: 13px Inter weight 500 text-primary, max 1 line, truncated, hover: accent color, cursor pointer
- Below title (second line): slug in small monospace text-tertiary — "/frierens-animation-direction"

**Column: Author**
- Small avatar (22px) + author name
- Avatar: colored circle with initial
- Name: 12px Inter text-secondary

**Column: Status**
Status badge — pill, 10px Inter weight 600, no icon:
- Published: bg #f0fdf4, text #15803d (light) / bg #14532d30, text #4ade80 (dark)
- Draft: bg subtle-bg, text text-tertiary
- Archived: bg #fff7ed, text #c2410c (light) / bg #7c2d1230, text #fb923c (dark)

**Column: Date**
- Published date: 12px Inter text-secondary, format "Jan 14, 2025"
- Draft rows: show "Updated Jan 8, 2025" in text-tertiary instead

**Column: Comments**
- Number only: 12px Inter weight 500 text-secondary
- Right-aligned

**Column: Actions**
Three icon buttons, right-aligned, gap: 2px:
1. External link icon (↗) — 14px, text-tertiary, hover: text-primary — opens post in new tab (only for published)
2. Archive icon (box with down arrow) — 14px, text-tertiary, hover: text-orange-500 — for published/draft rows
   OR Restore icon (box with up arrow) — for archived rows, hover: text-green-600
3. Trash icon — 14px, text-tertiary, hover: text-destructive

Each button: 28×28px clickable area, border-radius 5px, hover: bg subtle-bg

**Show these 10 posts in the table:**

Row 1: "The Sound Design Philosophy Behind Chainsaw Man's Most Brutal Scenes" / /chainsaw-man-sound / Haruki Tanaka (teal) / **Published** / Jan 14, 2025 / 24 comments
Row 2: "Blue Eye Samurai and the Western Gaze on Japanese Animation" / /blue-eye-samurai-western / Mei Yoshida (terracotta) / **Draft** / Updated Jan 13 / —
Row 3: "How Ufotable Redefined the Visual Language of Shonen Action" / /ufotable-visual-language / Haruki Tanaka (teal) / **Published** / Jan 12, 2025 / 41 comments
Row 4: "Reigen Arataka and the Art of Comedic Timing in Animation" / /reigen-comedic-timing / Kenta Mori (purple) / **Published** / Jan 10, 2025 / 8 comments
Row 5: "Vinland Saga Season 2: When Animation Becomes Philosophy" / /vinland-saga-s2-philosophy / Sora Nakamura (slate) / **Published** / Jan 8, 2025 / 16 comments
Row 6: "The Background Art of Made in Abyss" / /made-in-abyss-backgrounds / Sora Nakamura (slate) / **Draft** / Updated Jan 5 / —
Row 7: "Science SARU's Fluid Approach to Human Emotion" / /science-saru-fluid / Ren Fujiwara (green) / **Published** / Dec 29, 2024 / 7 comments
Row 8: "Satoshi Kon's Influence on Contemporary Directors" / /satoshi-kon-influence / Mei Yoshida (terracotta) / **Published** / Dec 22, 2024 / 33 comments
Row 9: "Seasonal Preview: Winter 2024 Animation" / /seasonal-winter-2024 / Yuki Ishikawa (burgundy) / **Archived** / Dec 15, 2024 / 5 comments
Row 10: "The Intimate Scale of Mushishi's World-Building" / /mushishi-world-building / Haruki Tanaka (teal) / **Published** / Dec 10, 2024 / 12 comments

**Pagination below table:**
Same style as homepage pagination — centered, minimal number buttons
Show: ‹ 1 [2] 3 4 5 ›
Margin top: 20px, padding-bottom: 8px

---

## Delete Confirmation Modal

Show as an overlay on one of the frames (frame 3 or 4):

**Backdrop:** `rgba(0,0,0,0.5)` overlay over entire page

**Modal card:**
- Width: 400px
- Background: page-bg
- Border: 1px solid border-default
- Border-radius: 10px
- Box-shadow: 0 20px 60px rgba(0,0,0,0.2)
- Padding: 28px

Content:
- Icon: trash icon 24px in a 48px circle, bg: red-50 (#fef2f2 light / #3f0f0f40 dark), icon color: destructive red
- Title: "Delete post?" — 17px Inter weight 700, margin-top 16px
- Body: "This will permanently delete "The Sound Design Philosophy Behind Chainsaw Man's Most Brutal Scenes". This action cannot be undone." — 13px Inter text-secondary line-height 1.6, margin-top 8px. Post title is displayed in quotes in weight 600.
- Buttons row (margin-top 24px, flex, gap: 8px, justify: flex-end):
  - "Cancel" — secondary button style, 36px height, padding 0 16px
  - "Delete post" — destructive button: bg #c0392b (light) / #e05c4a (dark), color white, 36px height, padding 0 16px, border-radius 5px, 13px Inter weight 600

---

## Archive Confirmation Modal

Show as a second modal variant:

Same structure but:
- Icon: archive box icon, bg: orange-50, icon color: orange-600
- Title: "Archive post?"
- Body: "This will hide "Vinland Saga Season 2: When Animation Becomes Philosophy" from public view. You can restore it anytime from the Archived filter." — same style, encouraging (not alarming) tone
- Buttons: "Cancel" + "Archive post" — orange primary button (#c47f5a background)

---

## Mobile Layout — Dashboard (390px)

### Admin Navbar — Mobile
- Left: "← Blog" link
- Center: "Admin" label
- Right: hamburger icon — taps to open mobile admin nav drawer

### Mobile Admin Drawer
Full-height sheet from right, 280px wide:
- "Admin Panel" header, 20px padding
- Nav items stacked vertically with icons:
  - 📊 Dashboard (active)
  - 📝 Posts
  - 👥 Writers
  - 💬 Comments
  - 📧 Newsletter
  - 📈 Analytics
- Bottom: small "View blog →" link

### Stats Grid — Mobile
2×3 grid (2 columns, 3 rows) instead of 5 in a row
Each card: same anatomy, slightly more compact

### Analytics section — Mobile
4 metric cards in 2×2 grid
Top pages table: hidden on mobile — replaced with "View full analytics →" link

### Recent activity — Mobile
Single column (not two columns)
Posts and Comments sections stacked vertically

---

## Interaction States to Design

**Table row states:**
- Default
- Hover (subtle bg)
- Row with action buttons visible on hover (buttons fade in)

**Action button states:**
- Default (invisible / very faint on row hover)
- Visible on row hover
- Individual button hover (colored)

**Filter tab states:**
- Default (inactive)
- Active (selected)
- Hover

**Status badge variants:**
- Published (green)
- Draft (neutral)
- Archived (orange)
All × 2 (light mode, dark mode)

**Modal states:**
- Delete confirmation
- Archive confirmation

---

## Atmosphere Notes

The admin panel is a **tool for people who care deeply about quality**. The admin is probably the blog owner — someone with strong aesthetic opinions who built this blog to publish good writing about something they love.

**The admin panel should feel like it belongs to the same person who designed the public blog.** Same fonts, same colors, same attention to detail. Not a generic CRUD interface bolted on the side.

**Information density matters here.** Unlike the public blog where whitespace signals confidence, the admin panel can be more information-dense — the user is here to work, not to read. But never cluttered. Every element earns its space.

**The stats and analytics section should feel genuinely useful**, not decorative. Numbers should be readable at a glance. Trends (up/down percentages) provide context without requiring the admin to do mental math.

**Tables are the core UI pattern here.** They must be scannable, sortable-feeling (even if not implemented), and clearly show the most important information at a glance. The post title is always the primary element in a row — everything else is secondary.

**The delete and archive modals must communicate gravity without being alarming.** Deleting is permanent — the modal should make that clear with calm authority, not panic-inducing red everywhere. Archiving is reversible — the modal should feel reassuring.

**Dark mode admin** should feel like a **professional working late** — the same focused, purposeful atmosphere as the dark mode editor. Not a dramatic cinematic experience like the public blog dark mode, but a comfortable working environment for someone managing content at any hour.

**The "← Blog" link in the top left is more important than it looks.** It is the admin's quick escape back to their creation. It should feel like stepping from the backstage into the theater — both spaces are part of the same world.
