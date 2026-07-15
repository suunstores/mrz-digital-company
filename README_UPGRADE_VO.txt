MRZ DIGITAL ACADEMY — VOICE OVER PRO UPGRADE

ISI UPDATE
- Pendaftaran gratis mandiri.
- User baru otomatis: package FREE, status ACTIVE, role MEMBER.
- Menu Produk & Tools.
- Landing page MRZ Voice Over Pro.
- Tab Ringkasan, Modul Belajar, dan Buka Tools.
- Contoh hasil ditempatkan di Ringkasan sebagai hook.
- Modul pengenalan FREE; modul lanjutan PREMIUM.
- URL tools asli hanya dikirim backend kepada user yang memiliki akses.
- Checkout awal membuat pesanan PENDING otomatis ke sheet ORDERS.
- Sistem USER_ACCESS untuk membuka tools per produk.

PENTING
Pembayaran otomatis belum aktif karena payment gateway belum dipilih/dihubungkan.
Versi ini sudah membuat invoice dan mengisi ORDERS secara otomatis. Akses dapat dibuka manual dahulu.

==================================================
A. UPDATE GOOGLE APPS SCRIPT
==================================================
1. Buka Spreadsheet → Extensions → Apps Script.
2. Backup Code.gs lama.
3. Ganti seluruh isi Code.gs dengan file Code.gs dari paket ini.
4. Save.
5. Jalankan setupProject() satu kali.

setupProject() akan menambahkan sheet/kolom berikut tanpa menghapus data lama:
- TOOLS
- TOOL_MODULES
- TOOL_SAMPLES
- TOOL_PROGRESS
- USER_ACCESS
- ORDERS
- Kolom phone dan registration_source pada USERS

setupProject() juga menambahkan data awal MRZ Voice Over Pro.

6. Deploy → Manage deployments → Edit → New version → Deploy.
7. URL Web App /exec tetap dapat digunakan bila deployment yang sama diperbarui.

==================================================
B. UPDATE GITHUB / VERCEL
==================================================
Upload/ganti file berikut pada root repository GitHub:
- app.js
- styles.css
- index.html
- package.json
- vercel.json
- folder api
- folder assets

PENTING:
Pastikan file thumbnail berada di:
assets/mrz-voice-over-pro.png

Setelah Commit, tunggu Vercel redeploy otomatis hingga Ready.

==================================================
C. TEST PENDAFTARAN GRATIS
==================================================
1. Buka website menggunakan Incognito.
2. Klik Daftar Gratis.
3. Isi nama, email, WhatsApp, dan password minimal 8 karakter.
4. User harus langsung masuk ke dashboard.
5. Cek sheet USERS:
   package             = FREE
   status              = ACTIVE
   role                = MEMBER
   registration_source = SELF_SIGNUP

==================================================
D. TEST PRODUK VOICE OVER PRO
==================================================
1. Buka menu Produk & Tools.
2. Klik MRZ Voice Over Pro.
3. Pastikan tab tersedia:
   - Ringkasan
   - Modul Belajar
   - Buka Tools
4. User FREE hanya dapat membuka modul pertama.
5. Modul premium dan tombol tools tetap terkunci.

==================================================
E. ISI CONTOH HASIL
==================================================
Buka sheet TOOL_SAMPLES.
Isi kolom media_url untuk:
- Voice Over Iklan
- Voice Over Storytelling
- Voice Over Edukasi

media_type:
- AUDIO untuk file/link audio langsung yang dapat diputar browser.
- VIDEO untuk link video eksternal.

==================================================
F. ISI VIDEO MODUL
==================================================
Buka sheet TOOL_MODULES.
Isi:
- video_url
- worksheet_url bila ada

Modul pertama memakai access_level FREE.
Modul lainnya memakai access_level PREMIUM.

==================================================
G. TEST PESANAN
==================================================
1. Login sebagai akun FREE.
2. Buka MRZ Voice Over Pro.
3. Klik Buat Pesanan / Buka Akses.
4. Isi nomor WhatsApp.
5. Data otomatis masuk ke sheet ORDERS dengan status PENDING.

Untuk menandai pembayaran secara manual:
1. Buka Apps Script.
2. Pilih fungsi markOrderPaidFromSheet.
3. Karena fungsi membutuhkan parameter, jalankan dari editor menggunakan fungsi sementara, contoh:

function testMarkPaid() {
  Logger.log(markOrderPaidFromSheet('MRZ-20260715-123456', 'TRANSFER-MANUAL'));
}

Ganti nomor invoice sesuai sheet ORDERS.
Setelah dijalankan:
- ORDERS menjadi PAID.
- USER_ACCESS otomatis dibuat/diaktifkan.
- User perlu refresh/login ulang agar tombol Buka Tools aktif.

Alternatif langsung membuka akses email tertentu:

function testGrantVO() {
  Logger.log(grantVoiceOverAccess('emailuser@gmail.com', ''));
}

==================================================
H. PAYMENT GATEWAY
==================================================
Tahap ini belum memasukkan Midtrans/Xendit/Tripay/Duitku karena membutuhkan akun dan Server Key/API Key.
Setelah payment gateway dipilih, webhook Vercel akan:
- menerima pembayaran berhasil,
- mengubah ORDERS menjadi PAID,
- mengisi USER_ACCESS otomatis,
- membuka tools tanpa tindakan admin.
