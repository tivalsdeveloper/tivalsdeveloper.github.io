# OpenCS News

A dark editorial technology news publication for OpenCS Community.

## Current status
- Responsive public frontend is connected to Supabase and reads only published stories.
- Admin dashboard supports email/password sign-in, article drafts, source records, review submission, approval, publication, rejection and unpublishing.
- AI-assisted drafting is not yet connected. AI output must enter the review queue and must never publish automatically.
- Public deployment is not verified yet; GitHub Pages must be enabled for the repository.

## Architecture
- Static frontend in this directory, hosted through GitHub Pages.
- Supabase Postgres stores articles, categories and source records.
- Supabase Auth secures the editorial dashboard.
- RLS allows public users to read published articles and their sources only. Admins are authorized through the protected `app_metadata.role = admin` claim.
- Browser code uses only the publishable key. Never put a service-role key or AI provider key in frontend files.

## Supabase project
- Dashboard: https://supabase.com/dashboard/project/asxeslqmfbhqzkqclfha
- Project URL: https://asxeslqmfbhqzkqclfha.supabase.co
- Region: eu-west-1
- Database schema: `supabase/schema.sql`

The project schema has been installed and verified. It contains six news categories and the three news tables: `news_categories`, `news_articles`, and `news_sources`.

## Create the first administrator
1. In the Supabase dashboard, open **Authentication → Users** and create an account for the editor using the intended email address and a strong password.
2. Open **SQL Editor** and run the following query, replacing the email with that exact account email:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'YOUR_ADMIN_EMAIL';
```

3. Sign out and sign in again at `https://tivalsdeveloper.github.io/opencs-news/admin.html` so the refreshed JWT contains the admin role.
4. Do not use `user_metadata` for roles; users can edit their own user metadata.

## Deploy
The website lives in the `opencs-news` directory of the `tivalsdeveloper/tivalsdeveloper.github.io` repository.
Enable GitHub Pages for the repository using the `main` branch and `/(root)` as the publishing source. The expected website URL is:
https://tivalsdeveloper.github.io/opencs-news/

## Editorial workflow
1. An editor creates a draft and records at least one source URL.
2. Submit it to the review queue.
3. An authorized admin checks factual accuracy, attribution, dates, context, image rights and verification notes.
4. The admin approves and publishes it. Only then will it appear on the public site.
5. Rejected and draft articles remain private.

Do not reproduce copyrighted articles. Write original reporting or summaries, cite original sources, distinguish confirmed facts from analysis, and correct errors transparently.
