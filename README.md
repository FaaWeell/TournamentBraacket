# 🏆 Tournament Bracket Generator

Aplikasi web untuk membuat dan mengelola turnamen single-elimination dengan bracket generator otomatis.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## ✨ Features

- 🎮 **Multi-type Tournament**: Futsal, E-Sport, Catur, atau Custom
- 👥 **Flexible Participants**: 4, 8, 16, 32, atau 64 peserta
- 🔄 **Auto Bracket Generation**: Single-elimination dengan seeding otomatis
- 📊 **Real-time Score Updates**: Update skor dan lihat pemenang langsung maju
- 🏆 **Champion Celebration**: Halaman perayaan juara dengan animasi
- 🔒 **Admin Protection**: Password protection untuk keamanan turnamen
- 📱 **Responsive Design**: Tampilan optimal di desktop dan mobile
- 💾 **LocalStorage**: Data tersimpan di browser, tidak perlu server

## 🚀 Demo

Buka `index.html` di browser atau jalankan dengan live server.

## 📦 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 atau lebih baru)
- npm (sudah termasuk dengan Node.js)

### Quick Start

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/tournament-bracket-generator.git

# Masuk ke folder project
cd tournament-bracket-generator

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Aplikasi akan berjalan di `http://127.0.0.1:3000`

### Tanpa Node.js

Cukup buka `index.html` langsung di browser. Tidak perlu instalasi apapun!

## 📁 Project Structure

```
tournament-bracket-generator/
├── css/
│   ├── style.css        # Core design system
│   ├── bracket.css      # Bracket visualization
│   └── champion.css     # Champion page styles
├── js/
│   ├── database.js      # LocalStorage service
│   ├── tournament.js    # Tournament management
│   ├── participant.js   # Participant management
│   ├── bracket.js       # Bracket generation engine
│   └── ui.js            # UI utilities
├── index.html           # Homepage
├── create.html          # Create tournament
├── tournament.html      # Tournament detail
├── bracket.html         # Bracket view
├── champion.html        # Champion celebration
├── tournaments.html     # Tournament listing
├── package.json
└── README.md
```

## 🎯 Usage

### Membuat Turnamen Baru

1. Klik **"Buat Turnamen Baru"** di homepage
2. Isi nama turnamen, pilih jenis, dan jumlah peserta
3. (Opsional) Set **Password Admin** untuk melindungi turnamen
4. Klik **"Buat Turnamen"**

### Mengelola Peserta

1. Buka halaman turnamen
2. Klik tab **"Peserta"**
3. Tambah peserta satu per satu atau gunakan **Auto Seed**

### Generate & Mulai Turnamen

1. Setelah peserta lengkap, klik tab **"Bracket"**
2. Klik **"Generate Bracket"**
3. Klik **"Mulai Turnamen"** untuk memulai

### Update Skor Pertandingan

1. Buka halaman **Bracket**
2. Klik pada match card yang mau di-update
3. Masukkan skor untuk kedua tim
4. Klik **"Simpan Skor"** → Pemenang otomatis maju

### Admin Login (jika ada password)

1. Jika turnamen dilindungi password, pengunjung akan melihat **"Mode Viewer"**
2. Klik **"Login Admin"**
3. Masukkan password yang sudah di-set
4. Setelah login, akses penuh tersedia

## 🔒 Security

Fitur **Admin Password Protection** memungkinkan:
- Creator turnamen dapat set password saat pembuatan
- Pengunjung tanpa password hanya bisa **melihat** (view-only)
- Admin yang sudah login mendapat **akses penuh**

## 🛠️ Technologies

- **HTML5** - Structure
- **CSS3** - Styling dengan CSS Variables
- **JavaScript (ES6+)** - Logic dan interactivity
- **LocalStorage** - Data persistence
- **Font Awesome** - Icons
- **Google Fonts (Inter)** - Typography

## 📝 License

MIT License - bebas digunakan untuk project personal atau komersial.

## 🤝 Contributing

1. Fork repository
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📧 Contact

Fajar - [@fajrios](https://github.com/fajrios)

---

⭐ Jika project ini membantu, mohon berikan star di GitHub!
