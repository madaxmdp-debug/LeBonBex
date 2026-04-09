// ===================================================
//  AnnoncesPro — app.js
//  Logique Firebase + UI pour toutes les pages
// ===================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, getDoc,
  doc, deleteDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
//import {
 // getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject
//} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ===================================================
//  🔥 CONFIGURATION FIREBASE
// ===================================================
const firebaseConfig = {
  apiKey: "AIzaSyAMErS6CHeHe5DFzp2_PxndSkhc_mVnKq0",
  authDomain: "lebonbex.firebaseapp.com",
  projectId: "lebonbex",
  storageBucket: "lebonbex.firebasestorage.app",
  messagingSenderId: "500510716597",
  appId: "1:500510716597:web:1b2977546bfb5741a084fc",
  measurementId: "G-KVYJXTQY9H"
};

// Initialisation Firebase
const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);
//const storage = getStorage(app);
const COLLECTION = "annonces";

// ===================================================
//  UTILITAIRES
// ===================================================
function showToast(message, type = "default") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = type;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatPrix(prix) {
  if (prix === 0 || prix === "0") return "Gratuit";
  return Number(prix).toLocaleString("fr-FR") + " €";
}

function creerCarteHTML(annonce) {
  const imagePart = annonce.imageUrl
    ? `<img src="${annonce.imageUrl}" alt="${annonce.titre}" loading="lazy" />`
    : `<div class="card-img-placeholder">📦</div>`;
  return `
    <div class="annonce-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 fade-in-up"
         onclick="window.location.href='annonce.html?id=${annonce.id}'">
      <div class="card-img-wrapper">${imagePart}</div>
      <div class="p-3">
        <p class="text-xs text-gray-400 font-semibold mb-0.5 truncate">${annonce.categorie || "Autres"}</p>
        <h3 class="text-sm font-bold text-gray-800 leading-snug line-clamp-2 mb-1">${annonce.titre}</h3>
        <p class="text-base font-extrabold text-primary">${formatPrix(annonce.prix)}</p>
        ${annonce.localisation ? `<p class="text-xs text-gray-400 mt-1 truncate">📍 ${annonce.localisation}</p>` : ""}
      </div>
    </div>
  `;
}

// ===================================================
//  PAGE INDEX.HTML
// ===================================================
async function initIndex() {
  const grid        = document.getElementById("annoncesGrid");
  const emptyState  = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchInput");
  const sortSelect  = document.getElementById("sortSelect");
  const resultCount = document.getElementById("resultCount");
  const catFilters  = document.getElementById("categoryFilters");

  if (!grid) return;

  let toutesLesAnnonces = [];
  let categorieActive   = "Toutes";

  async function chargerAnnonces() {
    grid.innerHTML = "";
    try {
      const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      toutesLesAnnonces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      construireFiltres();
      afficher();
    } catch (err) {
      console.error("Erreur Firestore :", err);
      grid.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400">
        Impossible de charger les annonces. Vérifiez votre configuration Firebase.
      </div>`;
    }
  }

  function construireFiltres() {
    const cats = ["Toutes", ...new Set(toutesLesAnnonces.map(a => a.categorie || "Autres"))];
    catFilters.innerHTML = cats.map(cat => `
      <button class="category-pill ${cat === categorieActive ? "active" : ""}"
              onclick="filtrerParCategorie('${cat}')">${cat}</button>
    `).join("");
  }

  window.filtrerParCategorie = function(cat) {
    categorieActive = cat;
    construireFiltres();
    afficher();
  };

  function afficher() {
    const terme = searchInput.value.toLowerCase().trim();
    const tri   = sortSelect.value;

    let liste = toutesLesAnnonces.filter(a => {
      const matchCat = categorieActive === "Toutes" || a.categorie === categorieActive;
      const matchSearch = !terme
        || a.titre?.toLowerCase().includes(terme)
        || a.description?.toLowerCase().includes(terme)
        || a.categorie?.toLowerCase().includes(terme)
        || a.vendeur?.toLowerCase().includes(terme);
      return matchCat && matchSearch;
    });

    if (tri === "price-asc")  liste.sort((a,b) => Number(a.prix)-Number(b.prix));
    if (tri === "price-desc") liste.sort((a,b) => Number(b.prix)-Number(a.prix));

    resultCount.textContent = `${liste.length} annonce${liste.length !== 1 ? "s" : ""}`;

    if (liste.length === 0) {
      grid.innerHTML = "";
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
      grid.innerHTML = liste.map(creerCarteHTML).join("");
    }
  }

  searchInput.addEventListener("input", afficher);
  sortSelect.addEventListener("change", afficher);

  await chargerAnnonces();
}

// ===================================================
//  PAGE PUBLIER.HTML
// ===================================================
function initPublier() {
  const form       = document.getElementById("publierForm");
  const successMsg = document.getElementById("successMsg");
  const submitBtn  = document.getElementById("submitBtn");
  const descArea   = document.getElementById("description");
  const charCount  = document.getElementById("charCount");

  if (!form) return;

  // compteur caractères
  descArea.addEventListener("input", () => {
    charCount.textContent = descArea.value.length;
  });

  // soumission
  form.addEventListener("submit", async e => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Publication en cours...";

    try {
      await addDoc(collection(db, COLLECTION), {
        titre: document.getElementById("titre").value.trim(),
        categorie: document.getElementById("categorie").value,
        prix: Number(document.getElementById("prix").value),
        description: document.getElementById("description").value.trim(),
        localisation: document.getElementById("localisation").value.trim(),
        contact: document.getElementById("contact").value.trim(),
        imageUrl: document.getElementById("imageUrlInput").value.trim(),
        vendeur: document.getElementById("vendeur").value.trim(),
        imagePath: "",  // vide
        createdAt: serverTimestamp()
      });

      form.classList.add("hidden");
      successMsg.classList.remove("hidden");

    } catch (err) {
      console.error("Erreur lors de la publication :", err);
      showToast("Erreur lors de la publication", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Publier l'annonce";
    }
  });
}

// ===================================================
//  PAGE ANNONCE.HTML
// ===================================================
async function initAnnonce() {
  const skeleton = document.getElementById("skeleton");
  const detail   = document.getElementById("annonceDetail");
  const errorState = document.getElementById("errorState");
  const deleteModal = document.getElementById("deleteModal");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  if (!skeleton) return;

  const params = new URLSearchParams(window.location.search);
  const annonceId = params.get("id");
  if (!annonceId) { skeleton.classList.add("hidden"); errorState.classList.remove("hidden"); return; }

  try {
    const docRef = doc(db, COLLECTION, annonceId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) { skeleton.classList.add("hidden"); errorState.classList.remove("hidden"); return; }
    const a = { id: docSnap.id, ...docSnap.data() };

    document.title = `${a.titre} – LeBonBex`;
    document.getElementById("detailTitre").textContent = a.titre;
    document.getElementById("detailTitreNav").textContent = a.titre;
    document.getElementById("detailCategorie").textContent = a.categorie || "Autres";
    document.getElementById("detailCategorieTag").textContent = a.categorie || "Autres";
    document.getElementById("detailPrix").textContent = formatPrix(a.prix);
    document.getElementById("detailDescription").textContent = a.description;
    document.getElementById("detailDate").innerHTML += `<svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg> ${formatDate(a.createdAt)}`;
    document.getElementById("detailLieu").innerHTML += a.localisation ? `<svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg> ${a.localisation}` : "";

    const contactEl   = document.getElementById("detailContact");
    const contactLink = document.getElementById("detailContactLink");
    contactEl.textContent = a.contact;
    if (a.contact.includes("@")) {
      contactLink.href = `mailto:${a.contact}?subject=Annonce : ${encodeURIComponent(a.titre)}`;
    } else {
      contactLink.href = "#";
      contactLink.textContent = "📋 Copier le contact";
      contactLink.onclick = (e) => { e.preventDefault(); navigator.clipboard.writeText(a.contact); showToast("Contact copié !","success"); };
    }

    const img = document.getElementById("detailImage");
    const imgPlaceholder = document.getElementById("detailImagePlaceholder");
    if (a.imageUrl) { img.src = a.imageUrl; img.alt = a.titre; } else { img.classList.add("hidden"); imgPlaceholder.classList.remove("hidden"); }

    document.getElementById("detailCategorie").onclick = () => { window.location.href = `index.html?categorie=${encodeURIComponent(a.categorie)}`; };
    window.confirmerSuppression = () => deleteModal.classList.remove("hidden");

    confirmDeleteBtn.addEventListener("click", async () => {
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = "Suppression...";
      try {
        if (a.imagePath) { await deleteObject(ref(storage, a.imagePath)).catch(()=>{}); }
        await deleteDoc(docRef);
        showToast("Annonce supprimée","success");
        setTimeout(()=>window.location.href="index.html",1200);
      } catch (err) { console.error(err); showToast("Erreur lors de la suppression","error"); confirmDeleteBtn.disabled=false; confirmDeleteBtn.textContent="Supprimer"; }
    });

    try {
      const q = query(collection(db,COLLECTION), orderBy("createdAt","desc"));
      const snapshot = await getDocs(q);
      const similaires = snapshot.docs.map(d=>({id:d.id,...d.data()})).filter(d=>d.id!==annonceId && d.categorie===a.categorie).slice(0,4);
      const simGrid = document.getElementById("annonceSimilaires");
      if(similaires.length>0){ simGrid.innerHTML=similaires.map(creerCarteHTML).join(""); }
      else{ simGrid.closest("div.mt-12").classList.add("hidden"); }
    } catch {}

    skeleton.classList.add("hidden");
    detail.classList.remove("hidden");

  } catch (err) {
    console.error("Erreur chargement annonce :",err);
    skeleton.classList.add("hidden");
    errorState.classList.remove("hidden");
  }
}

// ===================================================
//  INIT
// ===================================================
const page = window.location.pathname.split("/").pop() || "index.html";
if(page==="index.html"||page===""||page==="/"){ initIndex(); }
else if(page==="publier.html"){ initPublier(); }
else if(page==="annonce.html"){ initAnnonce(); }