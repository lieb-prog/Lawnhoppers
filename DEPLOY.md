# Deployment Plan

## Accounts to create

- GitHub for source code
- Vercel for website hosting and production deployments
- Supabase for database, auth, and backend API
- Domain registrar for the Lawn Hoppers domain
- Stripe later for online invoice payments
- Email or SMS provider later for reminders and invoice messages

## Vercel settings

- Framework preset: Vite
- Build command: npm run build
- Output directory: dist
- Install command: npm install

## Environment variables

Create these in Vercel Project Settings after creating Supabase:

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

## Supabase setup

1. Create a new Supabase project.
2. Open SQL Editor.
3. Paste and run supabase/schema.sql.
4. Create Isaac's owner login under Authentication > Users.
5. Keep the service role key private. Never put it in the browser or Vercel client environment variables.

## Launch sequence

1. Deploy the app to Vercel.
2. Test the booking request flow on mobile.
3. Test request approval, scheduling, job completion, and invoice state changes.
4. Connect a custom domain.
5. Send the booking link to five friendly customers.
6. Keep manual payments for the first week, then add Stripe when the workflow is validated.
