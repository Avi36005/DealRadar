import { auth } from './firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

/**
 * Get the current user's ID token for API requests
 */
export async function getIdToken() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          resolve(token);
        } catch (error) {
          reject(error);
        }
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    return false;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback: (user: any) => void) {
  return onAuthStateChanged(auth, callback);
}
