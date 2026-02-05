
-- ========= GO-BET DATABASE RESET SCRIPT =========
-- This script will completely reset your database.
-- It deletes old tables and types and recreates them with the correct structure and security policies.
-- RUN THIS SCRIPT ONCE.

-- Step 1: Drop existing objects in reverse order of dependency to avoid errors.
DROP TABLE IF EXISTS bets;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS profiles;
DROP TYPE IF EXISTS bet_status;
DROP TYPE IF EXISTS transaction_type;

-- Step 2: Recreate custom types.
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdraw', 'bet_placed', 'bet_won');
CREATE TYPE bet_status AS ENUM ('pending', 'won', 'lost', 'void');

-- Step 3: Recreate the 'profiles' table with correct Row Level Security (RLS).
CREATE TABLE profiles (
  id uuid NOT NULL PRIMARY KEY,
  username text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  CONSTRAINT username_length CHECK (char_length(username) >= 3),
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- POLICIES FOR PROFILES:
-- Users can create their own profile upon signing up. THIS IS THE CRITICAL FIX.
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Users can only see their own profile.
CREATE POLICY "Users can view their own profile." ON profiles FOR SELECT USING (auth.uid() = id);
-- Admins can see every user's profile.
CREATE POLICY "Admins can view all profiles." ON profiles FOR SELECT USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- Step 4: Recreate the 'accounts' table with correct RLS.
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  currency text NOT NULL DEFAULT 'TN',
  updated_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
-- POLICIES FOR ACCOUNTS:
-- Users can create their own account. THIS IS THE CRITICAL FIX.
CREATE POLICY "Users can insert their own account." ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can only see their own account details.
CREATE POLICY "Users can view their own account." ON accounts FOR SELECT USING (auth.uid() = user_id);
-- Admins can do anything with any account (deposit/withdraw).
CREATE POLICY "Admins can manage all accounts." ON accounts FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- Step 5: Recreate the 'transactions' table with correct RLS.
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type transaction_type NOT NULL,
  amount numeric(15, 2) NOT NULL CHECK (amount > 0),
  admin_id uuid, -- NULL if it's a bet transaction
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  FOREIGN KEY (admin_id) REFERENCES auth.users(id)
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- POLICIES FOR TRANSACTIONS:
CREATE POLICY "Users can view their own transactions." ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all transactions." ON transactions FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- Step 6: Recreate the 'bets' table with correct RLS.
CREATE TABLE bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_details jsonb NOT NULL, -- Stores event name, market, outcome
  stake numeric(15, 2) NOT NULL,
  odds numeric(10, 2) NOT NULL,
  potential_winnings numeric(15, 2) NOT NULL,
  status bet_status NOT NULL DEFAULT 'pending',
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  settled_at timestamp WITH TIME ZONE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
-- POLICIES FOR BETS:
CREATE POLICY "Users can manage their own bets." ON bets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all bets." ON bets FOR SELECT USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- NOTE: You do NOT need to manually insert the admin user anymore.
-- The application code will now handle this automatically when you log in as admin for the first time.
-- Just ensure you have created an 'admin' user in the 'Authentication' section of Supabase.
