import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Inizializzazione sicura di Firebase Admin (evita doppie inizializzazioni)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(req: Request) {
  try {
    const { fcmToken, title, body } = await req.json();

    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM Token mancante' }, { status: 400 });
    }

    // Payload basato sul nuovo standard FCM HTTP v1 tramite Admin SDK
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