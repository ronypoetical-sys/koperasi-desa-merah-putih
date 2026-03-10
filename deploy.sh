#!/bin/bash

# ============================================================
# SCRIPT DEPLOY OTOMATIS - Koperasi Desa Merah Putih
# Jalankan di Git Bash: bash deploy.sh
# ============================================================

echo ""
echo "🇮🇩 =================================================="
echo "   DEPLOY KOPERASI DESA MERAH PUTIH"
echo "   Git Bash Auto Deploy Script"
echo "===================================================="
echo ""

# ------------------------------------------------------------
# STEP 1: Cek apakah Git sudah terinstall
# ------------------------------------------------------------
echo "📋 STEP 1: Mengecek Git..."
if ! command -v git &> /dev/null; then
    echo "❌ Git tidak ditemukan! Download di: https://git-scm.com"
    exit 1
fi
echo "✅ Git ditemukan: $(git --version)"

# ------------------------------------------------------------
# STEP 2: Minta GitHub username dan repo name
# ------------------------------------------------------------
echo ""
echo "📋 STEP 2: Konfigurasi GitHub"
echo "-----------------------------------"
read -p "Masukkan GitHub username kamu: " GITHUB_USERNAME
read -p "Nama repo (default: koperasi-desa-merah-putih): " REPO_NAME
REPO_NAME=${REPO_NAME:-koperasi-desa-merah-putih}

echo ""
echo "✅ Akan membuat repo: https://github.com/$GITHUB_USERNAME/$REPO_NAME"

# ------------------------------------------------------------
# STEP 3: Init git dan buat .env.local dengan kredensial real
# ------------------------------------------------------------
echo ""
echo "📋 STEP 3: Inisialisasi Git repository..."

# Pastikan kita ada di folder yang benar
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: Jalankan script ini dari dalam folder koperasi-desa-merah-putih!"
    echo "   cd koperasi-desa-merah-putih"
    echo "   bash deploy.sh"
    exit 1
fi

# Update .env.local dengan URL Supabase yang sudah dibuat
cat > .env.local << 'EOF'
# ============================================
# SUPABASE - Project: koperasi-desa-merah-putih
# Region: Singapore (ap-southeast-1)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://afopmdnhyohktldkdpyj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmb3BtZG5oeW9oa3RsZGtkcHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM1NzksImV4cCI6MjA4ODY0OTU3OX0.e3cPj4ioo9XmhkvbWEeJH0fLbFoxqau0IHgnEaWYI5U

# PENTING: Isi service_role key dari Supabase Dashboard
# Settings > API > service_role (secret)
SUPABASE_SERVICE_ROLE_KEY=GANTI_DENGAN_SERVICE_ROLE_KEY_DARI_SUPABASE

# ============================================
# APP CONFIG
# ============================================
NEXT_PUBLIC_APP_NAME=Koperasi Desa Merah Putih
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
EOF

echo "✅ .env.local dibuat dengan kredensial Supabase"

# Init git
git init
git add .
git commit -m "🚀 Initial commit: Sistem Akuntansi Koperasi Desa Merah Putih

- Next.js 14 App Router + TypeScript
- Supabase Auth + PostgreSQL + RLS
- Journal Engine (debit = credit validation)
- Dashboard dengan Recharts
- Modul: Anggota, Unit Usaha, COA, Simpanan
- Laporan: Neraca, SHU, Buku Besar, Jurnal
- Template COA: Simpan Pinjam, Toko Desa, Pertanian
- Supabase Project: afopmdnhyohktldkdpyj (Singapore)"

echo "✅ Git commit berhasil"

# ------------------------------------------------------------
# STEP 4: Buat GitHub repo via API (tanpa GitHub CLI)
# ------------------------------------------------------------
echo ""
echo "📋 STEP 4: Membuat GitHub repository..."
echo "-----------------------------------"
echo "Kamu perlu GitHub Personal Access Token."
echo ""
echo "Cara dapat token:"
echo "  1. Buka https://github.com/settings/tokens/new"
echo "  2. Note: 'Koperasi Deploy'"
echo "  3. Centang: repo (full control)"
echo "  4. Klik 'Generate token'"
echo "  5. Copy tokennya"
echo ""
read -p "Paste GitHub token kamu (input tersembunyi): " -s GITHUB_TOKEN
echo ""

# Buat repo via GitHub API
echo "🔄 Membuat repository di GitHub..."
RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$REPO_NAME\",
    \"description\": \"Sistem Akuntansi Koperasi Desa Merah Putih - Next.js + Supabase\",
    \"private\": false,
    \"auto_init\": false
  }" \
  "https://api.github.com/user/repos")

# Cek apakah berhasil
if echo "$RESPONSE" | grep -q '"full_name"'; then
    echo "✅ Repository berhasil dibuat!"
else
    echo "⚠️  Repository mungkin sudah ada atau ada error. Melanjutkan..."
fi

# ------------------------------------------------------------
# STEP 5: Push ke GitHub
# ------------------------------------------------------------
echo ""
echo "📋 STEP 5: Push kode ke GitHub..."

git remote remove origin 2>/dev/null || true
git remote add origin "https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git"
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Push ke GitHub BERHASIL!"
    echo "   🔗 https://github.com/$GITHUB_USERNAME/$REPO_NAME"
else
    echo "❌ Push gagal. Cek token atau nama repo."
    exit 1
fi

# ------------------------------------------------------------
# STEP 6: Instruksi deploy Vercel
# ------------------------------------------------------------
echo ""
echo "🎉 =================================================="
echo "   GITHUB SELESAI! Tinggal 1 langkah lagi: Vercel"
echo "===================================================="
echo ""
echo "📋 STEP 6: Deploy ke Vercel (3 menit)"
echo "-----------------------------------"
echo ""
echo "OPSI A - Via Browser (Mudah):"
echo "  1. Buka https://vercel.com/new"
echo "  2. Import: github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "  3. Tambah Environment Variables:"
echo ""
echo "     NEXT_PUBLIC_SUPABASE_URL"
echo "     = https://afopmdnhyohktldkdpyj.supabase.co"
echo ""
echo "     NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "     = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmb3BtZG5oeW9oa3RsZGtkcHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzM1NzksImV4cCI6MjA4ODY0OTU3OX0.e3cPj4ioo9XmhkvbWEeJH0fLbFoxqau0IHgnEaWYI5U"
echo ""
echo "     SUPABASE_SERVICE_ROLE_KEY"
echo "     = (dari Supabase Dashboard > Settings > API > service_role)"
echo ""
echo "     NEXT_PUBLIC_APP_NAME"
echo "     = Koperasi Desa Merah Putih"
echo ""
echo "  4. Klik Deploy → selesai!"
echo ""
echo "OPSI B - Via Terminal (jika Vercel CLI sudah install):"
echo "  npx vercel --prod"
echo ""
echo "===================================================="
echo "✅ Supabase  : https://afopmdnhyohktldkdpyj.supabase.co"
echo "✅ GitHub    : https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "⏳ Vercel    : Deploy manual di vercel.com/new"
echo "===================================================="
echo ""
echo "🚀 Aplikasi siap! Setelah deploy Vercel, buka URL-nya"
echo "   dan daftar akun pertama sebagai Admin koperasi."
echo ""
