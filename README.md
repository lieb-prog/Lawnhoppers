# Lawn Hoppers Launch App

A Jobber-inspired MVP for a lawn care company. It gives Isaac one simple place to handle customer requests, schedule jobs, track work progress, and invoice customers.

## Included

- Vite, React, and Tailwind
- Jobber-style admin dashboard
- Customer booking request modal
- Requests to jobs workflow
- Schedule, clients, quotes, jobs, invoices, and messages screens
- Browser localStorage persistence for immediate testing
- Supabase database schema
- Vercel configuration

## Run locally

npm install
npm run dev

## Build

npm run build
npm run preview

## Deploy

1. Import this GitHub repo into Vercel.
2. Use framework preset Vite.
3. Build command: npm run build.
4. Output directory: dist.
5. Create a Supabase project.
6. Run supabase/schema.sql in the Supabase SQL Editor.
7. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Project Settings.

The current app runs right away with browser storage. The next production pass should connect the UI actions to Supabase tables and add owner login.
