import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

export async function POST(req: Request) {
  try {
    // 1. Controllo di sicurezza: verifica che le variabili d'ambiente esistano
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      return NextResponse.json({ 
        error: 'Variabili d ambiente Firebase Admin mancanti su Netlify.' 
      }, { status: 500 });
    }

    // 2. Inizializzazione sicura di Firebase Admin (solo a runtime)
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }

    const { fcmToken, title, body } = await req.json();

    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM Token mancante' }, { status: 400 });
    }

    // 3. Invio della notifica tramite il protocollo moderno FCM v1
    const message = {
      token: fcmToken,
      notification: {
        title: title || 'Nuova notifica Azphur',
        body: body || 'Hai una nuova informazione sulla tua corsa!',
      },
      webpush: {
        fcmOptions: {
          link: '/EV/driver',
        },
      },
    };

    const response = await admin.messaging().send(message);

    return NextResponse.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error("Errore invio notifica push:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}