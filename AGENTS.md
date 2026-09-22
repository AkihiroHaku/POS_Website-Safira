<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:workflow-rules -->
# Workflow Rules — Wajib Dipatuhi Semua AI Agent

## 1. Siklus Pengembangan Lokal
Setelah menyelesaikan perubahan kode, jalankan secara berurutan:
```bash
npm run lint
npm run build
```
Jika ada error, perbaiki sebelum lanjut.

Jalankan dev server (`npm run dev`) dan verifikasi aplikasi berjalan normal di `http://localhost:3000`.

## 2. Commit & Push
**Hanya commit setelah semua tes lokal lolos.**
```bash
git add .
git commit -m "deskripsi perubahan"
git push
```

## 3. CI/CD — GitHub Actions
Setelah push, buka tab Actions di GitHub dan pantau workflow.
- Jika ✅ hijau: selesai
- Jika ❌ merah: **jangan buat commit baru dari GitHub**. Klik workflow yang gagal, baca log error, lalu:
  1. Perbaiki kode di lokal
  2. Ulangi siklus dari langkah 1

## 4. Larangan
- Dilarang commit/push jika `npm run lint` atau `npm run build` gagal
- Dilarang melewati langkah verifikasi lokal
- Dilarang mengabaikan kegagalan CI — harus dianalisis dan diperbaiki
<!-- END:workflow-rules -->
