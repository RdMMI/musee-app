# Scan Musée — Guide de démarrage

## Structure du projet

```
musee-app/
├── api/
│   └── identify.js       <- fonction serverless (appel Gemini)
├── public/
│   ├── index.html         <- page principale
│   ├── style.css
│   ├── app.js              <- logique (caméra, scan, localStorage)
│   └── data/
│       └── artworks.js     <- TES infos sur les œuvres (à remplir)
├── package.json
└── vercel.json
```

## 1. Remplir tes œuvres

Ouvre `public/data/artworks.js` et complète/ajoute tes musées et œuvres.
Chaque œuvre doit avoir un `id` unique sans espaces (ex: `joconde`,
`venus_de_milo`). C'est cet id que Gemini renverra pour identifier l'œuvre.

## 2. Obtenir une clé API Gemini (gratuite)

1. Va sur https://aistudio.google.com/app/apikey
2. Connecte-toi avec un compte Google
3. Clique sur "Create API Key"
4. Copie la clé (tu en auras besoin à l'étape 4)

## 3. Déployer sur Vercel (gratuit, sans rien télécharger)

1. Crée un compte sur https://vercel.com (tu peux te connecter avec GitHub)
2. Mets ce dossier `musee-app/` dans un repo GitHub (créer un repo, push)
3. Sur Vercel : "Add New Project" → importe ton repo GitHub
4. Vercel détecte automatiquement la config (grâce à `vercel.json`)

## 4. Ajouter la clé API (variable d'environnement)

Sur Vercel, dans les paramètres du projet :
- Va dans "Settings" → "Environment Variables"
- Ajoute :
  - Nom : `GEMINI_API_KEY`
  - Valeur : (ta clé copiée à l'étape 2)
- Redéploie le projet (bouton "Redeploy")

## 5. C'est en ligne !

Vercel te donne une URL du type `https://musee-app-xxxx.vercel.app`.
Ouvre-la sur ton téléphone, autorise l'accès caméra, et scanne une œuvre !

À chaque modification du code (ex: ajout d'œuvres dans `artworks.js`),
push sur GitHub → Vercel redéploie automatiquement.

## Notes importantes

- La progression est stockée dans `localStorage` du navigateur (pas des
  cookies). Cela reste sur l'appareil de l'utilisateur, propre à chaque
  navigateur/appareil. Si l'utilisateur change de téléphone ou vide son
  cache, la progression est perdue (normal pour une v1).
- Le tier gratuit de Gemini est largement suffisant pour tester et pour
  un usage modéré.
- Tu peux tester en local avec `vercel dev` si tu installes l'outil Vercel
  CLI plus tard, mais ce n'est pas obligatoire pour déployer.
