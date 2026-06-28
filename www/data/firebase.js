import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBHWCrFDsuMLxbKmFMQPbMJGBtohzeqqUk",
  authDomain: "iraqi-drug-guide-38aa5.firebaseapp.com",
  projectId: "iraqi-drug-guide-38aa5",
  storageBucket: "iraqi-drug-guide-38aa5.firebasestorage.app",
  messagingSenderId: "457879362257",
  appId: "1:457879362257:web:5e7b517acd09dc0d2203f0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.db = db;
window.collection = collection;
window.getDocs = getDocs;