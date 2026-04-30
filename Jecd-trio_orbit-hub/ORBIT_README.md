# 🎺 ORBIT Artist Hub – Trio Santos Cirillo Diagne

**Chansons à la Demande – L'émotion sur mesure**

Artist visibility hub integrating streaming links, booking system, performance calendar, and social media aggregation. Built with LitElement (Web Components), FastAPI backend, and PWA capabilities.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Deployment](#deployment)
5. [API Documentation](#api-documentation)
6. [Development](#development)
7. [Customization](#customization)

---

## 🎯 Overview

**ORBIT Trio Hub** is a production-ready artist profile and booking platform for Trio Santos, Cirillo & Diagne. It provides:

✅ **Multi-platform streaming aggregation** (Spotify, Apple Music, YouTube, Deezer, etc.)  
✅ **Booking widget** with calendar validation and email notifications  
✅ **Performance calendar** with real-time updates from backend API  
✅ **Social media feed** aggregation (Instagram, Facebook)  
✅ **Mobile-first responsive design** (PWA-ready)  
✅ **Accessibility compliance** (WCAG 2.1 AA)  
✅ **SEO optimization** (Open Graph, structured data, meta tags)  
✅ **Admin panel** for managing bookings and performances  

### Key Features

- **Web Components (LitElement)** – Reusable, framework-agnostic, works in any browser
- **FastAPI Backend** – Lightweight, async, deployable on Railway
- **JSON Database** – Simple for MVP, easily upgradable to PostgreSQL
- **Stripe Integration** – Optional payment processing
- **Service Worker** – Offline support, installable app
- **Railway Deployment** – Production-grade infrastructure

---

## 🏗️ Architecture

```
orbit-trio/ (GitHub repository)
├── index.html                          [Entry point - PWA]
├── trio-artist-hub.js                 [LitElement Web Component]
├── manifest.json                       [PWA metadata]
├── netlify.toml                        [Netlify deployment config]
├── service-worker.js                   [Offline support - TODO]
│
├── backend/ (Railway deployment)
│   ├── main.py                        [FastAPI app]
│   ├── models.py                      [Pydantic models]
│   ├── routes.py                      [API endpoints]
│   ├── requirements.txt                [Python dependencies]
│   └── Procfile                        [Railway deployment]
│
├── data/
│   ├── bookings.json                  [Booking records]
│   └── performances.json               [Performance calendar]
│
├── images/
│   ├── trio-og.jpg                    [Open Graph image]
│   ├── trio-twitter.jpg               [Twitter Card image]
│   ├── screenshot-1.png               [PWA screenshot]
│   └── apple-touch-icon.png           [iOS icon]
│
└── README.md                           [This file]
```

### Data Flow

```
User's Browser (Frontend)
        ↓
   LitElement Component
   (trio-artist-hub.js)
        ↓
  Fetch API calls
        ↓
  Railway Backend (FastAPI)
        ↓
  JSON Database / External APIs
  (Spotify, Stripe, Email SMTP)
        ↓
  Response to Frontend
        ↓
  Real-time UI Update
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ (for local testing)
- Python 3.8+ (for backend development)
- Git
- Netlify account (for frontend hosting)
- Railway account (for backend hosting)

### 1. Clone Repository

```bash
git clone https://github.com/fullmeo/orbit-hub.git
cd orbit-hub/trio
```

### 2. Local Frontend Testing

```bash
# Serve locally (using Python's http.server)
python3 -m http.server 8000

# Open browser
open http://localhost:8000
```

### 3. Local Backend Testing

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
python main.py

# API available at http://localhost:8000
# Docs at http://localhost:8000/api/docs
```

### 4. Environment Variables

Create `.env` file in `backend/` directory:

```env
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Stripe (Optional)
STRIPE_API_KEY=sk_test_xxxxx

# Admin
ADMIN_EMAIL=admin@orbit-hub.netlify.app

# Environment
DEBUG=True
PORT=8000
HOST=0.0.0.0
```

---

## 📦 Deployment

### Frontend: Netlify

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Select GitHub repository
   - Select `trio` directory as publish directory

2. **Configure Build**
   ```
   Build command: (leave empty - static site)
   Publish directory: .
   ```

3. **Set Environment Variables**
   - Go to Site Settings → Build & Deploy → Environment
   - Add any needed environment variables (e.g., API endpoint)

4. **Deploy**
   - Push to `main` branch
   - Netlify auto-deploys
   - Live at `https://orbit-trio.netlify.app`

### Backend: Railway

1. **Create Railway Project**
   - Go to [railway.app](https://railway.app)
   - Click "Create New Project"
   - Select "Deploy from GitHub"

2. **Configure Service**
   ```
   Root Directory: backend/
   Start Command: python main.py
   ```

3. **Set Environment Variables**
   - In Railway dashboard, add:
     - `SMTP_SERVER`
     - `SMTP_USERNAME`
     - `SMTP_PASSWORD`
     - `STRIPE_API_KEY` (optional)
     - `DEBUG=False`

4. **Deploy**
   - Railway auto-deploys on push
   - Service available at `https://orbit-trio-api.railway.app`

5. **Update Frontend**
   - Update `backendUrl` in `trio-artist-hub.js`:
     ```javascript
     this.backendUrl = 'https://orbit-trio-api.railway.app';
     ```

---

## 📚 API Documentation

### Base URL

**Production:** `https://orbit-trio-api.railway.app`  
**Local:** `http://localhost:8000`

### Interactive Docs

Swagger UI: `/api/docs`  
ReDoc: `/api/redoc`

### Endpoints

#### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "ORBIT Artist Hub API",
  "timestamp": "2025-04-29T10:30:00"
}
```

#### Get Artist Profile

```http
GET /artists/{artist_id}
```

Example:
```bash
curl https://orbit-trio-api.railway.app/artists/trio-santos-cirillo-diagne
```

#### Get Performances

```http
GET /performances/{artist_id}
```

Returns list of upcoming performances.

#### Create Booking

```http
POST /bookings
Content-Type: application/json

{
  "artistId": "trio-santos-cirillo-diagne",
  "eventDate": "2025-06-15",
  "eventType": "wedding",
  "venue": "Le Caveau de la Huchette",
  "guestCount": 100,
  "message": "Voulez-vous jouer du Nougaro ?",
  "contactEmail": "client@example.com",
  "contactPhone": "+33612345678"
}
```

Response:
```json
{
  "id": "booking_20250429_120000_client",
  "status": "pending",
  "message": "✅ Demande de réservation reçue ! Nous vous recontacterons bientôt."
}
```

#### Get Booking Status

```http
GET /bookings/{booking_id}
```

#### Update Booking (Admin)

```http
PATCH /bookings/{booking_id}
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Confirmé pour le 15 juin. Tarif : 1200€"
}
```

#### Get Admin Stats

```http
GET /admin/stats
```

Returns booking and performance statistics.

---

## 💻 Development

### File Structure Explained

#### `index.html`
- Entry point for PWA
- Loads LitElement component via `<script type="module">`
- Contains loading screen, skip links, footer
- PWA manifest, favicon, Open Graph meta tags

#### `trio-artist-hub.js`
- LitElement Web Component
- Encapsulated DOM, styles, logic
- 5 tabs: About, Streaming, Performances, Booking, Contact
- Fetches data from FastAPI backend
- Form validation, email submission
- Responsive design (CSS Grid)
- Accessibility features (ARIA labels, semantic HTML)

#### `backend/main.py`
- FastAPI application
- CORS configured for all ORBIT sites
- Database: JSON files (easily upgradable)
- Routes: Artists, Performances, Bookings, Admin
- Email notifications (background tasks)
- Webhook support (Stripe)
- Error handling & logging

### Customization

#### Change Artist Name

In `trio-artist-hub.js`, update `ARTIST_CONFIG`:

```javascript
const ARTIST_CONFIG = {
  name: 'Your Artist Name',
  tagline: 'Your tagline here',
  // ... rest of config
};
```

#### Add Streaming Links

Update `streaming` object in `ARTIST_CONFIG`:

```javascript
streaming: {
  spotify: 'https://open.spotify.com/artist/YOUR_ID',
  youtubeMusic: 'https://www.youtube.com/c/YOUR_CHANNEL',
  // Add more platforms
}
```

#### Modify Booking Form Fields

In `trio-artist-hub.js`, update the form in `render()`:

```javascript
<div class="form-group">
  <label>Your new field</label>
  <input type="text" name="newField" />
</div>
```

Then update `BookingRequest` model in `backend/main.py`:

```python
class BookingRequest(BaseModel):
    newField: str  # Add your field
```

---

## 🔐 Security

- **Content Security Policy** enabled (netlify.toml)
- **CORS** restricted to allowed origins
- **HTTPS** enforced (Netlify & Railway)
- **Email validation** with Pydantic
- **Rate limiting** recommended (add nginx-like layer if needed)
- **No sensitive data** in frontend code
- **Password protection** for admin endpoints (TODO)

### TODO: Authentication

Add JWT-based authentication for admin routes:

```python
from fastapi.security import HTTPBearer

security = HTTPBearer()

@app.post("/admin/bookings/{booking_id}", dependencies=[Depends(security)])
async def admin_update_booking(...):
    # Protected endpoint
    pass
```

---

## 📊 Monitoring

### Netlify Analytics
- Built-in analytics dashboard
- Performance metrics
- Error tracking

### Railway Monitoring
- CPU/Memory usage
- Log streaming
- Deployment history

### Custom Analytics (TODO)
Add Google Analytics or similar:

```javascript
// In index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

---

## 🐛 Troubleshooting

### Booking Not Sending Emails

1. Check backend logs on Railway
2. Verify SMTP credentials in environment variables
3. Check spam folder for test emails
4. Enable "Less secure apps" in Gmail (if using Gmail SMTP)

### CORS Errors

1. Frontend URL must be in `allowed_origins` in `backend/main.py`
2. Ensure `Content-Type: application/json` header in API calls
3. Check browser console for specific CORS error

### Component Not Rendering

1. Check if `trio-artist-hub.js` loaded successfully
2. Verify no JavaScript errors in console
3. Check if `<trio-artist-hub>` element is in HTML

### Netlify Deploy Failure

1. Check build logs in Netlify dashboard
2. Ensure all files are committed to Git
3. Verify `.gitignore` doesn't exclude necessary files
4. Check branch name (should be `main` or `master`)

---

## 📝 License

This project is open-source and available under the MIT License.

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📞 Contact

**Trio Santos Cirillo Diagne**
- Email: serignetrumpet@gmail.com
- Phone: +33 (0)6 25 37 70 30
- Instagram: @serigne.diagnepro
- Facebook: jeanmarc.dossantos.9

---

## 🎵 Credits

Built with ❤️ by Serigne Diagne  
Part of the ORBIT Artist Hub ecosystem  
Powered by LitElement, FastAPI, Netlify, Railway

---

**Last Updated:** April 29, 2025  
**Version:** 1.0.0
