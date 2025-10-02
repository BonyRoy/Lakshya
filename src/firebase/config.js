import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiFVH8VH-JamXRtLcGGlFI6Vq2BKwQ-iM",
  authDomain: "eduflow-a2193.firebaseapp.com",
  projectId: "eduflow-a2193",
  storageBucket: "eduflow-a2193.firebasestorage.app",
  messagingSenderId: "329142621861",
  appId: "1:329142621861:web:cf899b9156dfb90c8a9f4c",
  measurementId: "G-CRHM18D7FK"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
const db = getFirestore(app)

// Initialize Analytics (optional)
const analytics = getAnalytics(app)

export { db, analytics } 