# JarbTeam 🎓🤝

> **"Find your next project. Build it with the right people."**

**JarbTeam** is a modern university student collaboration platform designed to make finding teammates effortless for course capstones, hackathons, competitions, innovation challenges, and startup projects.

---

## ✨ Features

- **Minimal Pastel Academic Aesthetic**: Adheres to the *Pastel Academic Synergy* design system—soft sky, lavender, and pink washes, generous rounded corners, Plus Jakarta Sans typography, and clean contrast without clinical corporate clutter.
- **Two Core Actions**:
  - **Create Project**: Define your idea, project type, duration, capacity, required skills, and recruiting roles.
  - **Join Project**: Explore available opportunities with live search, filters (Type, Work Style, Skills), and relevance ranking.
- **Rule-Based Match Scoring (0–100%)**:
  - **Skill Match (40%)**: Compares student proficiencies with project requirements.
  - **Interest / Domain Match (25%)**: Aligns project themes with personal passions.
  - **Role Match (20%)**: Connects open roles with preferred team responsibilities.
  - **Availability & Work Style Match (15%)**: Assesses schedule compatibility and work modes (Online, On-site, Hybrid).
  - Provides a transparent *"Why this project matches you"* explanation breakdown on project details.
- **Team Roster & Application Flow**:
  - Direct *"Request to Join"* dialog with customizable role and personal pitch.
  - Project Owner dashboard to review, accept, or decline applicant requests with real-time capacity checks.
- **Student Profile Management**: Showcase university, major, bio, skills, interests, and project history with pastel chips.
- **Authentication**:
  - University email & password registration with instant onboarding redirect.
  - Google OAuth single sign-on (SSO) with Supabase PKCE flow.
  - Supabase Row Level Security (RLS) enforcing granular access control across all 9 database tables.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Typography**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- **Database & Auth**: [Supabase PostgreSQL & Auth](https://supabase.com/)
- **Security**: Supabase Row Level Security (RLS) policies
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (Tested on Node.js v24)
- npm or yarn

### 2. Clone the Repository
```bash
git clone https://github.com/viphu-cs/JarbTeam.git
cd JarbTeam
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 6. Build for Production
```bash
npm run build
npm run start
```

---

## 🔒 Security & Privacy

- No service role keys or Google OAuth secrets are ever bundled into client-side code.
- Row Level Security (RLS) policies ensure students can only modify their own profile, manage projects they own, and process requests directed to their teams.

---

## 📄 License

MIT © JarbTeam Team
