#!/bin/bash

# ============================================================
# VERCEL DEPLOY SCRIPT - Jalankan SETELAH deploy.sh
# Requires: npm / npx sudah terinstall
# ============================================================

echo ""
echo "🚀 Deploy ke Vercel..."
echo ""

# Cek apakah sudah ada .vercel folder (sudah pernah deploy)
if [ -d ".vercel" ]; then
    echo "🔄 Re-deploying project yang sudah ada..."
    npx vercel --prod
else
    echo "📦 Deploy baru ke Vercel..."
    echo ""
    echo "Vercel akan menanyakan beberapa pertanyaan:"
    echo "  - Set up and deploy? → Y"
    echo "  - Which scope? → pilih akun kamu"
    echo "  - Link to existing project? → N"
    echo "  - Project name? → koperasi-desa-merah-putih"
    echo "  - Directory? → ./ (tekan Enter)"
    echo ""
    npx vercel --prod
fi

echo ""
echo "✅ Selesai! Cek URL deployment di atas."
