/**
 * ==========================================================================
 * VIDOZONE - CONFIGURATION FIREBASE
 * ==========================================================================
 * 
 * Instructions pour connecter votre propre projet Firebase :
 * 1. Rendez-vous sur la console Firebase : https://console.firebase.google.com/
 * 2. Créez un projet (ou sélectionnez un projet existant).
 * 3. Ajoutez une application Web (icône </>) et copiez vos paramètres.
 * 4. Remplacez les valeurs ci-dessous dans l'objet `firebaseConfig`.
 * 5. Activez "Authentication" (Email/Mot de passe), "Cloud Firestore", et "Cloud Storage".
 * 
 * NOTE : Si vous n'avez pas encore renseigné vos clés Firebase réelles,
 * VidoZone fonctionne automatiquement en mode "Local & Hors-ligne"
 * avec persistance dans le navigateur/WebView (localStorage) sans aucune erreur !
 */

const firebaseConfig = {
  apiKey: "VOTRE_API_KEY_ICI",
  authDomain: "vidozone-app.firebaseapp.com",
  projectId: "vidozone-app",
  storageBucket: "vidozone-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Vérifie si l'utilisateur a configuré de véritables identifiants Firebase
const isFirebaseReady = () => {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "VOTRE_API_KEY_ICI" &&
    firebaseConfig.apiKey.length > 15
  );
};

// Initialisation conditionnelle
let firebaseApp = null;
let firebaseAuth = null;
let firestoreDb = null;
let firebaseStorage = null;

try {
  if (isFirebaseReady() && typeof firebase !== "undefined") {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firebaseAuth = firebase.auth();
    firestoreDb = firebase.firestore();
    firebaseStorage = firebase.storage();
    console.log("VidoZone : Connecté avec succès à Firebase.");
  } else {
    console.log("VidoZone : Mode stockage local actif (clés Firebase par défaut).");
  }
} catch (err) {
  console.warn("VidoZone : Initialisation Firebase reportée en mode local :", err.message);
}

// Export global pour être accessible dans toutes les pages
window.VZ_FIREBASE = {
  config: firebaseConfig,
  isReady: isFirebaseReady,
  app: firebaseApp,
  auth: firebaseAuth,
  db: firestoreDb,
  storage: firebaseStorage
};
