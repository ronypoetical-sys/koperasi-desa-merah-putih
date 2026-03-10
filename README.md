# 🏛️ Koperasi Desa Merah Putih — Sistem Akuntansi

Aplikasi web akuntansi koperasi desa berbasis Next.js 14 + Supabase, mengikuti standar SAK EP/ETAP Indonesia.

## ✅ Status Deployment

| Komponen | Status |
|---|---|
| Supabase Project | ✅ ACTIVE — `afopmdnhyohktldkdpyj` |
| Database Schema | ✅ 11 tabel + RLS + Views |
| Template COA | ✅ Simpan Pinjam, Toko Desa, Pertanian |
| GitHub | ⏳ Push repo |
| Vercel | ⏳ Connect & deploy |

---

## 🚀 Langkah Deploy

### STEP 1: Upload ke GitHub
```bash
cd koperasi-desa-merah-putih
git init
git add .
git commit -m "feat: Initial - Sistem Akuntansi Koperasi Desa Merah Putih"
git branch -M main
git remote add origin https://github.com/USERNAME/koperasi-desa-merah-putih.git
git push -u origin main
```

### STEP 2: Deploy ke Vercel
1. Buka https://vercel.com/new
2. Import repo `koperasi-desa-merah-putih` dari GitHub
3. Framework Preset: **Next.js** (auto-detected)
4. Tambah Environment Variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://afopmdnhyohktldkdpyj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (dari Supabase Settings > API) |
| `SUPABASE_SERVICE_ROLE_KEY` | (dari Supabase Settings > API) |
| `NEXT_PUBLIC_APP_NAME` | `Koperasi Desa Merah Putih` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

5. Klik **Deploy** → selesai dalam ~2 menit!

### STEP 3: Setup Awal Aplikasi
1. Buka URL Vercel setelah deploy
2. Klik **Daftar** → isi nama, email, password
3. User pertama otomatis jadi **Admin**
4. Isi data koperasi di halaman Setup
5. Buat unit usaha pertama + pilih template COA
6. Mulai catat transaksi! 🎉

---

## 📁 Struktur Project

```
app/
├── auth/login          # Halaman login
├── auth/register       # Halaman daftar
├── setup               # Setup koperasi (first-time)
└── (dashboard)/
    ├── page.tsx         # Dashboard + grafik
    ├── anggota/         # Kelola anggota
    ├── unit-usaha/      # Unit usaha + COA template
    ├── accounts/        # Chart of Accounts
    ├── transaksi/       # Simpanan, Pinjaman, dll
    ├── akuntansi/       # Jurnal & Buku Besar
    ├── laporan/         # Neraca, SHU, Arus Kas
    └── pengaturan/      # Koperasi, User, Template

lib/
├── supabase/           # Client & server Supabase
├── accounting/
│   ├── journal-engine  # Engine jurnal otomatis
│   ├── reports         # Query laporan keuangan
│   └── coa-templates   # Template COA
└── utils/              # Format, export PDF/Excel
```

---

## 🔐 Role & Akses

| Role | Dashboard | Transaksi | Laporan | Pengaturan |
|---|---|---|---|---|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Bendahara | ✅ | ✅ | ✅ | ❌ |
| Kasir | ✅ | ✅ | ❌ | ❌ |
| Pengawas | ✅ | ❌ | ✅ | ❌ |

---

## 📊 Database Supabase

**Project:** `koperasi-desa-merah-putih`  
**Region:** Singapore (ap-southeast-1)  
**URL:** https://afopmdnhyohktldkdpyj.supabase.co

Tabel yang tersedia:
- `koperasi` — Data induk koperasi
- `users` — User + role (extends auth.users)
- `anggota` — Data anggota koperasi
- `unit_usaha` — Unit usaha dinamis
- `accounts` — Chart of Accounts
- `transactions` — Header transaksi
- `journals` — Jurnal akuntansi
- `journal_items` — Detail debit/kredit
- `audit_logs` — Log aktivitas
- `coa_templates` — Template COA (3 template)
- `coa_template_items` — Item template (54 akun)

Views otomatis:
- `v_neraca` — Posisi keuangan
- `v_shu` — Laporan laba rugi
- `v_buku_besar` — Running balance per akun
- `v_dashboard_stats` — Statistik dashboard

---

## 🛠️ Development Lokal

```bash
npm install
cp .env.example .env.local
# Edit .env.local dengan kredensial Supabase
npm run dev
# Buka http://localhost:3000
```

---

*Dibuat dengan ❤️ untuk kemajuan koperasi desa Indonesia*  
*Standar akuntansi: SAK EP / ETAP*
