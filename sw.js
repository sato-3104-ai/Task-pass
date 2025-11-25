// --- Service Worker スケルトン (PWA対応) ---
// GitHub Pagesで公開する際の基本キャッシュ戦略

const CACHE_NAME = 'todo-flow-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js'
];

// インストール処理: キャッシュにファイルを保存
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// フェッチ処理: キャッシュから提供、またはネットワークから取得
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにレスポンスがあればそれを使う
        if (response) {
          return response;
        }
        // なければネットワークから取得
        return fetch(event.request);
      })
  );
});

// キャッシュのクリーンアップ (バージョンアップ時)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
