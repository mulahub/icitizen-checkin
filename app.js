// Tiện ích dùng chung cho cả 3 trang. Gọi API Apps Script bằng JSONP (thẻ <script>)
// để tránh CORS, vì trang này (GitHub Pages) và Apps Script khác tên miền.
(function (w) {
  function jsonpOnce(fn, args, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var cb = '_icz_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
      var done = false;
      function don(ok, v, retryable) {
        if (done) return; done = true;
        clearTimeout(timer); delete w[cb]; s.remove();
        if (ok) return resolve(v);
        var err = new Error(v);
        err._retry = !!retryable;
        reject(err);
      }
      w[cb] = function (out) {
        out && out.ok ? don(true, out.data) : don(false, (out && out.loi) || 'Lỗi không rõ', false);
      };
      var s = document.createElement('script');
      s.src = w.APPS_SCRIPT_URL + '?fn=' + encodeURIComponent(fn) +
        '&args=' + encodeURIComponent(JSON.stringify(args || [])) + '&cb=' + cb;
      s.onerror = function () { don(false, 'Mất mạng hoặc máy chủ không phản hồi.', true); };
      document.body.appendChild(s);
      var timer = setTimeout(function () { don(false, 'Hết thời gian chờ, thử lại.', true); }, timeoutMs || 15000);
    });
  }

  function jsonp(fn, args, timeoutMs) {
    var left = 2;
    function thu() {
      return jsonpOnce(fn, args, timeoutMs).catch(function (err) {
        if (!err._retry || left-- <= 0) throw err;
        return new Promise(function (r) { setTimeout(r, 600); }).then(thu);
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
