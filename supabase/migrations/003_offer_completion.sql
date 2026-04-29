-- Extend offer_status with delivery/completion steps
ALTER TYPE offer_status ADD VALUE IF NOT EXISTS 'delivered';
ALTER TYPE offer_status ADD VALUE IF NOT EXISTS 'completed';
