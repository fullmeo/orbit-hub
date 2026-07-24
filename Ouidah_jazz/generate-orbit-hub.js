const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// === CONFIGURATION ===
const TEMPLATE_PATH = '.';
const OUTPUT_BASE = '../generated-hubs';

const argv = yargs(hideBin(process.argv))
  .option('nom', { type: 'string' })
  .option('slug', { type: 'string' })
  .option('genre', { type: 'string' })
  .option('data', { type: 'string', default: './artist-data.json' })
  .argv;

async function loadArtistData() {
  let data;

  // Priorité 1 : Arguments en ligne de commande
  if (argv.nom && argv.slug) {
    data = {
      nom: argv.nom,
      slug: argv.slug,
      genre: argv.genre || "Blues • Jazz • Gospel",
      bioCourte: "Artiste sélectionné pour le Ouidah Blues, Jazz & Gospel Festival 2026.",
      bioComplete: "Artiste talentueux participant à l'édition 2026 du festival à Ouidah.",
      spotify: "",
      instagram: "",
      youtube: "",
      facebook: ""
    };
  } 
  // Priorité 2 : Fichier JSON
  else if (fs.existsSync(argv.data)) {
    data = await fs.readJson(argv.data);
  } else {
    throw new Error("Aucune donnée fournie. Utilise --nom --slug ou un fichier artist-data.json");
  }

  return {
    nom: data.nom,
    slug: data.slug || data.nom.toLowerCase().replace(/\s+/g, '-'),
    genre: data.genre || "Musicien",
    bioCourte: data.bioCourte,
    bioComplete: data.bioComplete,
    spotify: data.spotify || "",
    appleMusic: data.appleMusic || "",
    youtube: data.youtube || "",
    instagram: data.instagram || "",
    facebook: data.facebook || "",
    photo: `${data.slug}.jpg`
  };
}

async function generateSchema(artist) {
  return `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MusicGroup",
  "name": "${artist.nom}",
  "genre": "${artist.genre}",
  "url": "https://${artist.slug}-orbit-hub.netlify.app",
  "description": "${artist.bioCourte}",
  "image": "https://${artist.slug}-orbit-hub.netlify.app/assets/images/${artist.photo}",
  "sameAs": [
    "${artist.spotify}",
    "${artist.instagram}",
    "${artist.youtube}"
  ]
}
</script>`;
}

async function main() {
  const artist = await loadArtistData();
  const outputPath = path.join(OUTPUT_BASE, `${artist.slug}-orbit-hub`);

  console.log(`🚀 Génération Orbit-hub pour : ${artist.nom}`);
  console.log(`📁 Dossier : ${outputPath}`);

  // Copier le template
  await fs.copy(TEMPLATE_PATH, outputPath, {
    filter: src => !src.includes('node_modules') && !src.includes('.git') && !src.includes('generated-hubs')
  });

  // Mise à jour des fichiers
  const files = ['index.html', 'about.html', 'music.html', 'connect.html'];
  for (const file of files) {
    const filePath = path.join(outputPath, file);
    if (await fs.pathExists(filePath)) {
      let content = await fs.readFile(filePath, 'utf8');

      content = content
        .replace(/\[Artist Name\]/g, artist.nom)
        .replace(/\[Nom de l'Artiste\]/g, artist.nom)
        .replace(/reggae-pop|Blues & Jazz/g, artist.genre)
        .replace(/\[Short bio.*?\]/g, artist.bioCourte)
        .replace(/\[Courte description.*?\]/g, artist.bioCourte);

      // Liens sociaux
      if (artist.instagram) content = content.replace(/https:\/\/instagram\.com\/[^"'\s]+/g, artist.instagram);
      if (artist.spotify) content = content.replace(/https:\/\/open\.spotify\.com\/artist\/[^"'\s]+/g, artist.spotify);
      if (artist.youtube) content = content.replace(/https:\/\/youtube\.com\/[^"'\s]+/g, artist.youtube);

      await fs.writeFile(filePath, content, 'utf8');
    }
  }

  // Ajouter Schema.org
  const indexPath = path.join(outputPath, 'index.html');
  if (await fs.pathExists(indexPath)) {
    let content = await fs.readFile(indexPath, 'utf8');
    const schema = await generateSchema(artist);
    content = content.replace('</head>', `${schema}\n</head>`);
    await fs.writeFile(indexPath, content, 'utf8');
  }

  console.log(`✅ Orbit-hub généré avec succès !`);

  // Push GitHub + Déploiement Netlify (optionnel)
  if (argv.push) {
    console.log("📤 Push vers GitHub + déploiement Netlify...");
    // (À compléter selon tes identifiants)
  }

  console.log(`\n🎉 Terminé ! Dossier : ${outputPath}`);
}

main().catch(console.error);