create extension if not exists pgcrypto;
create type public.article_status as enum ('draft','pending_review','published','rejected');
create table if not exists public.news_categories (
 id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, description text, created_at timestamptz not null default now()
);
create table if not exists public.news_articles (
 id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique, excerpt text not null, body_markdown text not null,
 category_id uuid references public.news_categories(id) on delete set null, status public.article_status not null default 'draft',
 hero_image_url text, author_name text not null default 'OpenCS News Desk', created_by uuid references auth.users(id) on delete set null,
 reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz, published_at timestamptz,
 verification_notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint published_requires_date check (status <> 'published' or published_at is not null)
);
create table if not exists public.news_sources (
 id uuid primary key default gen_random_uuid(), article_id uuid not null references public.news_articles(id) on delete cascade,
 source_name text not null, source_url text not null, published_at timestamptz, accessed_at timestamptz not null default now(), notes text, created_at timestamptz not null default now()
);
create index if not exists news_articles_publication_idx on public.news_articles(status,published_at desc);
create index if not exists news_articles_category_idx on public.news_articles(category_id,published_at desc);
create index if not exists news_sources_article_idx on public.news_sources(article_id);
create index if not exists news_articles_created_by_idx on public.news_articles(created_by);
create index if not exists news_articles_reviewed_by_idx on public.news_articles(reviewed_by);
alter table public.news_categories enable row level security;
alter table public.news_articles enable row level security;
alter table public.news_sources enable row level security;
create policy "Categories visible to everyone" on public.news_categories for select to anon,authenticated using (true);
create policy "Admins insert categories" on public.news_categories for insert to authenticated with check (((select auth.jwt())->'app_metadata'->>'role')='admin');
create policy "Admins update categories" on public.news_categories for update to authenticated using (((select auth.jwt())->'app_metadata'->>'role')='admin') with check (((select auth.jwt())->'app_metadata'->>'role')='admin');
create policy "Admins delete categories" on public.news_categories for delete to authenticated using (((select auth.jwt())->'app_metadata'->>'role')='admin');
create policy "Published articles or admin access" on public.news_articles for select to anon,authenticated using (status='published' or ((select auth.jwt())->'app_metadata'->>'role')='admin');
create policy "Admins can insert articles" on public.news_articles for insert to authenticated with check (((select auth.jwt())->'app_metadata'->>'role')='admin');
create policy "Admins can update articles" on public.news_articles for update to authenticated using (((select auth.jwt())->'app_metadata'->>'role')='admin') with check (((select auth.jwt())->'app_metadata'->>'role')='admin');
create policy "Admins can delete articles" on public.news_articles for delete to authenticated using (((select auth.jwt())->'app_metadata'->>'role')='admin');
create policy "Published sources or admin access" on public.news_sources for select to anon,authenticated using (exists(select 1 from public.news_articles a where a.id=article_id and a.status='published') or ((select auth.jwt())->'app_metadata'->>'role')='admin');
create policy "Admins can insert sources" on public.news_sources for insert to authenticated with check (((select auth.jwt())->'app_metadata'->>'role')='admin');
create policy "Admins can update sources" on public.news_sources for update to authenticated using (((select auth.jwt())->'app_metadata'->>'role')='admin') with check (((select auth.jwt())->'app_metadata'->>'role')='admin');
create policy "Admins can delete sources" on public.news_sources for delete to authenticated using (((select auth.jwt())->'app_metadata'->>'role')='admin');
grant select on public.news_categories,public.news_articles,public.news_sources to anon,authenticated;
grant insert,update,delete on public.news_categories,public.news_articles,public.news_sources to authenticated;
insert into public.news_categories(name,slug,description) values
 ('Artificial Intelligence','ai','AI models, agents, research and machine learning'),
 ('Cybersecurity','cybersecurity','Security research, vulnerabilities and digital safety'),
 ('Software Development','software','Programming languages, tools and engineering'),
 ('Robotics & Computing','robotics-computing','Robotics, hardware and computing research'),
 ('South African Technology','south-africa','Technology companies, infrastructure and innovation in South Africa'),
 ('Startups & Business','startups','Technology startups, funding and entrepreneurship')
on conflict(slug) do nothing;
