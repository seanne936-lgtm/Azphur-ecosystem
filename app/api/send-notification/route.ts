import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Definizione di tutti i possibili template di notifica (stile Grab)
const NOTIFICATION_TEMPLATES: Record<string, { title: string; body: string; link: string }> = {
  // --- NOTIFICHE LATO DRIVER ---
  'DRIVER_NEW_BOOKING': {
    title: 'New Ride Request!',
    body: 'A passenger nearby has booked a ride. Tap to view and accept.',
    link: '/EV/driver',
  },
  'DRIVER_BOOKING_CANCELLED': {
    title: 'Booking Cancelled',
    body: 'The passenger has cancelled the ride request.',
    link: '/EV/driver',
  },
  'DRIVER_TIP_RECEIVED': {
    title: 'Tip Received!',
    body: 'Great job! You just received a tip from your passenger.',
    link: '/EV/driver',
  },
  'DRIVER_SURGE_ALERT': {
    title: 'High Demand Area!',
    body: 'Surge pricing is active in your zone. Head there to earn more!',
    link: '/EV/driver',
  },

  // --- NOTIFICHE LATO CLIENTE (PASSENGER) ---
  'CLIENT_DRIVER_ACCEPTED': {
    title: 'Driver Found!',
    body: 'Your driver has accepted your request and is heading to your location.',
    link: '/EV/client',
  },
  'CLIENT_DRIVER_ARRIVED': {
    title: 'Driver Arrived!',
    body: 'Your driver has arrived at the pickup point. Please meet them.',
    link: '/EV/client',
  },
  'CLIENT_TRIP_STARTED': {
    title: 'Trip Started',
    body: 'You are on your way. Sit back, relax, and enjoy the ride with Azphur!',
    link: '/EV/client',
  },
  'CLIENT_TRIP_COMPLETED': {
    title: 'Trip Completed',
    body: 'You have arrived at your destination. Thank you for riding with us!',
    link: '/EV/client',
  },
  'CLIENT_TRIP_CANCELLED': {
    title: 'Ride Cancelled',
    body: 'Your booking has been cancelled successfully.',
    link: '/EV/client',
  },
};

export async function POST(req: Request) {
  try {
    // 1. Security check: verify that environment variables exist
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      return NextResponse.json({ 
        error: 'Firebase Admin environment variables missing on Netlify.' 
      }, { status: 500 });
    }

    // Clean the private key from potential quotes and format line breaks
    let privateKey = process.env.FIREBASE_PRIVATE_KEY
      .replace(/^["']|["']$/g, '')
      .replace(/\\n/g, '\n');

    // 2. Safe initialization of Firebase Admin (runtime only)
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    }

    const { fcmToken, type, customTitle, customBody, customLink } = await req.json();

    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM Token missing' }, { status: 400 });
    }

    // 3. Select template or use custom values
    let notificationData = {
      title: 'New Azphur Notification',
      body: 'You have a new update regarding your service.',
      link: '/EV/driver',
    };

    if (type && NOTIFICATION_TEMPLATES[type]) {
      notificationData = NOTIFICATION_TEMPLATES[type];
    }

    // Allow overriding with custom text if provided dynamically
    const finalTitle = customTitle || notificationData.title;
    const finalBody = customBody || notificationData.body;
    const finalLink = customLink || notificationData.link;

    // 4. Send notification via modern FCM v1 protocol
    const message = {
      token: fcmToken,
      notification: {
        title: finalTitle,
        body: finalBody,
      },
      webpush: {
        fcmOptions: {
          link: finalLink,
        },
      },
    };

    const response = await admin.messaging().send(message);

    return NextResponse.json({ success: true, messageId: response, typeUsed: type || 'custom' });
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}