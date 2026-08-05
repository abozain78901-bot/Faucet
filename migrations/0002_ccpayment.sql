-- Run once with:
--   npx wrangler d1 execute doge_rewards --remote --file=./migrations/0002_ccpayment.sql
-- (drop --remote to apply to your local/dev DB instead)

CREATE TABLE IF NOT EXISTS ccpayment_addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  chain TEXT NOT NULL,
  address TEXT NOT NULL,
  memo TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, chain)
);

CREATE TABLE IF NOT EXISTS ccpayment_deposits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  record_id TEXT UNIQUE NOT NULL,
  coin_symbol TEXT,
  amount REAL NOT NULL,
  status TEXT,
  created_at TEXT NOT NULL
);
