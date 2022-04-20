import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
const firebaseApi = process.env.REACT_APP_FIREBASE_API_KEY

const firebaseConfig = {
  apiKey: firebaseApi,
  authDomain: 'house-marketplace-app-23db2.firebaseapp.com',
  projectId: 'house-marketplace-app-23db2',
  storageBucket: 'house-marketplace-app-23db2.appspot.com',
  messagingSenderId: '347239580982',
  appId: '1:347239580982:web:b3cb62c3fe09c2366c9f97',
}

// Initialize Firebase
initializeApp(firebaseConfig)

export const db = getFirestore()
