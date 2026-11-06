'use strict';
// App State & Engine
const D = (typeof QUIZ_BANK !== 'undefined') ? QUIZ_BANK : (document.getElementById('bank') ? JSON.parse(document.getElementById('bank').textContent) : {});
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// LocalStorage & Persistent State
let saved = {};
try {
  saved = JSON.parse(localStorage.getItem('cse703102-v1') || '{}') || {};
} catch(e) {
  $('#storageNotice').classList.remove('hidden');
}

let state = {
  quiz: {},
  flash: {},
  essay: {},
  formula: {},
  star: {},
  notes: {},
  maxStreak: 0,
  ...saved
};

let soundEnabled = localStorage.getItem('cse703102-sound') !== 'false';
let currentTheme = localStorage.getItem('cse703102-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

function activateFormulaMode() {
  mode = 'formula';
  shuffled = false;
  try { closeDrawer(); } catch(e) {}
  if (typeof setupFormulaQuizList === 'function') setupFormulaQuizList();
  rebuild();
  setTimeout(scrollToCard, 10);
}

let sidebarCollapsed = localStorage.getItem('cse703102-sidebar-collapsed') === 'true';

let session = 'all';
let mode = 'quiz';
let index = 0;
let list = [];
let flipped = false;
let revealed = false;
let shuffled = false;
let order = [];
let currentStreak = 0;
let currentZoom = 1;

function persist() {
  try {
    localStorage.setItem('cse703102-v1', JSON.stringify(state));
  } catch(e) {
    $('#storageNotice').classList.remove('hidden');
  }
}

// Toast notification
let toastTimer;
function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// Audio Synthesizer (Web Audio API - 100% Offline)
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.15, startTime = 0, gainLevel = 0.15) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
    gain.gain.setValueAtTime(gainLevel, ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  } catch (e) {}
}

function playCorrectSound() {
  playTone(523.25, 'triangle', 0.22, 0, 0.18);
  playTone(659.25, 'triangle', 0.25, 0.08, 0.16);
  playTone(1046.50, 'sine', 0.35, 0.16, 0.2);
}

function playWrongSound() {
  playTone(220, 'sawtooth', 0.2, 0, 0.12);
  playTone(164.8, 'sawtooth', 0.25, 0.1, 0.14);
}

function playFlipSound() {
  playTone(440, 'sine', 0.08, 0, 0.08);
  playTone(660, 'sine', 0.08, 0.04, 0.08);
}

function playStreakCelebration() {
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  notes.forEach((f, i) => playTone(f, 'triangle', 0.25, i * 0.08, 0.18));
}

// Confetti Effect
const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas.getContext('2d');
let confettiParticles = [];
let confettiAnimId = null;

function resizeCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function triggerConfetti() {
  const colors = ['#7c3aed', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  for (let i = 0; i < 90; i++) {
    confettiParticles.push({
      x: window.innerWidth * (0.3 + Math.random() * 0.4),
      y: window.innerHeight * 0.4,
      w: Math.random() * 9 + 4,
      h: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 1.2) * 14,
      rot: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
      opacity: 1
    });
  }
  if (!confettiAnimId) renderConfetti();
}

function renderConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const p = confettiParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.38;
    p.vx *= 0.98;
    p.rot += p.vRot;
    p.opacity -= 0.012;

    if (p.opacity <= 0 || p.y > window.innerHeight) {
      confettiParticles.splice(i, 1);
      continue;
    }

    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rot * Math.PI) / 180);
    confettiCtx.fillStyle = p.color;
    confettiCtx.globalAlpha = Math.max(0, p.opacity);
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();
  }

  if (confettiParticles.length > 0) {
    confettiAnimId = requestAnimationFrame(renderConfetti);
  } else {
    confettiAnimId = null;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

// Theme handler
function applyTheme(th) {
  currentTheme = th;
  document.documentElement.setAttribute('data-theme', th);
  localStorage.setItem('cse703102-theme', th);
  $('#themeIcon').textContent = th === 'dark' ? '☀️' : '🌙';
}
applyTheme(currentTheme);

$('#themeToggle').onclick = () => {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
};

// Sound toggle
function updateSoundUI() {
  $('#soundIcon').textContent = soundEnabled ? '🔊' : '🔇';
  $('#soundToggle').title = soundEnabled ? 'Âm thanh: ĐANG BẬT (Bấm để tắt)' : 'Âm thanh: ĐÃ TẮT (Bấm để bật)';
}
updateSoundUI();
$('#soundToggle').onclick = () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem('cse703102-sound', String(soundEnabled));
  updateSoundUI();
  showToast(soundEnabled ? '🔊 Đã bật âm thanh' : '🔇 Đã tắt âm thanh');
  if (soundEnabled) playTone(587.33, 'sine', 0.15, 0, 0.15);
};

// Sidebar Collapse Handler
function applySidebarCollapsed(collapsed) {
  sidebarCollapsed = collapsed;
  $('#layoutContainer').classList.toggle('sidebar-collapsed', collapsed);
  $('#sidebarCollapseBtn').textContent = collapsed ? '▶' : '◀';
  $('#sidebarCollapseBtn').title = collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar';
  localStorage.setItem('cse703102-sidebar-collapsed', String(collapsed));
}
applySidebarCollapsed(sidebarCollapsed);
$('#sidebarCollapseBtn').onclick = () => applySidebarCollapsed(!sidebarCollapsed);

// Lightbox modal handler
function openLightbox(src, title) {
  document.body.style.overflow = "hidden";
  $('#lightboxImg').src = src;
  $('#lightboxTitle').textContent = title || 'Ảnh trích đoạn đáp án gốc';
  currentZoom = 1;
  $('#lightboxImg').style.transform = 'scale(1)';
  $('#zoomResetBtn').textContent = '100%';
  $('#imageLightbox').classList.add('open');
}

function closeLightbox() {
  $('#imageLightbox').classList.remove('open');
  document.body.style.overflow = '';
}

$('#closeLightbox').onclick = closeLightbox;
$('#imageLightbox').onclick = e => {
  if (e.target === $('#imageLightbox') || e.target === $('#lightboxBody')) closeLightbox();
};

$('#zoomInBtn').onclick = () => {
  currentZoom = Math.min(3, currentZoom + 0.25);
  $('#lightboxImg').style.transform = 'scale(' + currentZoom + ')';
  $('#zoomResetBtn').textContent = Math.round(currentZoom * 100) + '%';
};

$('#zoomOutBtn').onclick = () => {
  currentZoom = Math.max(0.5, currentZoom - 0.25);
  $('#lightboxImg').style.transform = 'scale(' + currentZoom + ')';
  $('#zoomResetBtn').textContent = Math.round(currentZoom * 100) + '%';
};

$('#zoomResetBtn').onclick = () => {
  currentZoom = 1;
  $('#lightboxImg').style.transform = 'scale(1)';
};

// AUTO-SCROLL TO CARD (USER REQUEST)
// Smoothly aligns the question card right below the sticky header
function scrollToCard() {
  const card = (mode === 'formula')
    ? ($('#formulaFlashcardBox') || $('.formula-flashcard-stage') || $('.formula-flash-section') || $('#card'))
    : $('#card');
  if (!card) return;
  const header = $('header');
  const headerHeight = header ? header.offsetHeight : 60;
  const rect = card.getBoundingClientRect();
  const targetY = window.pageYOffset + rect.top - headerHeight - 12;
  window.scrollTo({
    top: Math.max(0, targetY),
    behavior: 'smooth'
  });
}

// Key generation helper
const key = q => (mode === 'essay' ? 'e' : 'q') + q.id;

function base() {
  if (mode === 'formula') return [];
  return (mode === 'essay' ? D.essay : D.quiz).filter(q => session === 'all' || String(q.session) === session);
}

function rebuild() {
  if (mode === 'formula') {
    list = [];
    index = 0;
    render();
    return;
  }
  const all = base();
  const term = $('#search').value.trim().toLocaleLowerCase('vi');
  const filter = $('#filter').value;

  list = all.filter(q => {
    const r = (mode === 'flash') ? (state.flash[q.id] || state.quiz[q.id]) : state[mode][q.id];
    const matchTerm = !term || String(q.id) === term || (q.prompt + ' ' + (q.options || []).join(' ')).toLocaleLowerCase('vi').includes(term);
    const matchFilter = filter === 'all' ||
      (filter === 'star' && state.star[key(q)]) ||
      (filter === 'unseen' && !r) ||
      (filter === 'wrong' && r && !r.correct);
    return matchTerm && matchFilter;
  });

  if (shuffled) {
    const rank = new Map(order.map((id, i) => [id, i]));
    list.sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999));
  }

  index = 0;
  flipped = false;
  revealed = false;
  render();
}

// Navigation & Session List
function nav() {
  const labels = [
    ['all', 'Tất cả buổi học', D.quiz.length + ' trắc nghiệm · ' + D.essay.length + ' tự luận'],
    ...D.sessions.map(s => [String(s.id), s.title, s.count + ' trắc nghiệm · ' + (s.id <= 10 ? 4 : 1) + ' tự luận']),
    ['open', 'Câu hỏi mở tổng hợp', '15 câu tự luận tích hợp']
  ];

  const html = labels.map(([id, title, count]) => {
    const isActive = id === session;
    const sItems = (mode === 'essay' ? D.essay : D.quiz).filter(q => id === 'all' || String(q.session) === id);
    const targetMode = mode === 'formula' ? 'quiz' : mode;
    const mState = state[targetMode] || {};
    const doneCount = sItems.filter(q => mState[q.id]).length;
    const pct = sItems.length ? Math.round((doneCount / sItems.length) * 100) : 0;
    const isCompleted = sItems.length > 0 && doneCount === sItems.length;

    return '<button data-session="' + id + '" class="nav-item ' + (isActive ? 'active' : '') + '" ' + (isActive ? 'aria-current="true"' : '') + ' title="' + esc(title) + '">' +
      '<div class="nav-num">' + (id === 'all' ? '∞' : id === 'open' ? '✦' : id) + '</div>' +
      '<div class="nav-content">' +
        '<span class="nav-title">' + esc(title) + '</span>' +
        '<div class="nav-meta">' +
          '<span>' + count + '</span>' +
          '<span>' + (isCompleted ? '<strong style="color:var(--green)">✓ Xong</strong> ' : '') + doneCount + '/' + sItems.length + '</span>' +
        '</div>' +
        '<div class="nav-prog-bar"><div class="nav-prog-fill" style="width:' + pct + '%;"></div></div>' +
      '</div>' +
    '</button>';
  }).join('');

  const formulaNavHtml = '<button class="nav-item ' + (mode === 'formula' ? 'active' : '') + '" id="sidebarFormulaBtn" style="margin-bottom:10px;border:1.5px solid #8b5cf6;">' +
    '<div class="nav-num" style="background:linear-gradient(135deg, #6366f1, #8b5cf6);color:#fff;">📐</div>' +
    '<div class="nav-content">' +
      '<div class="nav-title" style="color:var(--primary);font-weight:800;">Công thức & Bài tập tính</div>' +
      '<div class="nav-meta">' +
        '<span>Slide & 121 trang</span>' +
        '<span style="background:var(--green);color:#fff;padding:1px 6px;border-radius:4px;font-size:10.5px;font-weight:700;">HOT</span>' +
      '</div>' +
    '</div>' +
  '</button>';

  $('#sessions').innerHTML = formulaNavHtml + html;

  const sideFormBtn = $('#sidebarFormulaBtn');
  if (sideFormBtn) {
    sideFormBtn.onclick = activateFormulaMode;
  }

  $$('[data-session]').forEach(b => {
    b.onclick = () => {
      session = b.dataset.session;
      if (session === 'open') mode = 'essay';
      shuffled = false;
      $('#search').value = '';
      $('#filter').value = 'all';
      closeDrawer();
      rebuild();
      setTimeout(scrollToCard, 10);
    };
  });

  const curS = D.sessions.find(s => String(s.id) === session);
  const mTitle = curS ? 'Buổi ' + curS.id + ' · ' + curS.title : session === 'open' ? '✦ Câu hỏi mở tổng hợp' : 'Tất cả buổi học';
  $('#mobileSessionText').textContent = '📍 ' + mTitle;
}

// Header formula button
const headerFormulaBtn = $('#headerFormulaBtn');
if (headerFormulaBtn) {
  headerFormulaBtn.onclick = activateFormulaMode;
}

// Drawer Controls for Mobile
function openDrawer() {
  $('#sidebar').classList.add('open');
  $('#drawerBackdrop').classList.add('open');
}

function closeDrawer() {
  $('#sidebar').classList.remove('open');
  $('#drawerBackdrop').classList.remove('open');
}

$('#menuToggle').onclick = openDrawer;
$('#closeDrawer').onclick = closeDrawer;
$('#drawerBackdrop').onclick = closeDrawer;
$('#mobileSessionBtn').onclick = openDrawer;

// Stats Calculation
function stats() {
  if (mode === 'formula') {
    const list = FORMULA_FLASHCARDS;
    const answered = list.filter(q => formulaQuizState[q.id]);
    const correctCount = answered.filter(q => formulaQuizState[q.id].correct).length;
    const pct = list.length ? Math.round((answered.length / list.length) * 100) : 0;
    const accPct = answered.length ? Math.round((correctCount / answered.length) * 100) : 100;

    $('#total').textContent = list.length;
    $('#done').textContent = answered.length;
    $('#donePercent').textContent = pct + '% tiến độ';
    $('#accuracy').textContent = answered.length ? accPct + '%' : '—';
    $('#accuracy').style.color = accPct >= 80 ? 'var(--green)' : 'var(--amber)';
    $('#accDetail').textContent = answered.length ? (correctCount + '/' + answered.length + ' đúng') : 'Chưa làm';
    $('#streakCount').textContent = formulaQuizStreak;
    $('#streakBadge').classList.toggle('active', formulaQuizStreak > 0);
    $('#maxStreakVal').textContent = state.maxStreak || 0;
    return;
  }
  const all = base();
  const mState = state[mode] || {};
  const seen = all.filter(q => mState[q.id]);
  const right = seen.filter(q => state[mode][q.id].correct);
  const pct = all.length ? Math.round((seen.length / all.length) * 100) : 0;

  $('#total').textContent = all.length;
  $('#done').textContent = seen.length;
  $('#donePercent').textContent = pct + '% tiến độ';

  if (seen.length > 0) {
    const acc = Math.round((right.length / seen.length) * 100);
    $('#accuracy').textContent = acc + '%';
    $('#accDetail').textContent = right.length + ' / ' + seen.length + ' đúng';
    if (acc >= 80) $('#accuracy').style.color = 'var(--green)';
    else if (acc >= 50) $('#accuracy').style.color = 'var(--amber)';
    else $('#accuracy').style.color = 'var(--red)';
  } else {
    $('#accuracy').textContent = '—';
    $('#accDetail').textContent = 'Chưa làm';
    $('#accuracy').style.color = 'inherit';
  }

  $('#streakCount').textContent = currentStreak;
  $('#streakBadge').classList.toggle('active', currentStreak > 0);
  $('#maxStreakVal').textContent = state.maxStreak || 0;
}

// Source Link Generator
function source(q, answer = false) {
  const p = answer ? q.answerPage : q.page;
  return '<a class="source-link" href="de-cuong-goc.pdf#page=' + p + '" target="_blank" rel="noopener">' +
    '<span>📄</span> <span class="hide-mobile">' + (answer ? 'Mở PDF gốc · ' : 'Đề bài gốc · ') + '</span>trang ' + p + ' ↗</a>';
}

function getLevelClass(lvl) {
  if (!lvl) return 'nho';
  const l = lvl.toLowerCase();
  if (l.includes('nhớ')) return 'nho';
  if (l.includes('hiểu')) return 'hieu';
  if (l.includes('vận dụng')) return 'vandun';
  if (l.includes('phân tích')) return 'phantich';
  return 'mo';
}

// Render Function
function render() {
  nav();
  stats();

  $$('[data-mode]').forEach(b => {
    const active = b.dataset.mode === mode;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active);
  });

  if (mode === 'formula') {
    $('#title').textContent = '📐 Sổ tay Công thức TMĐT & Bài tập tính';
    $('#subtitle').textContent = 'Tổng hợp tất cả công thức có trên slide và đề cương 121 trang, kèm máy tính tương tác mô phỏng chiến dịch và lời giải chi tiết.';
    $('#navigation').classList.add('hidden');
    $('.mobile-bottom-bar').classList.add('hidden');
    $('.jump-strip-wrap').classList.add('hidden');
    $('.prog-bar-container').classList.add('hidden');
    $('.toolbar-wrap').classList.add('hidden');
    renderFormulas();
    return;
  } else {
    $('.toolbar-wrap').classList.remove('hidden');
    $('.prog-bar-container').classList.remove('hidden');
    $('.jump-strip-wrap').classList.remove('hidden');
  }

  const s = D.sessions.find(s => String(s.id) === session);
  $('#title').textContent = s ? 'Buổi ' + s.id + '. ' + s.title : session === 'open' ? 'Câu hỏi mở tổng hợp' : 'Tất cả buổi học';
  $('#subtitle').textContent = mode === 'essay'
    ? 'Tự viết câu trả lời trước, sau đó mở ảnh chụp gợi ý lập luận từ đề cương để đối chiếu.'
    : mode === 'flash'
    ? 'Chạm trực tiếp vào thẻ hoặc nhấn Space để lật câu hỏi và ảnh chụp đáp án 3D.'
    : 'Bấm phím A, B, C, D (hoặc 1-4) để chọn. Đáp án đúng sáng lên, sai đỏ lên, câu khác mờ đi.';

  $('#shuffle').classList.toggle('primary', shuffled);
  $('#shuffle').innerHTML = shuffled
    ? '<span>✓</span> <span class="hide-mobile">Đang trộn câu</span><span class="show-mobile">Đang trộn</span>'
    : '<span>⇄</span> <span class="hide-mobile">Trộn câu</span><span class="show-mobile">Trộn</span>';

  if (!list.length) {
    $('#card').innerHTML = '<div class="empty-state"><h2>Không tìm thấy câu hỏi phù hợp</h2><p>Vui lòng chọn “Tất cả câu hỏi”, đổi buổi học hoặc xóa từ khóa tìm kiếm để tiếp tục.</p></div>';
    $('#navigation').classList.add('hidden');
    $('.mobile-bottom-bar').classList.add('hidden');
    $('#jump').innerHTML = '';
    $('#bar').style.width = '0%';
    $('#position').textContent = '0 / 0';
    return;
  }

  $('#navigation').classList.remove('hidden');
  $('.mobile-bottom-bar').classList.remove('hidden');

  const q = list[index];
  const r = state[mode][q.id];
  const star = state.star[key(q)];
  const ansPage = q.answerPage || q.page;

  let top = '<div class="card-top">' +
    '<div class="card-meta-wrap">' +
      '<span class="session-pill">' + (q.session === 'open' ? '✦ Tổng hợp' : 'Buổi ' + q.session) + '</span>' +
      '<span class="level-pill ' + getLevelClass(q.level) + '">' + (mode === 'essay' ? 'Tự luận' : 'Trắc nghiệm') + ' #' + q.id + ' · ' + esc(q.level) + '</span>' +
    '</div>' +
    '<button id="star" class="btn ' + (star ? 'marked' : '') + '" aria-pressed="' + !!star + '">' +
      (star ? '★ Đã lưu' : '☆ Đánh dấu') +
    '</button>' +
  '</div>';

  let body = '';

  if (mode === 'quiz') {
    body = '<h2 class="question-prompt">' + esc(q.prompt) + '</h2>' +
      '<div class="options-grid">' +
        q.options.map((opt, i) => {
          const letter = 'ABCD'[i];
          let cls = '';
          let statusBadge = '';
          if (r) {
            if (letter === q.answer) {
              cls = ' correct';
              statusBadge = '<span class="option-status-tag">✓ Đáp án đúng</span>';
            } else if (letter === r.choice) {
              cls = ' wrong';
              statusBadge = '<span class="option-status-tag">✕ Bạn đã chọn</span>';
            } else {
              cls = ' dimmed'; // CÂU KHÁC ẨN TỐI MỜ ĐI (USER REQUEST)
            }
          }
          return '<button class="option-card' + cls + '" data-choice="' + letter + '" ' + (r ? 'disabled' : '') + '>' +
            '<div class="option-letter">' + letter + '</div>' +
            '<div class="option-text-wrap">' +
              '<div>' + esc(opt) + '</div>' +
              statusBadge +
            '</div>' +
          '</button>';
        }).join('') +
      '</div>';

    if (r) {
      const cropSrc = 'answers/q_' + q.id + '.png';
      const fullPageSrc = 'pages/page_' + ansPage + '.png';

      body += '<div class="feedback-box ' + (r.correct ? 'good' : 'bad') + '" role="status">' +
        '<div class="feedback-header">' +
          '<span>' + (r.correct ? '🎉 Xuất sắc! Bạn trả lời đúng!' : '💡 Chưa chính xác! Đáp án đúng là: ' + q.answer) + '</span>' +
        '</div>' +
        '<div class="feedback-desc">' + esc(q.explanation) + '</div>' +
        
        // ANSWER IMAGE CROPPED FROM PDF
        '<div class="answer-crop-card">' +
          '<div class="answer-crop-header">' +
            '<span>📸 Ảnh chụp đáp án gốc (Đề cương · Trang ' + ansPage + ')</span>' +
            '<div style="display:flex;gap:6px;">' +
              '<button type="button" class="crop-action-btn" data-zoom-img="' + cropSrc + '" data-zoom-title="Ảnh chụp đáp án Câu ' + q.id + ' (Trang ' + ansPage + ')">🔍 Phóng to</button>' +
              '<button type="button" class="crop-action-btn" data-zoom-img="' + fullPageSrc + '" data-zoom-title="Toàn bộ Trang ' + ansPage + ' trong đề cương gốc">📖 Xem cả trang ' + ansPage + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="answer-crop-img-wrap" data-zoom-img="' + cropSrc + '" data-zoom-title="Ảnh chụp đáp án Câu ' + q.id + ' (Trang ' + ansPage + ')">' +
            '<img src="' + cropSrc + '" alt="Ảnh trích đoạn đáp án Câu ' + q.id + '" class="answer-crop-img" loading="lazy">' +
          '</div>' +
        '</div>' +

        '<div class="feedback-actions">' +
          source(q, true) +
          '<button id="retry" class="btn" style="padding:7px 10px;font-size:12px;">🔄 <span class="hide-mobile">Làm lại câu này (R)</span><span class="show-mobile">Làm lại</span></button>' +
          '<button id="nextInline" class="btn primary" style="padding:7px 12px;font-size:12px;"><span class="hide-mobile">Câu tiếp theo (Enter) </span><span class="show-mobile">Tiếp </span>→</button>' +
        '</div>' +
      '</div>';
    } else {
      body += '<div style="margin-top:18px;">' + source(q) + '</div>';
    }
  } else if (mode === 'flash') {
    const cropSrc = 'answers/q_' + q.id + '.png';

    // Flashcard Options (ABCD) for Multiple Choice Questions
    let optionsHtml = '';
    if (q.options && q.options.length) {
      optionsHtml = '<div class="flash-options-grid">' +
        q.options.map((opt, i) => {
          const letter = 'ABCD'[i];
          let btnCls = 'flash-opt-card';
          let statusBadge = '';
          if (r) {
            if (letter === q.answer) {
              btnCls += ' correct';
              statusBadge = '<span class="option-status-tag" style="margin-left:auto;font-size:11.5px;font-weight:700;color:var(--green);">✓ Đáp án đúng</span>';
            } else if (letter === r.choice) {
              btnCls += ' wrong';
              statusBadge = '<span class="option-status-tag" style="margin-left:auto;font-size:11.5px;font-weight:700;color:var(--red);">✕ Bạn đã chọn</span>';
            } else {
              btnCls += ' dimmed';
            }
          }
          return '<button type="button" class="' + btnCls + '" data-flash-choice="' + letter + '" ' + (r ? 'disabled' : '') + '>' +
            '<span class="flash-opt-letter">' + letter + '</span>' +
            '<span class="flash-opt-text">' + esc(opt) + '</span>' +
            statusBadge +
          '</button>';
        }).join('') +
      '</div>';
    }

    let userResultBadge = '';
    if (r) {
      userResultBadge = r.correct
        ? '<span class="flash-user-choice-badge good">✓ Bạn đã chọn đúng: <b>' + (r.choice || q.answer) + '</b></span>'
        : '<span class="flash-user-choice-badge bad">✕ Bạn đã chọn: <b>' + (r.choice || 'Chưa đúng') + '</b> (Đáp án đúng: <b>' + q.answer + '</b>)</span>';
    }

    body = '<div id="flashcard" class="flash-container ' + (flipped ? 'is-flipped' : '') + '" role="button" tabindex="0" aria-pressed="' + flipped + '">' +
      '<div class="flash-inner">' +
        '<div class="flash-face flash-front">' +
          '<span class="eyebrow">CÂU HỎI TRẮC NGHIỆM</span>' +
          '<h2 class="flash-prompt">' + esc(q.prompt) + '</h2>' +
          optionsHtml +
          '<div class="flash-flip-hint"><span>🔄</span> ' + (r ? 'Chạm vào thẻ hoặc nhấn Space để lật xem ảnh đáp án ↻' : 'Chọn đáp án A, B, C, D để kiểm tra & lật 3D · Hoặc bấm Space để lật ngay ↻') + '</div>' +
        '</div>' +
        '<div class="flash-face flash-back">' +
          '<div class="flash-back-top-row">' +
            '<span class="flash-answer-badge">ĐÁP ÁN ĐÚNG · ' + q.answer + '</span>' +
            userResultBadge +
          '</div>' +
          '<h3 class="flash-answer-title">' + esc(q.options['ABCD'.indexOf(q.answer)]) + '</h3>' +
          '<div class="flash-answer-exp">' + esc(q.explanation) + '</div>' +
          
          '<div class="answer-crop-card" style="width:100%;margin:12px 0;">' +
            '<div class="answer-crop-header">' +
              '<span>📸 Trích đoạn đề cương gốc (Trang ' + ansPage + ')</span>' +
              '<button type="button" class="crop-action-btn" data-zoom-img="' + cropSrc + '" data-zoom-title="Ảnh đáp án Câu ' + q.id + '">🔍 Phóng to</button>' +
            '</div>' +
            '<div class="answer-crop-img-wrap" data-zoom-img="' + cropSrc + '" data-zoom-title="Ảnh đáp án Câu ' + q.id + '">' +
              '<img src="' + cropSrc + '" alt="Đáp án gốc" class="answer-crop-img" loading="lazy">' +
            '</div>' +
          '</div>' +

          source(q, true) +
          '<div class="flash-back-footer-row">' +
            (r ? '<button type="button" id="flashRetryBtn" class="btn flash-retry-btn">🔄 Làm lại câu này (R)</button>' : '') +
            '<div class="flash-flip-hint"><span>🔄</span> Chạm để quay lại câu hỏi (Space) ↻</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="flash-actions-bar">' +
      '<span class="pos-indicator">' + (r ? (r.correct ? '✅ Đã nhớ vững' : '⚠️ Cần ôn lại') : 'Chưa đánh giá') + '</span>' +
      '<div class="grade-btn-group">' +
        '<button class="btn" data-grade="no" style="color:var(--red);">❌ <span class="hide-mobile">Cần ôn lại (1)</span><span class="show-mobile">Ôn lại</span></button>' +
        '<button class="btn primary" data-grade="yes">✅ <span class="hide-mobile">Đã nhớ (2)</span><span class="show-mobile">Đã nhớ</span></button>' +
      '</div>' +
    '</div>';
  } else {
    // Essay Mode
    const userNote = state.notes[q.id] || '';
    const wordCount = userNote.trim() ? userNote.trim().split(/\s+/).length : 0;
    const charCount = userNote.length;
    const cropSrc = 'answers/e_' + q.id + '.png';
    const fullPageSrc = 'pages/page_' + ansPage + '.png';

    body = '<h2 class="question-prompt">' + esc(q.prompt) + '</h2>' +
      '<div class="essay-meta-row">' +
        '<span>Viết lập luận và câu trả lời của bạn:</span>' +
        '<span id="noteCount">' + wordCount + ' từ · ' + charCount + ' ký tự · Tự động lưu ✓</span>' +
      '</div>' +
      '<textarea id="notes" class="essay-textarea" placeholder="Gõ câu trả lời, phân tích ý chính, cấu trúc lập luận và ví dụ minh họa…">' + esc(userNote) + '</textarea>' +
      '<div class="card-nav-row" style="margin-top:16px;">' +
        '<button id="reveal" class="btn primary">' + (revealed ? 'Ẩn gợi ý đáp án' : '<span class="hide-mobile">👁️ Xem ảnh chụp gợi ý đáp án theo đề cương</span><span class="show-mobile">👁️ Xem gợi ý đáp án</span>') + '</button>' +
        source(q) +
      '</div>';

    if (revealed) {
      body += '<div class="essay-solution-card">' +
        '<div class="essay-solution-title">' +
          '<span>💡</span> ' + (q.level === 'MO' ? 'Định hướng lập luận & tiêu chí đánh giá (Câu hỏi mở)' : 'Gợi ý đáp án chi tiết theo đề cương') +
        '</div>' +

        '<div class="answer-crop-card">' +
          '<div class="answer-crop-header">' +
            '<span>📸 Ảnh chụp lời giải gốc (Đề cương · Trang ' + ansPage + ')</span>' +
            '<div style="display:flex;gap:6px;">' +
              '<button type="button" class="crop-action-btn" data-zoom-img="' + cropSrc + '" data-zoom-title="Ảnh lời giải Câu tự luận ' + q.id + ' (Trang ' + ansPage + ')">🔍 <span class="hide-mobile">Phóng to</span></button>' +
              '<button type="button" class="crop-action-btn" data-zoom-img="' + fullPageSrc + '" data-zoom-title="Toàn bộ Trang ' + ansPage + ' trong đề cương">📖 <span class="hide-mobile">Xem cả trang </span><span class="show-mobile">Trang </span>' + ansPage + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="answer-crop-img-wrap" data-zoom-img="' + cropSrc + '" data-zoom-title="Ảnh lời giải Câu tự luận ' + q.id + ' (Trang ' + ansPage + ')">' +
            '<img src="' + cropSrc + '" alt="Ảnh lời giải gốc" class="answer-crop-img" loading="lazy">' +
          '</div>' +
        '</div>' +

        '<div class="essay-solution-body">' + esc(q.answer) + '</div>' +
        '<div style="margin-top:16px;">' + source(q, true) + '</div>' +
      '</div>' +
      '<div class="card-nav-row" style="margin-top:18px;">' +
        '<span class="pos-indicator">Đánh giá mức độ nắm bài:</span>' +
        '<div class="grade-btn-group">' +
          '<button class="btn" data-grade="no" style="color:var(--red);">❌ <span class="hide-mobile">Cần ôn lại</span><span class="show-mobile">Ôn lại</span></button>' +
          '<button class="btn primary" data-grade="yes">✅ <span class="hide-mobile">Đã nắm vững ✓</span><span class="show-mobile">Đã nhớ ✓</span></button>' +
        '</div>' +
      '</div>';
    }
  }

  $('#card').innerHTML = top + body;

  // Lightbox click bindings
  $$('[data-zoom-img]').forEach(el => {
    el.onclick = e => {
      e.stopPropagation();
      openLightbox(el.dataset.zoomImg, el.dataset.zoomTitle);
    };
  });

  // Star Toggle
  $('#star').onclick = () => {
    const k = key(q);
    state.star[k] = !state.star[k];
    persist();
    showToast(state.star[k] ? '⭐ Đã thêm vào mục đánh dấu' : '☆ Đã gỡ khỏi mục đánh dấu');
    render();
  };

  // Choice Selection (Quiz Mode)
  $$('[data-choice]').forEach(b => {
    b.onclick = () => answer(b.dataset.choice);
  });

  // Retry Button
  if ($('#retry')) {
    $('#retry').onclick = () => {
      delete state.quiz[q.id];
      persist();
      render();
    };
  }

  // Next Inline Button in feedback
  if ($('#nextInline')) {
    $('#nextInline').onclick = () => move(1);
  }

  // Flashcard Flip
  if ($('#flashcard')) {
    $('#flashcard').onclick = e => {
      if (e.target.closest('[data-zoom-img]')) return;
      if (e.target.closest('[data-flash-choice]')) return;
      if (e.target.closest('#flashRetryBtn') || e.target.closest('.flash-retry-btn')) return;
      flipCard();
    };
  }

  // Flashcard Option Selection
  $$('[data-flash-choice]').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const choice = btn.dataset.flashChoice;
      answerFlashcard(choice);
    };
  });

  // Flashcard Retry
  if ($('#flashRetryBtn')) {
    $('#flashRetryBtn').onclick = e => {
      e.stopPropagation();
      retryFlashcard();
    };
    $('#flashcard').onkeydown = e => {
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) flipCard();
      }
    };
  }

  // Reveal Button (Essay Mode)
  if ($('#reveal')) {
    $('#reveal').onclick = () => {
      revealed = !revealed;
      render();
    };
  }

  // Notes Auto-Save (Essay Mode)
  if ($('#notes')) {
    $('#notes').oninput = e => {
      state.notes[q.id] = e.target.value;
      persist();
      const val = e.target.value;
      const wc = val.trim() ? val.trim().split(/\s+/).length : 0;
      $('#noteCount').textContent = wc + ' từ · ' + val.length + ' ký tự · Tự động lưu ✓';
    };
  }

  // Grade Buttons
  $$('[data-grade]').forEach(b => {
    b.onclick = () => {
      const isYes = b.dataset.grade === 'yes';
      state[mode][q.id] = { correct: isYes };
      persist();
      if (isYes) {
        playCorrectSound();
        showToast('✅ Đã ghi nhận: Đã nhớ vững');
      } else {
        playWrongSound();
        showToast('📌 Đã lưu: Cần ôn lại');
      }
      if (index < list.length - 1) {
        move(1);
      } else {
        render();
      }
    };
  });

  // Navigation Indicators
  const posText = (index + 1) + ' / ' + list.length;
  $('#position').textContent = posText + ' câu';
  $('#mobilePos').textContent = 'Câu ' + posText + ' ▾';
  $('#bar').style.width = (((index + 1) / list.length) * 100) + '%';
  $('#prev').disabled = index === 0;
  $('#next').disabled = index === list.length - 1;
  $('#mobilePrev').disabled = index === 0;
  $('#mobileNext').disabled = index === list.length - 1;

  // Jump Grid (Paging 30 items)
  const start = Math.floor(index / 30) * 30;
  $('#jump').innerHTML = list.slice(start, start + 30).map((v, j) => {
    const rr = state[mode][v.id];
    const isCur = start + j === index;
    const isSt = state.star[key(v)];
    let cls = isCur ? 'current ' : '';
    if (rr) cls += rr.correct ? 'done ' : 'miss ';
    if (isSt) cls += 'starred ';

    return '<button data-index="' + (start + j) + '" class="jump-btn ' + cls + '" aria-label="Câu ' + v.id + '" ' + (isCur ? 'aria-current="step"' : '') + '>' +
      v.id +
    '</button>';
  }).join('');

  $$('[data-index]').forEach(b => {
    b.onclick = () => {
      index = +b.dataset.index;
      flipped = false;
      revealed = false;
      render();
      setTimeout(scrollToCard, 10);
    };
  });
}

// Flip Card Action
function flipCard() {
  const card = $('#flashcard');
  if (mode !== 'flash' || !card || !list.length) return;
  flipped = !flipped;
  card.classList.toggle('is-flipped', flipped);
  card.setAttribute('aria-pressed', String(flipped));
  playFlipSound();
}

// Answer Flashcard Action (Select ABCD & Flip 3D)
function answerFlashcard(choice) {
  const q = list[index];
  if (mode !== 'flash' || !q) return;

  const isCorrect = choice === q.answer;
  state.flash[q.id] = { choice: choice, correct: isCorrect };
  if (!state.quiz[q.id]) {
    state.quiz[q.id] = { choice: choice, correct: isCorrect };
  }

  if (isCorrect) {
    currentStreak++;
    if (currentStreak > (state.maxStreak || 0)) {
      state.maxStreak = currentStreak;
    }
    playCorrectSound();
    if (currentStreak >= 5 && currentStreak % 5 === 0) {
      playStreakCelebration();
      triggerConfetti();
      showToast('🔥 Chuỗi ' + currentStreak + ' câu đúng liên tiếp! Quá đỉnh!');
    }
  } else {
    currentStreak = 0;
    playWrongSound();
  }

  persist();
  stats();

  // Visually highlight chosen options on front card immediately
  const allBtns = document.querySelectorAll('[data-flash-choice]');
  allBtns.forEach(btn => {
    btn.disabled = true;
    const letter = btn.dataset.flashChoice;
    if (letter === q.answer) {
      btn.classList.add('correct');
      if (!btn.querySelector('.option-status-tag')) {
        btn.insertAdjacentHTML('beforeend', '<span class="option-status-tag" style="margin-left:auto;font-size:11.5px;font-weight:700;color:var(--green);">✓ Đáp án đúng</span>');
      }
    } else if (letter === choice) {
      btn.classList.add('wrong');
      if (!btn.querySelector('.option-status-tag')) {
        btn.insertAdjacentHTML('beforeend', '<span class="option-status-tag" style="margin-left:auto;font-size:11.5px;font-weight:700;color:var(--red);">✕ Bạn đã chọn</span>');
      }
    } else {
      btn.classList.add('dimmed');
    }
  });

  // Flip after a short moment to reveal answer ("xong lật ra đáp án")
  setTimeout(() => {
    flipped = true;
    const card = $('#flashcard');
    if (card) {
      card.classList.add('is-flipped');
      card.setAttribute('aria-pressed', 'true');
    }
    playFlipSound();
    render();
    setTimeout(scrollToCard, 10);
  }, 400);
}

// Retry Flashcard Action
function retryFlashcard() {
  const q = list[index];
  if (!q) return;
  delete state.flash[q.id];
  delete state.quiz[q.id];
  flipped = false;
  persist();
  stats();
  render();
  setTimeout(scrollToCard, 10);
}

// Answer Action
function answer(letter) {
  const q = list[index];
  if (mode !== 'quiz' || !q || state.quiz[q.id]) return;

  const isCorrect = letter === q.answer;
  state.quiz[q.id] = { choice: letter, correct: isCorrect };

  if (isCorrect) {
    currentStreak++;
    if (currentStreak > (state.maxStreak || 0)) {
      state.maxStreak = currentStreak;
    }
    playCorrectSound();
    if (currentStreak >= 5 && currentStreak % 5 === 0) {
      playStreakCelebration();
      triggerConfetti();
      showToast('🔥 Chuỗi ' + currentStreak + ' câu đúng liên tiếp! Quá đỉnh!');
    }
  } else {
    currentStreak = 0;
    playWrongSound();
  }

  persist();
  render();

  const seenAll = list.every(item => state.quiz[item.id]);
  if (seenAll) {
    triggerConfetti();
    showToast('🏆 Chúc mừng! Bạn đã hoàn thành tất cả câu trong bộ này!');
  }
}

// Move Navigation with smooth auto-scroll to card
function move(n) {
  if (index + n < 0 || index + n >= list.length) return;
  index += n;
  flipped = false;
  revealed = false;
  render();
  setTimeout(scrollToCard, 10);
}

// Full Matrix Modal Builder
function openMatrixModal() {
  const modal = $('#matrixModal');
  const grid = $('#matrixGrid');

  grid.innerHTML = list.map((v, i) => {
    const rr = state[mode][v.id];
    const isCur = i === index;
    const isSt = state.star[key(v)];
    let cls = isCur ? 'current ' : '';
    if (rr) cls += rr.correct ? 'done ' : 'miss ';
    if (isSt) cls += 'starred ';

    return '<button data-matrix-index="' + i + '" class="jump-btn ' + cls + '" style="position:relative;">' +
      v.id +
    '</button>';
  }).join('');

  $$('[data-matrix-index]').forEach(b => {
    b.onclick = () => {
      index = +b.dataset.matrixIndex;
      flipped = false;
      revealed = false;
      modal.classList.remove('open');
      render();
      setTimeout(scrollToCard, 10);
    };
  });

  modal.classList.add('open');
}

function closeMatrixModal() {
  $('#matrixModal').classList.remove('open');
}

$('#openMatrixBtn').onclick = openMatrixModal;
$('#viewAllMatrix').onclick = openMatrixModal;
$('#mobilePos').onclick = openMatrixModal;
$('#closeMatrixBtn').onclick = closeMatrixModal;
$('#matrixModal').onclick = e => {
  if (e.target === $('#matrixModal')) closeMatrixModal();
};

// Mode Switching
function setAppMode(m) {
  mode = m;
  shuffled = false;
  rebuild();
  setTimeout(scrollToCard, 10);
}

$$('[data-mode]').forEach(b => {
  b.onclick = () => setAppMode(b.dataset.mode);
});

// Event Listeners
$('#search').oninput = () => { rebuild(); setTimeout(scrollToCard, 10); };
$('#filter').onchange = () => { rebuild(); setTimeout(scrollToCard, 10); };

$('#prev').onclick = () => move(-1);
$('#next').onclick = () => move(1);
$('#mobilePrev').onclick = () => move(-1);
$('#mobileNext').onclick = () => move(1);

$('#shuffle').onclick = () => {
  order = base().map(q => q.id);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  shuffled = !shuffled;
  rebuild();
  showToast(shuffled ? '⇄ Đã trộn ngẫu nhiên thứ tự câu' : '⇄ Đã khôi phục thứ tự chuẩn');
  setTimeout(scrollToCard, 10);
};

$('#reset').onclick = () => {
  if (confirm('Bạn có chắc muốn xóa toàn bộ kết quả, đánh dấu sao và bài tự luận trên trình duyệt này?')) {
    state = { quiz: {}, flash: {}, essay: {}, star: {}, notes: {}, maxStreak: 0 };
    currentStreak = 0;
    persist();
    rebuild();
    showToast('🗑️ Đã xóa toàn bộ dữ liệu học tập.');
    setTimeout(scrollToCard, 10);
  }
};

// GLOBAL KEYBOARD SHORTCUTS (USER REQUEST)
// Keys: A, B, C, D (case-insensitive) or 1, 2, 3, 4 to select options
// Keys: ArrowLeft / ArrowRight to move between questions
// Key: Enter to advance to next question after answering
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if ($('#syncModal') && $('#syncModal').classList.contains('open')) {
      closeSyncModal();
      return;
    }
    if ($('#formulaModal') && $('#formulaModal').classList.contains('open')) {
      closeFormulaModal();
      return;
    }
    if ($('#imageLightbox').classList.contains('open')) {
      closeLightbox();
      return;
    }
    if ($('#matrixModal').classList.contains('open')) {
      closeMatrixModal();
      return;
    }
    closeDrawer();
  }

  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;

  const keyUpper = e.key.toUpperCase();

  // FORMULA 3D FLASHCARD MODAL SHORTCUTS (WAYGROUND / QUIZIZZ STYLE)
  const formulaModalEl = $('#formulaModal');
  if (formulaModalEl && formulaModalEl.classList.contains('open')) {
    if (e.code === 'Space') {
      e.preventDefault();
      flipFormulaCard();
      return;
    }
    if (['A', 'B', 'C', 'D'].includes(keyUpper)) {
      e.preventDefault();
      answerFormulaQuiz(keyUpper);
      return;
    }
    if (/^[1-4]$/.test(e.key)) {
      e.preventDefault();
      answerFormulaQuiz('ABCD'[+e.key - 1]);
      return;
    }
    if (keyUpper === 'R') {
      e.preventDefault();
      retryFormulaQuiz();
      return;
    }
    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      navFormulaQuiz(1);
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navFormulaQuiz(-1);
      return;
    }
    return;
  }

  // Navigation Arrows
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    if (mode === 'formula') navFormulaQuiz(1);
    else move(1);
    return;
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (mode === 'formula') navFormulaQuiz(-1);
    else move(-1);
    return;
  }

  // Formula Mode Flashcard Selection with A, B, C, D or 1, 2, 3, 4
  if (mode === 'formula') {
    if (['A', 'B', 'C', 'D'].includes(keyUpper)) {
      e.preventDefault();
      answerFormulaQuiz(keyUpper);
      return;
    }
    if (/^[1-4]$/.test(e.key)) {
      e.preventDefault();
      answerFormulaQuiz('ABCD'[+e.key - 1]);
      return;
    }
    if (keyUpper === 'R') {
      e.preventDefault();
      retryFormulaQuiz();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      navFormulaQuiz(1);
      return;
    }
  }

  // Quiz Mode Selection with A, B, C, D or 1, 2, 3, 4
  if (mode === 'quiz') {
    const curQ = list[index];
    if (['A', 'B', 'C', 'D'].includes(keyUpper)) {
      e.preventDefault();
      answer(keyUpper);
      return;
    }
    if (/^[1-4]$/.test(e.key)) {
      e.preventDefault();
      answer('ABCD'[+e.key - 1]);
      return;
    }
    // Enter key to advance to next question if already answered
    if (e.key === 'Enter') {
      if (curQ && state.quiz[curQ.id]) {
        e.preventDefault();
        move(1);
        return;
      }
    }
  }

  // Flashcard Mode Controls
  if (mode === 'flash') {
    const curQ = list[index];
    if (!flipped) {
      // Front face: options can be selected with A, B, C, D or 1, 2, 3, 4
      if (['A', 'B', 'C', 'D'].includes(keyUpper) && curQ && curQ.options && curQ.options.length) {
        e.preventDefault();
        answerFlashcard(keyUpper);
        return;
      }
      if (/^[1-4]$/.test(e.key) && curQ && curQ.options && curQ.options.length) {
        e.preventDefault();
        answerFlashcard('ABCD'[+e.key - 1]);
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        flipCard();
        return;
      }
    } else {
      // Back face: Space flips back, 1/2 grades, R retries
      if (e.code === 'Space') {
        e.preventDefault();
        flipCard();
        return;
      }
      if (keyUpper === 'R') {
        e.preventDefault();
        retryFlashcard();
        return;
      }
      if (e.key === '1') {
        if (curQ) {
          state.flash[curQ.id] = { correct: false };
          persist();
          playWrongSound();
          showToast('📌 Đã lưu: Cần ôn lại');
          if (index < list.length - 1) move(1); else render();
        }
        return;
      }
      if (e.key === '2') {
        if (curQ) {
          state.flash[curQ.id] = { correct: true };
          persist();
          playCorrectSound();
          showToast('✅ Đã ghi nhận: Đã nhớ vững');
          if (index < list.length - 1) move(1); else render();
        }
        return;
      }
    }
  }

  // Common quick shortcuts
  if (keyUpper === 'R') {
    const q = list[index];
    if (mode === 'quiz' && q && state.quiz[q.id]) {
      delete state.quiz[q.id];
      persist();
      render();
      showToast('🔄 Đã đặt lại câu hỏi');
      setTimeout(scrollToCard, 10);
    }
  }
  if (keyUpper === 'S') {
    const q = list[index];
    if (q) {
      const k = key(q);
      state.star[k] = !state.star[k];
      persist();
      render();
      showToast(state.star[k] ? '⭐ Đã lưu' : '☆ Đã bỏ lưu');
    }
  }
});

// ==========================================================================
// CROSS-DEVICE INSTANT SYNC & BACKUP ENGINE (CLOUD SHORT-LINK & QR OPTIMIZED)
// 1. Ultra-short link: https://on-tap-cse703102.vercel.app/?c=... (~50-70 chars)
// 2. High-contrast QR Code with 3-day expiry badge (matching user reference)
// 3. 3-layer sync: Vercel /api/sync -> Cloud KV -> Offline direct compact fallback
// ==========================================================================

const SYNC_CHOICE_MAP = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
const SYNC_CHOICE_REV = ['', 'A', 'B', 'C', 'D'];
let currentCloudSyncId = null;

function getExpiryDateStr(days = 3) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return day + '/' + month + '/' + year;
}

function getQuizBankAnswer(id) {
  if (typeof QUIZ_BANK !== 'undefined' && QUIZ_BANK.quiz) {
    const item = QUIZ_BANK.quiz.find(q => q.id === Number(id));
    if (item) return item.answer;
  }
  return null;
}

function getFormulaBankAnswer(id) {
  if (typeof FORMULA_FLASHCARDS !== 'undefined') {
    const item = FORMULA_FLASHCARDS.find(q => q.id === Number(id));
    if (item) return item.answer;
  }
  return null;
}

function utf8ToBase64(str) {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p1) => String.fromCharCode(parseInt(p1, 16))));
  } catch (e) {
    return btoa(unescape(encodeURIComponent(str)));
  }
}

function base64ToUtf8(b64) {
  try {
    return decodeURIComponent(Array.prototype.map.call(atob(b64), c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch (e) {
    return decodeURIComponent(escape(atob(b64)));
  }
}

function toBase64Url(str) {
  return utf8ToBase64(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url) {
  let b64 = String(b64url).replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return base64ToUtf8(b64);
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(b64url) {
  let b64 = String(b64url).replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function packQuestionMap(map, count, prefixKey) {
  if (!map) return '';
  const entries = [];
  let maxId = 0;
  for (const [k, v] of Object.entries(map)) {
    const id = parseInt(k, 10);
    if (!isNaN(id) && v) {
      const choice = v.choice || (v.correct ? 'C' : 'A');
      entries.push(id + choice);
      if (id > maxId) maxId = id;
    }
  }
  if (entries.length === 0) return '';

  const sparseStr = prefixKey + 's.' + entries.join(',');

  let maxAligned = maxId;
  while (maxAligned % 3 !== 0) maxAligned++;
  const bytes = [];
  for (let i = 1; i <= maxAligned; i += 3) {
    const q0 = map[i];
    const q1 = map[i + 1];
    const q2 = map[i + 2];
    const v0 = q0 ? (SYNC_CHOICE_MAP[q0.choice] || (q0.correct ? 2 : 1)) : 0;
    const v1 = q1 ? (SYNC_CHOICE_MAP[q1.choice] || (q1.correct ? 2 : 1)) : 0;
    const v2 = q2 ? (SYNC_CHOICE_MAP[q2.choice] || (q2.correct ? 2 : 1)) : 0;
    bytes.push(v0 * 25 + v1 * 5 + v2);
  }
  const denseStr = prefixKey + '.' + bytesToBase64Url(bytes);

  return (sparseStr.length <= denseStr.length) ? sparseStr : denseStr;
}

function packSyncData(currState) {
  const s = currState || state;
  const parts = ['2'];

  const qStr = packQuestionMap(s.quiz, 300, 'q');
  if (qStr) parts.push(qStr);

  const fStr = packQuestionMap(s.flash, 300, 'f');
  if (fStr) parts.push(fStr);

  const mStr = packQuestionMap(s.formula, 24, 'm');
  if (mStr) parts.push(mStr);

  if (s.star) {
    const active = Object.keys(s.star).filter(k => s.star[k]);
    if (active.length > 0) parts.push('s.' + active.join(','));
  }

  if (s.maxStreak) {
    parts.push('k.' + s.maxStreak);
  }

  if (s.notes && Object.keys(s.notes).length > 0) {
    try { parts.push('n.' + toBase64Url(JSON.stringify(s.notes))); } catch(e) {}
  }

  if (s.essay && Object.keys(s.essay).length > 0) {
    try { parts.push('e.' + toBase64Url(JSON.stringify(s.essay))); } catch(e) {}
  }

  return parts.join('~');
}

function decodeQuestionSection(targetObj, type, data) {
  if (type.endsWith('s.')) {
    data.split(',').forEach(item => {
      if (!item) return;
      const match = item.match(/^(\d+)([A-D1-4])$/i);
      if (match) {
        const id = parseInt(match[1], 10);
        let ch = match[2].toUpperCase();
        if (ch === '1') ch = 'A';
        else if (ch === '2') ch = 'B';
        else if (ch === '3') ch = 'C';
        else if (ch === '4') ch = 'D';
        targetObj[id] = { choice: ch };
      }
    });
  } else {
    try {
      const bytes = base64UrlToBytes(data);
      let id = 1;
      for (let i = 0; i < bytes.length; i++) {
        let byte = bytes[i];
        const v0 = Math.floor(byte / 25);
        byte %= 25;
        const v1 = Math.floor(byte / 5);
        const v2 = byte % 5;
        if (v0 > 0) targetObj[id] = { choice: SYNC_CHOICE_REV[v0] };
        if (v1 > 0) targetObj[id + 1] = { choice: SYNC_CHOICE_REV[v1] };
        if (v2 > 0) targetObj[id + 2] = { choice: SYNC_CHOICE_REV[v2] };
        id += 3;
      }
    } catch(e) {
      console.warn('Cannot decode dense section:', type, e);
    }
  }
}

function unpackSyncData(payloadStr) {
  if (!payloadStr || typeof payloadStr !== 'string') return null;
  const raw = payloadStr.trim();

  // 1. Try V2 Compact Format
  if (raw === '2' || raw.startsWith('2~') || raw.startsWith('2_') || raw.includes('~q.') || raw.includes('~qs.')) {
    const parts = raw.split('~');
    const result = { quiz: {}, flash: {}, formula: {}, star: {}, notes: {}, essay: {}, maxStreak: 0 };

    for (let pIdx = 1; pIdx < parts.length; pIdx++) {
      const part = parts[pIdx];
      if (part.startsWith('qs.')) {
        decodeQuestionSection(result.quiz, 'qs.', part.slice(3));
      } else if (part.startsWith('q.')) {
        decodeQuestionSection(result.quiz, 'q.', part.slice(2));
      } else if (part.startsWith('fs.')) {
        decodeQuestionSection(result.flash, 'fs.', part.slice(3));
      } else if (part.startsWith('f.')) {
        decodeQuestionSection(result.flash, 'f.', part.slice(2));
      } else if (part.startsWith('ms.')) {
        decodeQuestionSection(result.formula, 'ms.', part.slice(3));
      } else if (part.startsWith('m.')) {
        decodeQuestionSection(result.formula, 'm.', part.slice(2));
      } else if (part.startsWith('s.')) {
        part.slice(2).split(',').forEach(k => { if (k) result.star[k] = true; });
      } else if (part.startsWith('k.')) {
        result.maxStreak = parseInt(part.slice(2), 10) || 0;
      } else if (part.startsWith('n.')) {
        try { result.notes = JSON.parse(fromBase64Url(part.slice(2))); } catch(e) {}
      } else if (part.startsWith('e.')) {
        try { result.essay = JSON.parse(fromBase64Url(part.slice(2))); } catch(e) {}
      }
    }
    return result;
  }

  // 2. Try JSON
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch(e) {
    try {
      const jsonStr = fromBase64Url(raw);
      parsed = JSON.parse(jsonStr);
    } catch(e2) {
      console.warn('Cannot decode sync payload:', e2);
      return null;
    }
  }

  if (!parsed || typeof parsed !== 'object') return null;

  if (parsed.state && typeof parsed.state === 'object') {
    parsed = parsed.state;
  }

  const result = { quiz: {}, flash: {}, formula: {}, star: {}, notes: {}, essay: {}, maxStreak: 0 };

  if (parsed.quiz && typeof parsed.quiz === 'object') {
    Object.assign(result.quiz, parsed.quiz);
  }
  if (parsed.q && typeof parsed.q === 'object') {
    for (const [k, v] of Object.entries(parsed.q)) {
      if (Array.isArray(v)) {
        result.quiz[k] = { choice: v[0], correct: Boolean(v[1]) };
      } else if (typeof v === 'object') {
        result.quiz[k] = v;
      }
    }
  }

  if (parsed.flash && typeof parsed.flash === 'object') {
    Object.assign(result.flash, parsed.flash);
  }
  if (parsed.f && typeof parsed.f === 'object') {
    for (const [k, v] of Object.entries(parsed.f)) {
      if (Array.isArray(v)) {
        result.flash[k] = { choice: v[0], correct: Boolean(v[1]) };
      } else if (typeof v === 'object') {
        result.flash[k] = v;
      } else {
        result.flash[k] = { correct: Boolean(v) };
      }
    }
  }

  if (parsed.formula && typeof parsed.formula === 'object') {
    Object.assign(result.formula, parsed.formula);
  }
  if (parsed.m && typeof parsed.m === 'object') {
    for (const [k, v] of Object.entries(parsed.m)) {
      if (Array.isArray(v)) {
        result.formula[k] = { choice: v[0], correct: Boolean(v[1]) };
      } else if (typeof v === 'object') {
        result.formula[k] = v;
      } else {
        result.formula[k] = { correct: Boolean(v) };
      }
    }
  }

  if (Array.isArray(parsed.star)) {
    parsed.star.forEach(k => { result.star[k] = true; });
  } else if (parsed.star && typeof parsed.star === 'object') {
    Object.assign(result.star, parsed.star);
  }
  if (Array.isArray(parsed.s)) {
    parsed.s.forEach(k => { result.star[k] = true; });
  }

  if (parsed.notes) Object.assign(result.notes, parsed.notes);
  if (parsed.n) Object.assign(result.notes, parsed.n);
  if (parsed.essay) Object.assign(result.essay, parsed.essay);
  if (parsed.e) Object.assign(result.essay, parsed.e);

  if (parsed.maxStreak) result.maxStreak = Math.max(result.maxStreak, parsed.maxStreak);
  if (parsed.k) result.maxStreak = Math.max(result.maxStreak, parsed.k);

  return result;
}

function mergeSyncState(imported) {
  if (!imported) return 0;
  let count = 0;

  state.quiz = state.quiz || {};
  state.flash = state.flash || {};
  state.formula = state.formula || {};
  state.star = state.star || {};
  state.notes = state.notes || {};
  state.essay = state.essay || {};

  if (imported.quiz) {
    for (const [k, v] of Object.entries(imported.quiz)) {
      if (!v) continue;
      const qId = parseInt(k, 10);
      let isCorrect = v.correct;
      if (isCorrect === undefined && v.choice) {
        const ans = getQuizBankAnswer(qId);
        isCorrect = ans ? (ans === v.choice) : true;
      }
      state.quiz[k] = {
        choice: v.choice || '',
        correct: isCorrect !== undefined ? Boolean(isCorrect) : true
      };
      count++;
    }
  }

  if (imported.flash) {
    for (const [k, v] of Object.entries(imported.flash)) {
      if (!v) continue;
      const qId = parseInt(k, 10);
      let isCorrect = v.correct;
      if (isCorrect === undefined && v.choice) {
        const ans = getQuizBankAnswer(qId);
        isCorrect = ans ? (ans === v.choice) : true;
      }
      state.flash[k] = {
        choice: v.choice || '',
        correct: isCorrect !== undefined ? Boolean(isCorrect) : true
      };
      count++;
    }
  }

  if (imported.formula) {
    for (const [k, v] of Object.entries(imported.formula)) {
      if (!v) continue;
      const fId = parseInt(k, 10);
      let isCorrect = v.correct;
      if (isCorrect === undefined && v.choice) {
        const ans = getFormulaBankAnswer(fId);
        isCorrect = ans ? (ans === v.choice) : true;
      }
      state.formula[k] = {
        choice: v.choice || '',
        correct: isCorrect !== undefined ? Boolean(isCorrect) : true
      };
      count++;
    }
  }

  if (imported.star) {
    for (const [k, v] of Object.entries(imported.star)) {
      if (v) {
        state.star[k] = true;
        count++;
      }
    }
  }

  if (imported.notes) {
    for (const [k, v] of Object.entries(imported.notes)) {
      if (v) {
        state.notes[k] = v;
        count++;
      }
    }
  }

  if (imported.essay) {
    for (const [k, v] of Object.entries(imported.essay)) {
      if (v) {
        state.essay[k] = v;
        count++;
      }
    }
  }

  if (imported.maxStreak) {
    state.maxStreak = Math.max(state.maxStreak || 0, imported.maxStreak);
  }

  persist();
  try { rebuild(); } catch (e) {}
  try { updateSyncStatsSummary(); } catch (e) {}

  return count;
}

function getSyncBaseUrl() {
  const isLocal = !window.location.hostname || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) {
    return 'https://on-tap-cse703102.vercel.app/';
  }
  return window.location.origin + window.location.pathname;
}

function getShortSyncUrl(syncId) {
  const base = getSyncBaseUrl();
  return base + (base.endsWith('/') ? '' : '/') + '?c=' + syncId;
}

function getOfflineSyncUrl() {
  const base = getSyncBaseUrl();
  const code = packSyncData();
  return base + (base.endsWith('/') ? '' : '/') + '#s=' + code;
}

function getSyncUrl() {
  if (currentCloudSyncId) {
    return getShortSyncUrl(currentCloudSyncId);
  }
  return getOfflineSyncUrl();
}

async function uploadStateToCloud() {
  try {
    let resp = null;
    try {
      resp = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
    } catch(e) {
      resp = null;
    }

    if (!resp || !resp.ok) {
      resp = await fetch('https://api.restful-api.dev/objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'TMDT_CSE703102_SYNC',
          data: {
            state: state,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000
          }
        })
      });
    }

    const data = await resp.json();
    if (data && data.id) {
      currentCloudSyncId = data.id;
      const shortUrl = getShortSyncUrl(data.id);
      renderSyncQrWithUrl(shortUrl);
      const codeArea = document.getElementById('syncExportText');
      if (codeArea) codeArea.value = data.id;
      return data.id;
    }
  } catch(err) {
    console.warn('Cloud sync upload failed, falling back to offline:', err);
    renderSyncQrWithUrl(getOfflineSyncUrl());
  }
}

async function fetchAndApplyCloudSync(syncId) {
  try {
    showToast('⏳ Đang kết nối nạp tiến độ từ mã ' + syncId.slice(0, 8) + '...');
    let resp = null;
    try {
      resp = await fetch('/api/sync?id=' + encodeURIComponent(syncId));
    } catch(e) {
      resp = null;
    }

    if (!resp || !resp.ok) {
      resp = await fetch('https://api.restful-api.dev/objects/' + encodeURIComponent(syncId));
    }

    if (!resp || !resp.ok) {
      throw new Error('Mã đồng bộ không tìm thấy hoặc đã hết hạn.');
    }

    const data = await resp.json();
    const importedState = (data && data.data && data.data.state) ? data.data.state : (data.state || data);
    const count = mergeSyncState(importedState);

    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      window.location.search = '';
      window.location.hash = '';
    }

    setTimeout(() => {
      playCorrectSound();
      try { triggerConfetti(); } catch (e) {}
      showToast('🎉 Đã đồng bộ thành công ' + count + ' mục vào điện thoại!');
    }, 300);
  } catch(err) {
    console.error('Fetch cloud sync failed:', err);
    showToast('⚠️ Không thể tải dữ liệu: ' + err.message);
  }
}

let activeSyncTab = 'qr';

function switchSyncTab(tabId) {
  activeSyncTab = tabId;
  const tabs = ['qr', 'file', 'code'];
  tabs.forEach(t => {
    const btn = $('#syncTabBtn' + t.charAt(0).toUpperCase() + t.slice(1));
    const panel = $('#syncTab' + t.charAt(0).toUpperCase() + t.slice(1));
    if (btn) btn.classList.toggle('active', t === tabId);
    if (panel) panel.classList.toggle('active', t === tabId);
  });

  if (tabId === 'qr') {
    generateSyncQr();
  } else if (tabId === 'code') {
    const codeArea = $('#syncExportText');
    if (codeArea) {
      codeArea.value = currentCloudSyncId || packSyncData();
    }
  }
}

function updateSyncStatsSummary() {
  const quizDone = Object.keys(state.quiz || {}).length;
  const flashDone = Object.keys(state.flash || {}).length;
  const formulaDone = Object.keys(state.formula || {}).length;
  const starDone = Object.values(state.star || {}).filter(Boolean).length;
  const streak = state.maxStreak || 0;

  const sq = $('#syncStatQuiz');
  const sf = $('#syncStatFlash');
  const sm = $('#syncStatFormula');
  const ss = $('#syncStatStar');
  const sk = $('#syncStatStreak');

  if (sq) sq.textContent = quizDone + '/300';
  if (sf) sf.textContent = flashDone + '/300';
  if (sm) sm.textContent = formulaDone + '/24';
  if (ss) ss.textContent = starDone + ' câu';
  if (sk) sk.textContent = streak + ' 🔥';

  const expEl = document.getElementById('syncExpiryDate');
  if (expEl) expEl.textContent = getExpiryDateStr(3);
}

function renderSyncQrWithUrl(targetUrl) {
  const canvas = document.getElementById('syncQrCanvas');
  if (!canvas) return;

  if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
    QRCode.toCanvas(canvas, targetUrl, {
      width: 280,
      margin: 3,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    }, function(err) {
      if (err) {
        console.warn('QR canvas error:', err);
      }
    });
  }
}

function generateSyncQr() {
  const expEl = document.getElementById('syncExpiryDate');
  if (expEl) expEl.textContent = getExpiryDateStr(3);

  if (currentCloudSyncId) {
    renderSyncQrWithUrl(getShortSyncUrl(currentCloudSyncId));
  } else {
    // Generate QR with direct URL first, then upgrade to cloud URL
    renderSyncQrWithUrl(getOfflineSyncUrl());
    uploadStateToCloud();
  }
}

function refreshSyncQr() {
  currentCloudSyncId = null;
  generateSyncQr();
  showToast('🔄 Đã làm mới mã QR siêu nét!');
}

function copySyncUrl() {
  const syncUrl = getSyncUrl();
  copyTextToClipboard(syncUrl, '📋 Đã sao chép link rút gọn!');
}

function copySyncCode() {
  const code = currentCloudSyncId || packSyncData();
  copyTextToClipboard(code, '📋 Đã sao chép mã đồng bộ rút gọn!');
}

function copyTextToClipboard(text, successMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
    }).catch(() => {
      fallbackCopy(text, successMsg);
    });
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    showToast(successMsg);
  } catch (e) {
    showToast('⚠️ Không thể sao chép tự động, vui lòng copy thủ công.');
  }
  document.body.removeChild(ta);
}

function exportBackupFile() {
  try {
    const backupData = {
      appName: 'Góc ôn tập TMĐT CSE703102',
      version: 1,
      exportedAt: new Date().toISOString(),
      summary: {
        quizDone: Object.keys(state.quiz || {}).length,
        flashDone: Object.keys(state.flash || {}).length,
        formulaDone: Object.keys(state.formula || {}).length,
        starred: Object.values(state.star || {}).filter(Boolean).length,
        maxStreak: state.maxStreak || 0
      },
      state: state
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const d = new Date();
    const dateStr = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tmdt_tiendo_' + dateStr + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 Đã tải file sao lưu tmdt_tiendo.json thành công!');
  } catch (err) {
    console.error(err);
    showToast('⚠️ Không thể xuất file: ' + err.message);
  }
}

function handleImportFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const content = e.target.result;
      const imported = unpackSyncData(content);
      if (!imported) {
        throw new Error('Dữ liệu trong file không hợp lệ');
      }
      const count = mergeSyncState(imported);
      closeSyncModal();
      playCorrectSound();
      try { triggerConfetti(); } catch (e) {}
      showToast('🎉 Khôi phục thành công ' + count + ' mục tiến độ từ file!');
    } catch (err) {
      alert('Không thể khôi phục từ file: ' + err.message);
    }
  };
  reader.readAsText(file, 'UTF-8');
  event.target.value = '';
}

function applySyncCode() {
  const inputEl = $('#syncImportText');
  if (!inputEl) return;
  let raw = inputEl.value.trim();
  if (!raw) {
    showToast('⚠️ Vui lòng dán mã đồng bộ vào ô.');
    return;
  }

  // Check if it's a short cloud code or short cloud link
  let cloudCode = null;
  if (raw.includes('?c=')) {
    cloudCode = raw.split('?c=')[1].split('&')[0];
  } else if (raw.includes('?code=')) {
    cloudCode = raw.split('?code=')[1].split('&')[0];
  } else if (raw.includes('#c=')) {
    cloudCode = raw.split('#c=')[1].split('&')[0];
  } else if (/^[a-f0-9]{32}$/i.test(raw)) {
    cloudCode = raw;
  }

  if (cloudCode) {
    closeSyncModal();
    fetchAndApplyCloudSync(cloudCode);
    inputEl.value = '';
    return;
  }

  // Direct offline code fallback
  if (raw.includes('#s=')) {
    raw = raw.split('#s=')[1].split('&')[0];
  } else if (raw.includes('#sync=')) {
    raw = raw.split('#sync=')[1].split('&')[0];
  }

  const imported = unpackSyncData(raw);
  if (!imported) {
    alert('Mã đồng bộ không hợp lệ hoặc đã bị lỗi ký tự!');
    return;
  }

  const count = mergeSyncState(imported);
  inputEl.value = '';
  closeSyncModal();
  playCorrectSound();
  try { triggerConfetti(); } catch (e) {}
  showToast('🎉 Đã đồng bộ thành công ' + count + ' mục!');
}

function openSyncModal() {
  updateSyncStatsSummary();
  switchSyncTab(activeSyncTab || 'qr');
  const modal = $('#syncModal');
  if (modal) {
    modal.classList.add('open');
  }
}

function closeSyncModal() {
  const modal = $('#syncModal');
  if (modal) {
    modal.classList.remove('open');
  }
}

function handleSyncOverlayClick(e) {
  if (e.target && e.target.id === 'syncModal') {
    closeSyncModal();
  }
}

function checkSyncUrlOnBoot() {
  try {
    let cloudCode = null;
    let payloadStr = '';

    const search = window.location.search || '';
    if (search) {
      const params = new URLSearchParams(search);
      if (params.get('c')) cloudCode = params.get('c');
      else if (params.get('code')) cloudCode = params.get('code');
    }

    const hash = window.location.hash || '';
    if (!cloudCode) {
      if (hash.startsWith('#c=')) {
        cloudCode = hash.slice(3);
      } else if (hash.startsWith('#s=')) {
        payloadStr = hash.slice(3);
      } else if (hash.startsWith('#sync=')) {
        payloadStr = hash.slice(6);
      }
    }

    if (cloudCode) {
      fetchAndApplyCloudSync(cloudCode);
      return;
    }

    if (payloadStr) {
      const imported = unpackSyncData(payloadStr);
      if (imported) {
        const count = mergeSyncState(imported);
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        } else {
          window.location.hash = '';
        }

        setTimeout(() => {
          playCorrectSound();
          try { triggerConfetti(); } catch (e) {}
          showToast('🎉 Đã tự động đồng bộ ' + count + ' mục từ thiết bị khác!');
        }, 400);
      }
    }
  } catch (err) {
    console.error('Boot sync check failed:', err);
  }
}

// Initial boot
rebuild();
checkSyncUrlOnBoot();

if (typeof window !== 'undefined') {
  window.setAppMode = setAppMode;
  window.answerFlashcard = answerFlashcard;
  window.retryFlashcard = retryFlashcard;
  window.openSyncModal = openSyncModal;
  window.closeSyncModal = closeSyncModal;
  window.handleSyncOverlayClick = handleSyncOverlayClick;
  window.switchSyncTab = switchSyncTab;
  window.packSyncData = packSyncData;
  window.unpackSyncData = unpackSyncData;
  window.mergeSyncState = mergeSyncState;
  window.checkSyncUrlOnBoot = checkSyncUrlOnBoot;
  window.generateSyncQr = generateSyncQr;
  window.refreshSyncQr = refreshSyncQr;
  window.copySyncUrl = copySyncUrl;
  window.copySyncCode = copySyncCode;
  window.exportBackupFile = exportBackupFile;
  window.handleImportFile = handleImportFile;
  window.applySyncCode = applySyncCode;
}
