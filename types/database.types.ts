/**
 * database.types.ts — Regenerated from Supabase schema 2026-03-13
 * ARCH-005 FIX: Proper types allow removing ignoreBuildErrors: true
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'bendahara' | 'kasir' | 'pengawas'
          koperasi_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          role: 'admin' | 'bendahara' | 'kasir' | 'pengawas'
          koperasi_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'admin' | 'bendahara' | 'kasir' | 'pengawas'
          koperasi_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nama_koperasi: string
          alamat?: string | null
          desa?: string | null
          kecamatan?: string | null
          kabupaten?: string | null
          provinsi?: string | null
          tanggal_berdiri?: string | null
          no_akta?: string | null
          npwp?: string | null
          tahun_buku_mulai?: number | null
          tahun_buku_akhir?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nama_koperasi?: string
          alamat?: string | null
          desa?: string | null
          kecamatan?: string | null
          kabupaten?: string | null
          provinsi?: string | null
          tanggal_berdiri?: string | null
          no_akta?: string | null
          npwp?: string | null
          tahun_buku_mulai?: number | null
          tahun_buku_akhir?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      unit_usaha: {
        Row: {
          id: string
          koperasi_id: string
          kode_unit: string
          nama_unit: string
          deskripsi: string | null
          status: 'aktif' | 'nonaktif' | null
          created_at: string | null
        }
        Insert: {
          id?: string
          koperasi_id: string
          kode_unit: string
          nama_unit: string
          deskripsi?: string | null
          status?: 'aktif' | 'nonaktif' | null
          created_at?: string | null
        }
        Update: {
          id?: string
          koperasi_id?: string
          kode_unit?: string
          nama_unit?: string
          deskripsi?: string | null
          status?: 'aktif' | 'nonaktif' | null
          created_at?: string | null
        }
        Relationships: []
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
          is_system: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          koperasi_id: string
          unit_usaha_id?: string | null
          kode_akun: string
          nama_akun: string
          kategori: 'aset' | 'kewajiban' | 'modal' | 'pendapatan' | 'beban'
          parent_id?: string | null
          is_system?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          koperasi_id?: string
          unit_usaha_id?: string | null
          kode_akun?: string
          nama_akun?: string
          kategori?: 'aset' | 'kewajiban' | 'modal' | 'pendapatan' | 'beban'
          parent_id?: string | null
          is_system?: boolean | null
          created_at?: string | null
        }
        Relationships: []
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
          status: 'aktif' | 'nonaktif' | null
          created_at: string | null
        }
        Insert: {
          id?: string
          koperasi_id: string
          nama: string
          nik?: string | null
          alamat?: string | null
          no_hp?: string | null
          tanggal_masuk?: string | null
          status?: 'aktif' | 'nonaktif' | null
          created_at?: string | null
        }
        Update: {
          id?: string
          koperasi_id?: string
          nama?: string
          nik?: string | null
          alamat?: string | null
          no_hp?: string | null
          tanggal_masuk?: string | null
          status?: 'aktif' | 'nonaktif' | null
          created_at?: string | null
        }
        Relationships: []
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
          created_at: string | null
        }
        Insert: {
          id?: string
          koperasi_id: string
          unit_usaha_id: string
          anggota_id?: string | null
          jenis_transaksi: 'simpanan' | 'penarikan_simpanan' | 'pinjaman' | 'angsuran' | 'penjualan' | 'pembelian' | 'biaya_operasional' | 'lainnya'
          tanggal: string
          keterangan?: string | null
          total_amount: number
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          koperasi_id?: string
          unit_usaha_id?: string
          anggota_id?: string | null
          jenis_transaksi?: 'simpanan' | 'penarikan_simpanan' | 'pinjaman' | 'angsuran' | 'penjualan' | 'pembelian' | 'biaya_operasional' | 'lainnya'
          tanggal?: string
          keterangan?: string | null
          total_amount?: number
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      journals: {
        Row: {
          id: string
          transaction_id: string
          tanggal: string
          unit_usaha_id: string
          keterangan: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          transaction_id: string
          tanggal: string
          unit_usaha_id: string
          keterangan?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          transaction_id?: string
          tanggal?: string
          unit_usaha_id?: string
          keterangan?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      journal_items: {
        Row: {
          id: string
          journal_id: string
          account_id: string
          debit: number
          credit: number
        }
        Insert: {
          id?: string
          journal_id: string
          account_id: string
          debit?: number
          credit?: number
        }
        Update: {
          id?: string
          journal_id?: string
          account_id?: string
          debit?: number
          credit?: number
        }
        Relationships: []
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
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      coa_templates: {
        Row: {
          id: string
          nama_template: string
          jenis_unit: string
          deskripsi: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          nama_template: string
          jenis_unit: string
          deskripsi?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          nama_template?: string
          jenis_unit?: string
          deskripsi?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      coa_template_items: {
        Row: {
          id: string
          template_id: string
          kode_akun: string
          nama_akun: string
          kategori: 'aset' | 'kewajiban' | 'modal' | 'pendapatan' | 'beban'
          parent_kode: string | null
          urutan: number | null
        }
        Insert: {
          id?: string
          template_id: string
          kode_akun: string
          nama_akun: string
          kategori: 'aset' | 'kewajiban' | 'modal' | 'pendapatan' | 'beban'
          parent_kode?: string | null
          urutan?: number | null
        }
        Update: {
          id?: string
          template_id?: string
          kode_akun?: string
          nama_akun?: string
          kategori?: 'aset' | 'kewajiban' | 'modal' | 'pendapatan' | 'beban'
          parent_kode?: string | null
          urutan?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_transaction_with_journal: {
        Args: {
          p_koperasi_id: string
          p_unit_usaha_id: string
          p_anggota_id: string | null
          p_jenis_transaksi: string
          p_tanggal: string
          p_keterangan: string
          p_total_amount: number
          p_created_by: string
          p_journal_entries: Json
        }
        Returns: Json
      }
      update_koperasi_safe: {
        Args: {
          p_id: string
          p_last_known_updated_at: string
          p_data: Json
        }
        Returns: Json
      }
      get_my_koperasi_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_role: {
        Args: { allowed_roles: string[] }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
