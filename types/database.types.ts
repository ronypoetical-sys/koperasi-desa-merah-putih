export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      koperasi: {
        Row: {
          id: string
          nama_koperasi: string
          alamat: string | null
          desa: string | null
          kecamatan: string | null
          kabupaten: string | null
          provinsi: string | null
          tanggal_berdiri: string | null
          no_akta: string | null
          npwp: string | null
          tahun_buku_mulai: number | null
          tahun_buku_akhir: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['koperasi']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['koperasi']['Insert']>
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'bendahara' | 'kasir' | 'pengawas'
          koperasi_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      anggota: {
        Row: {
          id: string
          koperasi_id: string
          nama: string
          nik: string | null
          alamat: string | null
          no_hp: string | null
          tanggal_masuk: string | null
          status: 'aktif' | 'nonaktif'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['anggota']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['anggota']['Insert']>
      }
      unit_usaha: {
        Row: {
          id: string
          koperasi_id: string
          kode_unit: string
          nama_unit: string
          deskripsi: string | null
          status: 'aktif' | 'nonaktif'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['unit_usaha']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['unit_usaha']['Insert']>
      }
      accounts: {
        Row: {
          id: string
          koperasi_id: string
          unit_usaha_id: string | null
          kode_akun: string
          nama_akun: string
          kategori: 'aset' | 'kewajiban' | 'modal' | 'pendapatan' | 'beban'
          parent_id: string | null
          is_system: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['accounts']['Row'], 'id' | 'created_at' | 'is_system'> & { is_system?: boolean }
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          koperasi_id: string
          unit_usaha_id: string
          anggota_id: string | null
          jenis_transaksi: 'simpanan' | 'penarikan_simpanan' | 'pinjaman' | 'angsuran' | 'penjualan' | 'pembelian' | 'biaya_operasional' | 'lainnya'
          tanggal: string
          keterangan: string | null
          total_amount: number
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      journals: {
        Row: {
          id: string
          transaction_id: string
          tanggal: string
          unit_usaha_id: string
          keterangan: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['journals']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['journals']['Insert']>
      }
      journal_items: {
        Row: {
          id: string
          journal_id: string
          account_id: string
          debit: number
          credit: number
        }
        Insert: Omit<Database['public']['Tables']['journal_items']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['journal_items']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
      coa_templates: {
        Row: {
          id: string
          nama_template: string
          jenis_unit: string
          deskripsi: string | null
          created_at: string
        }
        Insert: never
        Update: never
      }
      coa_template_items: {
        Row: {
          id: string
          template_id: string
          kode_akun: string
          nama_akun: string
          kategori: 'aset' | 'kewajiban' | 'modal' | 'pendapatan' | 'beban'
          parent_kode: string | null
          urutan: number
        }
        Insert: never
        Update: never
      }
    }
    Views: {
      v_buku_besar: {
        Row: {
          id: string
          tanggal: string
          keterangan: string | null
          kode_akun: string
          nama_akun: string
          kategori: string
          nama_unit: string
          debit: number
          credit: number
          saldo_berjalan: number
          koperasi_id: string
          account_id: string
        }
      }
      v_neraca: {
        Row: {
          koperasi_id: string
          account_id: string
          kode_akun: string
          nama_akun: string
          kategori: string
          parent_id: string | null
          saldo: number
        }
      }
      v_shu: {
        Row: {
          koperasi_id: string
          unit_usaha_id: string
          nama_unit: string
          kategori: string
          nama_akun: string
          tahun: number
          bulan: number
          pendapatan: number
          beban: number
        }
      }
      v_dashboard_stats: {
        Row: {
          koperasi_id: string
          nama_koperasi: string
          total_anggota: number
          total_unit_usaha: number
          total_simpanan: number
          total_pinjaman: number
        }
      }
    }
  }
}
