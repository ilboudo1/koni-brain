const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

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
    
    // Importez MessagingResponse en haut du fichier si pas déjà fait
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

📱 Envoyez le numéro de votre choix
🗣️ Bientôt : Parlez en mooré/dioula avec AYAH !`);
    }
    // Fruits & Légumes
    else if (message === '1') {
      twiml.message(`🥬 FRUITS & LÉGUMES DU JOUR

🍅 Tomates fraîches - 500 FCFA/kg
🥬 Choux - 300 FCFA/pièce
🥕 Carottes - 400 FCFA/kg
🍌 Bananes - 250 FCFA/régime
🥭 Mangues - 200 FCFA/kg

Pour commander, envoyez :
"commander [produit] [quantité]"

0️⃣ Retour au menu`);
    }
    // Viande & Poisson
    else if (message === '2') {
      twiml.message(`🥩 VIANDE & POISSON FRAIS

🥩 Bœuf - 3500 FCFA/kg
🐔 Poulet local - 2500 FCFA/kg
🐟 Poisson frais - 2000 FCFA/kg
🦐 Crevettes - 4000 FCFA/kg

Livraison gratuite à partir de 5000 FCFA !

0️⃣ Retour au menu`);
    }
    // Épices
    else if (message === '3') {
      twiml.message(`🌶️ ÉPICES & CONDIMENTS

🧄 Ail - 1000 FCFA/kg
🧅 Oignons - 350 FCFA/kg
🌶️ Piment - 500 FCFA/kg
🧂 Sel local - 200 FCFA/kg
🌿 Soumbala - 100 FCFA/boule

0️⃣ Retour au menu`);
    }
    // Commande
    else if (message.startsWith('commander')) {
      twiml.message(`📦 Commande reçue !

AYAH traite votre commande...
Un vendeur vous contactera dans 5 minutes.

Merci de faire confiance à KONI Markets ! 🙏

0️⃣ Retour au menu`);
    }
    // Message par défaut
    else {
      twiml.message(`Salut ! 👋 Je suis KONI, votre assistant.

AYAH (notre IA vocale) arrive bientôt pour vous servir en mooré et dioula !

En attendant, tapez "menu" pour voir nos produits 🛒`);
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('[WhatsApp] Erreur:', error);
    res.status(500).send('Erreur serveur');
  }
});
app.listen(PORT, () => {
  console.log(`🚀 KONI Brain démarré sur port ${PORT}`);
  console.log(`📱 API Chat: POST /api/chat`);
  console.log(`❤️ Health: GET /health`);
});