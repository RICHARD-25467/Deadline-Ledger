# Deadline Ledger

A full-stack student deadline manager built with React + Vite + Supabase, ready for GitHub and Vercel.

## Features

- Supabase email/password authentication
- User-specific data protected with Row Level Security (RLS)
- Dashboard with active, due-soon, overdue and completed statistics
- Add, edit, complete and delete deadlines
- Categories, courses, priorities, notes and due times
- Calendar view
- Search, filter and sorting
- In-app reminder banner
- Browser notification reminders when permission is granted
- Responsive mobile layout
- Vercel-ready deployment
- SQL schema and RLS policies included

## 1. Create Supabase project

Create a project at https://supabase.com.

Open **SQL Editor** and run:

`supabase/schema.sql`

The schema creates the `deadlines` table, indexes, triggers and RLS policies.

For local development, create `.env.local` from `.env.example`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

The anon key is safe to use in the browser when RLS is correctly configured. Never put a Supabase service-role key in this frontend.

## 2. Install and run

```bash
npm install
npm run dev
```

## 3. Authentication

Supabase Auth handles account creation and login.

For a simple student app, email/password is enabled by default. If email confirmation is enabled in your Supabase project, users must confirm their email before signing in.

## 4. Deploy to Vercel

Push this project to GitHub.

In Vercel:
1. Import the GitHub repository.
2. Framework preset: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy.

`vercel.json` is included so client-side routes continue to work.

## Project structure

```text
deadline-ledger/
├── public/
├── src/
│   ├── main.jsx
│   └── styles.css
├── supabase/
│   └── schema.sql
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── README.md
└── vercel.json
```

## Important

This package contains no Supabase credentials. Add your project's URL and anon key through Vercel environment variables or a local `.env.local`.

