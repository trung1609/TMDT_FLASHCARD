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

// Initial boot
rebuild();

if (typeof window !== 'undefined') {
  window.setAppMode = setAppMode;
  window.answerFlashcard = answerFlashcard;
  window.retryFlashcard = retryFlashcard;
}
