create table if not exists projects (
  id text primary key,
  user_id text not null,
  name text not null,
  domain text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on projects (user_id);

create table if not exists certificates (
  id text primary key,
  user_id text not null,
  project_id text not null,
  title text not null,
  verdict text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists certificates_user_id_idx on certificates (user_id);
