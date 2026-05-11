import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBCbJp-1ycJVZ27vKpOY45YLZnIUkYrQFY",
  authDomain: "sales-tracker-d8f48.firebaseapp.com",
  projectId: "sales-tracker-d8f48",
  storageBucket: "sales-tracker-d8f48.firebasestorage.app",
  messagingSenderId: "719309841826",
  appId: "1:719309841826:web:bfc945b38ea284a602fefb",
  measurementId: "G-VKB8EFHGRB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
