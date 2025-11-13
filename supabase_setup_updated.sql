-- SQL script to set up the required tables and views for the DSPI dashboard

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create beban_biaya_master table
CREATE TABLE IF NOT EXISTS beban_biaya_master (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tahun integer NOT NULL,
  kategori text NOT NULL,
  subkategori text,
  jumlah_awal numeric(15,2) DEFAULT 0,
  jumlah_akhir numeric(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create beban_biaya_transaksi table
CREATE TABLE IF NOT EXISTS beban_biaya_transaksi (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_id uuid REFERENCES beban_biaya_master(id) ON DELETE CASCADE,
  tanggal_transaksi date NOT NULL,
  keterangan text NOT NULL,
  nominal numeric(15,2) NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  role text CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created_at timestamptz DEFAULT NOW()
);

-- Create view for expense summary
CREATE OR REPLACE VIEW vw_ringkasan_beban_biaya AS
SELECT 
  m.kategori,
  SUM(t.nominal) as total_transaksi,
  MAX(m.jumlah_awal) as jumlah_awal,
  MAX(m.jumlah_awal) - SUM(t.nominal) as sisa_anggaran
FROM beban_biaya_master m
LEFT JOIN beban_biaya_transaksi t ON m.id = t.master_id
GROUP BY m.kategori;

-- Insert sample data into beban_biaya_master
INSERT INTO beban_biaya_master (tahun, kategori, subkategori, jumlah_awal) VALUES
  (2025, 'Beban Biaya Audit', 'Assessment IACM', 50000000),
  (2025, 'Beban Biaya Konsultan', 'Konsultan IT', 30000000),
  (2025, 'Beban Biaya Iuran', 'Iuran Tahunan', 10000000),
  (2025, 'Beban Biaya Tamu', 'Entertainment Tamu', 5000000),
  (2025, 'Beban Biaya Rapat', 'Meeting Room', 15000000)
ON CONFLICT DO NOTHING;

-- Enable realtime for tables
ALTER TABLE beban_biaya_transaksi REPLICA IDENTITY FULL;
ALTER TABLE beban_biaya_master REPLICA IDENTITY FULL;