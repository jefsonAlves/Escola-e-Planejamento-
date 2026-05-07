import { App, URLOpenListenerEvent } from '@capacitor/app';
import { getAuth, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const initGoogleAuthListener = (onAuthSuccess: (token: string) => void) => {
  App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
    const url = event.url;
    if (url.includes('auth')) {
      const urlObj = new URL(url);
      
      const hashParams = new URLSearchParams(urlObj.hash.substring(1));
      let accessToken = hashParams.get('access_token');
      let idToken = hashParams.get('id_token');
      
      if (!accessToken) {
         accessToken = urlObj.searchParams.get('access_token');
         idToken = urlObj.searchParams.get('id_token');
      }

      if (accessToken) {
        localStorage.setItem('google_access_token', accessToken);
        
        if (idToken) {
          try {
            const auth = getAuth();
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            
            // Create or update teacher profile in Firestore
            const { db } = await import('../firebase');
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              email: userCredential.user.email,
              displayName: userCredential.user.displayName,
              photoURL: userCredential.user.photoURL,
              role: 'teacher',
              updatedAt: serverTimestamp(),
            }, { merge: true });

          } catch (e) {
            console.error('Firebase Auth Error:', e);
          }
        }
        
        window.dispatchEvent(new CustomEvent('google-access-token-updated', { detail: accessToken }));
        onAuthSuccess(accessToken);
      }
    }
  });
};

export const logout = () => {
  const auth = getAuth();
  auth.signOut();
  localStorage.removeItem('google_access_token');
  window.dispatchEvent(new CustomEvent('google-access-token-updated', { detail: null }));
};
