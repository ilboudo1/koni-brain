const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const twilio = require('twilio');
const MessagingResponse = twilio.twiml.MessagingResponse;
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Créer un dossier pour les audios
const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Servir les fichiers statiques
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio')));

// Configuration Gemini pour AYAH
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Stockage des conversations (en mémoire pour l'instant)
const conversations = new Map();

// Fonction pour gérer l'historique des conversations
function getConversation(phoneNumber) {
  if (!conversations.has(phoneNumber)) {
    conversations.set(phoneNumber, {
      messages: [],
      panier: [],
      nom: null,
      preferences: {}
    });
  }
  return conversations.get(phoneNumber);
}

// Fonction principale d'AYAH
async function askAYAH(message, phoneNumber) {
  try {
    const conversation = getConversation(phoneNumber);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Ajouter le message à l'historique
    conversation.messages.push({ role: 'user', content: message });
    
    // Construire le contexte
    const historiqueRecent = conversation.messages.slice(-10).map(m => 
      `${m.role === 'user' ? 'Client' : 'AYAH'}: ${m.content}`
    ).join('\n');
    
    const prompt = `Tu es AYAH, l'assistante IA de KONI Markets, le premier marché digital du Burkina Faso.

PERSONNALITÉ:
- Tu es chaleureuse comme une maman du marché de Rood-Woko
- Tu parles français avec des expressions burkinabè authentiques
- Tu peux glisser des mots en mooré ou dioula naturellement
- Tu connais parfaitement les habitudes culinaires du Burkina

PRODUITS DISPONIBLES AUJOURD'HUI:
- Tomates fraîches: 500 FCFA/kg
- Oignons: 350 FCFA/kg  
- Piment: 500 FCFA/kg
- Poulet bicyclette: 2500 FCFA/kg
- Riz local: 600 FCFA/kg
- Haricots: 800 FCFA/kg
- Soumbala: 100 FCFA/boule
- Huile: 1000 FCFA/litre

CONTEXTE:
${conversation.nom ? `Client fidèle: ${conversation.nom}` : 'Nouveau client'}
Panier actuel: ${conversation.panier.length > 0 ? JSON.stringify(conversation.panier) : 'Vide'}

HISTORIQUE RÉCENT:
${historiqueRecent}

MESSAGE DU CLIENT: ${message}

INSTRUCTIONS:
1. Réponds naturellement comme au marché
2. Si le client veut commander, note bien les quantités
3. Suggère des produits complémentaires (ex: oignons avec tomates pour sauce)
4. Utilise des expressions comme "Yam Waya!", "C'est doux dèh!", "On dit quoi?"
5. Pour les plats traditionnels (tô, riz gras, zoom-koom), suggère les bons ingrédients

Réponds maintenant au client:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Sauvegarder la réponse d'AYAH
    conversation.messages.push({ role: 'assistant', content: response });
    
    return response;
    
  } catch (error) {
    console.error('Erreur AYAH:', error);
    return "Ah pardon dèh! J'ai un petit souci. Envoie 'menu' pour voir nos produits ou réessaye dans quelques secondes!";
  }
}

// Fonction pour détecter et extraire les commandes
function extractCommande(message) {
  const regex = /(\d+)\s*(kg|kilo|kilos|litre|litres|boule|boules)?\s*(de|d')?\s*(\w+)/gi;
  const commandes = [];
  let match;
  
  while ((match = regex.exec(message)) !== null) {
    commandes.push({
      quantite: parseInt(match[1]),
      unite: match[2] || 'unité',
      produit: match[4]
    });
  }
  
  return commandes;
}

// Fonction pour générer la voix avec ElevenLabs
// REMPLACEZ votre generateVoice par cette version optimisée :

// Version optimisée de generateVoice pour le plan Starter

async function generateVoice(text) {
  try {
    console.log('[AYAH Voix] Génération audio (Plan Starter)...');
    
    // Avec 30,000 caractères/mois, on peut être plus généreux
    const texteLimite = text.substring(0, 300); // 300 caractères au lieu de 150
    
    // Voix française de qualité
    const voiceId = "onwK4e9ZLuTAKqWW03F9"; // Daniel - excellente voix française
    
    const options = {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: texteLimite,
        model_id: "eleven_multilingual_v2", // Meilleur modèle avec le plan payant
        voice_settings: {
          stability: 0.7,        // Plus stable
          similarity_boost: 0.8, // Voix plus naturelle
          style: 0.5,
          use_speaker_boost: true
        }
      })
    };
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, options);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[AYAH Voix] Erreur:', error);
      return null;
    }
    
    console.log('[AYAH Voix] Audio généré avec succès !');
    
    const audioBuffer = await response.buffer();
    const filename = `ayah_${Date.now()}.mp3`;
    const filepath = path.join(audioDir, filename);
    
    fs.writeFileSync(filepath, audioBuffer);
    
    const audioUrl = `https://koni-brain.onrender.com/audio/${filename}`;
    
    // Nettoyer après 1 heure
    setTimeout(() => {
      try {
        fs.unlinkSync(filepath);
      } catch (err) {
        // Ignorer
      }
    }, 3600000);
    
    return audioUrl;
    
  } catch (error) {
    console.error('[AYAH Voix] Erreur:', error);
    return null;
  }
}
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, options);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[AYAH Voix] Erreur ElevenLabs:', error);
      
      // Si quota dépassé ou erreur, retourner null sans crash
      if (error.includes('quota') || error.includes('limit')) {
        console.log('[AYAH Voix] Quota ElevenLabs dépassé - Mode texte uniquement');
      }
      
      return null;
    }
    
    // Sauvegarder l'audio
    const audioBuffer = await response.buffer();
    const filename = `ayah_${Date.now()}.mp3`;
    const filepath = path.join(audioDir, filename);
    
    fs.writeFileSync(filepath, audioBuffer);
    console.log('[AYAH Voix] Audio sauvegardé:', filename);
    
    // Retourner l'URL publique
    const audioUrl = `https://koni-brain.onrender.com/audio/${filename}`;
    
    // Nettoyer après 30 minutes (pas 1h pour économiser l'espace)
    setTimeout(() => {
      try {
        fs.unlinkSync(filepath);
        console.log('[AYAH Voix] Audio supprimé:', filename);
      } catch (err) {
        // Ignorer si déjà supprimé
      }
    }, 1800000); // 30 minutes
    
    return audioUrl;
    
  } catch (error) {
    console.error('[AYAH Voix] Erreur:', error);
    return null;
  }
}

// AJOUTEZ CETTE ROUTE JUSTE AVANT app.listen

app.get('/test-voice', async (req, res) => {
  try {
    const testText = "Yam Waya! Je suis AYAH, ton assistante de KONI Markets. C'est doux dèh!";
    
    console.log('Test ElevenLabs - Clé présente:', !!process.env.ELEVENLABS_API_KEY);
    
    const audioUrl = await generateVoice(testText);
    
    if (audioUrl) {
      res.json({
        success: true,
        text: testText,
        audioUrl: audioUrl,
        message: "Audio généré avec succès ! Cliquez sur audioUrl pour écouter."
      });
    } else {
      res.json({
        success: false,
        error: "Impossible de générer l'audio",
        keyPresent: !!process.env.ELEVENLABS_API_KEY
      });
    }
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});
// Base de données produits populaires
const PRODUCTS = {
  'iphone 15': {
    name: 'iPhone 15 Pro Max',
    price_eur: 1299,
    price_fcfa: 850000,
    stock: true,
    delivery: '12-15 jours'
  },
  'macbook': {
    name: 'MacBook Pro M3',
    price_eur: 2499,
    price_fcfa: 1620000,
    stock: true,
    delivery: '12-15 jours'
  },
  'airpods': {
    name: 'AirPods Pro',
    price_eur: 279,
    price_fcfa: 180000,
    stock: true,
    delivery: '10-12 jours'
  },
  'ps5': {
    name: 'PlayStation 5',
    price_eur: 549,
    price_fcfa: 360000,
    stock: true,
    delivery: '15-18 jours'
  }
};

// Endpoint principal de chat
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  console.log('Message reçu:', message);
  
  // Convertir en minuscules pour la recherche
  const lowerMessage = message.toLowerCase();
  
  // Chercher un produit dans le message
  let foundProduct = null;
  for (const [key, product] of Object.entries(PRODUCTS)) {
    if (lowerMessage.includes(key)) {
      foundProduct = product;
      break;
    }
  }
  
  // Générer la réponse
  let response;
  
  if (foundProduct) {
    response = `Excellent choix ! 🎯\n\n` +
               `📱 ${foundProduct.name}\n` +
               `💰 Prix: ${foundProduct.price_fcfa.toLocaleString()} FCFA\n` +
               `🚚 Livraison: ${foundProduct.delivery}\n` +
               `✅ En stock sur Amazon\n\n` +
               `Pour commander, envoyez "OUI" ou contactez-nous sur WhatsApp!`;
  } else if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut')) {
    response = "Bonjour ! 😊 Je suis KONI, votre assistant shopping. Que cherchez-vous aujourd'hui ? (iPhone 15, MacBook, AirPods, PS5...)";
  } else if (lowerMessage.includes('oui') || lowerMessage.includes('commander')) {
    response = "Super ! 🎉 Pour finaliser votre commande:\n\n" +
               "1️⃣ Orange Money: *144*1*1*70000000#\n" +
               "2️⃣ Moov Money: *155*1*1*71000000#\n\n" +
               "Ou contactez-nous sur WhatsApp: +226 70 00 00 00";
  } else {
    response = "Je peux vous aider à trouver:\n" +
               "📱 iPhone 15\n" +
               "💻 MacBook Pro\n" +
               "🎧 AirPods Pro\n" +
               "🎮 PlayStation 5\n\n" +
               "Que voulez-vous commander ?";
  }
  
  res.json({ response });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: '✅ KONI Brain opérationnel!',
    time: new Date().toLocaleString()
  });
});

// Page d'accueil
app.get('/', (req, res) => {
  res.send('<h1>🧠 KONI Brain API</h1><p>Statut: Opérationnel</p>');
});

// Démarrage serveur
const PORT = process.env.PORT || 3000;
app.post('/whatsapp', async (req, res) => {
  try {
    const { Body, From } = req.body;
    console.log(`[WhatsApp] Message reçu de ${From}: ${Body}`);
    
    const twiml = new MessagingResponse();
    const message = Body.toLowerCase().trim();
    
    // Menu principal
    if (message === 'menu' || message === '0') {
      twiml.message(`🌍 BIENVENUE CHEZ KONI MARKETS 🌍
Le marché digital du Burkina !

1️⃣ Fruits & Légumes 🥬
2️⃣ Viande & Poisson 🥩🐟
3️⃣ Épices & Condiments 🌶️
4️⃣ Céréales & Farines 🌾
5️⃣ Boissons locales 🥤
🗣️ AYAH - Parlez-moi normalement !

📱 Envoyez le numéro ou parlez à AYAH
Exemple: "Je veux 2kg de tomates"`);
    }
    // Fruits & Légumes
    else if (message === '1') {
      twiml.message(`🥬 FRUITS & LÉGUMES DU JOUR

🍅 Tomates fraîches - 500 FCFA/kg
🥬 Choux - 300 FCFA/pièce
🥕 Carottes - 400 FCFA/kg
🍌 Bananes - 250 FCFA/régime
🥭 Mangues - 200 FCFA/kg
🧅 Oignons - 350 FCFA/kg

💬 Dites à AYAH ce que vous voulez!
"Je veux des tomates pour faire la sauce"

0️⃣ Retour au menu`);
    }
    // Viande & Poisson
    else if (message === '2') {
      twiml.message(`🥩 VIANDE & POISSON FRAIS

🥩 Bœuf - 3500 FCFA/kg
🐔 Poulet bicyclette - 2500 FCFA/kg
🐟 Poisson frais - 2000 FCFA/kg
🦐 Crevettes - 4000 FCFA/kg

💬 Parlez à AYAH pour commander!
"Il me faut du poulet pour 5 personnes"

0️⃣ Retour au menu`);
    }
    // Épices
    else if (message === '3') {
      twiml.message(`🌶️ ÉPICES & CONDIMENTS

🧄 Ail - 1000 FCFA/kg
🌶️ Piment frais - 500 FCFA/kg
🧂 Sel local - 200 FCFA/kg
🌿 Soumbala - 100 FCFA/boule
🍃 Feuilles de baobab - 200 FCFA/tas

💬 AYAH vous conseille!
"C'est pour préparer quoi?"

0️⃣ Retour au menu`);
    }
    // AYAH prend le relais pour tout le reste !
    else {
  // Obtenir la réponse texte d'AYAH
  const responseAYAH = await askAYAH(Body, From);
  
  // NOUVEAU : Essayer de générer l'audio
  const audioUrl = await generateVoice(responseAYAH);
  
  if (audioUrl) {
    // Envoyer le texte ET l'audio
    twiml.message(responseAYAH); // Le texte d'abord
    
    // Puis l'audio
    const audioMsg = twiml.message("🔊 Message vocal d'AYAH :");
    audioMsg.media(audioUrl);
    
    console.log('[AYAH] Réponse avec voix envoyée !');
  } else {
    // Si problème avec l'audio, envoyer juste le texte
    twiml.message(responseAYAH);
    console.log('[AYAH] Réponse texte seulement (audio failed)');
  }
  
  // Gérer le panier si commande détectée
  const commandes = extractCommande(Body);
  if (commandes.length > 0) {
    const conversation = getConversation(From);
    conversation.panier.push(...commandes);
  }
}
  
    
    res.type('text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('[WhatsApp] Erreur:', error);
    
    const twiml = new MessagingResponse();
    twiml.message("Oops! Petit problème technique. Envoyez 'menu' ou réessayez!");
    
    res.type('text/xml');
    res.send(twiml.toString());
  }
});
app.listen(PORT, () => {
  console.log(`🚀 KONI Brain démarré sur port ${PORT}`);
  console.log(`📱 API Chat: POST /api/chat`);
  console.log(`❤️ Health: GET /health`);
});