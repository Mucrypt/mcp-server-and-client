create table public.users (
  id uuid not null,
  email character varying(255) not null,
  full_name character varying(255) null,
  organization_id uuid null,
  role public.user_role_enum null default 'user'::user_role_enum,
  mfa_enabled boolean null default false,
  mfa_secret text null,
  last_login timestamp with time zone null,
  login_attempts integer null default 0,
  account_locked_until timestamp with time zone null,
  email_verified boolean null default false,
  phone character varying(20) null,
  avatar_url text null,
  preferences jsonb null default '{}'::jsonb,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  subscription_tier_id uuid null,
  subscription_status text null default 'free'::text,
  subscription_expires_at timestamp without time zone null,
  is_active boolean null default true,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint users_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete set null,
  constraint users_subscription_tier_id_fkey foreign KEY (subscription_tier_id) references subscription_tiers (id)
) TABLESPACE pg_default;

create index IF not exists idx_users_organization_id on public.users using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_users_role on public.users using btree (role) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create index IF not exists idx_users_last_login on public.users using btree (last_login) TABLESPACE pg_default;

create trigger update_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();