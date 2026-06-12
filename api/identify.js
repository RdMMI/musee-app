// ============================================================
// API ROUTE : /api/identify
// Reçoit une image (base64) + une liste d'œuvres possibles
// Envoie tout à Gemini, qui répond avec l'id de l'œuvre reconnue
// ============================================================

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { image, artworks } = req.body;

  if (!image || !artworks) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // Liste des ids/noms possibles, pour guider Gemini
  const listText = artworks
    .map((a) => `- id: "${a.id}", nom: "${a.nom}"`)
    .join("\n");

  const prompt = `Tu es un système d'identification d'œuvres d'art dans un musée.
Voici la liste des œuvres possibles :
${listText}

Regarde l'image fournie et détermine si elle correspond à une de ces œuvres.
Réponds UNIQUEMENT avec un objet JSON, sans aucun texte autour, au format :
{"id": "id_de_loeuvre"} si tu reconnais une œuvre de la liste,
ou {"id": "none"} si aucune œuvre ne correspond.`;

  try {
    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: image
                }
              }
            ]
          }
        ]
      })
    });

    const data = await geminiResponse.json();

    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Nettoyer la réponse (au cas où Gemini ajoute des ```json autour)
    const cleaned = textResponse.replace(/```json|```/g, "").trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      result = { id: "none" };
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
