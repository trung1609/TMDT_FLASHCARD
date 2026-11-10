/**
 * bigdata.js - Controller cho trang ôn tập Tích hợp và phân tích Dữ liệu lớn
 * 319 câu hỏi bám sát 100% Big Data Practice Lab
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'big-data-practice-v1';
  const SOUND_KEY = 'big-data-sound-enabled';
  const THEME_KEY = 'quiz-hub-theme';

  // State
  let currentBatch = '1';
  let currentFilter = 'all';
  let searchQuery = '';
  let currentQId = null;
  let answers = {};
  let last = {};
  let streak = 0;
  let soundEnabled = localStorage.getItem(SOUND_KEY) !== 'false';
  let currentTheme = localStorage.getItem(THEME_KEY) || 'light';

  // Load state từ LocalStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      answers = parsed.answers || {};
      last = parsed.last || {};
      if (parsed.batch && ['1', '2', '3', '4', '5', 'all'].includes(parsed.batch)) {
        currentBatch = parsed.batch;
      }
    }
  } catch (e) {
    console.warn('Cannot parse localStorage data:', e);
  }

  // Khởi tạo Audio Context (Offline Sound Synthesizer)
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'correct') {
        // Ding chord: C6 + G6
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1046.5, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1567.98, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.45);
        osc2.stop(now + 0.45);
      } else if (type === 'wrong') {
        // Low buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.28);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'streak') {
        // High arpeggio
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.12, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.25);
        });
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Pháo hoa giấy (Confetti)
  function triggerConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#0284c7', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.8) * 14,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
        alpha: 1
      });
    }

    let frame = 0;
    function renderConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // trọng lực
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
      frame++;
      if (alive && frame < 90) {
        requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    renderConfetti();
  }

  // Toast
  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2500);
  }

  // Lưu vào LocalStorage
  function saveState() {
    if (currentQId) {
      last[currentBatch] = currentQId;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, last, batch: currentBatch }));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  // Danh sách câu theo Batch đang chọn
  function getScopedQuestions() {
    if (typeof BIGDATA_QUESTIONS === 'undefined') return [];
    if (currentBatch === 'all') return BIGDATA_QUESTIONS;
    return BIGDATA_QUESTIONS.filter(q => String(q.batch) === String(currentBatch));
  }

  // Danh sách câu theo Bộ lọc (All, Chưa làm, Câu sai, Đã đúng) & Tìm kiếm
  function getVisibleQuestions() {
    const scoped = getScopedQuestions();
    return scoped.filter(q => {
      const rec = answers[q.id];
      // Filter trạng thái
      let matchesFilter = true;
      if (currentFilter === 'remaining') {
        matchesFilter = !rec || !rec.checked;
      } else if (currentFilter === 'wrong') {
        matchesFilter = rec && rec.checked && rec.correct === false;
      } else if (currentFilter === 'correct') {
        matchesFilter = rec && rec.checked && rec.correct === true;
      }

      // Filter từ khóa tìm kiếm
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        matchesSearch = (
          q.prompt.toLowerCase().includes(query) ||
          (q.note && q.note.toLowerCase().includes(query)) ||
          (q.context && q.context.toLowerCase().includes(query)) ||
          (q.command && q.command.toLowerCase().includes(query)) ||
          Object.values(q.options || {}).some(opt => opt.toLowerCase().includes(query))
        );
      }

      return matchesFilter && matchesSearch;
    });
  }

  // Cập nhật giao diện thống kê trên thẻ Overview
  function updateOverviewStats() {
    const all = typeof BIGDATA_QUESTIONS !== 'undefined' ? BIGDATA_QUESTIONS : [];
    const scoped = getScopedQuestions();

    const doneCount = scoped.filter(q => answers[q.id]?.checked).length;
    const correctCount = scoped.filter(q => answers[q.id]?.correct === true).length;
    const totalCount = scoped.length;

    const elDone = document.getElementById('statDone');
    const elCorrect = document.getElementById('statCorrect');
    const elTotal = document.getElementById('statTotal');
    const elRate = document.getElementById('statRate');

    if (elDone) elDone.textContent = doneCount;
    if (elCorrect) elCorrect.textContent = correctCount;
    if (elTotal) elTotal.textContent = totalCount;
    if (elRate) {
      const rate = doneCount > 0 ? Math.round((correctCount / doneCount) * 100) : 0;
      elRate.textContent = rate + '%';
    }

    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.textContent = streak;
  }

  // Cập nhật Dropdown Jump
  function updateJumpSelect(visibleList, activeQ) {
    const jump = document.getElementById('jumpSelect');
    if (!jump) return;
    jump.innerHTML = '';

    visibleList.forEach((q, idx) => {
      const opt = document.createElement('option');
      opt.value = q.id;
      const rec = answers[q.id];
      const statusIcon = rec?.checked ? (rec.correct ? '✓ ' : '✕ ') : '';
      opt.textContent = `${statusIcon}${currentBatch === 'all' ? `B${q.batch}·Câu ${q.n}` : `Câu ${q.n}`}`;
      if (activeQ && q.id === activeQ.id) opt.selected = true;
      jump.appendChild(opt);
    });

    jump.disabled = visibleList.length === 0;
  }

  // Render câu hỏi hiện tại
  function render() {
    updateOverviewStats();

    // Cập nhật trạng thái Batch Buttons
    document.querySelectorAll('.batch-btn').forEach(btn => {
      const b = btn.getAttribute('data-batch');
      btn.classList.toggle('active', b === currentBatch);
    });

    // Cập nhật Batch Notes
    const noteEl = document.getElementById('batchNoteBox');
    if (noteEl) {
      if (currentBatch === '4') {
        noteEl.style.display = 'flex';
        noteEl.innerHTML = '💡 <b>Lưu ý Batch 4:</b> Đáp án đã được đối chiếu kỹ lưỡng với tài liệu Word và tài liệu kỹ thuật Neo4j.';
      } else if (currentBatch === '5') {
        noteEl.style.display = 'flex';
        noteEl.innerHTML = '💡 <b>Gợi ý Batch 5:</b> Bao gồm các câu hỏi ôn tập cú pháp, bài tập thực hành và 16 câu trắc nghiệm so sánh các hệ dữ liệu lớn (Câu 101 – 116).';
      } else {
        noteEl.style.display = 'none';
      }
    }

    const visibleList = getVisibleQuestions();
    let q = visibleList.find(x => x.id === currentQId);
    if (!q && visibleList.length > 0) {
      q = visibleList[0];
      currentQId = q.id;
    }

    updateJumpSelect(visibleList, q);

    const quizCard = document.getElementById('quizCard');
    const emptyState = document.getElementById('emptyState');
    const navBottom = document.getElementById('navBottom');

    if (!q) {
      if (quizCard) quizCard.style.display = 'none';
      if (navBottom) navBottom.style.display = 'none';
      if (emptyState) {
        emptyState.style.display = 'block';
        const emptyDesc = document.getElementById('emptyDesc');
        if (emptyDesc) {
          emptyDesc.textContent = currentFilter === 'wrong'
            ? 'Bạn chưa có câu trả lời sai nào trong bộ đề này. Làm rất tốt!'
            : (currentFilter === 'remaining' ? 'Bạn đã làm xong tất cả các câu trong bộ đề này!' : 'Không tìm thấy câu hỏi phù hợp với tìm kiếm.');
        }
      }
      return;
    }

    if (quizCard) quizCard.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    if (navBottom) navBottom.style.display = 'flex';

    saveState();

    // Render thông tin chi tiết câu hỏi
    const rec = answers[q.id] || { selected: [] };
    const isGraded = q.answer && q.answer.length > 0;
    const isChecked = !!rec.checked;

    // Badges
    document.getElementById('qBatchTag').textContent = `Batch ${q.batch} · Câu ${q.n}`;
    const cdrTag = document.getElementById('qCdrTag');
    if (cdrTag) {
      if (q.cdr) {
        cdrTag.textContent = `CDR ${q.cdr}`;
        cdrTag.style.display = 'inline-flex';
      } else {
        cdrTag.style.display = 'none';
      }
    }

    const diffTag = document.getElementById('qDiffTag');
    if (diffTag) {
      if (q.difficulty) {
        const diffMap = { 'DE': 'Dễ', 'TB': 'Trung bình', 'KHO': 'Khó' };
        diffTag.textContent = diffMap[q.difficulty] || q.difficulty;
        diffTag.className = `q-badge diff-${q.difficulty}`;
        diffTag.style.display = 'inline-flex';
      } else {
        diffTag.style.display = 'none';
      }
    }

    // Status Pill
    const statusPill = document.getElementById('qStatusPill');
    if (statusPill) {
      if (!isChecked) {
        statusPill.textContent = isGraded ? 'Chưa kiểm tra' : 'Thảo luận (Không chấm)';
        statusPill.className = 'q-status-pill untested';
      } else {
        if (!isGraded) {
          statusPill.textContent = 'Đã xem gợi ý';
          statusPill.className = 'q-status-pill untested';
        } else if (rec.correct) {
          statusPill.textContent = '✓ Trả lời chính xác';
          statusPill.className = 'q-status-pill correct';
        } else {
          statusPill.textContent = '✕ Chưa chính xác';
          statusPill.className = 'q-status-pill wrong';
        }
      }
    }

    // Prompt
    document.getElementById('qPromptTitle').textContent = q.prompt;

    // Context / Sample / Command
    const contextBox = document.getElementById('qContextBox');
    if (contextBox) {
      if (q.context || q.sample || q.command || q.task) {
        contextBox.style.display = 'block';
        let contextHtml = '';
        if (q.context) {
          contextHtml += `<p class="q-context-desc">${q.context}</p>`;
        }
        if (q.sample) {
          contextHtml += `<div class="q-code-caption">Dữ liệu mẫu:</div><pre class="q-code-block"><code>${escapeHtml(q.sample)}</code></pre>`;
        }
        if (q.command) {
          contextHtml += `<div class="q-code-caption">Câu lệnh / Truy vấn:</div><pre class="q-code-block"><code>${escapeHtml(q.command)}</code></pre>`;
        }
        if (q.task) {
          contextHtml += `<div class="q-task-desc"><b>Yêu cầu:</b> ${q.task}</div>`;
        }
        contextBox.innerHTML = contextHtml;
      } else {
        contextBox.style.display = 'none';
      }
    }

    // Instruction Text
    const instrEl = document.getElementById('qInstructionText');
    if (instrEl) {
      if (!isGraded) {
        instrEl.textContent = 'Câu hỏi mở/thảo luận: Bạn có thể xem gợi ý đối chiếu mà không bị trừ điểm.';
      } else if (q.answer.length === 1) {
        instrEl.textContent = '💡 Chọn 1 đáp án (Bấm phím A, B, C, D hoặc bấm chuột):';
      } else {
        instrEl.textContent = `💡 Chọn ${q.answer.length} đáp án đúng (Câu hỏi nhiều lựa chọn):`;
      }
    }

    // Options List
    const optionsContainer = document.getElementById('qOptionsList');
    if (optionsContainer && q.options) {
      optionsContainer.innerHTML = '';
      const letters = Object.keys(q.options).sort();

      letters.forEach(letter => {
        const val = q.options[letter];
        const isSelected = rec.selected && rec.selected.includes(letter);
        const isCorrectChoice = isChecked && q.answer.includes(letter);
        const isWrongChoice = isChecked && isSelected && !isCorrectChoice;

        let itemCls = 'option-item';
        if (isSelected) itemCls += ' selected';
        if (isChecked && isCorrectChoice) itemCls += ' is-correct';
        if (isChecked && isWrongChoice) itemCls += ' is-wrong';

        const isMulti = q.answer.length > 1;
        const inputType = isMulti ? 'checkbox' : 'radio';

        const item = document.createElement('div');
        item.className = itemCls;
        item.setAttribute('data-letter', letter);

        const isCodeOption = q.codeOptions && q.codeOptions.includes(letter);
        const textMarkup = isCodeOption
          ? `<code class="option-code">${escapeHtml(val)}</code>`
          : `<span class="option-text">${val}</span>`;

        let markBadge = '';
        if (isChecked) {
          if (isCorrectChoice) markBadge = '<span class="option-mark-badge good">✓ Đúng</span>';
          else if (isWrongChoice) markBadge = '<span class="option-mark-badge bad">✕ Sai</span>';
        }

        item.innerHTML = `
          <input type="${inputType}" name="bd_opt_${q.id}" value="${letter}" ${isSelected ? 'checked' : ''} ${isChecked ? 'disabled' : ''}>
          <span class="option-letter">${letter}</span>
          ${textMarkup}
          ${markBadge}
        `;

        if (!isChecked) {
          item.addEventListener('click', (e) => {
            // Không kích hoạt trùng lặp nếu click vào chính checkbox
            if (e.target.tagName !== 'INPUT') {
              const input = item.querySelector('input');
              if (input) input.checked = !input.checked;
            }
            handleOptionSelect(q, letter);
          });
        }

        optionsContainer.appendChild(item);
      });
    }

    // Check & Clear Buttons
    const checkBtn = document.getElementById('btnCheck');
    const clearBtn = document.getElementById('btnClear');
    const retryBtn = document.getElementById('btnRetry');

    if (checkBtn) {
      checkBtn.textContent = isGraded ? 'Kiểm tra đáp án (Enter)' : 'Xem gợi ý đối chiếu';
      if (isChecked) {
        checkBtn.disabled = true;
      } else {
        checkBtn.disabled = isGraded && (!rec.selected || rec.selected.length === 0);
      }
    }

    if (clearBtn) {
      clearBtn.disabled = isChecked || !rec.selected || rec.selected.length === 0;
    }

    if (retryBtn) {
      retryBtn.style.display = isChecked ? 'inline-flex' : 'none';
    }

    // Feedback Box
    const fbBox = document.getElementById('qFeedbackBox');
    if (fbBox) {
      if (isChecked) {
        fbBox.style.display = 'block';
        fbBox.className = 'q-feedback-box ' + (!isGraded ? 'neutral' : rec.correct ? 'good' : 'bad');

        let fbTitle = !isGraded ? '💡 Gợi ý giải thích' : rec.correct ? '🎉 Chính xác!' : '⚠️ Chưa chính xác';
        let ansMarkup = '';
        if (isGraded) {
          const sourceLabels = {
            'docx': 'Đáp án chuẩn theo tài liệu Word:',
            'neo4j': 'Đáp án theo tài liệu kỹ thuật Neo4j:'
          };
          const sourceText = sourceLabels[q.source] || 'Đáp án đúng:';
          ansMarkup = `<div class="q-feedback-ans"><b>${sourceText}</b> ${q.answer.join(', ')}</div>`;
        }

        let noteMarkup = '';
        if (q.note) {
          noteMarkup = `<div class="q-feedback-note"><b>Giải thích & Đối chiếu:</b> ${q.note}</div>`;
        }

        fbBox.innerHTML = `
          <div class="q-feedback-header">${fbTitle}</div>
          ${ansMarkup}
          ${noteMarkup}
        `;
      } else {
        fbBox.style.display = 'none';
      }
    }

    // Nav Bottom Position & Buttons
    const curIdx = visibleList.indexOf(q);
    const posText = document.getElementById('navPosText');
    if (posText) {
      posText.textContent = `Câu ${curIdx + 1} / ${visibleList.length} (${currentBatch === 'all' ? 'Tất cả 319 câu' : `Batch ${currentBatch}`})`;
    }

    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    if (btnPrev) btnPrev.disabled = curIdx <= 0;
    if (btnNext) btnNext.disabled = curIdx >= visibleList.length - 1;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Chọn option
  function handleOptionSelect(q, letter) {
    const rec = answers[q.id] || { selected: [] };
    if (rec.checked) return;

    const isMulti = q.answer.length > 1;
    if (isMulti) {
      if (!rec.selected) rec.selected = [];
      const idx = rec.selected.indexOf(letter);
      if (idx >= 0) rec.selected.splice(idx, 1);
      else rec.selected.push(letter);
    } else {
      rec.selected = [letter];
    }

    answers[q.id] = rec;
    saveState();
    render();
  }

  // Kiểm tra đáp án
  function checkCurrentAnswer() {
    const visibleList = getVisibleQuestions();
    const q = visibleList.find(x => x.id === currentQId);
    if (!q) return;

    const rec = answers[q.id] || { selected: [] };
    if (rec.checked) return;

    const isGraded = q.answer && q.answer.length > 0;
    if (isGraded && (!rec.selected || rec.selected.length === 0)) {
      showToast('⚠️ Vui lòng chọn ít nhất 1 đáp án trước khi kiểm tra!');
      return;
    }

    // Tính đúng/sai
    if (isGraded) {
      const correctSorted = [...q.answer].sort().join(',');
      const selectedSorted = [...rec.selected].sort().join(',');
      rec.correct = correctSorted === selectedSorted;
      rec.checked = true;

      if (rec.correct) {
        streak++;
        playSound('correct');
        triggerConfetti();
        if (streak % 5 === 0) {
          playSound('streak');
          showToast(`🔥 Tuyệt vời! Chuỗi ${streak} câu trả lời đúng liên tiếp!`);
        }
      } else {
        streak = 0;
        playSound('wrong');
      }
    } else {
      rec.correct = null;
      rec.checked = true;
    }

    answers[q.id] = rec;
    saveState();
    render();
  }

  // Làm lại câu hiện tại
  function retryCurrentQuestion() {
    if (!currentQId) return;
    delete answers[currentQId];
    saveState();
    render();
  }

  // Xóa lựa chọn chưa nộp
  function clearCurrentSelection() {
    if (!currentQId) return;
    const rec = answers[currentQId];
    if (rec && !rec.checked) {
      delete answers[currentQId];
      saveState();
      render();
    }
  }

  // Chuyển câu (delta: -1 hoặc +1)
  function moveQuestion(delta) {
    const list = getVisibleQuestions();
    const idx = list.findIndex(x => x.id === currentQId);
    if (idx === -1) return;
    const nextQ = list[idx + delta];
    if (nextQ) {
      currentQId = nextQ.id;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Đổi Batch
  function setBatch(batchId) {
    currentBatch = batchId;
    currentFilter = 'all';
    searchQuery = '';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    const filterSelect = document.getElementById('filterSelect');
    if (filterSelect) filterSelect.value = 'all';

    // Đặt câu hỏi đầu tiên của batch
    const list = getScopedQuestions();
    currentQId = last[currentBatch] && list.some(x => x.id === last[currentBatch])
      ? last[currentBatch]
      : (list[0]?.id || null);

    saveState();
    render();
  }

  // Reset toàn bộ bộ đề đang chọn
  function resetCurrentBatchProgress() {
    const scoped = getScopedQuestions();
    const batchName = currentBatch === 'all' ? 'tất cả 319 câu hỏi' : `Batch ${currentBatch}`;
    if (!confirm(`Bạn có chắc muốn xóa toàn bộ kết quả đã làm trong ${batchName} để ôn tập lại từ đầu?`)) return;

    scoped.forEach(q => delete answers[q.id]);
    streak = 0;
    saveState();
    render();
    showToast('✨ Đã làm mới tiến độ bộ đề!');
  }

  // Theme Management
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // Sound Management
  function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_KEY, String(soundEnabled));
    const soundIcon = document.getElementById('soundIcon');
    if (soundIcon) {
      soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    }
    showToast(soundEnabled ? '🔊 Đã bật âm thanh' : '🔇 Đã tắt âm thanh');
  }

  // Phím tắt bàn phím
  function handleKeyDown(e) {
    // Không bắt phím khi đang gõ vào ô input tìm kiếm
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    const key = e.key.toUpperCase();

    // Phím A, B, C, D chọn đáp án
    if (['A', 'B', 'C', 'D'].includes(key)) {
      const visibleList = getVisibleQuestions();
      const q = visibleList.find(x => x.id === currentQId);
      if (q && q.options && q.options[key]) {
        handleOptionSelect(q, key);
      }
    } else if (e.key === 'Enter') {
      checkCurrentAnswer();
    } else if (e.key === 'ArrowLeft') {
      moveQuestion(-1);
    } else if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      moveQuestion(1);
    } else if (key === 'R') {
      retryCurrentQuestion();
    } else if (key === 'S') {
      toggleSound();
    }
  }

  // Lắng nghe sự kiện khi tài liệu sẵn sàng
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(currentTheme);

    const soundIcon = document.getElementById('soundIcon');
    if (soundIcon) soundIcon.textContent = soundEnabled ? '🔊' : '🔇';

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
      });
    }

    // Sound Toggle
    const soundBtn = document.getElementById('soundToggle');
    if (soundBtn) soundBtn.addEventListener('click', toggleSound);

    // Batch Buttons
    document.querySelectorAll('.batch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setBatch(btn.getAttribute('data-batch'));
      });
    });

    // Jump Select
    const jumpSelect = document.getElementById('jumpSelect');
    if (jumpSelect) {
      jumpSelect.addEventListener('change', (e) => {
        currentQId = e.target.value;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Filter Select
    const filterSelect = document.getElementById('filterSelect');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        render();
      });
    }

    // Search Input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
      });
    }

    // Buttons
    const btnCheck = document.getElementById('btnCheck');
    if (btnCheck) btnCheck.addEventListener('click', checkCurrentAnswer);

    const btnClear = document.getElementById('btnClear');
    if (btnClear) btnClear.addEventListener('click', clearCurrentSelection);

    const btnRetry = document.getElementById('btnRetry');
    if (btnRetry) btnRetry.addEventListener('click', retryCurrentQuestion);

    const btnResetBatch = document.getElementById('btnResetBatch');
    if (btnResetBatch) btnResetBatch.addEventListener('click', resetCurrentBatchProgress);

    const btnPrev = document.getElementById('btnPrev');
    if (btnPrev) btnPrev.addEventListener('click', () => moveQuestion(-1));

    const btnNext = document.getElementById('btnNext');
    if (btnNext) btnNext.addEventListener('click', () => moveQuestion(1));

    const btnEmptyReset = document.getElementById('btnEmptyReset');
    if (btnEmptyReset) {
      btnEmptyReset.addEventListener('click', () => {
        currentFilter = 'all';
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (filterSelect) filterSelect.value = 'all';
        render();
      });
    }

    window.addEventListener('keydown', handleKeyDown);

    // Initial render
    const scoped = getScopedQuestions();
    if (!currentQId && scoped.length > 0) {
      currentQId = scoped[0].id;
    }
    render();
  });
})();

