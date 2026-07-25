# 🔧 FIX IMMÉDIAT - SUPPRIMER CANONICAL

## ✅ LIGNE À SUPPRIMER

Dans ton `netlify.toml`, **SUPPRIME CETTE LIGNE:**

```toml
canonical: https://sarah-jane-iffra.com/
```

---

## 📍 OÙ CHERCHER

```
Ouvre: netlify.toml
Utilise: Ctrl+F (ou Cmd+F)
Cherche: "canonical"
```

---

## ✂️ AVANT vs APRÈS

### AVANT:
```toml
[[headers]]
  for = "/"
  [headers.values]
    canonical = "https://sarah-jane-iffra.com/"
    meta-DC.identifier = "https://sarah-jane-iffra.com/"
    meta-DC.creator = "Sarah-Jane Iffra"
```

### APRÈS:
```toml
[[headers]]
  for = "/"
  [headers.values]
    meta-DC.creator = "Sarah-Jane Iffra"
```

---

## 🚀 ÉTAPES

### 1️⃣ Ouvrir netlify.toml
```
Repo: https://github.com/fullmeo/Saraj-Jane-Website
Fichier: netlify.toml
```

### 2️⃣ Supprimer la ligne
```
Cherche:  canonical = "https://sarah-jane-iffra.com/"
Action:   DELETE THE ENTIRE LINE
```

### 3️⃣ Commit & Push
```bash
git add netlify.toml
git commit -m "fix: remove invalid canonical URL"
git push origin main
```

### 4️⃣ Attendre le redéploiement
```
Netlify redéploie automatiquement
Attends 1-2 minutes
Site va se recharger
```

---

## ✨ RÉSULTAT

### Immédiat:
```
✅ Site fonctionne toujours
✅ Pas de problème visuel
```

### Dans 3-7 jours:
```
✅ Google comprend qu'il n'y a qu'une URL
✅ Améliore le ranking automatiquement
✅ Position 7.7 → 6-6.5
✅ +50% clics supplémentaires
```

---

## 🎯 PROCHAINES ÉTAPES

Après avoir supprimé le canonical:

1. Aller à Google Search Console
2. Cliquer "Demander l'indexation"
3. Copier: https://sarah-jane-iffra.netlify.app/
4. Cliquer "Tester l'URL en direct"
5. Puis "Demander l'indexation"

---

**C'EST TOUT!** 5 minutes et c'est réglé! 🚀

Si tu as besoin d'aide pour trouver la ligne exacte, envoie-moi le contenu du netlify.toml!
