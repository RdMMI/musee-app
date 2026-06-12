// ============================================================
// APP.JS - logique principale
// ============================================================

const STORAGE_KEY = "musee_collection_progress";

let currentMuseumId = null;
let stream = null;

// ---------- Initialisation ----------

function init() {
  populateMuseumSelect();
  startCamera();

  // sélectionner le premier musée par défaut AVANT de rendre la collection
  const select = document.getElementById("museum-select");
  currentMuseumId = select.value;

  renderCollection();

  select.addEventListener("change", (e) => {
    currentMuseumId = e.target.value;
    renderCollection();
  });

  document.getElementById("capture-btn").addEventListener("click", captureAndIdentify);
  document.getElementById("file-input").addEventListener("change", handleFileImport);
  document.getElementById("close-result").addEventListener("click", () => {
    document.getElementById("result-section").classList.add("hidden");
  });
}

function populateMuseumSelect() {
  const select = document.getElementById("museum-select");
  Object.keys(MUSEUMS_DATA).forEach((museumId) => {
    const opt = document.createElement("option");
    opt.value = museumId;
    opt.textContent = MUSEUMS_DATA[museumId].nom;
    select.appendChild(opt);
  });
}

// ---------- Caméra ----------

async function startCamera() {
  const video = document.getElementById("camera");
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    video.srcObject = stream;
  } catch (err) {
    document.getElementById("status").textContent =
      "Impossible d'accéder à la caméra : " + err.message;
  }
}

// ---------- Fonctions utilitaires de comparaison (Matching) ----------

// Fonction de normalisation pour enlever les accents et passer en minuscule
function normalize(str) {
  return str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
}

// Compare l'identité d'œuvre donnée par l'IA avec la liste du musée.
// Retourne l'id de l'œuvre correspondante ou null.
function findBestMatch(identifiedArtwork, museumArtworks) {
  if (!identifiedArtwork) return null;

  const identifiedTitleLower = normalize(identifiedArtwork.titre);
  const identifiedArtistLower = normalize(identifiedArtwork.artiste);

  for (const artwork of museumArtworks) {
    const dbTitleLower = normalize(artwork.nom);
    const dbArtistLower = normalize(artwork.auteur);

    // Essayer de trouver une correspondance exacte (titre + auteur)
    if (identifiedTitleLower === dbTitleLower && identifiedArtistLower === dbArtistLower) {
      return artwork.id;
    }

    // Essayer de trouver une correspondance partielle sur le titre seul.
    // Plus souple, attrape "Mona Lisa" vs "La Joconde" ou les titres tronqués.
    if (identifiedTitleLower.includes(dbTitleLower) || dbTitleLower.includes(identifiedTitleLower)) {
       return artwork.id;
    }
  }

  return null; // Aucune correspondance trouvée
}


// ---------- Capture + identification ----------

async function captureAndIdentify() {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("canvas");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageBase64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
  await identifyImage(imageBase64);
}

async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    const imageBase64 = reader.result.split(",")[1];
    await identifyImage(imageBase64);
  };
  reader.readAsDataURL(file);
}

async function identifyImage(imageBase64) {
  const statusEl = document.getElementById("status");
  const captureBtn = document.getElementById("capture-btn"); 
  
  statusEl.textContent = "Analyse en cours... (merci de patienter)";
  
  // 🔒 On désactive le bouton pour empêcher les doubles clics
  if (captureBtn) captureBtn.disabled = true; 

  const museum = MUSEUMS_DATA[currentMuseumId];

  try {
    const response = await fetch("/api/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64 })
    });

    const identifiedData = await response.json();
    console.log("Réponse API détaillée:", identifiedData);

    if (!identifiedData || identifiedData.error) {
      statusEl.textContent = "Erreur API : " + (identifiedData?.error || "Impossible de parser la réponse.");
      if (captureBtn) captureBtn.disabled = false; // 🔓 On débloque en cas d'erreur
      return;
    }

    const matchedArtworkId = findBestMatch(identifiedData, museum.artworks);

    if (matchedArtworkId) {
      showResult(matchedArtworkId);
      unlockArtwork(currentMuseumId, matchedArtworkId);
      statusEl.textContent = "Œuvre identifiée et ajoutée à ta collection !";
    } else {
      statusEl.textContent = `Œuvre reconnue comme "${identifiedData.titre}" par l'IA, mais elle n'est pas dans la liste de ce musée.`;
    }

  } catch (err) {
    statusEl.textContent = "Erreur lors de l'analyse : " + err.message;
  }

  // 🔓 On réactive le bouton à la fin, quoi qu'il arrive
  if (captureBtn) captureBtn.disabled = false; 
}

// ---------- Affichage du résultat ----------

function showResult(artworkId) {
  const museum = MUSEUMS_DATA[currentMuseumId];
  const artwork = museum.artworks.find((a) => a.id === artworkId);
  if (!artwork) return;

  document.getElementById("result-title").textContent = artwork.icon + " " + artwork.nom;
  document.getElementById("result-author").textContent = "Auteur : " + artwork.auteur;
  document.getElementById("result-year").textContent = "Année : " + artwork.annee;
  document.getElementById("result-description").textContent = artwork.description;
  document.getElementById("result-section").classList.remove("hidden");
}

// ---------- Gestion de la progression (localStorage) ----------

function getProgress() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function unlockArtwork(museumId, artworkId) {
  const progress = getProgress();
  if (!progress[museumId]) progress[museumId] = [];
  if (!progress[museumId].includes(artworkId)) {
    progress[museumId].push(artworkId);
    saveProgress(progress);
  }
  renderCollection();
}

// ---------- Affichage de la collection ----------

function renderCollection() {
  const museum = MUSEUMS_DATA[currentMuseumId];
  const progress = getProgress();
  const unlocked = progress[currentMuseumId] || [];

  const grid = document.getElementById("collection-grid");
  grid.innerHTML = "";

  museum.artworks.forEach((artwork) => {
    const isUnlocked = unlocked.includes(artwork.id);
    const card = document.createElement("div");
    card.className = "artwork-card" + (isUnlocked ? "" : " locked");
    card.innerHTML = `
      <span class="icon">${isUnlocked ? artwork.icon : "❓"}</span>
      <span>${isUnlocked ? artwork.nom : "???"}</span>
    `;
    grid.appendChild(card);
  });

  document.getElementById("progress-text").textContent =
    `Progression : ${unlocked.length} / ${museum.artworks.length}`;
}

init();