#!/usr/bin/env node
// Populate Firestore with 120 Gramos menu data.
// Usage: node scripts/seed.js <email> <password>
// Run this AFTER registering your account in the app.

const path = require('path');
const fs = require('fs');

// Load .env manually (no dotenv dependency needed)
const envPath = path.join(__dirname, '..', '.env');
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, addDoc, collection } = require('firebase/firestore');

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: node scripts/seed.js <email> <password>');
  process.exit(1);
}

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

const FLAVORS_TORANI = ['Caramelo', 'Vainilla Francesa', 'Coco', 'Brown Sugar Cinnamon', 'Toasted Marshmallow'];
const COFFEE_FLAVORS = FLAVORS_TORANI;
const MATCHA_FLAVORS = ['Coco', 'Vainilla Francesa'];
const TEA_FLAVORS = ['Caramelo', 'Vainilla Francesa', 'Coco'];
const COLD_BREW_FLAVORS = ['Caramelo', 'Vainilla Francesa', 'Coco', 'Brown Sugar Cinnamon'];

const menuItems = [
  // ---- Iced Coffee / Lattes ----
  { name: 'Clásico', category: 'iced_coffee', price: 60, available: true, flavors: COFFEE_FLAVORS, hasBoba: true, isFeatured: false, sortOrder: 1, imageUrl: null },
  { name: 'Iced Americano', category: 'iced_coffee', price: 60, available: true, flavors: COFFEE_FLAVORS, hasBoba: true, isFeatured: false, sortOrder: 2, imageUrl: null },
  { name: 'Latte Caramelo', category: 'iced_coffee', price: 70, available: true, flavors: [], hasBoba: true, isFeatured: true, sortOrder: 3, imageUrl: null },
  { name: 'Latte Vainilla Francesa', category: 'iced_coffee', price: 70, available: true, flavors: [], hasBoba: true, isFeatured: true, sortOrder: 4, imageUrl: null },
  { name: 'Latte Coco', category: 'iced_coffee', price: 70, available: true, flavors: [], hasBoba: true, isFeatured: false, sortOrder: 5, imageUrl: null },
  { name: 'Toasted Marshmallow Latte', category: 'iced_coffee', price: 70, available: true, flavors: [], hasBoba: true, isFeatured: false, sortOrder: 6, imageUrl: null },
  { name: 'Brown Shaken Espresso', category: 'iced_coffee', price: 70, available: true, flavors: [], hasBoba: true, isFeatured: true, sortOrder: 7, imageUrl: null },
  { name: 'Butterbeer', category: 'iced_coffee', price: 75, available: true, flavors: [], hasBoba: true, isFeatured: false, sortOrder: 8, imageUrl: null },
  // ---- Matcha ----
  { name: 'Matcha Latte', category: 'matcha', price: 70, available: true, flavors: MATCHA_FLAVORS, hasBoba: true, isFeatured: false, sortOrder: 9, imageUrl: null },
  { name: 'Dirty Matcha', category: 'matcha', price: 75, available: true, flavors: [], hasBoba: true, isFeatured: false, sortOrder: 10, imageUrl: null },
  { name: 'Strawberry Matcha', category: 'matcha', price: 75, available: true, flavors: [], hasBoba: true, isFeatured: false, sortOrder: 11, imageUrl: null },
  { name: 'Matcha Coco Latte', category: 'matcha', price: 75, available: true, flavors: [], hasBoba: true, isFeatured: false, sortOrder: 12, imageUrl: null },
  // ---- Otras ----
  { name: 'Taro Latte', category: 'otras', price: 70, available: true, flavors: [], hasBoba: true, isFeatured: false, sortOrder: 13, imageUrl: null },
  { name: 'Iced Tea', category: 'otras', price: 55, available: true, flavors: TEA_FLAVORS, hasBoba: true, isFeatured: false, sortOrder: 14, imageUrl: null },
  { name: 'Cold Brew', category: 'otras', price: 65, available: true, flavors: COLD_BREW_FLAVORS, hasBoba: false, isFeatured: false, sortOrder: 15, imageUrl: null },
  { name: 'Café Caliente', category: 'otras', price: 50, available: true, flavors: [], hasBoba: false, isFeatured: false, sortOrder: 16, imageUrl: null },
];

async function main() {
  console.log('Signing in as', email, '...');
  await signInWithEmailAndPassword(auth, email, password);
  console.log('Signed in!\n');

  // Menu items
  const menuRef = collection(db, 'menu');
  for (const item of menuItems) {
    await addDoc(menuRef, item);
    console.log(`✓ ${item.name} ($${item.price} MXN)`);
  }

  console.log(`\nListo! Se agregaron ${menuItems.length} productos al menú.`);
  process.exit(0);
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
