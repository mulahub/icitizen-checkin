// Service worker: trang HTML luôn lấy bản MỚI NHẤT khi có mạng (network-first) — tránh lặp lỗi
// "sửa xong vẫn thấy bản cũ" vì app đang sửa nhanh mỗi ngày. Tài nguyên tĩnh (css/js/icon) mới
// cache-first cho nhanh. KHÔNG cache lượt gọi API — check-in luôn cần mạng để ghi đúng Google Sheet.
var CACHE = 'icitizen-v10';
var VO = ['./', 'index.html', 'tram.html', 'admin.html', 'cua-toi.html', 'cai-dat.html', 'nhan-vien.html', 'xep-hang.html',
  'style.css', 'app.js', 'config.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/logo-header.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(VO); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

function luuCache_(req, res) {
  var copy = res.clone();
  caches.open(CACHE).then(function (c) { c.put(req, copy); });
  return res;
}

self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (u.hostname.indexOf('script.google') >= 0 || u.hostname.indexOf('workers.dev') >= 0) return; // không đụng lượt gọi API
  if (e.request.method !== 'GET') return;

  var laTrangHtml = e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').indexOf('text/html') >= 0 ||
    u.pathname.endsWith('/config.js') || u.pathname.endsWith('/app.js') || u.pathname.endsWith('/style.css');
  if (laTrangHtml) {
    // Network-first: có mạng là lấy bản mới nhất; mất mạng mới dùng bản cũ trong cache.
    e.respondWith(
      fetch(e.request).then(function (res) { return luuCache_(e.request, res); })
        .catch(function () { return caches.match(e.request); })
    );
    return;
  }

  // Tài nguyên tĩnh: trả cache ngay cho nhanh, nhưng luôn tải lại ngầm để lần sau có bản mới.
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      var net = fetch(e.request).then(function (res) { return luuCache_(e.request, res); }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
