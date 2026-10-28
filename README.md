# NovaCart

NovaCart is a React + Vite storefront prototype. Its current product catalogue is local sample data; cart and wishlist state are stored in the browser. Supabase Auth is integrated for signup/sign-in/session persistence, and a separate Supabase `user_roles` table is used to gate the demo admin route.

## Setup

1. Install Node.js (use the current LTS release).
2. In this folder, create a local `.env` file beside `package.json` with the Supabase project URL and publishable key:

   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
   ```

   Do not commit `.env`. Never put a Supabase secret or `service_role` key in a frontend app.
3. Open a terminal in this folder and run:

   ```bash
   npm install @supabase/supabase-js
   npm run dev
   ```

4. To check the production bundle, run `npm run build`.

## Supabase setup

The SQL for the role table and signup trigger is in `supabase/auth_roles_setup.sql`. If this script has already run successfully in your Supabase project, you do not need to run it again.

To give your own account admin access, open Supabase Dashboard → Authentication → Users, copy that account's User UID, then run this in SQL Editor (replace the placeholder with your own UID):

```sql
update public.user_roles
set role = 'admin'
where user_id = 'YOUR-USER-UUID';
```

The normal frontend client is granted read-only access to each signed-in user's own role. Admin access should be enforced by database RLS policies for any real admin data; protecting a React route alone is not sufficient security for database operations.

## Current limitations

- Product catalogue and admin statistics are still sample/local data.
- Cart and wishlist are browser-local, not synchronized across devices.
- Checkout does not process payments or create orders.
- Admin page access is gated by the role table, but real product and order management still needs backend tables and RLS policies.
- Password recovery and a full email-confirmation UX are not yet implemented.

This is a portfolio project in progress, not yet a production-ready store.
