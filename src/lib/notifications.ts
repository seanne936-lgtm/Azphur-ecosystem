// lib/notifications.ts

export type NotificationType = 
  | 'DRIVER_NEW_BOOKING'
  | 'DRIVER_BOOKING_CANCELLED'
  | 'DRIVER_TIP_RECEIVED'
  | 'DRIVER_SURGE_ALERT'
  | 'CLIENT_DRIVER_ACCEPTED'
  | 'CLIENT_DRIVER_ARRIVED'
  | 'CLIENT_TRIP_STARTED'
  | 'CLIENT_TRIP_COMPLETED'
  | 'CLIENT_TRIP_CANCELLED';

/**
 * Invia una notifica push in stile Grab sia al driver che al passeggero.
 * @param targetFcmToken Il token FCM del destinatario salvato nel database.
 * @param notificationType La tipologia di notifica basata sul template predefinito.
 * @param customTitle (Opzionale) Un titolo personalizzato per sovrascrivere il template.
 * @param customBody (Opzionale) Un testo personalizzato per sovrascrivere il template.
 */
export async function triggerGrabNotification(
  targetFcmToken: string, 
  notificationType: NotificationType,
  customTitle?: string,
  customBody?: string
) {
  try {
    if (!targetFcmToken) {
      console.warn("Impossibile inviare la notifica: FCM Token mancante.");
      return { success: false, error: "FCM Token missing" };
    }

    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        fcmToken: targetFcmToken,
        type: notificationType,
        ...(customTitle && { customTitle }),
        ...(customBody && { customBody }),
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send notification');
    }

    console.log("Notification sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error triggering notification:", error);
    return { success: false, error };
  }
}