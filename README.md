# Taleora 📖

A modern, distraction-free story publishing and reading platform built for serial fiction authors and readers.

🌐 **Live Application:** [https://taleora-nine.vercel.app](https://taleora-nine.vercel.app)

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Frontend & State**: [React 19](https://react.dev/), TypeScript
- **Styling & Theming**: [Tailwind CSS v4](https://tailwindcss.com/), `next-themes`
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL with Row-Level Security, Auth, Storage, Realtime WebSockets)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/)

---

## 📋 Prerequisites

- **Node.js**: v20.x or later
- **Package Manager**: `npm` (or `pnpm` / `yarn`)
- **Supabase Project**: A configured Supabase project with database migrations applied

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/dharsitr/Taleora.git
cd Taleora
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase project credentials:

```env
# Public Application Settings
NEXT_PUBLIC_APP_NAME="Taleora"
NEXT_PUBLIC_APP_DESCRIPTION="A modern, immersive story and reading experience"
NEXT_PUBLIC_APP_URL="http://localhost:3000" # Production: https://taleora-nine.vercel.app

# Supabase Public Configuration (Safe for client-side usage with RLS)
NEXT_PUBLIC_SUPABASE_URL="https://<your-project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<your-publishable-key>"
# Legacy Anon Key fallback:
# NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"

# Server-Only Configuration (Optional / Admin tasks - NEVER expose to client)
# SUPABASE_SECRET_KEY="<your-secret-key>"
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with Turbopack |
| `npm run build` | Builds the application for production |
| `npm run start` | Runs the built production server |
| `npm run lint` | Runs ESLint to check for code quality and syntax issues |
| `npm run test` | Runs the automated test suite using Vitest |

---

## 📁 Project Structure

```
├── public/               # Static assets, icons, manifest, and service worker
├── scripts/              # Helper utility scripts
├── src/
│   ├── app/              # Next.js App Router (pages and API endpoints)
│   ├── components/       # Reusable React components (Reader, Studio, Layout, Auth)
│   ├── lib/              # Core utilities, API client, rate limiting, and Supabase clients
│   └── proxy.ts          # Edge authentication & route protection proxy
├── supabase/
│   └── migrations/       # SQL migrations, table definitions, and RLS policies
└── vitest.config.mts     # Test configuration
```

---

## 📄 License

Private repository. All rights reserved.
