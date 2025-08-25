-- Create the users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userPublicAddress TEXT NOT NULL,
  portfolio JSONB,
  initial_asset_prices JSONB,
  total_deposit_amount JSONB
);

-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow anon role to select (adjust based on your needs)
CREATE POLICY "Allow anon to read users" ON public.users
FOR SELECT
USING (true);