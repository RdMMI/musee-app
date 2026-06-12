// ============================================================
// API ROUTE : /api/identify
// Version avec gestion d'erreurs renforcée
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
  if (!apiKey) {
    return res.status(500).json({ error: "La clé API Gemini est introuvable sur Vercel." });
  }

  // Utilisation de gemini-1.5-flash (très stable pour la vision)
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `Tu es un expert en histoire de l'art. Analyse l'image ci-jointe et identifie de manière précise l'œuvre d'art. 
Tu DOIS répondre UNIQUEMENT avec un objet JSON strict au format suivant, sans aucun autre texte, ni bonjour, ni explication :
{"titre": "Titre de l'oeuvre", "artiste": "Nom de l'artiste", "annee": "Année"}
Si tu ne reconnais pas l'œuvre, renvoie quand même un JSON valide : {"titre": "inconnu", "artiste": "inconnu", "annee": "inconnu"}`;

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

    // 1. Gérer les erreurs venant de l'API Google (ex: quota, clé invalide)
    if (!geminiResponse.ok || data.error) {
      return res.status(500).json({ 
        error: "Erreur de l'API Google Gemini", 
        details: data.error 
      });
    }

    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 2. Nettoyer la réponse pour forcer le JSON
    const cleaned = textResponse.replace(/```json/gi, "").replace(/```/g, "").trim();

    if (!cleaned) {
      return res.status(400).json({ 
        error: "Gemini a renvoyé une réponse vide.", 
        rawGeminiData: data 
      });
    }

    // 3. Essayer de parser le JSON
    let result;
    try {
      result = JSON.parse(cleaned);
    } catch (e) {
      // Si ça échoue, on renvoie ce que Gemini a dit pour que tu puisses le lire dans la console !
      return res.status(500).json({ 
        error: "Impossible de parser la réponse de l'IA en JSON.", 
        ceQueGeminiADit: textResponse 
      });
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur : " + err.message });
  }
}