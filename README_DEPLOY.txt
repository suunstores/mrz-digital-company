MRZ DIGITAL ACADEMY — FRONTEND VERCEL
======================================

BACKEND YANG SUDAH TERHUBUNG
https://script.google.com/macros/s/AKfycbz_hsDU2_rpEoH-8qKzfph-uT7MAIgFh4c2jFYUFDFjuYNDuIBont8aQ7WNTz9PpVle/exec

FITUR
- Login email + password
- Dashboard maroon dan gold
- Progress keseluruhan
- Modul bertahap dan terkunci
- Tonton video YouTube
- Link worksheet
- Tandai modul selesai
- Catatan pribadi per modul
- Jadwal konsultasi/Zoom
- Pengumuman
- Admin membuat member baru
- Tampilan responsif HP dan desktop

CARA DEPLOY PALING MUDAH KE VERCEL
1. Ekstrak folder ZIP ini.
2. Masuk ke https://vercel.com dan login.
3. Pilih Add New → Project.
4. Cara yang paling stabil: upload folder ini ke repository GitHub, lalu Import repository tersebut di Vercel.
5. Framework Preset: Other.
6. Build Command: kosongkan.
7. Output Directory: kosongkan.
8. Klik Deploy.
9. Setelah selesai, buka URL namaproject.vercel.app.

CATATAN URL BACKEND
URL Google Apps Script sudah tertanam sebagai fallback pada:
api/mrz.js

Jadi deployment dapat langsung digunakan tanpa Environment Variable.
Untuk mengganti URL di masa depan, tambahkan Environment Variable Vercel:
GAS_API_URL = URL /exec yang baru
lalu Redeploy.

SEBELUM TES LOGIN
1. Pastikan akun di sheet USER_IMPORT berstatus CREATED.
2. Gunakan email dan password sementara yang dibuat ketika mengisi USER_IMPORT.
3. Pastikan deployment Apps Script: Execute as Me dan Who has access Anyone.

MENGISI MATERI
Buka sheet MODULES:
- video_url: URL YouTube, YouTube Shorts, atau youtu.be
- worksheet_url: URL Google Drive/Docs
- thumbnail_url: URL gambar publik (opsional)
- is_published: TRUE
- required_previous_module_id: isi ID modul sebelumnya agar terkunci

MENGISI LINK KOMUNITAS
Buka sheet SETTINGS:
- TELEGRAM_URL: link grup Telegram
- MENTOR_WHATSAPP: nomor format 628xxxx
- SUPPORT_EMAIL: email bantuan

SETELAH MENGUBAH CODE.GS
Setiap perubahan backend perlu:
Deploy → Manage deployments → Edit → New version → Deploy.
Jika hanya mengubah isi Spreadsheet, tidak perlu deploy ulang.
