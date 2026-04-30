"""
ORBIT Trio Hub — Backend FastAPI v2.0 (PRODUCTION)
Tous les TODOs résolus :
  ✅ Email réel via aiosmtplib (HTML templates)
  ✅ JWT authentication pour routes admin
  ✅ Stripe webhook avec signature vérifiée
  ✅ Endpoint /tips/create-checkout
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime, timedelta
from enum import Enum
import os, json, logging, asyncio
from pathlib import Path

from jose import JWTError, jwt
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import stripe as stripe_lib

# ── Logging ─────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s"
)
logger = logging.getLogger("orbit-trio")

# ── Config ───────────────────────────────────────────────────
ARTIST_ID    = "trio-santos-cirillo-diagne"
ADMIN_EMAIL  = os.getenv("ADMIN_EMAIL",   "serignetrumpet@gmail.com")
SITE_URL     = os.getenv("SITE_URL",      "https://orbit-trio.netlify.app")
SMTP_SERVER  = os.getenv("SMTP_SERVER",   "smtp.gmail.com")
SMTP_PORT    = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER    = os.getenv("SMTP_USERNAME", "")
SMTP_PASS    = os.getenv("SMTP_PASSWORD", "")
stripe_lib.api_key     = os.getenv("STRIPE_SECRET_KEY",     "")
STRIPE_PUB_KEY         = os.getenv("STRIPE_PUBLISHABLE_KEY","")
STRIPE_WEBHOOK_SECRET  = os.getenv("STRIPE_WEBHOOK_SECRET", "")
JWT_SECRET    = os.getenv("JWT_SECRET",    "CHANGE_ME_IN_PROD")
JWT_ALGORITHM = "HS256"
ADMIN_USER    = os.getenv("ADMIN_USERNAME","admin")
ADMIN_PASS    = os.getenv("ADMIN_PASSWORD","CHANGE_ME")

DATA_DIR  = Path("data"); DATA_DIR.mkdir(exist_ok=True)
F_BOOK    = DATA_DIR / "bookings.json"
F_PERF    = DATA_DIR / "performances.json"
F_TIPS    = DATA_DIR / "tips.json"

# ── DB helpers ───────────────────────────────────────────────
def _load(f): return json.load(open(f)) if f.exists() else []
def _save(f, d):
    with open(f, "w") as fp: json.dump(d, fp, indent=2, ensure_ascii=False)
def upsert(f, rec, key="id"):
    d = _load(f); idx = next((i for i,r in enumerate(d) if r.get(key)==rec.get(key)), None)
    if idx is not None: d[idx] = rec
    else: d.append(rec)
    _save(f, d)

# ── Security ─────────────────────────────────────────────────
security = HTTPBearer(auto_error=False)

def make_token(data):
    p = {**data, "exp": datetime.utcnow() + timedelta(hours=24)}
    return jwt.encode(p, JWT_SECRET, algorithm=JWT_ALGORITHM)

def require_admin(creds: HTTPAuthorizationCredentials = Depends(security)):
    if not creds:
        raise HTTPException(401, "Auth requise")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(401, "Token invalide")
    if payload.get("role") != "admin":
        raise HTTPException(403, "Accès refusé")
    return payload

# ── Email ────────────────────────────────────────────────────
async def send_email(to: str, subject: str, html: str):
    if not SMTP_USER or not SMTP_PASS:
        logger.warning(f"📧 SMTP non configuré — email '{subject}' non envoyé")
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"ORBIT Trio Hub <{SMTP_USER}>"
    msg["To"]      = to
    msg.attach(MIMEText(html, "html", "utf-8"))
    try:
        async with aiosmtplib.SMTP(hostname=SMTP_SERVER, port=SMTP_PORT) as smtp:
            await smtp.starttls()
            await smtp.login(SMTP_USER, SMTP_PASS)
            await smtp.send_message(msg)
        logger.info(f"✅ Email envoyé → {to}")
    except Exception as e:
        logger.error(f"❌ Email failed ({to}): {e}")

def _booking_html(b):
    return f"""<html><body style="font-family:Georgia,serif;padding:32px;background:#f5f3f0;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
      <div style="background:#1a1f3a;padding:24px;text-align:center;">
        <h2 style="color:#d4af37;margin:0;letter-spacing:2px;">🎺 TRIO SCD</h2>
        <p style="color:rgba(255,255,255,.6);margin:6px 0 0;font-style:italic;font-size:13px;">
          Nouvelle demande de réservation
        </p>
      </div>
      <div style="padding:28px;">
        {''.join(f'<p style="border-bottom:1px solid #eee;padding:8px 0;margin:0;"><span style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">{k}</span><br><strong style="font-size:15px;color:#1a1f3a;">{v}</strong></p>' for k,v in [("Date",b.get("eventDate","—")),("Lieu",b.get("venue","—")),("Contact",f"{b.get('contactEmail','—')} · {b.get('contactPhone','—')}"),("Message",b.get("message","(aucun)"))])}
        <div style="text-align:center;margin-top:24px;">
          <a href="{SITE_URL}/admin" style="background:#d4af37;color:#1a1f3a;padding:12px 24px;border-radius:6px;font-weight:700;text-decoration:none;font-size:14px;">
            Gérer →
          </a>
        </div>
      </div>
      <div style="background:#f5f3f0;padding:12px;text-align:center;font-size:11px;color:#999;">
        Réf. {b.get("id","—")} · ORBIT Artist Hub
      </div>
    </div></body></html>"""

async def notify_booking(booking: dict):
    html = _booking_html(booking)
    await send_email(ADMIN_EMAIL,
        f"🎺 Nouvelle réservation — {booking.get('eventDate')} · {booking.get('venue')}", html)
    client_html = f"""<html><body style="font-family:Georgia,serif;padding:32px;color:#333;">
      <h2 style="color:#1a1f3a;">Demande bien reçue ✅</h2>
      <p>Merci pour votre intérêt pour le <strong>Trio Santos, Cirillo & Diagne</strong>.</p>
      <p>Nous vous recontactons sous <strong>48h</strong> pour votre soirée
         du <strong>{booking.get("eventDate")}</strong>.</p>
      <p style="color:#d4af37;font-style:italic;">L'émotion sur mesure. 🎺</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
      <p style="font-size:11px;color:#999;">Réf. {booking.get("id","—")}</p>
    </body></html>"""
    await send_email(booking["contactEmail"],
        "Trio Santos, Cirillo & Diagne — Demande reçue ✅", client_html)

# ── Models ───────────────────────────────────────────────────
class BookingStatus(str, Enum):
    PENDING="pending"; CONFIRMED="confirmed"; REJECTED="rejected"
    COMPLETED="completed"; CANCELLED="cancelled"

class BookingRequest(BaseModel):
    artistId:str; eventDate:str; eventType:str; venue:str
    guestCount:Optional[int]=50; message:Optional[str]=None
    contactEmail:EmailStr; contactPhone:Optional[str]=None

    @field_validator("eventDate")
    @classmethod
    def check_date(cls, v):
        d = datetime.fromisoformat(v).date()
        if d < datetime.now().date() + timedelta(days=14):
            raise ValueError("Date minimum : J+14")
        return v

class Performance(BaseModel):
    id:str; artistId:str; date:str; time:str
    venue:str; city:str; type:str; status:str="confirmed"
    bookingUrl:Optional[str]=None

class AdminLogin(BaseModel):
    username:str; password:str

class BookingUpdate(BaseModel):
    status:BookingStatus; notes:Optional[str]=None

class TipCheckout(BaseModel):
    amount:int; currency:str="eur"
    description:str="Soutien – Trio Santos, Cirillo & Diagne"
    successUrl:Optional[str]=None; cancelUrl:Optional[str]=None

# ── App ──────────────────────────────────────────────────────
app = FastAPI(title="ORBIT Trio Hub API", version="2.0.0",
              docs_url="/api/docs", openapi_url="/api/openapi.json")

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000","http://localhost:8000",
                   "https://orbit-trio.netlify.app","https://orbit-hub.netlify.app",
                   "https://orbit-allysonglado.netlify.app"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── Health ───────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    return {"status":"ok","version":"2.0.0",
            "stripe":bool(stripe_lib.api_key),"smtp":bool(SMTP_USER),
            "timestamp":datetime.now().isoformat()}

# ── Auth ─────────────────────────────────────────────────────
@app.post("/auth/login", tags=["Auth"])
async def login(creds: AdminLogin):
    if creds.username != ADMIN_USER or creds.password != ADMIN_PASS:
        raise HTTPException(401, "Identifiants incorrects")
    token = make_token({"sub": creds.username, "role": "admin"})
    logger.info(f"🔐 Login admin: {creds.username}")
    return {"access_token": token, "token_type": "bearer"}

# ── Artists ──────────────────────────────────────────────────
@app.get("/artists/{artist_id}", tags=["Artists"])
async def get_artist(artist_id: str):
    if artist_id != ARTIST_ID: raise HTTPException(404, "Introuvable")
    return {"id":ARTIST_ID,"name":"Trio Santos, Cirillo & Diagne",
            "tagline":"Chansons à la Demande – L'émotion sur mesure"}

# ── Performances ─────────────────────────────────────────────
@app.get("/performances/{artist_id}", tags=["Performances"])
async def get_performances(artist_id: str):
    return [p for p in _load(F_PERF) if p.get("artistId") == artist_id]

@app.post("/performances", tags=["Performances"], status_code=201,
          dependencies=[Depends(require_admin)])
async def create_performance(perf: Performance):
    upsert(F_PERF, perf.dict()); return perf

# ── Bookings ─────────────────────────────────────────────────
@app.post("/bookings", tags=["Bookings"], status_code=201)
async def create_booking(req: BookingRequest, bg: BackgroundTasks):
    bid = f"bk_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{req.contactEmail.split('@')[0]}"
    booking = {**req.dict(),"id":bid,"status":"pending",
               "createdAt":datetime.now().isoformat(),"updatedAt":None}
    upsert(F_BOOK, booking)
    bg.add_task(notify_booking, booking)
    logger.info(f"✅ Booking: {bid}")
    return {"id":bid,"status":"pending",
            "message":"Demande reçue ! Réponse sous 48h."}

@app.get("/bookings/{booking_id}", tags=["Bookings"])
async def get_booking(booking_id: str):
    b = next((b for b in _load(F_BOOK) if b["id"]==booking_id), None)
    if not b: raise HTTPException(404, "Introuvable")
    return b

@app.patch("/bookings/{booking_id}", tags=["Bookings"],
           dependencies=[Depends(require_admin)])
async def update_booking(booking_id:str, upd:BookingUpdate, bg:BackgroundTasks):
    b = next((b for b in _load(F_BOOK) if b["id"]==booking_id), None)
    if not b: raise HTTPException(404, "Introuvable")
    b.update({"status":upd.status.value,"updatedAt":datetime.now().isoformat()})
    if upd.notes: b["notes"] = upd.notes
    upsert(F_BOOK, b)
    if upd.status == BookingStatus.CONFIRMED:
        html = f"""<html><body style="font-family:Georgia,serif;padding:32px;">
          <h2 style="color:#1a1f3a;">🎺 Soirée confirmée !</h2>
          <p>Votre soirée du <strong>{b.get("eventDate")}</strong>
             à <strong>{b.get("venue")}</strong> est confirmée.</p>
          <p style="color:#d4af37;font-style:italic;">À très bientôt ! 🎺</p>
        </body></html>"""
        bg.add_task(send_email, b["contactEmail"],
            "Trio Santos, Cirillo & Diagne — Soirée confirmée 🎺", html)
    return b

# ── Tips ─────────────────────────────────────────────────────
@app.post("/tips/create-checkout", tags=["Tips"], status_code=201)
async def create_tip_checkout(req: TipCheckout):
    if not stripe_lib.api_key:
        raise HTTPException(503, "Stripe non configuré")
    if req.amount < 100:
        raise HTTPException(400, "Montant minimum : 1€ (100 centimes)")
    try:
        session = stripe_lib.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price_data":{
                "currency": req.currency,
                "unit_amount": req.amount,
                "product_data":{
                    "name": "Soutien – Trio Santos, Cirillo & Diagne",
                    "description": req.description,
                    "images": [f"{SITE_URL}/images/trio-og.jpg"]
                }
            },"quantity":1}],
            mode="payment",
            success_url=req.successUrl or f"{SITE_URL}?tip=success",
            cancel_url=req.cancelUrl or SITE_URL,
            metadata={"type":"tip","artist":ARTIST_ID}
        )
        logger.info(f"✅ Stripe session: {session.id} ({req.amount/100:.0f}€)")
        return {"sessionId": session.id, "url": session.url}
    except stripe_lib.error.StripeError as e:
        logger.error(f"❌ Stripe: {e}")
        raise HTTPException(502, f"Erreur Stripe: {e.user_message}")

@app.get("/tips/config", tags=["Tips"])
async def tip_config():
    return {"publishableKey": STRIPE_PUB_KEY or "NOT_CONFIGURED"}

# ── Stripe Webhook ───────────────────────────────────────────
@app.post("/webhooks/stripe", tags=["Webhooks"])
async def stripe_webhook(request: Request):
    payload    = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if not STRIPE_WEBHOOK_SECRET:
        logger.warning("⚠️ STRIPE_WEBHOOK_SECRET absent — webhook non vérifié")
        return {"received": True}

    try:
        event = stripe_lib.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except ValueError:
        raise HTTPException(400, "Payload invalide")
    except stripe_lib.error.SignatureVerificationError:
        raise HTTPException(400, "Signature invalide")

    etype = event["type"]
    data  = event["data"]["object"]
    logger.info(f"📨 Webhook Stripe: {etype}")

    if etype == "checkout.session.completed":
        if data.get("metadata", {}).get("type") == "tip":
            amount = data.get("amount_total", 0) / 100
            email  = data.get("customer_details", {}).get("email", "anonyme")
            upsert(F_TIPS, {"id":data["id"],"amount":amount,
                            "currency":data.get("currency","eur"),
                            "email":email,"createdAt":datetime.now().isoformat()})
            logger.info(f"💰 Tip: {amount}€ de {email}")
            asyncio.create_task(send_email(ADMIN_EMAIL,
                f"💰 Tip reçu : {amount:.0f}€",
                f"<p><strong>{amount:.0f}€</strong> de <em>{email}</em>. 🎺</p>"))

    return {"received": True, "type": etype}

# ── Admin ────────────────────────────────────────────────────
@app.get("/admin/stats", tags=["Admin"], dependencies=[Depends(require_admin)])
async def admin_stats():
    bk = _load(F_BOOK); tips = _load(F_TIPS)
    return {
        "bookings":{
            "total":len(bk),
            "pending":sum(1 for b in bk if b.get("status")=="pending"),
            "confirmed":sum(1 for b in bk if b.get("status")=="confirmed"),
        },
        "tips":{
            "total":len(tips),
            "amount":round(sum(t.get("amount",0) for t in tips),2)
        }
    }

@app.get("/admin/bookings", tags=["Admin"], dependencies=[Depends(require_admin)])
async def admin_bookings(status: Optional[BookingStatus] = None):
    d = _load(F_BOOK)
    if status: d = [b for b in d if b.get("status")==status.value]
    return sorted(d, key=lambda b: b.get("createdAt",""), reverse=True)

@app.get("/admin/tips", tags=["Admin"], dependencies=[Depends(require_admin)])
async def admin_tips():
    return sorted(_load(F_TIPS), key=lambda t: t.get("createdAt",""), reverse=True)

# ── Startup ──────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("🚀 ORBIT Trio Hub API v2.0")
    logger.info(f"   Stripe : {'✅' if stripe_lib.api_key else '❌ NON CONFIGURÉ'}")
    logger.info(f"   SMTP   : {'✅' if SMTP_USER else '❌ NON CONFIGURÉ'}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=os.getenv("HOST","0.0.0.0"),
                port=int(os.getenv("PORT",8000)),
                reload=os.getenv("DEBUG","false").lower()=="true")
