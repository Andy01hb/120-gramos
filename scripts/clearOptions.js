#!/usr/bin/env node
// One-time cleanup: removes all configured options from every product in Firestore.
// Run with: node scripts/clearOptions.js <email> <password>

const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env');
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs, updateDoc } = require('firebase/firestore');

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: node scripts/clearOptions.js <email> <password>');
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

async function main() {
  console.log('Signing in as', email, '...');
  await signInWithEmailAndPassword(auth, email, password);
  console.log('Signed in!\n');

  const snap = await getDocs(collection(db, 'menu'));
  let count = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const hasOptions = Array.isArray(data.options) && data.options.length > 0;
    if (hasOptions) {
      await updateDoc(docSnap.ref, { options: [] });
      console.log(`✓ Limpiado: ${data.name}`);
      count++;
    } else {
      console.log(`  Sin cambios: ${data.name}`);
    }
  }

  console.log(`\nListo. ${count} producto(s) actualizados.`);
  process.exit(0);
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
