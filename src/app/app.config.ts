import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'crud-login-salud',
        appId: '1:249280736281:web:5df6bc0eda7934fd364e88',
        storageBucket: 'crud-login-salud.firebasestorage.app',
        apiKey: 'AIzaSyDBuBiEhrf5TPg8P3JMkRq2RLif7P4RdUE',
        authDomain: 'crud-login-salud.firebaseapp.com',
        messagingSenderId: '249280736281',
      })
    ),
    provideFirestore(() => getFirestore()),
  ],
};