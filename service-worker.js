// Bolor Games — PWA Service Worker
// Зорилго: апп-ыг хурдан ачаалуулах, сүлжээгүй үед ч дэлгэц цагаан гарахгүй байлгах.
// Firestore/Auth/Cloud Function-ийн бодит цагийн өгөгдлийг кэшлэхгүй — зөвхөн
// статик файлуудыг (HTML/CSS/JS/зураг) л кэшлэнэ, тиймээс тоглоомын өгөгдөл
// үргэлж шинэ хэвээр байна.

const CACHE_NAME = 'bolorgames-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Firebase/Google/Cloud Function-ийн хүсэлтийг хэзээ ч кэшлэхгүй, шууд сүлжээгээр дамжуулна
  if (url.includes('firestore.googleapis.com') ||
      url.includes('firebaseapp.com') ||
      url.includes('googleapis.com') ||
      url.includes('cloudfunctions.net') ||
      url.includes('cloudinary.com') ||
      event.request.method !== 'GET') {
    return; // browser-ийн анхны сүлжээний зан үйлийг хэвээр орхино
  }

  // Статик файлуудад: сүлжээг эхлээд оролдоод, амжилтгүй бол кэшээс өгнө (network-first)
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request).then(r => r || caches.match('/index.html')))
  );
});
