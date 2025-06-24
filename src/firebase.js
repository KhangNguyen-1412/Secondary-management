// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyChfMPi3vUZKLprpluClREkiEE4uHoAdd4",
  authDomain: "school-management-e39e2.firebaseapp.com",
  projectId: "school-management-e39e2",
  storageBucket: "school-management-e39e2.firebasestorage.app",
  messagingSenderId: "111026624529",
  appId: "1:111026624529:web:5bb45c30dbb6a46d2a39b0",
  measurementId: "G-NFZVZ34Q4P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);