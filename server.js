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
app.post('/whatsapp', (req, res) => {
  console.log('WhatsApp message reçu:', req.body);
  res.status(200).send('OK');
});
app.listen(PORT, () => {
  console.log(`🚀 KONI Brain démarré sur port ${PORT}`);
  console.log(`📱 API Chat: POST /api/chat`);
  console.log(`❤️ Health: GET /health`);
});