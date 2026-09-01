# 🚀 Hugo for Obsidian

A high-performance, modern static documentation site and knowledge base template built with **Hugo**, crafted specifically to pair seamlessly with the [Hugo Sync Modal](https://github.com/rubanbalaji-g/obsidian-hugo-sync-modal) Obsidian plugin.

---

## ✨ Features

- **🖥️ Fixed 3-Pane Viewport Layout**: Modern documentation layout (inspired by VitePress & Obsidian Desktop).
  - Pinned header and sticky breadcrumbs.
  - Pinned left topic sidebar with its own independent scrollbar.
  - Pinned right "On this page" TOC with its own independent scrollbar.
  - **Only center note content scrolls**, with an embedded dead-bottom footer.
- **🎨 Custom Obsidian Callouts**: Native rendering for all Obsidian callouts (`[!tip]`, `[!note]`, `[!danger]`, etc.) with **dynamic Lucide vector icon color inheritance** (`stroke: currentColor`).
- **📐 KaTeX Math Typography**: High-speed mathematical rendering for inline equations ($E = mc^2$) and complex display math blocks, with automatic horizontal scroll containers on mobile.
- **🧜‍♂️ On-Demand Mermaid Diagrams**: Flowcharts and sequence diagrams load on demand with dark/light theme switching.
- **🧭 Non-Emoji Clean Breadcrumbs**: Clean navigation trail powered by universal Lucide vector SVGs that never break or glitch on older operating systems.
- **🔍 Instant Fuzzy Search**: Client-side modal search triggered via `Ctrl + K` / `Cmd + K`.
- **🏷️ Obsidian Frontmatter Support**: Supports `aliases:` for redirects, `title:`, `tags:`, `is_index:`, and `draft:`.
- **🌐 Automated Custom Domain Configuration**: Easily configure your custom domain directly in GitHub Actions or via the Obsidian sync plugin.

---

## ⚡ 2-Minute Quick Start

### Step 1: Use this Template
1. Click the green **"Use this template"** button at the top of this repository $\rightarrow$ **"Create a new repository"**.
2. Name your repository (e.g., `my-digital-garden`) and set it to **Public** or **Private**.

### Step 2: Deploy to Cloudflare Pages (Free)
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
2. Select your newly created repository.
3. Configure the build settings:
   - **Framework preset**: `Hugo`
   - **Build command**: `hugo --minify`
   - **Build output directory**: `public`
4. Click **Save and Deploy**. Your site will be live on a `*.pages.dev` domain in under 30 seconds!

*(Alternative: You can also deploy via the included GitHub Actions workflow by adding `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to your GitHub repository secrets).*

### Step 3: Install Sync Plugin in Obsidian
1. In your Obsidian vault, install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Community Plugins.
2. In Obsidian Settings $\rightarrow$ **BRAT** $\rightarrow$ **Add Beta plugin**, enter:
   ```text
   https://github.com/rubanbalaji-g/obsidian-hugo-sync-modal
   ```
3. Enable the **Hugo Sync Modal** plugin.

### Step 4: Configure & Publish
1. Open Obsidian Settings $\rightarrow$ **Hugo Sync Modal**.
2. Enter your:
   - **GitHub Personal Access Token** (classic token with `repo` scope).
   - **GitHub Username** & **Repository Name**.
   - **Branch**: `main`.
3. Click the cloud upload icon in Obsidian's left ribbon.
4. Review your notes and click **Publish to GitHub**!

---

## 🌐 Custom Domain Setup

Want to use your own domain (e.g., `notes.yourdomain.com`)?

1. **Option A (GitHub Repository Variable)**:
   - In your GitHub repo, go to **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions** $\rightarrow$ **Variables**.
   - Add a new variable: `CUSTOM_DOMAIN` with the value `notes.yourdomain.com`.
   - GitHub Actions will automatically compile Hugo with `baseURL = "https://notes.yourdomain.com/"`.

2. **Option B (Direct in `hugo.toml`)**:
   - Change line 1 of `hugo.toml`:
     ```toml
     baseURL = "https://notes.yourdomain.com/"
     ```

---

## 🛠️ Local Development

To preview and edit the site locally:

```bash
# Clone your repository
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

# Start local Hugo development server with drafts
hugo server -D
```

Open `http://localhost:1313` in your browser.

---

## 📁 Repository Structure

```text
├── content/               # Your published markdown notes
│   ├── _index.md          # Home page
│   └── getting-started/   # Example topic section
├── layouts/               # Hugo HTML templates & Obsidian parsers
│   ├── _default/          # Base, single note, and list templates
│   └── partials/          # Breadcrumbs, header, sidebar, callout parser
├── static/                # Static assets (CSS, JS, images)
│   ├── css/               # 3-pane fixed layout & custom callouts
│   └── js/                # Theme switcher & fuzzy search
├── .github/workflows/     # Automated deployment pipeline
└── hugo.toml              # Site settings & KaTeX delimiters
```

---

## 📄 License

MIT License © 2026 [Dr. Rubanbalaji](https://github.com/rubanbalaji-g)