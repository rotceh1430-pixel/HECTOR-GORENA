import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- CONFIGURACIÓN DE FIREBASE ---
// 1. Ve a la consola de Firebase: https://console.firebase.google.com/
// 2. Entra a "Configuración del proyecto" (ícono de engranaje) -> General.
// 3. Baja hasta "Tus apps" y copia el objeto 'firebaseConfig'.
// 4. Reemplaza los valores de abajo con los tuyos reales:

const firebaseConfig = {

  apiKey: "AIzaSyBVXJtHblm4UTYyV1WyoQcHRpC1oqRqrXU",
  authDomain: "dulce-mimo.firebaseapp.com",
  projectId: "dulce-mimo",
  storageBucket: "dulce-mimo.firebasestorage.app",
  messagingSenderId: "516054814700",
  appId: "1:516054814700:web:4d29205e7e181695767ac9",
  measurementId: "G-7RG9NKFH9T"
};

let app;
let db: any = null;

// Lógica de seguridad:
// El sistema solo intentará conectarse a la nube si detecta que has cambiado
// los valores por defecto ("tu-proyecto"). Si no, usará el modo Offline.

const isConfigured = firebaseConfig.apiKey !== "TU_API_KEY_AQUI" && 
                     !firebaseConfig.projectId.includes("tu-proyecto");

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("✅ Conexión a Firebase Nube establecida.");
  } catch (e) {
    console.error("❌ Error inicializando Firebase:", e);
  }
} else {
  console.warn("⚠️ MODO OFFLINE: Firebase no está configurado. Usando almacenamiento local.");
}

export { db };