// Tiện ích dùng chung cho mọi trang. Gọi API Cloudflare Workers + D1 qua fetch() POST
// (nhanh < 30ms, chịu tải hàng nghìn người, không dính 302/JSONP của Apps Script).
(function (w) {
  function goiApiLan(fn, args, timeoutMs) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, timeoutMs || 12000);
    return fetch(w.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fn: fn, args: args || [] }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) {
        var eHttp = new Error('Máy chủ bận (' + res.status + '), thử lại.');
        eHttp._retry = res.status >= 500;
        throw eHttp;
      }
      return res.json();
    }, function (err) {
      clearTimeout(timer);
      var msg = (err && err.name === 'AbortError')
        ? 'Hết thời gian chờ, thử lại.'
        : 'Mất mạng hoặc máy chủ không phản hồi.';
      var eNet = new Error(msg);
      eNet._retry = true;
      throw eNet;
    }).then(function (out) {
      if (out && out.ok) return out.data;
      throw new Error((out && out.loi) || 'Lỗi không rõ');
    });
  }

  function jsonp(fn, args, timeoutMs) {
    var left = 2;
    function thu() {
      return goiApiLan(fn, args, timeoutMs).catch(function (err) {
        if (!err._retry || left-- <= 0) throw err;
        return new Promise(function (r) { setTimeout(r, 500); }).then(thu);
      });
    }
    return thu();
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function toast(t, ok) {
    var el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.hidden = true; document.body.appendChild(el); }
    el.textContent = t; el.className = 'toast ' + (ok ? 'ok2 nhay' : 'sai'); el.hidden = false;
    clearTimeout(el._h); el._h = setTimeout(function () { el.hidden = true; }, 3200);
    if (ok !== undefined && navigator.vibrate) navigator.vibrate(ok ? 80 : [80, 60, 80]);
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  /** Hiệu ứng ăn mừng ở mốc thành công (đăng ký lần đầu, đủ COMBO…). Im lặng nếu thư viện chưa tải kịp/offline. */
  function anMung(manh) {
    if (typeof w.confetti !== 'function') return;
    try {
      w.confetti({ particleCount: manh || 90, spread: 75, origin: { y: 0.4 }, colors: ['#0b6e4f', '#4ade80', '#fbbf24', '#ffffff'] });
    } catch (e) {}
  }

  /** Chớp xanh ngắn + rung nhẹ cho thao tác lặp lại của nhân viên (Trạm) — gọn hơn confetti để không gây phiền khi bấm hàng trăm lần. */
  function nhapNhay(el) {
    if (!el) return;
    el.classList.remove('nhay'); void el.offsetWidth; el.classList.add('nhay');
  }

  w.ICZ = { jsonp: jsonp, esc: esc, toast: toast, anMung: anMung, nhapNhay: nhapNhay };
})(window);
