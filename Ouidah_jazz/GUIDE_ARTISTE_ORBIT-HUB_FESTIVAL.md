# 🎸 Guide Artiste – Orbit-hub Festival Ouidah 2026

**Processus « Artiste Orbit-hub »**  
*Votre hub digital professionnel offert dans le cadre du Festival Ouidah Blues, Jazz & Gospel*

---

## Vision claire (pour éviter toute confusion)

- **Le Festival** (Ouidah Blues, Jazz & Gospel Festival) = Le site officiel de l’événement, propulsé par Orbit-hub.
- **Orbit-hub** = La plateforme digitale indépendante (template) qui permet de créer des hubs artistes professionnels.
- **Orbit-hub Artiste** = **Votre mini-site personnel professionnel** (créé avec le template Orbit-hub).  
  Il vous appartient à 100 %. Il centralise vos liens streaming, bio, musique et contacts.

**Avantage exclusif** : Les artistes sélectionnés reçoivent **gratuitement** leur Orbit-hub personnel (mini-site pro), avec un lien vers le site du festival. Le festival utilise Orbit-hub comme solution technique pour offrir une vraie valeur ajoutée à ses artistes.

---

## Processus en 4 étapes simples

### Étape 1 : Sélection
- Vous postulez via le formulaire sur le site du festival.
- Si vous êtes sélectionné, vous recevez un email de confirmation + accès au template.

### Étape 2 : Réception du Template
- Fork du repository officiel : [github.com/fullmeo/orbit-hub](https://github.com/fullmeo/orbit-hub)
- Ou nous vous fournissons une version déjà préparée avec le branding festival.

### Étape 3 : Personnalisation rapide (30–60 minutes)

**Choses à modifier obligatoirement :**

| Fichier          | Que changer ?                              | Exemple |
|------------------|--------------------------------------------|---------|
| `index.html`     | Nom, genre, photo hero, bio courte         | "Togbé Adjos – Blues & Vodun Jazz" |
| `about.html`     | Biographie complète + influences           | Votre parcours + lien avec Ouidah |
| `music.html`     | Albums, tracklists, liens Spotify/YouTube  | Remplacez les exemples |
| `connect.html`   | Contacts, réseaux sociaux, formulaire      | Vos vrais liens |
| Footer           | Copyright + liens vers le festival         | © 2026 Votre Nom • Artiste du Festival Ouidah 2026 |

**Éléments festival à intégrer (recommandé) :**
- Ajouter un bandeau ou section « Artiste du Ouidah Blues, Jazz & Gospel Festival 2026 »
- Lien vers le site du festival dans le menu ou footer
- Hashtag officiel : `#OuidahVibration2026`

### Intégration Réseaux Sociaux (fortement recommandé)

Dans ton Orbit-hub personnel, assure-toi d’avoir des liens clairs et visibles vers tes réseaux sociaux.

**Plateformes prioritaires :**
- Instagram (priorité n°1 pour les visuels et Reels)
- Facebook
- YouTube
- TikTok (si tu publies du contenu court)
- Spotify / Apple Music (déjà géré dans la section musique)

**Conseils :**
- Utilise des icônes claires (le template Orbit-hub inclut déjà Font Awesome)
- Le tracking des clics est automatique grâce à GA4
- Regroupe tous tes liens dans la page `connect.html`
- Ajoute un lien vers ton Orbit-hub dans ta bio Instagram et Facebook

Exemple simple à ajouter :
```html
<div class="flex gap-4 text-2xl">
  <a href="https://instagram.com/toncompte"><i class="fa-brands fa-instagram"></i></a>
  <a href="https://facebook.com/toncompte"><i class="fa-brands fa-facebook"></i></a>
  <a href="https://youtube.com/toncompte"><i class="fa-brands fa-youtube"></i></a>
</div>
```

### Étape 4 : Déploiement
- Déployez gratuitement sur **Netlify** (recommandé) ou GitHub Pages.
- Envoyez-nous le lien de votre Orbit-hub.
- Nous l’ajoutons sur la page « Nos Artistes » du site festival.

---

## Modèle de Footer recommandé (copier-coller)

```html
<footer>
    <p>&copy; 2026 [Votre Nom]. Tous droits réservés.</p>
    <p>
        Artiste sélectionné du <a href="https://votre-site-festival.com">Ouidah Blues, Jazz & Gospel Festival 2026</a>
    </p>
    <p>
        <a href="terms.html">Conditions</a> • 
        <a href="privacy.html">Confidentialité</a>
    </p>
</footer>
```

---

## Ce que vous gagnez

- Un site professionnel et moderne (design prêt à l’emploi)
- Tracking analytics (GA4) pour mesurer votre impact
- Capture d’emails (Brevo)
- SEO optimisé
- Preuve de professionnalisme pour votre carrière
- Visibilité via la page « Nos Artistes » du festival
- Lien permanent entre votre hub et le festival

---

## Support

- Questions techniques → GitHub Issues du repo Orbit-hub
- Personnalisation avancée ou aide au déploiement → Contactez l’organisation du festival
- Email : Adjos67@gmail.com

---

**Bienvenue dans l’écosystème Orbit-hub du Festival Ouidah !**  
Votre présence digitale commence ici.

*Document mis à jour le 16 mai 2026*