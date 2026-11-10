/**
 * hub-sync.js - Hệ thống đồng bộ đa học phần (All-in-One Multi-Course Sync)
 * Cho phép đồng bộ 1 lần toàn bộ tiến độ của tất cả các môn học (TMĐT, Dữ liệu lớn...)
 * Hỗ trợ: Mã QR 1 chạm, File sao lưu (.json), Mã rút gọn 6 ký tự đám mây (/api/sync)
 */

(function () {
  'use strict';

  const SYNC_CHOICE_MAP = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
  const SYNC_CHOICE_REV = ['', 'A', 'B', 'C', 'D'];

  let currentShortUrl = null;
  let currentShortCode = null;
  let isGeneratingSync = false;

  // Base64 URL Helpers
  function toBase64Url(str) {
    try {
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
      return '';
    }
  }

  function fromBase64Url(str) {
    try {
      let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch (e) {
      return null;
    }
  }

  // --- 1. PACKING DATA (ĐÓNG GÓI TIẾN ĐỘ TẤT CẢ CÁC MÔN) ---

  // Đóng gói TMĐT (CSE703102)
  function packTmdtState() {
    try {
      const raw = localStorage.getItem('cse703102-v1');
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s) return null;

      // Thu gọn mảng câu hỏi
      function packMap(map) {
        if (!map) return '';
        const list = [];
        for (const [k, v] of Object.entries(map)) {
          const id = parseInt(k, 10);
          if (!isNaN(id) && v && v.choice) {
            list.push(id + v.choice);
          }
        }
        return list.join(',');
      }

      return {
        q: packMap(s.quiz),
        f: packMap(s.flash),
        m: packMap(s.formula),
        s: s.star ? Object.keys(s.star).filter(k => s.star[k]) : [],
        k: s.maxStreak || 0,
        n: s.notes || {},
        e: s.essay || {}
      };
    } catch (e) {
      return null;
    }
  }

  // Đóng gói Dữ liệu lớn (CSE405)
  function packBigDataState() {
    try {
      const raw = localStorage.getItem('big-data-practice-v1');
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.answers) return null;

      // Thu gọn: id:selected:correct
      const list = [];
      for (const [id, rec] of Object.entries(s.answers)) {
        if (rec && rec.selected && rec.selected.length > 0) {
          const sel = rec.selected.join('');
          const cor = rec.correct === true ? '1' : (rec.correct === false ? '0' : 'x');
          list.push(`${id}:${sel}:${cor}`);
        }
      }

      return {
        a: list.join(';'),
        b: s.batch || '1',
        l: s.last || {}
      };
    } catch (e) {
      return null;
    }
  }

  // Đóng gói toàn bộ các môn thành chuỗi siêu ngắn
  function packAllHubData() {
    const bundle = {
      app: 'phenikaa-hub',
      v: 2,
      ts: Date.now(),
      tmdt: packTmdtState(),
      bd: packBigDataState()
    };

    return toBase64Url(JSON.stringify(bundle));
  }

  // --- 2. UNPACKING & MERGING DATA (GIẢI NÉN VÀ HỢP NHẤT) ---

  // Hợp nhất dữ liệu TMĐT
  function mergeTmdtState(imported) {
    if (!imported) return 0;
    try {
      let state = {};
      try {
        state = JSON.parse(localStorage.getItem('cse703102-v1') || '{}') || {};
      } catch (e) {}

      state.quiz = state.quiz || {};
      state.flash = state.flash || {};
      state.formula = state.formula || {};
      state.star = state.star || {};
      state.notes = state.notes || {};
      state.essay = state.essay || {};

      let added = 0;

      // Giải nén câu hỏi
      function unpackMap(str, target) {
        if (!str || typeof str !== 'string') return;
        str.split(',').forEach(item => {
          if (!item) return;
          const match = item.match(/^(\d+)([A-D1-4])$/i);
          if (match) {
            const id = parseInt(match[1], 10);
            const ch = match[2].toUpperCase();
            if (!target[id]) {
              target[id] = { choice: ch };
              added++;
            }
          }
        });
      }

      if (imported.q) unpackMap(imported.q, state.quiz);
      if (imported.f) unpackMap(imported.f, state.flash);
      if (imported.m) unpackMap(imported.m, state.formula);

      if (Array.isArray(imported.s)) {
        imported.s.forEach(id => {
          if (!state.star[id]) {
            state.star[id] = true;
            added++;
          }
        });
      }

      if (imported.k && imported.k > (state.maxStreak || 0)) {
        state.maxStreak = imported.k;
      }

      if (imported.n && typeof imported.n === 'object') {
        Object.assign(state.notes, imported.n);
      }

      if (imported.e && typeof imported.e === 'object') {
        Object.assign(state.essay, imported.e);
      }

      localStorage.setItem('cse703102-v1', JSON.stringify(state));
      return added;
    } catch (e) {
      console.warn('Error merging TMĐT state:', e);
      return 0;
    }
  }

  // Hợp nhất dữ liệu Dữ liệu lớn
  function mergeBigDataState(imported) {
    if (!imported) return 0;
    try {
      let current = {};
      try {
        current = JSON.parse(localStorage.getItem('big-data-practice-v1') || '{}') || {};
      } catch (e) {}

      current.answers = current.answers || {};
      current.last = current.last || {};

      let added = 0;

      if (imported.a && typeof imported.a === 'string') {
        imported.a.split(';').forEach(item => {
          if (!item) return;
          const parts = item.split(':');
          if (parts.length >= 2) {
            const id = parts[0];
            const selStr = parts[1];
            const corStr = parts[2];

            const selected = selStr.split('');
            const correct = corStr === '1' ? true : (corStr === '0' ? false : null);

            if (!current.answers[id]) {
              current.answers[id] = {
                selected,
                correct,
                checked: true
              };
              added++;
            }
          }
        });
      }

      if (imported.b) current.batch = imported.b;
      if (imported.l && typeof imported.l === 'object') {
        Object.assign(current.last, imported.l);
      }

      localStorage.setItem('big-data-practice-v1', JSON.stringify(current));
      return added;
    } catch (e) {
      console.warn('Error merging Big Data state:', e);
      return 0;
    }
  }

  // Giải mã và hợp nhất toàn bộ
  function unpackAndMergeHubData(payload) {
    if (!payload) return { success: false, count: 0 };

    try {
      let data = null;

      // 1. Nếu là đối tượng JSON trực tiếp (ví dụ tải từ file backup .json)
      if (typeof payload === 'object') {
        data = payload;
      } else if (typeof payload === 'string') {
        const raw = payload.trim();
        // Kiểm tra xem là chuỗi Base64Url hay JSON thô
        if (raw.startsWith('{')) {
          data = JSON.parse(raw);
        } else {
          const jsonStr = fromBase64Url(raw);
          if (jsonStr) {
            data = JSON.parse(jsonStr);
          }
        }
      }

      if (!data) return { success: false, count: 0 };

      let totalAdded = 0;

      // A. Nếu là định dạng Hub Version 2 (Multi-course bundle)
      if (data.app === 'phenikaa-hub' || data.tmdt || data.bd) {
        if (data.tmdt) totalAdded += mergeTmdtState(data.tmdt);
        if (data.bd) totalAdded += mergeBigDataState(data.bd);
      }
      // B. Nếu là định dạng file sao lưu JSON thô ({ "cse703102-v1": ..., "big-data-practice-v1": ... })
      else if (data['cse703102-v1'] || data['big-data-practice-v1']) {
        if (data['cse703102-v1']) {
          localStorage.setItem('cse703102-v1', JSON.stringify(data['cse703102-v1']));
          totalAdded += 10;
        }
        if (data['big-data-practice-v1']) {
          localStorage.setItem('big-data-practice-v1', JSON.stringify(data['big-data-practice-v1']));
          totalAdded += 10;
        }
      }

      // Cập nhật lại giao diện danh sách học phần trên trang chủ nếu có hàm render
      if (typeof renderCourses === 'function') {
        renderCourses();
      }

      return { success: true, count: totalAdded };
    } catch (e) {
      console.error('Failed to unpack sync data:', e);
      return { success: false, count: 0 };
    }
  }

  // --- 3. ĐỒNG BỘ ĐÁM MÂY & MÃ RÚT GỌN 6 KÝ TỰ (/api/sync) ---

  function getSyncTargetUrl(compactPayload) {
    const isLocal = !window.location.hostname || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const base = isLocal ? 'https://on-tap-cse703102.vercel.app/' : (window.location.origin + '/');
    return base + '?sync=' + encodeURIComponent(compactPayload);
  }

  async function generateCloudSyncUrl(compactPayload) {
    const targetUrl = getSyncTargetUrl(compactPayload);

    // 1. Thử gọi Vercel Serverless Function /api/sync
    try {
      const resp = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.shortUrl && data.id) {
          return { shortUrl: data.shortUrl, shortCode: data.id };
        }
      }
    } catch (e) {
      console.warn('/api/sync failed, trying direct is.gd:', e);
    }

    // 2. Thử trực tiếp is.gd
    try {
      const resp = await fetch('https://is.gd/create.php?format=json&url=' + encodeURIComponent(targetUrl));
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.shorturl) {
          const id = data.shorturl.split('/').filter(Boolean).pop();
          return { shortUrl: data.shorturl, shortCode: id };
        }
      }
    } catch (e) {
      console.warn('is.gd failed:', e);
    }

    // 3. Fallback: Dùng chính link compact target
    return { shortUrl: targetUrl, shortCode: 'OFFLINE' };
  }

  // --- 4. GIAO DIỆN MODAL ĐỒNG BỘ TRANG CHỦ ---

  window.openGlobalSyncModal = async function () {
    const modal = document.getElementById('globalSyncModal');
    if (!modal) return;

    // 1. Cập nhật số liệu thống kê trong modal
    updateSyncSummaryStats();

    modal.classList.add('active');

    // 2. Tạo mã đồng bộ và QR nếu chưa có
    refreshGlobalSync();
  };

  window.closeGlobalSyncModal = function () {
    const modal = document.getElementById('globalSyncModal');
    if (modal) modal.classList.remove('active');
  };

  function updateSyncSummaryStats() {
    let tmdtCount = 0;
    try {
      const raw = localStorage.getItem('cse703102-v1');
      if (raw) {
        const s = JSON.parse(raw);
        tmdtCount = Object.keys(s.quiz || {}).length;
      }
    } catch (e) {}

    let bdCount = 0;
    try {
      const raw = localStorage.getItem('big-data-practice-v1');
      if (raw) {
        const s = JSON.parse(raw);
        bdCount = Object.keys(s.answers || {}).length;
      }
    } catch (e) {}

    const elTmdt = document.getElementById('syncSumTmdt');
    const elBd = document.getElementById('syncSumBd');
    const elTotal = document.getElementById('syncSumTotal');

    if (elTmdt) elTmdt.textContent = `${tmdtCount}/360 câu`;
    if (elBd) elBd.textContent = `${bdCount}/319 câu`;
    if (elTotal) elTotal.textContent = `${tmdtCount + bdCount} câu đã làm`;
  }

  window.refreshGlobalSync = async function () {
    if (isGeneratingSync) return;
    isGeneratingSync = true;

    const exportInput = document.getElementById('globalSyncExportText');
    if (exportInput) exportInput.value = 'Đang khởi tạo mã...';

    const canvas = document.getElementById('globalSyncQrCanvas');
    const payload = packAllHubData();

    try {
      const res = await generateCloudSyncUrl(payload);
      currentShortUrl = res.shortUrl;
      currentShortCode = res.shortCode;

      if (exportInput) {
        exportInput.value = currentShortCode === 'OFFLINE' ? currentShortUrl : currentShortCode;
      }

      // Render mã QR sắc nét
      if (canvas && typeof QRCode !== 'undefined' && QRCode.toCanvas) {
        QRCode.toCanvas(canvas, currentShortUrl, {
          width: 260,
          margin: 2,
          color: { dark: '#002855', light: '#ffffff' },
          errorCorrectionLevel: 'M'
        });
      }
    } catch (e) {
      console.error('Sync generation failed:', e);
      if (exportInput) exportInput.value = 'Lỗi tạo mã, thử lại';
    } finally {
      isGeneratingSync = false;
    }
  };

  // Chuyển tab trong modal
  window.switchGlobalSyncTab = function (tabName) {
    document.querySelectorAll('.sync-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.sync-tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `syncPanel_${tabName}`);
    });
  };

  // Sao chép mã 6 ký tự
  window.copyGlobalSyncCode = function () {
    if (!currentShortCode) return;
    navigator.clipboard.writeText(currentShortCode).then(() => {
      showToast('📋 Đã sao chép mã đồng bộ: ' + currentShortCode);
    }).catch(() => {
      prompt('Sao chép mã đồng bộ của bạn:', currentShortCode);
    });
  };

  // Sao chép link đầy đủ
  window.copyGlobalSyncUrl = function () {
    if (!currentShortUrl) return;
    navigator.clipboard.writeText(currentShortUrl).then(() => {
      showToast('🔗 Đã sao chép liên kết đồng bộ!');
    }).catch(() => {
      prompt('Sao chép liên kết đồng bộ:', currentShortUrl);
    });
  };

  // Tải ảnh QR Code về máy
  window.downloadGlobalQrImage = function () {
    const canvas = document.getElementById('globalSyncQrCanvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `phenikaa_quiz_sync_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('📥 Đã tải ảnh mã QR đồng bộ về máy!');
  };

  // Nạp ảnh QR từ album để quét
  window.handleGlobalQrUpload = function (event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const cvs = document.createElement('canvas');
        cvs.width = img.width;
        cvs.height = img.height;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);

        if (typeof jsQR !== 'undefined') {
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            resolveAndApplySyncUrl(code.data);
          } else {
            showToast('⚠️ Không tìm thấy mã QR hợp lệ trong ảnh.');
          }
        } else {
          showToast('⚠️ Thư viện quét mã jsQR chưa sẵn sàng.');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  // Áp dụng mã nhập từ thiết bị khác
  window.applyGlobalSyncCode = async function () {
    const input = document.getElementById('globalSyncImportInput');
    if (!input || !input.value.trim()) {
      showToast('⚠️ Vui lòng nhập mã 6 ký tự hoặc dán link đồng bộ!');
      return;
    }

    const val = input.value.trim();
    await resolveAndApplySyncUrl(val);
  };

  // Dán từ clipboard
  window.pasteToGlobalSyncInput = async function () {
    try {
      const text = await navigator.clipboard.readText();
      const input = document.getElementById('globalSyncImportInput');
      if (input && text) {
        input.value = text.trim();
        showToast('📋 Đã dán nội dung từ bộ nhớ tạm!');
      }
    } catch (e) {
      showToast('⚠️ Trình duyệt chặn quyền truy cập Clipboard.');
    }
  };

  // Xuất file backup (.json)
  window.exportGlobalBackupFile = function () {
    let tmdt = null;
    let bd = null;
    try { tmdt = JSON.parse(localStorage.getItem('cse703102-v1') || '{}'); } catch (e) {}
    try { bd = JSON.parse(localStorage.getItem('big-data-practice-v1') || '{}'); } catch (e) {}

    const backupData = {
      app: 'phenikaa-quiz-hub',
      version: 2,
      exported_at: new Date().toISOString(),
      data: {
        'cse703102-v1': tmdt,
        'big-data-practice-v1': bd
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phenikaa_quiz_hub_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Đã tải file sao lưu tiến độ (.json) thành công!');
  };

  // Khôi phục từ file (.json)
  window.handleGlobalImportFile = function (event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const json = JSON.parse(e.target.result);
        const res = unpackAndMergeHubData(json);
        if (res.success) {
          showToast(`🎉 Khôi phục thành công tiến độ tất cả các môn!`);
          closeGlobalSyncModal();
          triggerSyncCelebration();
        } else {
          showToast('⚠️ File sao lưu không đúng định dạng!');
        }
      } catch (err) {
        showToast('⚠️ Không thể đọc file JSON.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Xử lý nạp từ URL hoặc mã ngắn
  async function resolveAndApplySyncUrl(codeOrUrl) {
    let target = codeOrUrl.trim();
    showToast('⏳ Đang xử lý đồng bộ tiến độ...');

    // Nếu người dùng nhập mã 6 ký tự
    if (!target.includes('/') && target.length <= 10) {
      try {
        const resp = await fetch('/api/sync?id=' + encodeURIComponent(target));
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.url) target = data.url;
        }
      } catch (e) {
        console.warn('Resolve short code failed:', e);
      }
    }

    // Trích xuất payload từ url
    let payload = null;
    try {
      if (target.includes('?sync=') || target.includes('&sync=')) {
        const urlObj = new URL(target);
        payload = urlObj.searchParams.get('sync');
      } else if (target.includes('#sync=')) {
        payload = target.split('#sync=')[1];
      } else {
        payload = target;
      }
    } catch (e) {
      payload = target;
    }

    if (!payload) {
      showToast('⚠️ Không tìm thấy dữ liệu hợp lệ để đồng bộ.');
      return;
    }

    const res = unpackAndMergeHubData(payload);
    if (res.success) {
      closeGlobalSyncModal();
      showToast('🎉 Đã đồng bộ thành công tiến độ của tất cả các môn học!');
      triggerSyncCelebration();
    } else {
      showToast('⚠️ Mã đồng bộ không hợp lệ hoặc đã hết hạn.');
    }
  }

  // Hiệu ứng ăn mừng đồng bộ thành công
  function triggerSyncCelebration() {
    // 1. Pháo hoa
    const canvas = document.getElementById('confettiCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const particles = [];
      const colors = ['#ea580c', '#0284c7', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
      for (let i = 0; i < 70; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height * 0.45,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.8) * 15,
          size: Math.random() * 6 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          vr: (Math.random() - 0.5) * 12,
          alpha: 1
        });
      }
      function renderConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.35;
          p.rotation += p.vr;
          p.alpha -= 0.015;
          if (p.alpha > 0) {
            alive = true;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
          }
        });
        if (alive) requestAnimationFrame(renderConfetti);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      renderConfetti();
    }

    // 2. Cập nhật thẻ các môn học trên trang chủ
    if (typeof renderCourses === 'function') {
      renderCourses();
    }
  }

  // Toast thông báo
  function showToast(msg) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  // --- 5. TỰ ĐỘNG ĐỒNG BỘ KHI MỞ TRANG CHỦ VỚI THAM SỐ (?c=... hoặc ?sync=...) ---
  async function checkAutoSyncOnPageLoad() {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    // A. Nếu có mã ngắn ?c=XXXXXX từ QR scan điện thoại
    const shortCode = params.get('c');
    if (shortCode) {
      await resolveAndApplySyncUrl(shortCode);
      // Xóa tham số trên thanh địa chỉ URL mà không load lại trang
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState(null, '', cleanUrl);
      }
      return;
    }

    // B. Nếu có ?sync=PAYLOAD
    const syncPayload = params.get('sync');
    if (syncPayload) {
      resolveAndApplySyncUrl(syncPayload);
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return;
    }

    // C. Nếu có #sync=PAYLOAD
    if (hash && hash.startsWith('#sync=')) {
      const hashPayload = hash.slice(6);
      resolveAndApplySyncUrl(hashPayload);
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return;
    }

    // D. Nếu có ?openSync=1 hoặc #sync-modal từ các trang môn học
    if (params.get('openSync') === '1' || hash === '#sync-modal') {
      setTimeout(() => {
        if (typeof openGlobalSyncModal === 'function') {
          openGlobalSyncModal();
        }
      }, 350);
    }
  }

  // Expose helpers for external or debug usage
  window.packAllHubData = packAllHubData;
  window.unpackAndMergeHubData = unpackAndMergeHubData;

  // Lắng nghe khi tải trang
  document.addEventListener('DOMContentLoaded', () => {
    checkAutoSyncOnPageLoad();

    // Đóng modal khi click ra ngoài overlay
    window.addEventListener('click', (e) => {
      const modal = document.getElementById('globalSyncModal');
      if (e.target === modal) closeGlobalSyncModal();
    });

    // Đóng khi bấm Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeGlobalSyncModal();
    });
  });
})();
