## E-Store – Static E-Commerce Frontend

E-Store is a **fully static HTML/CSS/JavaScript** recreation of a modern e‑commerce dashboard, originally inspired by a **Next.js + React + Tailwind** project.  
This version removes all frameworks and bundlers and focuses on a clean, performant, and responsive frontend suitable for demos, assessments, and static hosting.

- **GitHub Repository:** `https://github.com/Rishivaradha/Ecommerce.git`  
- **Live Demo (Vercel):** `https://e-store-rishivaradha.vercel.app/`

---

## 1. Features

- **Home Categories**
  - Landing page with category tiles (Phones, Laptops, Watches, Fans, Fashion).
  - Each tile links into the products flow using a consistent card layout.

- **Product Search & Filters**
  - Text search across product names and descriptions.
  - Price slider filter (max price).
  - Rating dropdown filter (Any / 3+ / 4+ / 4.5+).
  - Sort options: Featured, Price (low → high, high → low), Rating.

- **Product Listing Grid**
  - Responsive card grid with fixed card sizing for visual consistency.
  - Shows category label, rating, short description, and formatted price.
  - “Add to Cart” and “Buy Now” actions wired to the in‑memory store.

- **Shopping Cart**
  - Line items with thumbnail, name, description, category, and price.
  - Quantity increment/decrement controls (buttons and numeric input).
  - Item removal and dynamic subtotal/total calculation.
  - Clear empty state when no items are in the cart.

- **Checkout Page**
  - Shipping address form (full name, street, city, state, postal code, country).
  - Payment section with **Card** and **UPI** modes.
  - Card validation (length, expiry format, CVV).
  - Place Order button with clear layout and spacing below payment inputs.

- **Order History (Session Only)**
  - Session-scope list of orders created during that browser session.
  - Status badges (Processing, Shipped, Out for Delivery, Delivered).
  - Visual step timeline with progress bar and step indicators.

- **Analytics Dashboard (Session Only)**
  - Summary cards: Total Revenue, Total Orders, Average Order Value, Revenue Growth.
  - Line chart: Orders per month.
  - Bar chart: Revenue per month.
  - Pie chart: Revenue by category.
  - Shows a clear “No analytics yet” state when there are no session orders.

- **Clean UI Interactions & Animations**
  - Subtle hover lift on cards and buttons.
  - Soft fade-in on sections.
  - Skeleton states for loading placeholders.
  - Smooth transitions tuned for a modern, professional feel.

---

## 2. Data Model (Mock JSON)

All functionality is powered by **mock JSON** in `data.json`.

- `categories`: High-level store categories used on the home page.
- `products`: Product catalog (IDs, names, descriptions, categories, prices, ratings, images).
- `orders`: Example orders (used as a reference model; the static build uses in-memory session orders only).
- `analytics`: Sample monthly metrics modelled for the original React dashboard.

The static frontend **does not call any backend** – all data is loaded from `data.json` at runtime and managed in memory via `script.js`.

---

## 3. Tech Stack

- **HTML5** – Semantic structure for pages and components.
- **CSS3** – Custom properties (design tokens), modern layout (Flexbox/Grid), and keyframe animations.
- **Vanilla JavaScript** – In‑memory store and UI wiring (`script.js`).
- **Chart.js (via CDN)** – Line, bar, and pie charts on the analytics dashboard.
- **Mock JSON** – `data.json` as the sole data source.

No React, Next.js, Tailwind, TypeScript, Zustand, or bundlers are used in this static version.

---

## 4. Folder Structure

Static project layout:

```text
.
├── index.html                 # Home – category overview
├── login.html                 # Login form (session auth)
├── signup.html                # Signup form (client-side validation only)
├── products.html              # Product listing + search/filters/sort
├── cart.html                  # Shopping cart view
├── checkout.html              # Checkout form (address + payment)
├── orders.html                # Session order history + timeline
├── analytics.html             # Session analytics dashboard (Chart.js)
├── style.css                  # Global styles, layout, tokens, animations
├── script.js                  # In-memory store + UI interactions + charts
├── data.json                  # Mock data for categories/products/orders/analytics
├── design-tokens.json         # Design tokens (colors, spacing, type, etc.)
├── project-analysis.json      # Notes extracted from original React project
├── conversion-report.md       # Summary of static conversion details
├── deploy-instructions.md     # Netlify / static deployment notes
├── assets/
│   ├── img/
│   │   ├── 1st.png            # Reference screenshots from original build
│   │   ├── 2nd.png
│   │   ├── 3rd.png
│   │   ├── 4th.png
│   │   ├── 5th.png
│   │   ├── 6th.png
│   │   ├── 7th.png
│   │   └── 8th.png
│   ├── icons/
│   │   ├── analytics.svg
│   │   ├── cart.svg
│   │   ├── home.svg
│   │   ├── logout.svg
│   │   └── store.svg
│   └── fonts/
│       ├── README.txt         # Notes about Google Fonts usage
│       └── .keep              # Placeholder for potential self-hosted fonts
└── README.md                  # This file
```

> Note: Screenshot paths in the examples below assume a future `assets/screenshots/` directory; you can generate and place actual PNGs there as needed for the repository.

---

## 5. Getting Started

### 5.1 Clone the Repository

```bash
git clone https://github.com/Rishivaradha/Ecommerce.git
cd Ecommerce
```

> If this static build lives on a separate branch or directory, navigate into that folder first.

### 5.2 Run with a Simple Static Server

Because `script.js` fetches `data.json`, you should serve the files over HTTP (not `file://`).

Using **Python 3**:

```bash
python3 -m http.server 4173
```

Using **http-server** (Node.js):

```bash
npx http-server .
```

Then open:

```text
http://localhost:4173
# or the port http-server prints out (often http://127.0.0.1:8080)
```

### 5.3 Navigate the App

- `index.html` → category overview (home).
- `products.html` → listing + filters.
- `cart.html`, `checkout.html`, `orders.html`, `analytics.html` → cart, checkout, order history, and analytics dashboard.
- `login.html` / `signup.html` → auth entry points (mocked, front-end only).

---

## 6. Deployment

This static build is deployed on **Vercel**:

- **Live URL:** `https://e-store-rishivaradha.vercel.app/`

Deployment notes:

- Vercel serves the static files directly (no build command required).
- Each HTML page is directly addressable (e.g., `/index.html`, `/products.html`, `/analytics.html`).
- The root route typically maps to `index.html`.

You can also deploy this folder to any static hosting platform (Netlify, GitHub Pages, S3, etc.) using the same structure.

---

## 7. Screenshots

You can capture and store screenshots under `assets/screenshots/` and reference them here.

```markdown
![Homepage](./assets/screenshots/home.png)
![Products](./assets/screenshots/products.png)
![Cart](./assets/screenshots/cart.png)
![Checkout](./assets/screenshots/checkout.png)
![Orders](./assets/screenshots/orders.png)
![Analytics](./assets/screenshots/analytics.png)
```

---

## 8. Purpose & Context

This static implementation of **E-Store – Static E-Commerce Frontend** was built as part of a **frontend assessment for ProU Technology**.

Goals:

- Demonstrate the ability to translate a complex Next.js + React + Tailwind application into a **pure static HTML/CSS/JS** implementation.
- Preserve the original **look, feel, and UX behaviors** of the React dashboard as closely as possible.
- Showcase:
  - Design token extraction.
  - Responsive layouts without CSS frameworks.
  - State management in vanilla JavaScript.
  - Chart integration without React bindings.

---

## 9. Notes for Evaluators

- **No Backend**
  - All logic runs purely on the client.
  - No API calls, server code, or database.

- **Session-Only Data**
  - Cart, order history, and analytics data exist **only in memory**.
  - When you refresh the page or close the tab, all data is reset to an empty state.
  - This behavior is intentional and matches the assessment requirement.

- **In-Memory Session Logic Only**
  - `script.js` implements a lightweight in-memory store.
  - No `localStorage`, `sessionStorage`, `indexedDB`, or cookies are used.

- **Fully Responsive UI**
  - Layouts are tuned for:
    - Desktop (1366px+)
    - Tablet
    - Mobile (single-column stacking)
  - Cards, grids, and forms maintain consistent spacing and avoid overlap at all breakpoints.

- **Static-Only Technologies**
  - No React, Next.js, or Tailwind in this build.
  - Only HTML, CSS, vanilla JS, Chart.js (via CDN), and `data.json`.

---

## 10. Further Reading / Internal Docs

For more implementation detail:

- `design-tokens.json` – Source of truth for colors, spacing, typography, radii, shadows, transitions.
- `project-analysis.json` – Extracted notes from the original Next.js + React project that guided this static rebuild.
- `conversion-report.md` – What was converted, logic parity, animation preservation, and known approximations.
- `deploy-instructions.md` – Step-by-step notes for deploying to static hosts (e.g., Netlify, Vercel).

These files are included to make the architecture and design decisions transparent and easy to evaluate.
