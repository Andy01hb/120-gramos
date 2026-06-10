#!/usr/bin/env node
// Upload hero images to Firebase Storage and update Firestore menu items with image URLs.
// Usage: node scripts/upload-images.js <email> <password>

const path = require('path');
const fs = require('fs');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: node scripts/upload-images.js <email> <password>');
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
const storage = getStorage(app);
const db = getFirestore(app);

// Map each menu item name to the image file to use
const IMAGE_MAP = {
  // hero1.jpg: iced coffee latte (center), taro (left, purple), matcha (right, green)
  'Clásico':                  'hero1.jpg',
  'Iced Americano':           'hero1.jpg',
  'Latte Caramelo':           'hero1.jpg',
  'Latte Vainilla Francesa':  'hero1.jpg',
  'Latte Coco':               'hero1.jpg',
  'Toasted Marshmallow Latte':'hero1.jpg',
  'Brown Shaken Espresso':    'hero1.jpg',
  'Butterbeer':               'hero1.jpg',
  'Matcha Latte':             'hero1.jpg',
  'Dirty Matcha':             'hero1.jpg',
  'Strawberry Matcha':        'hero1.jpg',
  'Matcha Coco Latte':        'hero1.jpg',
  'Taro Latte':               'hero1.jpg',
  'Iced Tea':                 'hero1.jpg',
  'Cold Brew':                'hero1.jpg',
  // hero2.jpg: hot espresso cups — "Don't worry, Drink coffee"
  'Café Caliente':            'hero2.jpg',
};

async function uploadImage(filename) {
  const filePath = path.join(__dirname, '..', 'assets', filename);
  const bytes = fs.readFileSync(filePath);
  const storageRef = ref(storage, `menu/${filename}`);
  console.log(`  Uploading ${filename}...`);
  await uploadBytes(storageRef, bytes, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(storageRef);
  console.log(`  ✓ ${filename} uploaded`);
  return url;
}

async function main() {
  console.log('Signing in...');
  await signInWithEmailAndPassword(auth, email, password);
  console.log('Signed in!\n');

  // Upload both images and get their URLs
  console.log('Uploading images to Firebase Storage:');
  const urls = {
    'hero1.jpg': await uploadImage('hero1.jpg'),
    'hero2.jpg': await uploadImage('hero2.jpg'),
  };
  console.log('');

  // Update Firestore menu items
  console.log('Updating menu items in Firestore:');
  const snap = await getDocs(collection(db, 'menu'));
  let updated = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const imageFile = IMAGE_MAP[data.name];
    if (imageFile && urls[imageFile]) {
      await updateDoc(doc(db, 'menu', docSnap.id), { imageUrl: urls[imageFile] });
      console.log(`  ✓ ${data.name}`);
      updated++;
    }
  }

  console.log(`\nListo! Se actualizaron ${updated} productos con imágenes.`);
  process.exit(0);
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
