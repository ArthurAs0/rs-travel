# RS Travel: Design Demo

This is a **design-only demo** of the RS Travel website. It's a clickable, animated frontend that uses mock data.
It has no backend, no database and no auth. The goal is to show the look, feel and page flow before building the real system.

The folder layout already follows the planned monorepo (`apps/web`), so the demo grows into the real product instead of being thrown away.

---

## 1. Scope

**In the demo**
- Public site pages (listed in section 5), fully styled and animated
- Mock data from local TypeScript files
- Forms that validate and show a success state but **don't send anything**
- Responsive layout (mobile, tablet, desktop)
- Optional: a static admin panel mock-up (section 5.2)

**Not in the demo (comes later)**
- `apps/api` (Fastify), PostgreSQL, migrations
- Login, JWT, roles
- Real form submission, image uploads
- PM2 / deployment

---

## 2. Tech stack (demo)

| Purpose | Tool |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Base UI components | shadcn/ui (current version is built on Base UI) + `lucide-react` icons |
| Animation | `motion` (formerly Framer Motion, import from `motion/react`) |
| Scrolling | **Native browser scrolling**. Motion handles the hero's gentle zoom, parallax and card reveals (`useScroll`, `useTransform`, `whileInView`). |
| Showcase effects | Magic UI (copy-paste components, added only when needed) |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` |
| Images / fonts | `next/image`, `next/font` |
| Package manager | pnpm (workspaces) |

**Not installed, add only if needed:**
- `lenis`: if we decide to change how scrolling *feels* (smooth/inertia scrolling).
- `gsap` + ScrollTrigger: if we decide on an elaborate **pinned** scroll sequence.

---

## 3. Setup (✅ done)

Prerequisites: **Node.js 22+** and **pnpm**.

Already set up:
- Root pnpm workspace (`package.json`, `pnpm-workspace.yaml`)
- `apps/web`: Next.js 16 + TypeScript + Tailwind v4 + ESLint, `src/` dir, alias `@/*`
- shadcn/ui components: button, card, input, textarea, select, label, dialog, sheet, badge, carousel, accordion, sonner, separator
- `motion`, `react-hook-form`, `zod`, `@hookform/resolvers`, `lucide-react`

Run it (from the repo root):

```bash
pnpm install   # only needed on a fresh clone
pnpm dev       # http://localhost:3000
pnpm build     # production build check
pnpm lint
```

Add more shadcn components later (run inside `apps/web`):

```bash
pnpm dlx shadcn@latest add <component>
```

**Magic UI:** add components one at a time, using the install command shown on each component's page at magicui.design. Only add what you actually use.

---

## 4. Folder structure

```
rs-travel/
├─ pnpm-workspace.yaml
├─ package.json
├─ apps/
│  └─ web/
│     ├─ public/images/          # tour & destination photos
│     └─ src/
│        ├─ app/
│        │  ├─ (public)/         # public site pages
│        │  │  ├─ page.tsx               # Home
│        │  │  ├─ tours/page.tsx         # Tours list
│        │  │  ├─ tours/[slug]/page.tsx  # Tour detail
│        │  │  ├─ destinations/page.tsx
│        │  │  ├─ about/page.tsx
│        │  │  └─ contact/page.tsx
│        │  ├─ (admin)/admin/    # optional admin mock-up
│        │  ├─ layout.tsx
│        │  └─ globals.css       # Tailwind + design tokens
│        ├─ components/
│        │  ├─ ui/               # shadcn components (generated)
│        │  ├─ magicui/          # Magic UI components (copied)
│        │  ├─ motion/           # reusable animation wrappers (FadeIn, Stagger…)
│        │  ├─ layout/           # Header, Footer
│        │  └─ sections/         # Hero, FeaturedTours, Testimonials…
│        └─ lib/
│           ├─ mock-data/        # tours.ts, destinations.ts, testimonials.ts
│           └─ schemas/          # zod schemas for forms (move to packages/contracts later)
└─ packages/                     # empty for now → contracts later
```

---

## 5. Pages to build

### 5.1 Public site

| Page | Sections |
|---|---|
| **Home** | Animated hero (big photo or video, headline reveal, search/CTA) · Featured tours (hover cards) · Popular destinations (bento grid) · Why travel with us (icons + stagger) · Testimonials (marquee) · Enquiry CTA band · Footer |
| **Tours** | Filter bar (destination, duration, price), mock filtering · Tour card grid with scroll reveal |
| **Tour detail** | Photo gallery / carousel · Overview + highlights · Day-by-day itinerary (accordion) · Included / not included · Price box (sticky) · "Enquire about this tour" form |
| **Destinations** | Destination cards → link to filtered tours |
| **About** | Story, team, numbers (animated counters) |
| **Contact** | General enquiry form (validation + success toast), contact info, map image |

### 5.2 Admin mock-up (optional)
Static screens with no login, to show the idea:
- Dashboard (counts: tours, enquiries)
- Tours table + "edit tour" form
- Enquiries list

Keep the admin plain (shadcn only, no fancy animation).

---

## 6. Mock data

Put typed mock data in `src/lib/mock-data/`. Shape it like the future API responses, so swapping to the real API later is easy.

```ts
// src/lib/mock-data/tours.ts
export type Tour = {
  slug: string;
  title: string;
  destination: string;
  durationDays: number;
  priceFrom: number;
  currency: "EUR" | "USD";
  coverImage: string;
  gallery: string[];
  highlights: string[];
  itinerary: { day: number; title: string; description: string }[];
  included: string[];
  excluded: string[];
  featured: boolean;
};

export const tours: Tour[] = [/* 6–9 sample tours */];
```

Free photos: Unsplash / Pexels. Save them to `public/images/` (don't hotlink).

---

## 7. Design & animation rules

1. **Design tokens first.** Define colors, fonts, radius and spacing in `globals.css` (Tailwind v4 `@theme`) before building pages.
2. **Server by default.** Pages stay Server Components. Only small animated pieces get `"use client"` (put them in `components/motion/`).
3. **Reusable motion wrappers.** Build `FadeIn`, `SlideUp`, `Stagger` and `ScaleOnHover` once and reuse them everywhere, so the site has a consistent feel.
4. **Native scrolling.** Scroll effects use Motion's `useScroll` + `useTransform` (hero zoom, parallax) and `whileInView` (card reveals). Don't take over the browser's scrolling.
5. **Use animation where it helps:** hero, tour cards, scroll reveals, testimonials. Don't animate everything.
6. **Respect `prefers-reduced-motion`.** Use `useReducedMotion()` from Motion.
7. **Photos matter most.** Use `next/image` with proper `sizes`, and only add `priority` to the hero image.
8. **Mobile first.** Check every section at 375px width.

---

## 8. Build order (checklist)

- [x] 1. Workspace + Next.js app + Tailwind + shadcn + Motion installed, build & lint pass
- [ ] 2. Design tokens (colors, fonts) + Header + Footer
- [ ] 3. Motion wrappers (`FadeIn`, `Stagger`, …)
- [ ] 4. Mock data (tours, destinations, testimonials)
- [ ] 5. Home page, all sections
- [ ] 6. Tours list + Tour detail
- [ ] 7. Destinations, About, Contact
- [ ] 8. Enquiry forms (validation + success state, no sending)
- [ ] 9. Responsive pass + reduced-motion pass
- [ ] 10. (Optional) Admin mock-up screens
- [ ] 11. Deploy demo preview (e.g. Vercel) to share

---

## 9. After the demo: path to the real product

Once the design is approved:
1. Move form schemas to `packages/contracts` (shared Zod)
2. Add Turborepo
3. Build `apps/api` (Fastify + `pg`), starting with `POST /enquiries` and `POST /tour-enquiries`
4. PostgreSQL + `.sql` migrations (`dbmate`)
5. Replace mock data with API calls, one slice at a time
6. Auth (JWT in httpOnly cookies, admin role) → real admin panel
7. Decide image storage (local disk vs S3/R2)
8. Sitemap/SEO, PM2 deployment
