CREATE TABLE IF NOT EXISTS split_shop_orders (
  order_ref text PRIMARY KEY,
  record jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (record->>'orderRef' = order_ref),
  CHECK (record->>'status' IN ('pending', 'funded')),
  CHECK (record->>'credentialMode' IN ('live', 'sandbox')),
  CHECK ((record->>'total')::numeric > 0)
);
