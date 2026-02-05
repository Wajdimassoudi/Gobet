
create table profiles (
  id uuid not null primary key,
  username text unique not null,
  role text not null default 'USER' check (role in ('USER', 'ADMIN')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  constraint username_length check (char_length(username) >= 3),
  foreign key (id) references auth.users(id) on delete cascade
);

alter table profiles enable row level security;

create policy "Users can view their own profile." on profiles
  for select using ( auth.uid() = id );

create policy "Admins can view all profiles." on profiles
  for select using ( (select role from profiles where id = auth.uid()) = 'ADMIN' );

create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  balance numeric(15, 2) not null default 0.00 check (balance >= 0),
  currency text not null default 'TN',
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  foreign key (user_id) references auth.users(id) on delete cascade
);

alter table accounts enable row level security;

create policy "Users can view their own account." on accounts
  for select using ( auth.uid() = user_id );

create policy "Admins can manage all accounts." on accounts
  for all using ( (select role from profiles where id = auth.uid()) = 'ADMIN' );

create type transaction_type as enum ('deposit', 'withdraw', 'bet_placed', 'bet_won');

create table transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  user_id uuid not null,
  type transaction_type not null,
  amount numeric(15, 2) not null check (amount > 0),
  admin_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  foreign key (account_id) references accounts(id),
  foreign key (user_id) references auth.users(id),
  foreign key (admin_id) references auth.users(id)
);

alter table transactions enable row level security;

create policy "Users can view their own transactions." on transactions
  for select using ( auth.uid() = user_id );
  
create policy "Admins can manage all transactions." on transactions
  for all using ( (select role from profiles where id = auth.uid()) = 'ADMIN' );

create type bet_status as enum ('pending', 'won', 'lost', 'void');

create table bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_details jsonb not null,
  stake numeric(15, 2) not null,
  odds numeric(10, 2) not null,
  potential_winnings numeric(15, 2) not null,
  status bet_status not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  settled_at timestamp with time zone,
  foreign key (user_id) references auth.users(id)
);

alter table bets enable row level security;

create policy "Users can manage their own bets." on bets
  for all using ( auth.uid() = user_id );

create policy "Admins can view all bets." on bets
  for select using ( (select role from profiles where id = auth.uid()) = 'ADMIN' );
