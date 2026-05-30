# ResuMind AI — Backend Setup Guide

## Folder Structure
```
resumind-backend/
├── server.js               ← Entry point
├── package.json
├── .env                    ← Your secrets (never commit this)
├── .env.example            ← Template
├── controllers/
│   ├── authController.js   ← Signup, login, getMe
│   ├── resumeController.js ← AI analysis, history
│   └── userController.js   ← Profile
├── middleware/
│   └── auth.js             ← JWT verification
├── models/
│   ├── User.js             ← User schema
│   └── Analysis.js         ← Analysis schema
└── routes/
    ├── auth.js
    ├── resume.js
    └── user.js
```

---

## Step 1 — Install Node.js

Download from https://nodejs.org (choose LTS version).
Verify: `node -v` and `npm -v` in terminal.

---

## Step 2 — Get MongoDB Atlas (Free Database)

1. Go to https://mongodb.com/atlas → Sign up free
2. Create a new **Free Cluster** (M0)
3. Under **Database Access** → Add a user with a password
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all — fine for dev)
5. Click **Connect** → **Drivers** → Copy your connection string
   It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`
6. Add `/resumind` before the `?` at the end

---

## Step 3 — Get Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up / Log in
3. Go to **API Keys** → Create a new key
4. Copy it — looks like `sk-ant-...`

---

## Step 4 — Set Up the Project

```bash
# 1. Open terminal in the resumind-backend folder
cd resumind-backend

# 2. Install all dependencies
npm install

# 3. Copy the env template
cp .env.example .env

# 4. Open .env and fill in your values:
#    MONGO_URI = your MongoDB connection string
#    JWT_SECRET = any long random string
#    ANTHROPIC_API_KEY = your key from step 3
#    FRONTEND_URL = http://localhost:3000
```

### Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Paste the output as your JWT_SECRET.

---

## Step 5 — Run Locally

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
```

Test it: open http://localhost:5000 — you should see `"ResuMind AI Backend is running 🚀"`

---

## Step 6 — Connect Frontend

In your React frontend, change the API base URL to:
```
http://localhost:5000/api   ← for local dev
https://your-render-url.onrender.com/api  ← for production
```

### Example frontend API calls:

**Signup:**
```js
const res = await fetch("http://localhost:5000/api/auth/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, password })
});
const data = await res.json();
localStorage.setItem("token", data.token);
```

**Login:**
```js
const res = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
});
const data = await res.json();
localStorage.setItem("token", data.token);
```

**Analyze Resume (with PDF):**
```js
const formData = new FormData();
formData.append("file", pdfFile);           // optional
formData.append("resumeText", text);         // optional
formData.append("jobDescription", jd);       // optional

const res = await fetch("http://localhost:5000/api/resume/analyze", {
  method: "POST",
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  body: formData
});
const data = await res.json();
console.log(data.result); // ← full AI analysis
```

**Get History:**
```js
const res = await fetch("http://localhost:5000/api/resume/history", {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});
```

---

## Step 7 — Deploy to Render (Free Hosting)

1. Push your backend folder to a GitHub repository
2. Go to https://render.com → Sign up free
3. Click **New → Web Service**
4. Connect your GitHub repo
5. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
6. Under **Environment Variables**, add all your `.env` values
7. Click **Deploy**

Render gives you a URL like `https://resumind-backend.onrender.com`
Use that as your FRONTEND_URL and API base in production.

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | No | Create account |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Get current user |
| POST | /api/resume/analyze | Yes | Analyze resume (PDF or text) |
| GET | /api/resume/history | Yes | Get past analyses |
| GET | /api/resume/:id | Yes | Get one analysis |
| DELETE | /api/resume/:id | Yes | Delete analysis |
| GET | /api/user/profile | Yes | Full profile + stats |
| PATCH | /api/user/profile | Yes | Update name |

**Auth header format:** `Authorization: Bearer <your_jwt_token>`

---

## Common Issues

**MongoDB connection failed** → Check your IP whitelist in Atlas (add 0.0.0.0/0)

**401 Unauthorized** → Token missing or expired. Re-login to get a fresh token.

**PDF parse error** → Make sure you're sending the file as `multipart/form-data`, not JSON

**Analysis limit reached** → Rate limited to 10 analyses/hour per IP to protect API costs

---

Built by Team Code Breaker · Bharati Vidyapeeth's College of Engineering, New Delhi
