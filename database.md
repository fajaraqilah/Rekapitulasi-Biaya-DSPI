[beban_biaya_master
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "column_name": "tahun",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "kategori",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "subkategori",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "jumlah_awal",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "column_name": "jumlah_akhir",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  }
]


beban_biaya_transaksi
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "column_name": "master_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "tanggal_kegiatan",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "nama_kegiatan",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "jumlah_orang",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "1"
  },
  {
    "column_name": "biaya_kegiatan",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  }
]


bpd_budget_master
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "column_name": "tahun",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "kategori",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "budget_awal",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "column_name": "budget_sisa",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  }
]

bpd_budget_transactions
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "column_name": "bpd_budget_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "transaction_type",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "amount",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "created_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": "auth.uid()"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  }
]


beban_biaya_budget_transactions
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "column_name": "beban_biaya_master_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "transaction_type",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "amount",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "saldo_sebelum",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "saldo_sesudah",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "created_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": "auth.uid()"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  }
]