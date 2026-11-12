# OpenCS News

A dark editorial technology news publication for OpenCS Community.

## Current status
The public homepage is the first frontend milestone. It currently uses editorial placeholder cards; these are not live news articles. Supabase database, authentication, AI drafting and the approval workflow must be configured before production publishing.

## Planned architecture
- Static public frontend hosted with GitHub Pages.
- Supabase Postgres for articles, categories and source records.
- Supabase Auth for administrator sign-in.
- Row Level Security: public readers can only read published articles; administrators can manage drafts and approvals.
- AI research/drafting creates pending-review content only. It must never publish directly.
- Admin approval is required before an article becomes public.

## Deploy
The site is in the opencs-news directory of the tivalsdeveloper.github.io repository.
After GitHub Pages is enabled for the repository, the expected URL is:
https://tivalsdeveloper.github.io/opencs-news/

## Supabase setup
See supabase/schema.sql. Create a dedicated Supabase project, apply the schema, then configure the frontend with the project URL and publishable key. Never put a service-role key or AI provider key in browser code.

## Editorial requirements
Each article should include a publication date, author/editor, category, concise summary, source links and a verification note. Distinguish confirmed reporting from analysis. Do not reproduce copyrighted articles; write original summaries and link to sources.