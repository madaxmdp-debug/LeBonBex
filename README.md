# 📢 AnnoncesPro — Petites annonces internes

Site de petites annonces entre collègues, style Leboncoin.  
Stack : HTML/CSS/JS + Tailwind CSS + Firebase (Firestore + Storage) + GitHub Pages.

---

## 📁 Structure des fichiers

```
annonces/
├── index.html      → Page d'accueil (liste des annonces)
├── publier.html    → Formulaire de publication
├── annonce.html    → Page de détail d'une annonce
├── style.css       → Styles complémentaires
├── app.js          → Logique Firebase + UI
└── README.md       → Ce fichier
```

---

## 🔥 Étape 1 — Créer un projet Firebase

1. Rendez-vous sur **https://console.firebase.google.com/**
2. Cliquez sur **"Ajouter un projet"**
3. Donnez un nom (ex: `annonces-pro`), désactivez Google Analytics si vous voulez, puis **Créer le projet**

---

## 🗄️ Étape 2 — Activer Firestore

1. Dans la console Firebase → menu gauche → **"Firestore Database"**
2. Cliquez **"Créer une base de données"**
3. Choisissez **"Démarrer en mode test"** (règles ouvertes pendant 30 jours)
4. Sélectionnez une région (ex: `eur3` pour l'Europe)
5. Cliquez **"Activer"**

### Règles Firestore recommandées (production)
Dans l'onglet **Règles** de Firestore, collez :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /annonces/{doc} {
      allow read: if true;
      allow write: if true;  // Adaptez si vous voulez une auth
    }
  }
}
```

---

## 🖼️ Étape 3 — Activer Firebase Storage

1. Dans le menu gauche → **"Storage"**
2. Cliquez **"Commencer"**
3. Sélectionnez **"Mode test"**
4. Choisissez la même région que Firestore
5. Cliquez **"Suivant"** puis **"Terminer"**

### Règles Storage recommandées
Dans l'onglet **Règles** de Storage :

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /annonces/{allPaths=**} {
      allow read: if true;
      allow write: if request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## ⚙️ Étape 4 — Récupérer la configuration Firebase

1. Dans la console Firebase → ⚙️ **Paramètres du projet**
2. Descendez jusqu'à **"Vos applications"**
3. Cliquez sur l'icône **`</>`** pour créer une application Web
4. Donnez un nom (ex: `annonces-web`), cliquez **"Enregistrer"**
5. Copiez l'objet `firebaseConfig` qui s'affiche

---

## 📝 Étape 5 — Coller la config dans app.js

Ouvrez `app.js` et remplacez le bloc `firebaseConfig` par vos vraies valeurs :

```javascript
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "mon-projet.firebaseapp.com",
  projectId:         "mon-projet",
  storageBucket:     "mon-projet.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};
```

---

## 🚀 Étape 6 — Déployer sur GitHub Pages

### Option A — Via l'interface GitHub (le plus simple)

1. Créez un nouveau dépôt sur **https://github.com** (ex: `annonces-pro`)
2. Uploadez tous vos fichiers (`index.html`, `publier.html`, `annonce.html`, `style.css`, `app.js`)
3. Allez dans **Settings → Pages**
4. Sous **Source**, choisissez `Deploy from a branch`
5. Sélectionnez la branche `main`, dossier `/ (root)`
6. Cliquez **Save**
7. Votre site est disponible à l'URL : `https://VOTRE_USERNAME.github.io/annonces-pro/`

### Option B — Via Git en ligne de commande

```bash
git init
git add .
git commit -m "Initial commit - AnnoncesPro"
git remote add origin https://github.com/VOTRE_USERNAME/annonces-pro.git
git push -u origin main
```

Puis activez GitHub Pages depuis les Settings (cf. Option A, étape 3).

---

## 🔐 Étape 7 — Autoriser votre domaine dans Firebase

1. Console Firebase → **Authentication → Paramètres → Domaines autorisés**
2. Ajoutez : `VOTRE_USERNAME.github.io`

---

## ✅ Test rapide

1. Ouvrez `https://VOTRE_USERNAME.github.io/annonces-pro/`
2. Cliquez **"Publier une annonce"**
3. Remplissez le formulaire et ajoutez une photo
4. L'annonce doit apparaître sur la page d'accueil

---

## 🛠️ Personnalisation

| Besoin | Fichier | Section |
|---|---|---|
| Changer les catégories | `publier.html` | `<select id="categorie">` |
| Modifier les couleurs | `index.html` | `tailwind.config` → `colors` |
| Changer le nom du site | `index.html` | Balise `<title>` + logo |
| Ajouter des champs | `publier.html` + `app.js` | Formulaire + `addDoc` |

---

## ⚠️ Limites du plan gratuit Firebase (Spark)

| Ressource | Limite gratuite |
|---|---|
| Lectures Firestore | 50 000 / jour |
| Écritures Firestore | 20 000 / jour |
| Storage | 1 Go stockage, 10 Go/mois transfert |
| Hosting | Non utilisé (GitHub Pages à la place) |

Largement suffisant pour un usage interne entre collègues ! 🎉
