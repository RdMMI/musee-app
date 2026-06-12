// ====================================================================
// C'EST ICI QUE TU ÉCRIS TOUTES TES INFOS SUR LES ŒUVRES.
// Chaque musée a un "id" et une liste d'œuvres.
// Chaque œuvre a : id, nom, auteur, annee, description, icon (emoji)
// L'id doit être unique et SANS ESPACES (utilisé par Gemini pour identifier).
// ====================================================================

const MUSEUMS_DATA = {
  "louvre": {
    nom: "Musée du Louvre",
    artworks: [
      {
        id: "joconde",
        nom: "La Joconde",
        auteur: "Léonard de Vinci",
        annee: "1503-1519",
        description: "Écris ici ta propre description de la Joconde...",
        icon: "🖼️"
      },
      {
        id: "venus_de_milo",
        nom: "Vénus de Milo",
        auteur: "Inconnu (sculpteur grec)",
        annee: "~130-100 av. J.-C.",
        description: "Écris ici ta propre description de la Vénus de Milo...",
        icon: "🗿"
      },
      {
        id: "victoire_de_samothrace",
        nom: "Victoire de Samothrace",
        auteur: "Inconnu (sculpteur grec)",
        annee: "~190 av. J.-C.",
        description: "Écris ici ta propre description...",
        icon: "🪶"
      }
    ]
  },

  "orsay": {
    nom: "Musée d'Orsay",
    artworks: [
      {
        id: "le_dejeuner_sur_l_herbe",
        nom: "Le Déjeuner sur l'herbe",
        auteur: "Édouard Manet",
        annee: "1863",
        description: "Écris ici ta propre description...",
        icon: "🎨"
      }
    ]
  }
};
