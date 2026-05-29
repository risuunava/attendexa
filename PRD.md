# PRODUCT REQUIREMENTS DOCUMENT
## Attendexa
### Sistem Absensi Perusahaan dengan Gamifikasi

**Versi:** 1.0.0 | **Status:** Draft  
**Tanggal:** Mei 2026  
**Arsitektur berbasis:** OurCreativity Stack (React + TypeScript + Supabase + Vite)

---

## 1. Executive Summary

Attendexa adalah platform absensi digital berbasis web yang dirancang untuk perusahaan, startup, dan organisasi modern. Platform ini menggabungkan fitur absensi berbasis lokasi GPS dan verifikasi wajah (Face Recognition via kamera) dengan sistem gamifikasi leaderboard XP yang mendorong kedisiplinan karyawan secara organik.

### 🎯 Visi Produk

Menjadi platform absensi paling engaging di Indonesia yang tidak hanya mencatat kehadiran, tetapi juga memotivasi karyawan untuk hadir tepat waktu melalui sistem reward yang transparan dan adil.

### 1.1 Target Pengguna

| Segmen | Deskripsi |
|---|---|
| Startup & SME | Perusahaan 10–500 karyawan yang butuh sistem absensi digital tanpa infrastruktur berat |
| Enterprise | Perusahaan besar dengan multi-kantor, multi-shift, dan kebutuhan laporan kompleks |
| Remote-first | Tim hybrid/remote yang perlu absensi fleksibel dengan verifikasi lokasi |

### 1.2 Aktor Sistem

| Aktor | Deskripsi & Wewenang |
|---|---|
| Karyawan (Employee) | Melakukan absen, melihat history, memantau XP & leaderboard, mengajukan izin/cuti |
| Admin (HRD/Manager) | Mengelola karyawan, mengatur titik lokasi absen, approve izin, generate laporan |
| Boss/Owner | Pantau seluruh KPI kehadiran, lihat analytics & chart, oversight keseluruhan perusahaan |

---

## 2. Tech Stack & Arsitektur

Arsitektur proyek ini mengadopsi sepenuhnya stack yang digunakan OurCreativity (React + TypeScript + Supabase + Vite), dengan tambahan library spesifik untuk kebutuhan absensi.

### 2.1 Frontend Stack

| Kategori | Teknologi & Versi |
|---|---|
| Framework UI | React 19 (versi terbaru, concurrency features) |
| Bahasa | TypeScript 5.8 (strict mode, full type safety) |
| Build Tool | Vite 6 (ESM native, HMR super cepat) |
| Styling | Tailwind CSS v3 + PostCSS + Autoprefixer |
| Utility CSS | clsx + tailwind-merge (conditional class management) |
| Animasi | Framer Motion v12 (page transition, micro-interaction) |
| Animasi Lanjut | GSAP v3 + @gsap/react (animasi kompleks, leaderboard) |
| Routing | React Router DOM v6 (BrowserRouter, persistent URL) |
| Server State | TanStack React Query v5 (caching, background refetch) |
| Ikon | Lucide React (konsisten dengan OurCreativity) |
| Notifikasi | React Hot Toast (feedback aksi user) |
| Charts/Grafik | Recharts (pie, bar, line chart untuk dashboard Boss) |
| Tabel Data | TanStack Table v8 (sortable, filterable data grid) |
| Form | React Hook Form + Zod (validasi schema-based) |
| Date/Time | date-fns v4 (parsing, format tanggal absen) |
| QR Code | qrcode.react (alternatif absen via QR) |

### 2.2 Backend Stack (BaaS — Supabase)

Tidak ada server Node.js custom. Seluruh backend memanfaatkan Supabase sebagai Backend as a Service, identik dengan arsitektur OurCreativity.

| Layanan Supabase | Fungsi dalam Attendexa |
|---|---|
| PostgreSQL Database | Menyimpan semua data: karyawan, absensi, XP, lokasi, notifikasi |
| Supabase Auth | Autentikasi multi-role (employee, admin, boss) dengan JWT |
| Supabase Storage | Menyimpan foto selfie saat absen + foto profil karyawan |
| Supabase Realtime | Live update dashboard admin & boss saat ada absen masuk |
| Row Level Security | Keamanan data: karyawan hanya bisa lihat data miliknya sendiri |
| Edge Functions | Logika kalkulasi XP, pengiriman notifikasi push (Deno runtime) |
| REST API | Auto-generated dari schema PostgreSQL, diakses via @supabase/supabase-js v2 |
| pg_cron | Scheduler untuk rekap absensi harian, reset leaderboard bulanan |

### 2.3 Fitur Kamera & Lokasi

| Fitur | Implementasi |
|---|---|
| Kamera / Selfie | Browser MediaDevices API (getUserMedia) — akses kamera HP langsung dari browser, tanpa app native |
| Kompresi Foto | browser-image-compression — foto selfie dikompresi sebelum upload ke Supabase Storage |
| Geolokasi GPS | Browser Geolocation API (navigator.geolocation.getCurrentPosition) — akurasi tinggi |
| Kalkulasi Jarak | Haversine Formula — menghitung jarak antara koordinat GPS karyawan vs titik absen yang diset admin |
| Radius Check | Dilakukan di client side, divalidasi ulang di Supabase Edge Function untuk anti-cheat |

### 2.4 DevOps & Tooling

| Kategori | Teknologi |
|---|---|
| Hosting | Vercel (auto-deploy dari GitHub, CDN global) |
| Analytics | @vercel/analytics + @vercel/speed-insights |
| Version Control | GitHub (branch strategy: main, develop, feature/*) |
| Package Manager | npm |
| Linter / Formatter | ESLint + Prettier (code consistency) |
| Environment | Vite env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) |
| Database Migration | Supabase CLI (supabase/ folder berisi SQL migrations) |
| Error Monitoring | React Error Boundary (graceful error handling) |
| PWA | Vite PWA Plugin — agar bisa diinstall di HP (Add to Home Screen) |

### 2.5 Arsitektur Sistem

```
Browser (React SPA)
 │
 ├── Vercel CDN (Static Hosting + Edge Network)
 │
 └── Supabase (BaaS)
     ├── Auth Service (JWT, OAuth)
     ├── PostgreSQL DB (RLS enabled)
     ├── Storage Bucket (foto selfie absen)
     ├── Realtime WebSocket (live dashboard)
     └── Edge Functions (kalkulasi XP, notifikasi)
```

---

## 3. Struktur Database (Schema PostgreSQL)

Database dirancang di Supabase PostgreSQL dengan Row Level Security (RLS) aktif di semua tabel. Berikut tabel-tabel utama:

### Tabel: `users` (extends auth.users Supabase)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | Foreign key ke auth.users Supabase |
| full_name | varchar(100) | Nama lengkap karyawan |
| employee_id | varchar(20) | ID karyawan (NIK/kode internal) |
| role | enum | `'employee'` \| `'admin'` \| `'boss'` |
| department | varchar(50) | Divisi / departemen |
| company_id | uuid FK | Relasi ke tabel companies |
| avatar_url | text | URL foto profil di Supabase Storage |
| total_xp | integer default 0 | Total XP kumulatif all-time |
| monthly_xp | integer default 0 | XP bulan berjalan (reset tiap bulan via pg_cron) |
| streak_days | integer default 0 | Hari berturut-turut hadir tepat waktu |
| created_at | timestamptz | Waktu dibuat |

### Tabel: `attendance_records`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | Primary key |
| user_id | uuid FK | Relasi ke users.id |
| company_id | uuid FK | Relasi ke companies.id |
| check_in_at | timestamptz | Waktu absen masuk (UTC) |
| check_out_at | timestamptz | Waktu absen keluar (nullable) |
| photo_url | text | URL foto selfie di Supabase Storage |
| latitude | decimal(10,8) | Koordinat GPS latitude saat absen |
| longitude | decimal(11,8) | Koordinat GPS longitude saat absen |
| distance_meters | integer | Jarak dari titik absen (meter) |
| status | enum | `'on_time'` \| `'late_10'` \| `'late_15'` \| `'late_20'` \| `'late_30plus'` \| `'absent'` |
| minutes_late | integer default 0 | Menit keterlambatan (0 = tepat waktu) |
| xp_earned | integer | XP yang didapat dari absen ini |
| location_point_id | uuid FK | Titik absen yang digunakan |

### Tabel: `location_points` (diatur Admin)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | Primary key |
| company_id | uuid FK | Relasi ke companies |
| name | varchar(100) | Nama titik (mis: 'Kantor Pusat Jakarta') |
| latitude | decimal(10,8) | Koordinat pusat titik absen |
| longitude | decimal(11,8) | Koordinat pusat titik absen |
| radius_meters | integer default 100 | Radius toleransi (default 100m, diatur admin) |
| work_start_time | time | Jam mulai kerja (mis: 08:00) |
| is_active | boolean default true | Status aktif titik absen |

### Tabel: `leave_requests` (Izin & Cuti)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | Primary key |
| user_id | uuid FK | Karyawan yang mengajukan |
| type | enum | `'sick'` \| `'annual_leave'` \| `'permit'` \| `'wfh'` |
| start_date | date | Tanggal mulai |
| end_date | date | Tanggal selesai |
| reason | text | Alasan / keterangan |
| attachment_url | text | Lampiran (surat dokter, dll) di Storage |
| status | enum | `'pending'` \| `'approved'` \| `'rejected'` |
| reviewed_by | uuid FK | Admin yang mereview |
| xp_impact | integer default 0 | XP tidak dipotong jika izin disetujui |

---

## 4. Sistem XP, Leaderboard & Gamifikasi

Sistem gamifikasi adalah fitur pembeda utama Attendexa. Dirancang agar fair, transparan, dan tidak menciptakan tekanan berlebihan pada karyawan.

### 4.1 Tabel Poin XP Absen

| Status Kehadiran | Keterlambatan | XP Didapat | Keterangan |
|---|---|---|---|
| Tepat Waktu (On Time) | 0 menit | +15 XP | Hadir sebelum/tepat jam kerja |
| Terlambat Sedikit | 1–10 menit | +10 XP | Toleransi keterlambatan minor |
| Terlambat Sedang | 11–20 menit | +5 XP | Masih mendapat poin positif |
| Terlambat Cukup | 21–30 menit | +2 XP | Minimal poin, sebagai pengingat |
| Terlambat Parah | >30 menit | 0 XP | Tidak dapat poin, tidak minus |
| Absen (Tanpa Keterangan) | Full day | -10 XP | Pemotongan hanya jika tidak ada izin |
| Izin Resmi (Approved) | N/A | +5 XP | Izin disetujui tetap dapat poin dasar |
| WFH (Approved) | N/A | +10 XP | WFH tepat waktu setara absen normal |

> **⚡ Kenapa Tidak Ada -5 untuk Telat 30 Menit?**  
> Sistem poin minus hanya diterapkan untuk ABSEN TANPA KETERANGAN, bukan keterlambatan.  
> Reasoning: Keterlambatan bisa punya banyak sebab (macet, transportasi, dll). Memberikan poin minus untuk terlambat akan terasa unfair dan justru menurunkan motivasi karyawan. Hukuman yang fair adalah tidak dapat poin, bukan pemotongan poin.

### 4.2 Bonus XP — Streak & Achievement

| Bonus / Achievement | XP Bonus |
|---|---|
| Streak 5 hari berturut tepat waktu | +10 XP bonus |
| Streak 10 hari berturut tepat waktu | +25 XP bonus |
| Streak 20 hari berturut tepat waktu | +50 XP bonus |
| Streak 1 bulan penuh tepat waktu | +100 XP + Badge 'Disiplin Master' |
| Pertama kali absen tepat waktu (onboarding) | +20 XP bonus |
| Top 3 Leaderboard akhir bulan | +30/20/15 XP tambahan |
| 0 ketidakhadiran dalam sebulan | +40 XP 'Attendance Perfect' |

### 4.3 Sistem Level / Tier Karyawan

| Level (Tier) | Total XP Kumulatif |
|---|---|
| 🥉 Bronze | 0 – 499 XP |
| 🥈 Silver | 500 – 1,499 XP |
| 🥇 Gold | 1,500 – 2,999 XP |
| 💎 Platinum | 3,000 – 4,999 XP |
| 💠 Diamond | 5,000+ XP |

Level karyawan ditampilkan di profil dan leaderboard. Level tidak di-reset setiap bulan (bersifat kumulatif), sedangkan leaderboard bulanan menggunakan `monthly_xp` yang direset setiap tanggal 1.

### 4.4 Perlindungan Fairness

- Izin sakit yang dilampiri surat dokter: XP tidak dipotong, dapat +5 XP izin resmi
- Cuti tahunan yang disetujui admin: tidak mempengaruhi streak negatif
- Keterlambatan karena force majeure (banjir, darurat): admin dapat override status
- Sistem tidak menampilkan nama karyawan yang XP-nya sangat rendah di leaderboard publik (privacy protection)
- Leaderboard hanya tampilkan Top 10, agar tidak memalukan karyawan di posisi bawah

---

## 5. User Flow & Fitur Per Aktor

### 5.1 Flow Karyawan (Employee)

#### Halaman & Route

| Route | Halaman / Fungsi |
|---|---|
| `/login` | Halaman login (email + password) |
| `/dashboard` | Dashboard utama: CTA absen, summary hari ini, XP widget |
| `/absen` | Halaman proses absen: kamera + GPS + submit |
| `/history` | Riwayat absensi bulanan dengan filter tanggal |
| `/leaderboard` | Leaderboard XP: monthly + all-time, posisi karyawan ini |
| `/izin` | Pengajuan izin/cuti dengan upload lampiran |
| `/profile` | Profil karyawan: edit nama, foto, lihat level & XP |
| `/settings` | Pengaturan: notifikasi, timezone, ubah password |

#### Flow Absen Detail

1. Karyawan klik tombol 'Absen Sekarang' di dashboard
2. Sistem meminta izin akses kamera dan lokasi GPS
3. Kamera depan menyala, karyawan ambil selfie
4. Sistem mengambil koordinat GPS secara real-time
5. Haversine formula menghitung jarak ke titik absen terdekat
6. Jika jarak > radius yang diset admin: muncul error 'Anda di luar area absen'
7. Jika jarak valid: foto dikompresi, diupload ke Supabase Storage
8. Record absen dibuat di database dengan status & XP otomatis
9. Notifikasi toast muncul: 'Absen berhasil! +15 XP (Tepat Waktu)'
10. Dashboard karyawan update real-time (Supabase Realtime)

#### Fitur Tambahan Karyawan (Saran)

- Check-out absen pulang (untuk tracking jam kerja aktual)
- Notifikasi reminder absen (push notification via PWA, 15 menit sebelum jam kerja)
- Absen WFH: tidak perlu GPS, hanya foto selfie + checklist 'Sedang WFH'
- Kalender visual: warna hijau = hadir tepat, kuning = terlambat, merah = absen
- Widget XP Progress: progress bar menuju level berikutnya
- History detail: klik absen tertentu untuk lihat foto selfie & koordinat peta
- Export history ke PDF untuk keperluan administrasi

### 5.2 Flow Admin

#### Halaman & Route

| Route | Halaman / Fungsi |
|---|---|
| `/admin/dashboard` | Dashboard: ringkasan hari ini, siapa saja yang sudah/belum absen |
| `/admin/karyawan` | Manajemen karyawan: tambah, edit, nonaktifkan, import CSV |
| `/admin/lokasi` | Manajemen titik absen: set koordinat via map, atur radius (meter) |
| `/admin/absensi` | Monitor absensi real-time: live update saat ada absen masuk |
| `/admin/izin` | Approval izin & cuti karyawan (approve/reject + catatan) |
| `/admin/laporan` | Generate laporan: per karyawan, per departemen, per periode |
| `/admin/jadwal` | Pengaturan jadwal kerja & shift (jika ada multi-shift) |
| `/admin/settings` | Pengaturan perusahaan: jam kerja, toleransi, notifikasi |

#### Fitur Admin (Saran Tambahan)

- Import karyawan massal via CSV/Excel
- Bulk action: approve izin multiple karyawan sekaligus
- QR Code Mode: admin bisa generate QR code khusus sebagai alternatif absen
- Override absen: admin dapat koreksi status absen karyawan dengan alasan
- Notifikasi real-time: alert jika ada karyawan belum absen 30 menit setelah jam kerja
- Template laporan: laporan bulanan otomatis bisa di-export Excel/PDF
- Audit log: semua aksi admin tercatat untuk akuntabilitas

### 5.3 Flow Boss / Owner

#### Halaman & Route

| Route | Halaman / Fungsi |
|---|---|
| `/boss/dashboard` | Executive dashboard: KPI utama, chart kehadiran, alert |
| `/boss/analytics` | Analytics mendalam: trend, perbandingan departemen, prediksi |
| `/boss/leaderboard` | Leaderboard perusahaan: top performer, departemen terbaik |
| `/boss/karyawan` | Overview karyawan: profil, track record absen, level XP |
| `/boss/laporan` | Laporan eksekutif: download PDF/Excel siap presentasi |
| `/boss/settings` | Pengaturan global: aktifkan/nonaktifkan fitur XP, atur threshold |

#### Wajib: Chart & Visualisasi Data (Recharts)

- **Line Chart:** Tren kehadiran 30/60/90 hari terakhir
- **Bar Chart:** Perbandingan kehadiran antar departemen per bulan
- **Pie/Donut Chart:** Distribusi status absen (Tepat waktu vs Terlambat vs Absen)
- **Area Chart:** Total jam kerja aktual vs jam kerja seharusnya
- **Heatmap Calendar:** Visualisasi pola kehadiran per hari dalam setahun
- **Gauge Chart:** Tingkat kehadiran perusahaan hari ini (misal: 87%)
- **Leaderboard Chart:** Top 10 karyawan XP bulan ini
- **KPI Cards:** Total hadir, total terlambat, total absen, rata-rata jam kerja

#### Fitur Boss (Saran Tambahan)

- Executive Summary otomatis via email setiap Senin pagi
- Komparasi YoY (Year over Year): bandingkan kehadiran tahun ini vs tahun lalu
- Drill-down: klik departemen di chart → lihat detail karyawan di departemen itu
- Threshold alert: notifikasi jika tingkat kehadiran drop di bawah 80%
- Cost analysis: estimasi biaya ketidakhadiran (gaji per jam × jam hilang)

---

## 6. UI/UX Design System

Tema visual Attendexa: **Neo-Brutalist Light Mode**. Mengadopsi arsitektur grid dan estetika dari *OurCreativity* (namun dalam versi terang/Light Mode). Desain ini mengedepankan garis tegas, bayangan solid, dan tipografi Serif yang elegan bercampur dengan gaya modern.

### 6.1 Color Palette

| Token | Nilai & Penggunaan |
|---|---|
| Primary Blue | `#1A56DB` — CTA utama, background interaktif |
| Brutalist Yellow | `#FACC15` — Warna pop untuk Streak dan elemen mencolok |
| Brutalist Pink | `#F472B6` — Warna pop sekunder |
| Brutalist Cyan | `#22D3EE` — Warna pop tersier (Avatar, highlight) |
| Brutalist White | `#F8FAFC` — Latar kartu pasif |
| Success | `#059669` — Status hadir, XP positif |
| Warning | `#D97706` — Status terlambat |
| Danger | `#DC2626` — Status absen |
| Base Background | `#FAFAFA` — Background utama aplikasi (ditambah SVG noise overlay) |
| Solid Line / Text | `#1F2937` — Border tegas, bayangan brutalist, teks utama |

### 6.2 Neo-Brutalist Rules & Layout

- **Base Container**: Menggunakan tekstur noise transparan `0.03` untuk kesan organik.
- **Card (Bento Grid)**: Background solid `#FFFFFF`, border tegas `2px solid #E5E7EB`, dengan bayangan solid (offset) `4px 4px 0px 0px #E5E7EB`.
- **Card Hover State**: Border berubah menjadi `#1F2937`, bayangan offset menjadi `4px 4px 0px 0px #1F2937`, dan elemen bergeser `translate-x(-2px) translate-y(-2px)`.
- **Layout Dashboard**: Menggunakan **Bento Grid** responsif, di mana elemen-elemen penting memakan *span* kolom yang lebih besar (misal `md:col-span-2` atau `md:col-span-3`).
- **Navbar**: Background transparan/solid putih, border bawah `2px solid #E5E7EB`.

### 6.3 Typography

| Elemen | Spesifikasi |
|---|---|
| Font Heading Utama | **Playfair Display** (Serif) — Digunakan untuk H1/H2 dan Logo, memberi kesan editorial/eksekutif. |
| Font Body / UI | **Inter** (Sans-serif) — Keterbacaan maksimal untuk form dan paragraf. |
| Font Monospace | **JetBrains Mono** — Digunakan untuk data kritikal (angka XP, statistik) dan label teknis. |
| Styling Khas | Penggunaan teks *Italic* untuk kata kunci (contoh: Attend*exa*, *Dashboard*). |

### 6.4 Komponen Utama

- **Bento Card** — Kotak layout asimetris dengan sudut tajam/tumpul ringan (`rounded-none` atau `rounded-lg`).
- **Solid Button** — Tombol tanpa *border-radius*, warna mencolok, dengan efek klik turun (menghilangkan bayangan dan menggeser kembali posisi tombol).
- **Brutalist Badge** — Label dengan `border-2`, teks `uppercase`, tebal.
- **XP Progress Bar** — Garis kotak tajam dengan warna isian yang kontras.

### 6.5 Mobile-First

Karena karyawan absen via HP, seluruh UI HARUS didesain mobile-first. Prioritas breakpoint:

- **Mobile:** 320px – 768px (PRIORITAS UTAMA — tempat absen terjadi)
- **Tablet:** 768px – 1024px
- **Desktop:** 1024px+ (Dashboard admin & boss lebih optimal di desktop)
- **PWA (Progressive Web App):** bisa diinstall di home screen HP via Vite PWA Plugin

---

## 7. Struktur Proyek (File & Folder)

Mengadopsi struktur identik dengan OurCreativity untuk konsistensi arsitektur.

```
absensi-pro/
├── components/                  # Komponen UI reusable
│   ├── attendance/              # AttendanceCard, CameraModal, GPSIndicator
│   ├── leaderboard/             # LeaderboardTable, XPBar, LevelBadge
│   ├── charts/                  # PresenceChart, DeptBarChart, KPICard
│   ├── common/                  # Button, Badge, Modal, Toast, Avatar
│   └── layout/                  # Navbar, Sidebar, PageContainer
├── pages/                       # Halaman per route
│   ├── employee/                # Dashboard, Absen, History, Leaderboard, Profile
│   ├── admin/                   # Dashboard, Karyawan, Lokasi, Laporan, Izin
│   └── boss/                    # Dashboard, Analytics, Leaderboard, Laporan
├── hooks/                       # Custom React Hooks
│   ├── useAttendance.ts         # Logic absen, GPS, camera
│   ├── useXP.ts                 # Kalkulasi XP, streak, level
│   ├── useLeaderboard.ts        # Fetch & subscribe leaderboard realtime
│   └── useGeolocation.ts        # GPS utilities + Haversine formula
├── lib/                         # Utilities & config
│   ├── supabase.ts              # Supabase client (sama dengan OurCreativity)
│   ├── xpCalculator.ts          # Logika kalkulasi XP (agar bisa di-test)
│   ├── haversine.ts             # Kalkulasi jarak GPS
│   └── dateUtils.ts             # Helpers format tanggal/waktu
├── supabase/                    # Database migrations (SQL)
├── .env.example                 # Template env vars
├── vite.config.ts               # Vite config dengan manual chunking
├── tailwind.config.ts           # Tailwind config
└── vercel.json                  # Vercel deployment config
```

---

## 8. Keamanan & Penanganan Edge Case

### 8.1 Keamanan Absen (Anti-Fraud)

| Ancaman | Mitigasi |
|---|---|
| GPS Spoofing | Validasi ulang di Supabase Edge Function (server-side check), anomali detection jika pindah lokasi terlalu cepat |
| Foto palsu / foto foto | Timestamp EXIF pada foto + metadata device. Future: liveness detection via MediaPipe Face Mesh |
| Absen untuk karyawan lain | Foto selfie tersimpan dan bisa diaudit admin. Future: Face Recognition via TensorFlow.js |
| Double absen | Database constraint: 1 record absen per user per hari, unique constraint di PostgreSQL |
| Manipulasi XP | XP hanya dihitung di Supabase Edge Function, bukan di client. Client tidak bisa manipulasi nilai XP |
| Unauthorized access | Row Level Security (RLS) Supabase: karyawan hanya bisa akses data miliknya |

### 8.2 Edge Cases Absensi

- **Karyawan di luar negeri / timezone berbeda:** semua waktu disimpan UTC, display disesuaikan timezone lokasi
- **Internet tidak stabil saat absen:** foto disimpan sementara di IndexedDB, auto-retry saat koneksi kembali
- **GPS tidak tersedia (dalam gedung):** fallback ke WiFi-based geolocation, atau admin dapat aktifkan mode manual
- **Kamera tidak tersedia:** sistem fallback ke mode text-only + GPS saja (configureable per perusahaan)
- **Hari libur nasional:** admin set daftar hari libur, sistem skip kalkulasi XP minus untuk tanggal tersebut
- **Karyawan baru:** grace period 7 hari pertama tanpa poin minus untuk adaptasi

### 8.3 Environment Variables

| Variable | Keterangan |
|---|---|
| `VITE_SUPABASE_URL` | URL project Supabase (wajib) |
| `VITE_SUPABASE_ANON_KEY` | Anonymous public key Supabase (wajib) |
| `VITE_APP_NAME` | Nama aplikasi yang ditampilkan (default: Attendexa) |
| `VITE_DEFAULT_RADIUS` | Radius default absen dalam meter (default: 100) |
| `VITE_WORK_START_TIME` | Jam mulai kerja default (default: 08:00) |

---

## 9. Roadmap Pengembangan

### 9.1 Phase 1 — MVP (Bulan 1–2)

> **Scope MVP:** Target: Sistem absensi fungsional dengan gamifikasi dasar. Bisa digunakan real oleh perusahaan kecil.

- Auth: Login, register, role-based routing (employee/admin/boss)
- Absen: Kamera selfie + GPS validation + status + XP otomatis
- Dashboard Employee: summary hari ini, CTA absen, XP widget
- History: Riwayat absensi bulanan dengan status
- Leaderboard: Top 10 bulanan, posisi karyawan ini
- Admin: Manajemen karyawan, set titik lokasi, monitor absen real-time
- Boss: Dashboard KPI + 3 chart utama (line, bar, pie)
- Profile: Edit profil, lihat level & streak

### 9.2 Phase 2 — Growth (Bulan 3–4)

- Sistem izin & cuti dengan approval flow
- Notifikasi push via PWA
- Export laporan PDF & Excel
- Achievement & badge system
- Multi-lokasi (perusahaan dengan beberapa kantor)
- Admin override status absen
- Import karyawan massal via CSV

### 9.3 Phase 3 — Scale (Bulan 5–6)

- Multi-perusahaan (SaaS model): satu platform untuk banyak perusahaan
- Face Recognition liveness detection (TensorFlow.js / MediaPipe)
- Analytics lanjutan: cost analysis, prediksi trend
- Integrasi payroll (kalkulasi tunjangan berdasarkan kehadiran)
- Mobile app (React Native / Capacitor dari codebase yang sama)
- API publik untuk integrasi dengan HRIS lain
- Executive email report otomatis (Resend / SendGrid)

---

## 10. Risiko & Dependencies

| Risiko | Mitigasi |
|---|---|
| Browser tidak support MediaDevices API | Tampilkan fallback mode + panduan enable permission di browser settings |
| GPS inaccurate di dalam gedung | Tambah opsi radius yang lebih besar (200-500m) atau WiFi geolocation fallback |
| Supabase downtime | Implementasi offline-first dengan IndexedDB, sync saat online kembali |
| Biaya Supabase Storage (foto selfie) | Kompresi foto ke < 100KB sebelum upload. Supabase free tier: 1GB storage |
| Adopsi karyawan rendah | Gamifikasi XP/leaderboard adalah solusi utama. Tambah social proof (streak visible to team) |
| Data privacy PDPA/UU PDP | Foto selfie hanya disimpan 90 hari lalu dihapus otomatis. Karyawan bisa request hapus data |

### 10.1 Third-party Dependencies Kritis

| Dependency | Keterangan |
|---|---|
| Supabase | Backend utama — seluruh data, auth, storage bergantung di sini |
| Vercel | Hosting — jika Vercel down, site tidak bisa diakses |
| Browser Geolocation API | Wajib untuk validasi lokasi absen |
| Browser MediaDevices API | Wajib untuk fitur kamera selfie |

---

*Attendexa PRD v1.0.0*  
*Stack: React 19 + TypeScript 5.8 + Vite 6 + Tailwind CSS + Supabase + Vercel*
