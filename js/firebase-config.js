// Firebase Consoleで取得した設定です。
// この設定情報はFirebaseのWebアプリ接続に使う公開情報です。
export const firebaseConfig = {
  apiKey: "AIzaSyDiaAHF0iceYJNlSDKFKtHKnCETeMCW8IA",
  authDomain: "no32-player-stats.firebaseapp.com",
  projectId: "no32-player-stats",
  storageBucket: "no32-player-stats.firebasestorage.app",
  messagingSenderId: "934416639889",
  appId: "1:934416639889:web:cd0e319fa86c1acb3fdc30"
};

// Firebaseクラウド保存を有効化
export const useFirebase = true;

// Firestore上の保存場所。通常は変更不要です。
export const firestoreCollection = "teams";
export const firestoreDocument = "no32";
