# Project Management System

Sistem manajemen proyek dan penjadwalan tugas berbasis web untuk mengelola siklus pengembangan perangkat lunak (SDLC) secara menyeluruh. Aplikasi ini dirancang untuk tim pengembangan perangkat lunak yang membutuhkan alat untuk merencanakan, melacak, dan mengkoordinasikan pekerjaan proyek secara efektif.

## 📋 Fitur Utama

### 📊 Manajemen Tugas SDLC
Kelola tugas-tugas pengembangan perangkat lunak sesuai fase-fase SDLC:
- **Analisis Kebutuhan** - Pengumpulan data & wawancara pemangku kepentingan
- **Analisis Sistem** - Analisis alur & penyusunan spesifikasi
- **Perancangan/Desain** - Perancangan basis data & UI/UX
- **Implementasi/Coding** - Pengembangan modul & API
- **Pengujian/Testing** - Pengujian fungsionalitas & UAT
- **Deployment & Maintenance** - Penerapan sistem & pelatihan

Setiap tugas dapat dikonfigurasi dengan:
- Durasi (hari)
- Prioritas (Low/Normal/High)
- Status (Pending/In Progress/Completed)
- Progress percentage (0-100%)
- Tanggal mulai & selesai

### 🔗 Task Dependencies
Atur ketergantungan antar tugas untuk memodelkan alur kerja yang realistis:
- **Finish-to-Start (FS)** - Tugas B mulai setelah Tugas A selesai
- **Start-to-Start (SS)** - Tugas B mulai bersamaan dengan Tugas A
- **Finish-to-Finish (FF)** - Tugas B selesai bersamaan dengan Tugas A
- **Start-to-Finish (SF)** - Tugas B selesai setelah Tugas A dimulai
- Konfigurasi lag/delay hari untuk penjadwalan yang fleksibel

### 👥 Resource Allocation
Kelola sumber daya tim dan alokasi ke tugas:
- Profil anggota tim dengan role, email, dan informasi kontak
- Alokasi persentase ke setiap tugas
- Visualisasi beban kerja tim

### 📈 Gantt Chart
Visualisasi timeline proyek secara interaktif:
- Timeline horizontal dengan baris tugas
- Progress bar yang menunjukkan kemajuan setiap tugas
- Indikator ketergantanan antar tugas
- Penanda akhir pekan dalam timeline
- Warna status: Hijau (Selesai), Biru (Proses), Abu (Pending)

### 🎯 Milestones
Tentukan dan lacak pencapaian kunci proyek:
- Tentukan target tanggal untuk setiap milestone
- Tandai milestone sebagai "Achieved" atau "Pending"
- Lihat progres keseluruhan proyek

## 🚀 Cara Menjalankan Aplikasi

### Prerequisites
- Node.js (versi 14 atau lebih baru)
- npm (Node Package Manager)

### Langkah-Langkah

1. **Clone repository**
   ```bash
   git clone https://github.com/ariltaki-glitch/project-management-system.git
   cd project-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Jalankan aplikasi**
   ```bash
   npm start
   ```

4. **Buka di browser**
   Akses aplikasi di: http://localhost:3000

### Database
Aplikasi menggunakan SQLite (sql.js) yang disimpan dalam file `database/projects.db`. Database akan otomatis dibuat saat aplikasi pertama kali dijalankan.

### Seeder Data (Opsional)
Untuk mengisi database dengan data contoh yang realistis:
```bash
node database/seeder.js
```

## 📸 Screenshots

### Dashboard & Project List
![Dashboard](screenshots/dashboard.png)

### Task Management
![Task Management](screenshots/tasks.png)

### Task Dependencies
![Task Dependencies](screenshots/dependencies.png)

### Team & Resource Allocation
![Team Members](screenshots/team.png)

### Gantt Chart
![Gantt Chart](screenshots/gantt.png)

### Milestones
![Milestones](screenshots/milestones.png)

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (sql.js)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Tailwind CSS (CDN)
- **Icons**: Font Awesome

## 📁 Struktur Proyek

```
project-management-system/
├── package.json           # Konfigurasi proyek & dependencies
├── server.js              # Entry point Express server
├── README.md              # Dokumentasi proyek
├── database/
│   ├── db.js             # Modul handler database SQLite
│   ├── seeder.js         # Script pengisi data contoh
│   └── projects.db       # File database SQLite
├── routes/
│   └── api.js            # REST API routes
└── public/
    ├── index.html        # Halaman utama (frontend)
    ├── app.js            # Logika frontend JavaScript
    └── app.css           # Styling aplikasi
```

## 🔧 API Endpoints

### Projects
- `GET /api/projects` - Daftar semua proyek
- `GET /api/projects/:id` - Detail proyek
- `POST /api/projects` - Buat proyek baru
- `PUT /api/projects/:id` - Update proyek
- `DELETE /api/projects/:id` - Hapus proyek

### Tasks
- `GET /api/projects/:projectId/tasks` - Daftar tugas
- `GET /api/tasks/:id` - Detail tugas
- `POST /api/tasks` - Buat tugas
- `PUT /api/tasks/:id` - Update tugas
- `DELETE /api/tasks/:id` - Hapus tugas

### Dependencies
- `POST /api/dependencies` - Tambah ketergantanan
- `DELETE /api/dependencies/:id` - Hapus ketergantanan
- `GET /api/tasks/:taskId/dependencies` - Daftar ketergantanan

### Team Members
- `GET /api/projects/:projectId/team` - Daftar anggota tim
- `POST /api/team` - Tambah anggota
- `PUT /api/team/:id` - Update anggota
- `DELETE /api/team/:id` - Hapus anggota

### Assignments
- `POST /api/assignments` - Alokasikan resource ke tugas
- `DELETE /api/assignments/:id` - Hapus alokasi
- `GET /api/tasks/:taskId/assignments` - Daftar alokasi tugas

### Milestones
- `GET /api/projects/:projectId/milestones` - Daftar milestones
- `POST /api/milestones` - Buat milestone
- `PUT /api/milestones/:id` - Update milestone
- `DELETE /api/milestones/:id` - Hapus milestone

## 📄 Lisensi

Proyek ini digunakan untuk keperluan akademik dan pembelajaran.

## 🤝 Kontribusi

1. Fork repository
2. Buat branch fitur (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -am 'Tambah fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

---

**Developer**: Aril Takiudin  
**Repository**: https://github.com/ariltaki-glitch/project-management-system
