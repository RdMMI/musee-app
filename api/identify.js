// ============================================================
// API ROUTE : /api/identify
// Reçoit une image (base64). N'a plus besoin de la liste des œuvres.
// Demande à Gemini d'identifier l'œuvre de manière exhaustive.
// ============================================================

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: "Image manquante" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  // Utiliser le modèle gemini-2.0-flash, excellent en multimodalité
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `Tu es un expert en histoire de l'art. Analyse l'image ci-jointe et identifie de manière précise et exhaustive l'œuvre d'art qu'elle représente. Donne : le titre de l'œuvre (en français), le nom de l'artiste, et l'année de création. Réponds uniquement avec un objet JSON, sans aucun texte autour, au format suivant :
{"titre": "...", "artiste": "...", "annee": "..."}`;

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
      result = null; // Indique une erreur de parsing ou une non-identification
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}