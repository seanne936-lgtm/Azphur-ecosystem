import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { fcmToken, title, body } = await req.json();

    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM Token mancante' }, { status: 400 });
    }

    // Chiamata diretta all'API FCM legacy/standard di Firebase via fetch
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Usa la Server Key/API Key di Firebase
        'Authorization': `key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: {
          title: title || 'Nuova notifica Azphur',
          body: body || 'Hai una nuova informazione sulla tua corsa!',
          icon: '/favicon.ico',
        },
      }),
    });

    const data = await response.json();

    return NextResponse.json({ success: true, result: data });
  } catch (error: any) {
    console.error("Errore invio notifica push:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}