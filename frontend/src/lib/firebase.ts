import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  GoogleAuthProvider,
  OAuthProvider,
  FacebookAuthProvider,
  signInWithCredential,
  signInWithPopup,
  // @ts-ignore — expo adapter
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Complete auth sessions
WebBrowser.maybeCompleteAuthSession();

// Firebase Config — Project ID: rovr-b6353
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCRn5UlUhXBMAOJLaD4OhFM5QTeFjmHZtA',
  authDomain: 'rovr-b6353.firebaseapp.com',
  projectId: 'rovr-b6353',
  storageBucket: 'rovr-b6353.firebasestorage.app',
  messagingSenderId: '30362906740',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:30362906740:web:a7b1f8de021572a63b2121',
  measurementId: 'G-5E797PLVNG',
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { auth };

export type SocialProvider = 'google' | 'apple' | 'facebook';

const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '30362906740-1n4mg2jmvng7fccpvfillqi30nnk99uu.apps.googleusercontent.com';

// ─────────────────────────── Google Sign-In ───────────────────────────
// Uses Firebase's Authorized Redirect URI directly with WebBrowser for seamless in-app token interception

export async function signInWithGoogle() {
  // Web Platform: Standard Firebase popup
  if (Platform.OS === 'web') {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    const result = await signInWithPopup(auth, provider);
    return { success: true, user: result.user };
  }

  // Native Platform: Direct Google OAuth with Firebase Authorized redirect URI
  const redirectUri = `https://${firebaseConfig.authDomain}/__/auth/handler`;
  const nonce = Math.random().toString(36).substring(2, 15);

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    GOOGLE_CLIENT_ID
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=id_token%20token&scope=${encodeURIComponent(
    'openid profile email'
  )}&nonce=${encodeURIComponent(nonce)}&prompt=select_account`;

  const result = await WebBrowser.openAuthSessionAsync(googleAuthUrl, redirectUri);

  if (result.type === 'success' && result.url) {
    try {
      const parsedUrl = new URL(result.url);
      const params = new URLSearchParams(
        parsedUrl.hash ? parsedUrl.hash.substring(1) : parsedUrl.search
      );

      const idToken = params.get('id_token');
      const accessToken = params.get('access_token');

      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken, accessToken || undefined);
        const userCred = await signInWithCredential(auth, credential);
        return { success: true, user: userCred.user };
      }
    } catch {
      if (auth.currentUser) {
        return { success: true, user: auth.currentUser };
      }
    }
  }

  // Check if session was authenticated
  if (auth.currentUser) {
    return { success: true, user: auth.currentUser };
  }

  return { success: false, cancelled: result.type !== 'success' };
}

// ─────────────────────────── Apple Sign-In ───────────────────────────

export async function signInWithApple() {
  const rawNonce = Crypto.getRandomValues(new Uint8Array(32))
    .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');

  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const redirectUri = `https://${firebaseConfig.authDomain}/__/auth/handler`;
  const appleAuthUrl = `https://appleid.apple.com/auth/authorize?client_id=rovr-b6353&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code%20id_token&scope=name%20email&response_mode=fragment&nonce=${hashedNonce}`;

  const result = await WebBrowser.openAuthSessionAsync(appleAuthUrl, redirectUri);

  if (result.type === 'success' && result.url) {
    const parsedUrl = new URL(result.url);
    const params = new URLSearchParams(
      parsedUrl.hash ? parsedUrl.hash.substring(1) : parsedUrl.search
    );
    const idToken = params.get('id_token');
    if (idToken) {
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken,
        rawNonce,
      });
      const userCred = await signInWithCredential(auth, credential);
      return { success: true, user: userCred.user };
    }
  }

  return { success: false, cancelled: result.type !== 'success' };
}

// ─────────────────────────── Facebook Sign-In ───────────────────────────

export async function signInWithFacebook() {
  const redirectUri = `https://${firebaseConfig.authDomain}/__/auth/handler`;
  const fbAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '';

  const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${encodeURIComponent(
    fbAppId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=token&scope=public_profile,email`;

  const result = await WebBrowser.openAuthSessionAsync(fbAuthUrl, redirectUri);

  if (result.type === 'success' && result.url) {
    const parsedUrl = new URL(result.url);
    const params = new URLSearchParams(
      parsedUrl.hash ? parsedUrl.hash.substring(1) : parsedUrl.search
    );
    const accessToken = params.get('access_token');
    if (accessToken) {
      const credential = FacebookAuthProvider.credential(accessToken);
      const userCred = await signInWithCredential(auth, credential);
      return { success: true, user: userCred.user };
    }
  }

  return { success: false, cancelled: result.type !== 'success' };
}

// ─────────────────────────── Unified Handler ───────────────────────────

export async function signInWithSocialProvider(provider: SocialProvider) {
  try {
    switch (provider) {
      case 'google':
        return await signInWithGoogle();
      case 'apple':
        return await signInWithApple();
      case 'facebook':
        return await signInWithFacebook();
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Social authentication failed';
    throw new Error(message);
  }
}
