import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDD-pzAoAyMDNsQIURuQ24kQbWknh69h40',
  authDomain: 'appfoodrecipes.firebaseapp.com',
  projectId: 'appfoodrecipes',
  storageBucket: 'appfoodrecipes.firebasestorage.app',
  messagingSenderId: '429155997133',
  appId: '1:429155997133:web:2a7ad0ca0036df01eea084',
};

export const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

// Caché persistente: las aperturas siguientes leen de disco (0 lecturas de cuota)
// y la app funciona offline. Single-tab: una sola pestaña a la vez.
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }),
});
