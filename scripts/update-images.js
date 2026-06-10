#!/usr/bin/env node
// Actualiza imageUrl de los items del menú usando Sample APIs (sampleapis.com/coffee).
// Usage: node scripts/update-images.js <email> <password>

const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env');
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: node scripts/update-images.js <email> <password>');
  process.exit(1);
}

// Asignación por id de cada endpoint.
// hot → Unsplash (alta calidad), iced → Wikipedia
// ids elegidos por similitud visual con cada bebida de 120 Gramos.
//
// hot endpoint ids disponibles:
//   2=Latte  3=Caramel Latte  4=Cappuccino  5=Americano  6=Espresso
//   7=Macchiato  8=Mocha  9=Hot Chocolate  11=Matcha Latte  12=Seasonal Brew
//   13=Svart Te(Black Tea)  14=Islatte  15=Islatte Mocha  16=Frapino Caramel
//   17=Frapino Mocka  19=Frozen Lemonade
// iced endpoint ids disponibles:
//   1=Iced Coffee  2=Iced Espresso  3=Cold Brew  4=Frappuccino  5=Nitro  6=Mazagran

const MENU_IMAGE_PLAN = [
  // ---- Iced Coffee / Lattes ----
  { name: 'Clásico',                   endpoint: 'iced', id: 1  }, // Iced Coffee
  { name: 'Iced Americano',            endpoint: 'hot',  id: 5  }, // Americano ✓
  { name: 'Latte Caramelo',            endpoint: 'hot',  id: 3  }, // Caramel Latte ✓
  { name: 'Latte Vainilla Francesa',   endpoint: 'hot',  id: 14 }, // Islatte
  { name: 'Latte Coco',                endpoint: 'hot',  id: 2  }, // Latte
  { name: 'Toasted Marshmallow Latte', endpoint: 'hot',  id: 16 }, // Frapino Caramel
  { name: 'Brown Shaken Espresso',     endpoint: 'hot',  id: 7  }, // Macchiato
  { name: 'Butterbeer',                endpoint: 'hot',  id: 12 }, // Seasonal Brew
  // ---- Matcha ----
  { name: 'Matcha Latte',              endpoint: 'hot',  id: 11 }, // Matcha Latte ✓
  { name: 'Dirty Matcha',              endpoint: 'hot',  id: 15 }, // Islatte Mocha (espresso layer)
  { name: 'Strawberry Matcha',         endpoint: 'hot',  id: 19 }, // Frozen Lemonade (pinkish)
  { name: 'Matcha Coco Latte',         endpoint: 'hot',  id: 9  }, // Hot Chocolate (cremoso)
  // ---- Otras ----
  { name: 'Taro Latte',                endpoint: 'iced', id: 4  }, // Frappuccino (púrpura/rosa)
  { name: 'Iced Tea',                  endpoint: 'hot',  id: 13 }, // Svart Te ✓
  { name: 'Cold Brew',                 endpoint: 'iced', id: 3  }, // Cold Brew ✓
  { name: 'Café Caliente',             endpoint: 'hot',  id: 6  }, // Espresso ✓
];

const app = initializeApp({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);

async function fetchEndpoint(type) {
  const res = await fetch(`https://api.sampleapis.com/coffee/${type}`);
  if (!res.ok) throw new Error(`Sample APIs ${type} returned ${res.status}`);
  const data = await res.json();
  // Index by id for O(1) lookup
  return Object.fromEntries(data.map(item => [item.id, item]));
}

async function main() {
  console.log('Obteniendo imágenes de sampleapis.com/coffee...');
  const [iced, hot] = await Promise.all([
    fetchEndpoint('iced'),
    fetchEndpoint('hot'),
  ]);
  console.log(`  iced: ${Object.keys(iced).length} items  |  hot: ${Object.keys(hot).length} items\n`);

  // Build name → imageUrl map
  const imageMap = {};
  for (const plan of MENU_IMAGE_PLAN) {
    const source = plan.endpoint === 'iced' ? iced : hot;
    const item = source[plan.id];
    if (!item) {
      console.warn(`  ⚠ id ${plan.id} no encontrado en endpoint ${plan.endpoint} (${plan.name})`);
      continue;
    }
    imageMap[plan.name] = item.image;
  }

  console.log('Iniciando sesión en Firebase...');
  await signInWithEmailAndPassword(auth, email, password);
  console.log('Sesión iniciada.\n');

  console.log('Actualizando Firestore:');
  const snap = await getDocs(collection(db, 'menu'));
  let updated = 0;

  for (const docSnap of snap.docs) {
    const { name } = docSnap.data();
    const imageUrl = imageMap[name];
    if (imageUrl) {
      await updateDoc(doc(db, 'menu', docSnap.id), { imageUrl });
      console.log(`  ✓ ${name}`);
      updated++;
    } else {
      console.log(`  – ${name} (sin mapeo)`);
    }
  }

  console.log(`\nListo! ${updated} de ${snap.size} productos actualizados.`);
  process.exit(0);
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
