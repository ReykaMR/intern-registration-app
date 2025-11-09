# Intern Registration System
Sistem Pengelolaan Magang

## Teknologi yang Digunakan
### Frontend
- React JS
- Bootstrap 5

### Backend
- Node JS
- Express JS
- MySQL2

### DBMS
- MySQL

## Instalasi dan Setup
### Langkah 1: Clone Repository
```bash
git clone https://github.com/ReykaMR/intern-registration-app.git
cd intern-registration-app
```

### Langkah 2: Setup Database
**Catatan**: jka menggunakan perintah terminal dan versi mysql nya terbaru harap ganti nama dari ../../database/schema.sql ke ../../database/schema2.sql di file backend/scripts/setupDatabase.js

Jalankan perintah berikut di terminal (root proyek):
```bash
npm run db:setup
npm run db:seed
```
Atau:
1. Buka phpMyAdmin
2. Buat database baru dengan nama intern_registration lalu masuk ke dalam database tersebut
3. Import file schema.sql atau schema2.sql ke dalam database

### Langkah 3: Setup Backend dan Frontend
1. Rename file .env.example ke .env yang ada di folder backend, lalu sesuaikan isi kodenya.
2. Jalankan perintah berikut di terminal (root proyek):
    - Install dependencies:
    ```bash
    npm run install:all
    ```
    - Jalankan server:
    ```bash
    npm run dev
    ```
Server frontend akan berjalan di http://localhost:3000 dan server backend akan berjalan di http://localhost:5000
