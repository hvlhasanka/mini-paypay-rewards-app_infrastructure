interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export async function sendExpoPush(message: PushMessage): Promise<void> {
  if (!message.to || !message.to.startsWith('ExponentPushToken')) return;

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: message.to,
        sound: message.sound ?? 'default',
        title: message.title,
        body: message.body,
        data: message.data ?? {},
      }),
    });
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn('Expo push send failed', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Expo push send threw', err);
  }
}
