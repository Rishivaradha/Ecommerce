## Netlify Deployment Guide

1. **Prepare the bundle**
   - Ensure the root folder contains `index.html`, all other HTML files, `style.css`, `script.js`, `data.json`, `design-tokens.json`, `project-analysis.json`, `conversion-report.md`, `assets/`, etc.
   - No build step is required; the project is already production-ready.

2. **Use Netlify Drop (drag & drop)**
   - Visit [https://app.netlify.com/drop](https://app.netlify.com/drop).
   - Drag the entire project folder (or a `.zip` of the folder) onto the drop zone.
   - Netlify will upload and host the static site automatically.

3. **Configure the site**
   - Ensure the **Publish directory** is set to the project root (where `index.html` lives).
   - Since there is no build command, leave the build step blank.
   - After deployment, Netlify provides a default URL (e.g., `https://your-site.netlify.app`). You can customize the domain inside the site settings.

4. **Route handling**
   - All primary entry points are HTML files (`/index.html`, `/products.html`, `/cart.html`, etc.). Access them directly or via links rendered in the UI.
   - If you need pretty URLs (e.g., `/products` instead of `/products.html`), add rewrite rules in a `_redirects` file, but this is optional.

5. **Environment considerations**
   - No environment variables are needed.
   - `fetch("data.json")` works on Netlify because the file is hosted alongside your pages.

6. **Post-deploy verification**
   - Login flow: open `/login.html`, submit any email/password, and confirm redirect to the dashboard.
   - Data-driven screens: confirm products load, filters work, cart updates persist on reload, and analytics charts render.
   - Responsive breakpoints: test 1366px (baseline), tablet, and mobile widths to validate layout fidelity.

That’s it! The site is live once Netlify finishes processing the upload (usually a few seconds).

