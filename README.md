# 🎬 VidEdit — Full Stack Video Editing Platform

A powerful platform to manage **video editing workflows** between clients, editors, and administrators.

---

## ✨ Overview

VidEdit allows users to:
- Submit editing jobs
- Collaborate with editors in real-time
- Track progress from start to delivery

---

## 🏗️ Project Structure

videdit/
├── backend/ # Node.js + Express + MongoDB API
└── frontend/ # Next.js 14 + Tailwind CSS


---

## 🚀 Features

### 🔐 Authentication
- Email + Password login/signup  
- JWT-based authentication (7-day expiry)  
- Role-based access (User / Admin / Super Admin)  
- Auto-seeded Super Admin  

---

### 👤 User Features
- Create editing jobs  
- Upload sample videos + clips  
- Track job status  
- Request revisions  
- Real-time chat  
- Settle job  
- Email notifications  

---

### 🛠️ Admin Features
- View available jobs  
- Accept jobs  
- Upload edited videos  
- Chat with users  

---

### 👑 Super Admin Features
- Full dashboard  
- Set pricing  
- Assign admins  
- Manage users  
- Assign badges  

---

### 💬 Chat System
- Real-time (Socket.IO)  
- Image sharing  
- Typing indicators  
- Auto-delete messages after 7 days  

---

### 📧 Notifications
- Job delivery emails  
- Price confirmation  
- Revision alerts  

---

## ⚙️ Setup

### 📌 Prerequisites
- Node.js (v18+)  
- MongoDB  
- Cloudinary  
- SMTP (Gmail recommended)  

---

## 🔧 Backend Setup

cd backend
npm install
cp .env.example .env
npm run dev

---

### 🔑 Backend Environment Variables

| Variable | Description |
|----------|------------|
| MONGODB_URI | MongoDB connection |
| JWT_SECRET | Secret key |
| CLOUDINARY_* | Cloudinary credentials |
| SMTP_* | Email config |
| SUPER_ADMIN_EMAIL | Admin email |
| SUPER_ADMIN_PASSWORD | Admin password |
| FRONTEND_URL | Frontend URL |

---

## 🎨 Frontend Setup

cd frontend
npm install
cp .env.example .env.local
npm run dev

---


### 🔑 Frontend Environment Variables

NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000


---

## 🌐 Deployment

### 🚀 Frontend (Vercel)
- Import repo  
- Add env variables  
- Deploy  

---

### ⚙️ Backend (Railway / Render)

**Railway**
- Connect GitHub  
- Add env variables  
- Deploy  

**Render**
- Build: `npm install`  
- Start: `node server.js`  

> ⚠️ Socket.IO requires persistent server (not supported on Vercel backend)

---

## 📡 API Routes

### Auth

POST /api/auth/signup
POST /api/auth/login
GET /api/auth/me


### Jobs

POST /api/jobs
GET /api/jobs/my
POST /api/jobs/:id/deliver
PATCH /api/jobs/:id/set-price

---

### Chat

GET /api/chat/:jobId
POST /api/chat/:jobId


---

## 🔐 Default Super Admin

Email: superadmin@videdit.com
Password: SuperAdmin@123

---

⚠️ Change after first login.

---

## 🧠 Tech Stack

- Frontend: Next.js, Tailwind CSS  
- Backend: Node.js, Express  
- Database: MongoDB  
- Real-time: Socket.IO  
- Auth: JWT  
- Storage: Cloudinary  
- Email: Nodemailer  

---

## 🛡️ Security Notes

- Do NOT commit `.env` files  
- Use `.gitignore`  
- Rotate secrets if exposed  

---

## 🤝 Contributing

1. Fork repo  
2. Create branch  
3. Make changes  
4. Submit PR  

---

## ⭐ Final Note

Production-ready system for video editing workflow with real-time collaboration.

---