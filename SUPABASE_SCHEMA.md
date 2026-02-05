
# GoBet Supabase SQL Schema

Here is a recommended SQL schema for setting up your Supabase database for the GoBet application. This schema is designed to support the core features: admin-managed users, virtual currency transactions, and bet tracking.

**IMPORTANT**: Before you begin, go to `Authentication -> Providers` and disable "Confirm email". This is necessary for the admin user creation feature to work from the client-side.

You can run these commands in the Supabase SQL Editor. It's recommended to use the `CLEAN_SUPABASE_SCHEMA.sql` file which includes a full reset.

### 1. `profiles` Table

This table extends the built-in `auth.users` table to store public data and application-specific roles.

```sql
-- Create a table for public user profiles
create table profiles (
  id uuid not null primary key,
  username text unique not null,
  role text not null default 'USER' check (role in ('USER', 'ADMIN')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  
  constraint username_length check (char_length(username) >= 3),
  foreign key (id) references auth.users(id) on delete cascade
);

alter table profiles enable row level security;

-- Policies for profiles
create policy "Users can insert their own profile." on profiles
  for insert with check ( auth.uid() = id );

create policy "Users can view their own profile." on profiles
  for select using ( auth.uid() = id );

create policy "Admins can view all profiles." on profiles
  for select using ( (select role from profiles where id = auth.uid()) = 'ADMIN' );
```

### 2. `accounts` Table

This table manages the virtual currency balance for each user.

```sql
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  balance numeric(15, 2) not null default 0.00 check (balance >= 0),
  currency text not null default 'TN',
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  
  foreign key (user_id) references auth.users(id) on delete cascade
);

alter table accounts enable row level security;

-- Policies for accounts
create policy "Users can insert their own account." on accounts
  for insert with check ( auth.uid() = user_id );

create policy "Users can view their own account." on accounts
  for select using ( auth.uid() = user_id );

create policy "Admins can manage all accounts." on accounts
  for all using ( (select role from profiles where id = auth.uid()) = 'ADMIN' );
```

### 3. `transactions` Table

This table logs all deposits and withdrawals performed by the admin.

```sql
create type transaction_type as enum ('deposit', 'withdraw', 'bet_placed', 'bet_won');

create table transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  user_id uuid not null,
  type transaction_type not null,
  amount numeric(15, 2) not null check (amount > 0),
  admin_id uuid, -- NULL if it's a bet transaction
  created_at timestamp with time zone default timezone('utc'::text, now()),
  
  foreign key (account_id) references accounts(id),
  foreign key (user_id) references auth.users(id),
  foreign key (admin_id) references auth.users(id)
);

alter table transactions enable row level security;

-- Policies for transactions
create policy "Users can view their own transactions." on transactions
  for select using ( auth.uid() = user_id );
  
create policy "Admins can manage all transactions." on transactions
  for all using ( (select role from profiles where id = auth.uid()) = 'ADMIN' );
```

### 4. `bets` Table

This table stores the details of each bet placed by a user.

```sql
create type bet_status as enum ('pending', 'won', 'lost', 'void');

create table bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_details jsonb not null, -- Stores event name, market, outcome
  stake numeric(15, 2) not null,
  odds numeric(10, 2) not null,
  potential_winnings numeric(15, 2) not null,
  status bet_status not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  settled_at timestamp with time zone,
  
  foreign key (user_id) references auth.users(id)
);

alter table bets enable row level security;

-- Policies for bets
create policy "Users can manage their own bets." on bets
  for all using ( auth.uid() = user_id );

create policy "Admins can view all bets." on bets
  for select using ( (select role from profiles where id = auth.uid()) = 'ADMIN' );
```

### 5. Admin User Setup

The application now contains a self-healing mechanism that automatically creates the admin's profile and account upon the first successful login. You no longer need to run manual `INSERT` commands.

1.  Go to `Authentication` in your Supabase dashboard.
2.  Add a new user with the email `admin@gobet.local` and your desired password.
3.  That's it! Log in to the application with username `admin` and your password.
