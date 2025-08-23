import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBivUU6qYY0mrASf3V2ys_hzwGB6HZOqzM",
  authDomain: "coaching-classes-db.firebaseapp.com",
  projectId: "coaching-classes-db",
  storageBucket: "coaching-classes-db.firebasestorage.app",
  messagingSenderId: "820490465479",
  appId: "1:820490465479:web:6a1ce6ec63d39f96608ee2",
  measurementId: "G-ED7BME8BPG"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
const db = getFirestore(app)

// Initialize Analytics (optional)
const analytics = getAnalytics(app)

export { db, analytics } 