// サービスのバージョンが変わったときにキャッシュを更新するためにバージョン名を変更します
const CACHE_NAME = 'my-pwa-cache-v1'; 

// オフラインで利用できるようにキャッシュしておきたいファイルの一覧
// 🚨 注意: ここにリストされたファイルは全てGitHubにアップロードする必要があります
const urlsToCache = [
    // GitHub Pagesのルートパスとファイル名を指定
    '/YOUR_REPO_NAME/', // 💡 修正必須: リポジトリ名 (例: /Task-pass/) に置き換えてください
    '/YOUR_REPO_NAME/index.html',
    '/YOUR_REPO_NAME/style.css',
    '/YOUR_REPO_NAME/main.js',
    '/YOUR_REPO_NAME/manifest.json',
    '/YOUR_REPO_NAME/icon-192.png', // 🚨 必要なアイコンファイルを全てリストアップしてください
    '/YOUR_REPO_NAME/icon-512.png'  // 🚨 必要なアイコンファイルを全てリストアップしてください
];

// Service Worker がインストール（ブラウザに登録）された時の処理
self.addEventListener('install', event => {
    // キャッシュをオープンし、urlsToCache のファイルを保存する
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                // fetch に失敗してもインストールを止めないように .catch() を追加するのが一般的ですが、
                // 初回は全てのファイルが必須なので、このまま失敗を許可します。
                return cache.addAll(urlsToCache);
            })
    );
});

// アプリがネットワークリクエストを出した時の処理 (オフライン処理の核心)
self.addEventListener('fetch', event => {
    event.respondWith(
        // ネットワーク接続が不要な場合、キャッシュから取得
        caches.match(event.request)
            .then(response => {
                // キャッシュに見つかったら、それを返す
                if (response) {
                    return response;
                }
                // キャッシュになければ、ネットワークにリクエストを送り、新しいデータを取得する
                return fetch(event.request);
            })
    );
});

// キャッシュを更新する時の処理 (古いキャッシュの削除)
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    
    event.waitUntil(
        // 現在のキャッシュ以外の古いキャッシュをすべて削除する
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
