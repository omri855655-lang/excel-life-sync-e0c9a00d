// Push notification service worker
self.addEventListener('push', (event) => {
  let data = { title: 'התראה', body: 'יש לך עדכון חדש', icon: '/app-icon.png' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/app-icon.png',
    badge: '/app-icon.png',
    dir: 'rtl',
    lang: 'he',
    tag: data.tag || 'default',
    data: data.url ? { url: data.url } : {},
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/personal';
  event.waitUntil(clients.openWindow(url));
});
