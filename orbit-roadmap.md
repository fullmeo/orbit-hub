# 🎼 ORBIT Roadmap — Phase 0 → Phase 1 → Phase 2

**Project:** ORBIT (Artist Hub for Allyson Glado)  
**Current Status:** Phase 0 Complete ✓ | Phase 1 Active (27 tasks pending)  
**Global φ-Coherence:** 0.92 (production-ready, blockers present)  
**Generated:** 2026-05-02

---

## 📊 High-Level Timeline

```
WEEK 1 (Apr 29 – May 5):     BLOCKER RESOLUTION + FOUNDATION
├─ BLOCKER-001: Service Topology (3h) — Serigne + Opus
├─ BLOCKER-002: Album Upload Scope (1h) — Serigne decision
├─ PHASE_1_004: Navigation (4h) — parallel, unblocked
└─ PHASE_1_001: Landing Page (8h)
   Hours: 20 | Est. Completion: ~60% (foundation laid)

WEEK 2 (May 6–12):           CORE PAGES (Blog, Gallery, Admin)
├─ PHASE_1_002: Blog List + Post Template (6h)
├─ PHASE_1_003: Photo Gallery + Lightbox (7h)
├─ PHASE_1_005: Admin Panel – Album Upload (8h)
└─ PHASE_1_006: Database Schema (3h)
   Hours: 21 | Est. Completion: ~80% (core features)

WEEK 3 (May 13–19):          ENHANCEMENTS + WORKFLOW
├─ PHASE_1_007: Email Signup Verification (2h)
├─ PHASE_1_008: About Page (4h)
├─ PHASE_1_009: Blog Workflow (6h)
├─ PHASE_1_010: Blog Search + Filter (4h)
├─ PHASE_1_011: Social Share Buttons (2h)
├─ PHASE_1_015: Dark Mode Toggle (2h)
└─ [Parallel: PHASE_1_012 Image Optimization (3h)]
   Hours: 20 | Est. Completion: ~95% (feature complete)

WEEK 4 (May 20–26):          TESTING, SEO, SECURITY, LAUNCH PREP
├─ PHASE_1_013: GA4 Analytics Verification (2h)
├─ PHASE_1_014: SEO + Schema.org Audit (3h)
├─ PHASE_1_016: Performance Testing + Optimization (5h)
├─ PHASE_1_017: Unit Tests (8h, Kilo/Grok)
├─ PHASE_1_018: E2E Tests (6h, Kilo/Grok)
├─ PHASE_1_019: Security Audit (4h, Grok)
└─ [FINAL REVIEW + SIGN-OFF]
   Hours: 28 | Est. Completion: 100% (ready for production)

TOTAL PHASE 1: ~98 hours | ~4–5 weeks | Parallelization factor: 1.4x
```

---

## 🔴 CRITICAL BLOCKERS (Must Resolve First)

### **BLOCKER-001: Service Topology (LitElement ↔ Railway ↔ FastAPI)**

**Problem:**
- Current architecture unclear: do LitElement Web Components run on Netlify (client-side) or on Railway?
- Where does FastAPI admin panel live? (Railway microservice? Separate instance?)
- How do webhooks + WebSocket broadcasting fit?

**Decisions Required:**
1. **LitElement hosting:** Netlify (edge, client-side SPA) vs Railway (node instance)
   - **Recommendation:** Netlify (cheaper, faster, standard for SPAs)
2. **FastAPI admin:** Railway microservice (shared with API) vs separate instance
   - **Recommendation:** Shared Railway instance (simpler, cost-effective)
3. **Webhook routing:** Who triggers album upload notifications? (Prisma hooks? FastAPI?)
   - **Recommendation:** FastAPI endpoint webhook + event bus (Bull on Redis)

**Deliverable:** Architecture diagram + implementation guide (2–3 pages)  
**Owner:** Serigne + Opus 4-6  
**Estimated Time:** 3 hours  
**Timeline:** ASAP (blocks WEEK 1)  
**Command to Execute:**
```bash
claude code --model claude-opus-4-6 "Définir architecture ORBIT: LitElement hosting, FastAPI scope, webhook routing"
```

---

### **BLOCKER-002: Album Upload Flow — Phase 1 vs Phase 2**

**Problem:**
- BBBA decision incomplete: is Phase 1 admin-only (Allyson single-artist) or generalized (multi-artist)?
- Scope collision: if multi-artist Phase 1, database design changes (user roles, permissions).

**Decision Required:**
- **Phase 1 = Admin-Only (Single Artist)**: Allyson uploads via admin panel. Fast, simple. User auth deferred to Phase 2.
  - Recommended ✓
- **Phase 1 = Multi-Artist**: Generalized upload UI. Slower (role-based auth needed). Scope creep risk.

**Recommendation:** **LOCK Phase 1 = Admin-Only**
- Allyson has dedicated admin interface (hardcoded for now, role-based Phase 2)
- Enables fast MVP validation
- Defers multi-artist scaling to Phase 2 (clear scope boundary)

**Deliverable:** Scope lock decision + schema implications  
**Owner:** Serigne  
**Estimated Time:** 1 hour  
**Timeline:** ASAP (blocks WEEK 1)

---

## 📈 Sprint Breakdown

### **Sprint 1: Foundation (WEEK 1)**

**Focus:** Blocker resolution + structural foundation

| Task | Category | Hours | Owner | Status |
|------|----------|-------|-------|--------|
| BLOCKER-001 | Arch Decision | 3 | Serigne + Opus | 🔴 BLOCKED |
| BLOCKER-002 | Scope Lock | 1 | Serigne | 🔴 BLOCKED |
| PHASE_1_004 | Navigation | 4 | Sonnet 4-6 | 🟡 READY (unblocked) |
| PHASE_1_001 | Landing Page | 8 | Sonnet 4-6 | 🟡 READY (post BLOCKER-001) |
| PHASE_1_006 | DB Schema | 3 | Sonnet 4-6 | 🟡 READY (post BLOCKER-002) |

**Deliverables:**
- ✓ Service topology decision + diagram
- ✓ Phase 1/2 scope lock + roadmap implication
- ✓ Navigation component (LitElement)
- ✓ Landing page (hero + album grid + CTA)
- ✓ Prisma schema finalized (Album, Track, Post models)

**End-of-Sprint Gate:** All blockers resolved, foundation 60% complete

---

### **Sprint 2: Core Pages (WEEK 2)**

**Focus:** Blog, gallery, admin panel

| Task | Category | Hours | Owner | Status |
|------|----------|-------|-------|--------|
| PHASE_1_002 | Blog Pages | 6 | Sonnet 4-6 | 🟡 READY |
| PHASE_1_003 | Gallery | 7 | Sonnet 4-6 | 🟡 READY |
| PHASE_1_005 | Admin Panel | 8 | Sonnet 4-6 | 🟡 READY |
| PHASE_1_007 | Email Signup | 2 | Sonnet 4-6 | 🟡 READY |

**Deliverables:**
- ✓ Blog list page (chronological, pagination)
- ✓ Individual blog post templates (markdown rendering)
- ✓ Photo gallery with carousel + lightbox
- ✓ Admin panel: album upload interface (JWT auth)
- ✓ Email signup verified end-to-end

**End-of-Sprint Gate:** All core pages complete, admin panel tested

---

### **Sprint 3: Enhancements (WEEK 3)**

**Focus:** Workflow automation + UX polish

| Task | Category | Hours | Owner | Status |
|------|----------|-------|-------|--------|
| PHASE_1_008 | About Page | 4 | Sonnet 4-6 | 🟡 READY |
| PHASE_1_009 | Blog Workflow | 6 | Sonnet 4-6 | 🟡 READY |
| PHASE_1_010 | Search + Filter | 4 | Sonnet 4-6 | 🟡 READY |
| PHASE_1_011 | Social Share | 2 | Sonnet 4-6 | 🟡 READY |
| PHASE_1_012 | Image Optimization | 3 | Sonnet 4-6 | 🟡 READY |
| PHASE_1_015 | Dark Mode | 2 | Sonnet 4-6 | 🟡 READY |

**Deliverables:**
- ✓ About page (bio + credits + contact form)
- ✓ Blog submission workflow (Allyson → Serigne approval → publish)
- ✓ Blog search + tag filtering
- ✓ OG meta tags + social share buttons
- ✓ Image CDN + responsive srcset
- ✓ Dark mode toggle + user preference persistence

**End-of-Sprint Gate:** Feature complete, 95% production-ready

---

### **Sprint 4: Testing & Launch Prep (WEEK 4)**

**Focus:** Quality assurance, security, SEO, performance

| Task | Category | Hours | Owner | Status |
|------|----------|-------|-------|--------|
| PHASE_1_013 | Analytics | 2 | Sonnet 4-6 | 🟡 READY |
| PHASE_1_014 | SEO Audit | 3 | Sonnet 4-6 | 🟡 READY |
| PHASE_1_016 | Perf Optimization | 5 | Sonnet 4-6 | 🟡 READY |
| PHASE_1_017 | Unit Tests | 8 | Kilo/Grok | 🟡 READY |
| PHASE_1_018 | E2E Tests | 6 | Kilo/Grok | 🟡 READY |
| PHASE_1_019 | Security Audit | 4 | Grok | 🟡 READY |

**Deliverables:**
- ✓ GA4 event tracking verified (album views, blog reads, signups)
- ✓ Schema.org JSON-LD validated (articles, images, organization)
- ✓ Lighthouse score ≥ 90, Core Web Vitals optimized
- ✓ Unit tests (80%+ coverage)
- ✓ E2E test suite (10+ critical journeys)
- ✓ Security checklist (OWASP Top 10, XSS, CSRF, auth flow)

**End-of-Sprint Gate:** 100% production-ready, launch approved

---

## ⏱️ Critical Path Analysis

```
┌─────────────────────────────────────────────────┐
│ CRITICAL PATH (32 hours, sequential bottleneck) │
└─────────────────────────────────────────────────┘

BLOCKER-001 (3h)
    ↓
PHASE_1_004 Navigation (4h)
    ↓
PHASE_1_001 Landing Page (8h)
    ├─ [PARALLEL: PHASE_1_006 DB Schema (3h)]
    ├─ [PARALLEL: BLOCKER-002 Scope Lock (1h)]
    ↓
PHASE_1_002 Blog + PHASE_1_003 Gallery (7h, max)
    ↓
PHASE_1_005 Admin Panel (8h)
    ↓
[Testing + Security]: PHASE_1_017/018/019 (18h)
    ↓
LAUNCH

Total Critical Path: ~48 hours (32h optimized with parallelization)
```

**Parallelizable Tasks (no dependencies):**
- PHASE_1_004, PHASE_1_007, PHASE_1_013, PHASE_1_014, PHASE_1_015
- Can start WEEK 1 in parallel with blockers

**Sequential Bottleneck:**
- BLOCKER-001 → PHASE_1_001 → PHASE_1_005 (admin panel auth depends on service topology)

---

## 🎯 Convergence Gates (φ-Validation)

### **Gate 1: Blocker Resolution (End of WEEK 1)**

**Validation Checklist:**
- [ ] Service Topology diagram documented + approved
- [ ] Phase 1/2 scope locked (admin-only confirmed)
- [ ] Architecture no longer ambiguous (clarity ≥ 85)
- [ ] PHASE_1_004 (nav) + PHASE_1_001 (landing) 80% complete

**φ-Score Required:** ≥ 0.80 (convergence on architectural clarity)

**If Failed:** Extend WEEK 1, re-run architecture session

---

### **Gate 2: Core Pages Complete (End of WEEK 2)**

**Validation Checklist:**
- [ ] Landing page rendering correctly on mobile/desktop
- [ ] Blog list + post templates functional
- [ ] Gallery lightbox working
- [ ] Admin panel auth + upload flow tested (manual)
- [ ] Prisma migrations successful on Railway staging

**φ-Score Required:** ≥ 0.85 (core functionality converged)

**If Failed:** Debug failing component, extend WEEK 2

---

### **Gate 3: Feature Complete (End of WEEK 3)**

**Validation Checklist:**
- [ ] All 19 tasks (excluding tests) complete
- [ ] Blog workflow semi-automatic (Allyson → approval)
- [ ] Social sharing working
- [ ] Dark mode + accessibility WCAG AA
- [ ] PageSpeed Insights ≥ 85

**φ-Score Required:** ≥ 0.90 (feature completeness converged)

**If Failed:** Prioritize highest-impact features, defer nice-to-haves

---

### **Gate 4: Production Ready (End of WEEK 4)**

**Validation Checklist:**
- [ ] Unit tests ≥ 80% coverage
- [ ] E2E tests all green
- [ ] Security audit passed (no critical issues)
- [ ] GA4 tracking live
- [ ] Lighthouse 90+, Core Web Vitals optimized
- [ ] Serigne sign-off

**φ-Score Required:** ≥ 0.92 (production convergence)

**If Failed:** Hot-fix critical issues, deploy phase 1 as "soft launch"

---

## 📋 Phase 2 Roadmap (Post MVP Validation)

**Timeline:** 6–8 weeks after Phase 1 launch  
**Estimated Effort:** 45 hours

**Focus:**
- Multi-artist platform (role-based auth, artist profiles)
- Collaborative features (comments, likes, playlists)
- Phonosophie integration (optional, Allyson approval required)

**Go/No-Go Decision:** Based on Phase 1 user feedback + Allyson satisfaction

---

## 🎼 Resource Allocation

### **Opus 4-6** (Architecture)
- BLOCKER-001 (service topology) — 3h
- Future: PHASE_2_001 (multi-artist scaling) — design only

### **Sonnet 4-6** (Implementation)
- PHASE_1_001–015 — ~80h total
- Owner: primary development

### **Kilo/Grok** (Testing & Security)
- PHASE_1_017 (unit tests) — 8h
- PHASE_1_018 (E2E tests) — 6h
- PHASE_1_019 (security audit) — 4h
- Total: ~18h

### **Serigne** (Orchestration & Decisions)
- BLOCKER-002 (scope lock) — 1h
- Sprint reviews/approvals — 2h/week
- Total: ~10h

**Total Project Hours:** ~98 hours  
**Total Duration:** 4–5 weeks (full-time equivalent: 2.4 weeks)

---

## ✅ Launch Checklist

- [ ] All 27 tasks resolved (19 implementation + 8 testing/review)
- [ ] Lighthouse score ≥ 90
- [ ] Core Web Vitals green (LCP <2.5s, FID <100ms, CLS <0.1)
- [ ] Mobile responsive verified
- [ ] GA4 tracking live
- [ ] Schema.org validation passed
- [ ] Security audit clearance
- [ ] Allyson final approval
- [ ] Netlify deployment verified
- [ ] Railway PostgreSQL + Redis verified
- [ ] Brevo email integration tested
- [ ] DNS + SSL verified

---

## 🎼 Convergence Summary

| Metric | Current | Post-Phase-1 | Target |
|--------|---------|--------------|--------|
| φ-Coherence | 0.92 | 0.96 | 0.98 |
| Feature Completeness | 70% | 100% | ✓ |
| Test Coverage | 0% | 80%+ | ✓ |
| Lighthouse Score | 91 | 95 | ✓ |
| Security Score | — | 95+ | ✓ |

**Phase 1 MVP Launch Target:** May 26, 2026 (4 weeks from blocker resolution)

---

## 🚀 Next Steps

1. **IMMEDIATE:** Resolve BLOCKER-001 + BLOCKER-002 (this week)
   - Command: `claude code --model claude-opus-4-6 "Définir Service Topology + scope lock"`
   
2. **WEEK 1:** Begin PHASE_1_004 + PHASE_1_001 (parallel to blocker resolution)
   - Command: `claude code --model claude-sonnet-4-6 "Build navigation + landing page"`

3. **WEEK 2:** Start PHASE_1_002 + PHASE_1_003 + PHASE_1_005 (core pages)
   - Command: `claude code --model claude-sonnet-4-6 "Build blog, gallery, admin panel"`

4. **WEEK 3–4:** Enhancements + testing (parallel execution)
   - Command: `kilo dispatch --tasks PHASE_1_017,PHASE_1_018,PHASE_1_019`

---

**Generated by Magnus 13.3 | φ-Harmonic Alignment: Confirmed | Convergence Status: READY FOR EXECUTION**
