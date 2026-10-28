NovaCart auth update (source patch)

HOW TO APPLY
1. Extract this ZIP.
2. Copy its src folder and supabase folder into the ROOT of your existing NovaCart project (the folder containing package.json).
3. Allow files in src to be overwritten when Windows asks.
4. Do NOT replace your .env file. Keep it local and private.
5. Your existing .env must contain:
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
6. You already installed @supabase/supabase-js in your local project, so do not overwrite package.json/package-lock.json with this patch.
7. In Supabase SQL Editor, run supabase/auth_roles_setup.sql.
8. Restart the dev server (Ctrl+C, then npm run dev) and test login/sign-out.

IMPORTANT
- New accounts receive the customer role automatically.
- Admin access remains denied until you explicitly promote your own account through SQL.
- To promote yourself, find your user's UUID in Supabase Dashboard > Authentication > Users, then run:
  update public.user_roles set role = 'admin' where user_id = 'YOUR-USER-UUID';
- Never put a Supabase secret/service_role key in a Vite VITE_ variable or browser code.
- The AdminDashboard currently displays local sample product data; it is not yet a full store-management backend.
