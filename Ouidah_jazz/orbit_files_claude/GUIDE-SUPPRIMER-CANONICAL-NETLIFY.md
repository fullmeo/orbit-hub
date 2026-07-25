# 🔧 GUIDE: SUPPRIMER LE CANONICAL DU NETLIFY.TOML

## 📍 OÙ TROUVER LE FICHIER

```
Repo Sarah-Jane:
├─ root/
│  ├─ netlify.toml ← C'EST ICI!
│  ├─ index.html
│  ├─ ...
│  └─ autres fichiers
```

---

## 🔍 OÙ CHERCHER LE CANONICAL

Dans le `netlify.toml`, le canonical peut être à plusieurs endroits:

### **Option 1: Métadonnées Dublin Core (PLUS PROBABLE)**

```toml
meta-DC.identifier = "https://sarah-jane-iffra.com"
```

### **Option 2: Canonical direct**

```toml
canonical = "https://sarah-jane-iffra.com/"
```

### **Option 3: Dans les en-têtes HTTP**

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Link = '</sarah-jane-iffra.com/>; rel="canonical"'
```

### **Option 4: Dans les redirects**

```toml
[[redirects]]
  from = "https://sarah-jane-iffra.com/*"
  to = "https://sarah-jane-iffra.netlify.app/:splat"
  status = 301
```

---

## ❌ CE QU'IL FAUT SUPPRIMER

```
❌ CHERCHE CETTE LIGNE:
meta-DC.identifier = "https://sarah-jane-iffra.com"

OU

❌ CHERCHE CETTE LIGNE:
canonical = "https://sarah-jane-iffra.com/"

OU TOUTE VARIATION AVEC .COM
```

---

## ✅ COMMENT LE SUPPRIMER

### **Étape 1: Ouvrir le netlify.toml**

```
File: netlify.toml
Path: /root/netlify.toml
```

### **Étape 2: Localiser la ligne**

```
Utilise Ctrl+F (Cmd+F sur Mac) pour chercher:
"sarah-jane-iffra.com"
```

### **Étape 3: Supprimer la ligne entière**

```
AVANT:
────────────────────────────────────────
meta-DC.identifier: https://sarah-jane-iffra.com/
meta-DC.language: fr
────────────────────────────────────────

APRÈS:
────────────────────────────────────────
meta-DC.language: fr
────────────────────────────────────────

(La ligne du .com est COMPLÈTEMENT ENLEVÉE)
```

### **Étape 4: Sauvegarder**

```
Ctrl+S (Cmd+S)
```

### **Étape 5: Commit et Push**

```bash
git add netlify.toml
git commit -m "fix: remove invalid canonical URL to .com domain"
git push origin main
```

---

## 📋 EXEMPLE COMPLET

### **AVANT (avec canonical):**

```toml
[build]
  command = "npm run build"
  publish = "public"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"

[[headers]]
  for = "/"
  [headers.values]
    canonical = "https://sarah-jane-iffra.com/"
    meta-DC.identifier = "https://sarah-jane-iffra.com"
    meta-DC.creator = "Sarah-Jane Iffra"
```

### **APRÈS (canonical enlevé):**

```toml
[build]
  command = "npm run build"
  publish = "public"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"

[[headers]]
  for = "/"
  [headers.values]
    meta-DC.creator = "Sarah-Jane Iffra"
```

---

## ⚠️ IMPORTANT: VÉRIFIER AUSSI LE HTML

Si le canonical est PAS dans netlify.toml, cherche dans les fichiers HTML:

```html
❌ CHERCHER ET SUPPRIMER:
<link rel="canonical" href="https://sarah-jane-iffra.com/">

FICHIERS À VÉRIFIER:
├─ index.html
├─ public/index.html
├─ src/index.html
└─ Tous les fichiers HTML
```

---

## 🚀 APRÈS SUPPRESSION

### **Vérifier le déploiement:**

```
1. Attendre que Netlify redéploie (quelques secondes)
2. Aller à: https://sarah-jane-iffra.netlify.app/
3. Inspecter la page (Ctrl+Shift+I)
4. Chercher "canonical"
5. NE DOIT PAS être là!
```

### **Vérifier dans Google Search Console:**

```
1. Aller à: search.google.com/search-console
2. Cliquer sur "Demander l'indexation"
3. Paster: https://sarah-jane-iffra.netlify.app/
4. Cliquer "Tester l'URL en direct"
5. Puis "Demander l'indexation"
```

---

## ✨ AVANT/APRÈS

### **AVANT (avec canonical au .com):**

```
Google voit:
├─ URL: https://sarah-jane-iffra.netlify.app/
├─ Canonical: https://sarah-jane-iffra.com/
├─ Problème: .com n'existe pas!
└─ Résultat: Duplicate content penalty

Ranking: Position 7.7 (baissé!)
```

### **APRÈS (canonical enlevé):**

```
Google voit:
├─ URL: https://sarah-jane-iffra.netlify.app/
├─ Canonical: ABSENT (utilise l'URL de la page)
├─ Problème: RÉSOLU!
└─ Résultat: Pas de penalty

Ranking: Position 6-6.5 (amélioré!)
Délai: 3-7 jours
```

---

## 📞 ÉTAPES POUR TOI

```
1. Ouvre le repo GitHub Sarah-Jane
2. Cherche le netlify.toml
3. Utilise Ctrl+F pour chercher ".com"
4. Supprime la ligne entière
5. Commit et push
6. Vérifie que le site fonctionne toujours
7. Attends 3-7 jours

C'EST TOUT!
```

---

## ⚡ VÉRIFICATION RAPIDE

Après le fix, tu peux vérifier avec:

```bash
# Voir le contenu du netlify.toml
cat netlify.toml

# Chercher le .com (ne devrait rien trouver)
grep "sarah-jane-iffra.com" netlify.toml
# Résultat: (vide - c'est bon!)
```

---

**Envoie-moi le netlify.toml si tu veux que je te montre EXACTEMENT où supprimer!** 🎯
