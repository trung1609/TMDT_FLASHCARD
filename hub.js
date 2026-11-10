/**
 * hub.js - Controller for Phenikaa Quiz Hub
 * Quản lý hiển thị danh mục học phần, tìm kiếm, lọc, tiến độ người học và modal.
 */

(function () {
  'use strict';

  // Khởi tạo State
  let currentFilter = 'all';
  let searchQuery = '';
  let currentTheme = localStorage.getItem('quiz-hub-theme') || localStorage.getItem('cse703102-theme') || 'light';
  
  // Tùy chỉnh kích thước các đề mục (Heading Scale)
  const HEADING_SCALES = ['compact', 'normal', 'large'];
  const HEADING_LABELS = {
    compact: 'Gọn',
    normal: 'Chuẩn',
    large: 'Lớn'
  };
  let currentHeadingScale = localStorage.getItem('quiz-hub-heading-scale') || 'normal';

  // Áp dụng Tùy Chỉnh Tiêu Đề
  function applyHeadingScale(scale) {
    if (!HEADING_SCALES.includes(scale)) scale = 'normal';
    currentHeadingScale = scale;
    document.documentElement.setAttribute('data-heading-scale', scale);
    localStorage.setItem('quiz-hub-heading-scale', scale);

    const labelEl = document.getElementById('headingScaleLabel');
    if (labelEl) {
      labelEl.textContent = HEADING_LABELS[scale] || 'Chuẩn';
    }

    document.querySelectorAll('.heading-size-opt').forEach(btn => {
      if (btn.getAttribute('data-scale') === scale) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  window.setHeadingScale = function (scale) {
    applyHeadingScale(scale);
  };

  window.cycleHeadingScale = function () {
    const idx = HEADING_SCALES.indexOf(currentHeadingScale);
    const nextIdx = (idx + 1) % HEADING_SCALES.length;
    applyHeadingScale(HEADING_SCALES[nextIdx]);
  };

  // Áp dụng Theme
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('quiz-hub-theme', theme);
    localStorage.setItem('cse703102-theme', theme);
    
    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    if (window.update3DTheme) {
      window.update3DTheme(theme);
    }
  }

  // Render Danh Sách Học Phần
  function renderCourses() {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;

    if (typeof COURSES_DATA === 'undefined' || !Array.isArray(COURSES_DATA)) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Không tìm thấy dữ liệu học phần.</div>';
      return;
    }

    // Lọc danh sách theo filter & search
    const filtered = COURSES_DATA.filter(course => {
      // 1. Filter theo category
      let matchesFilter = true;
      if (currentFilter === 'in_progress') {
        const progress = getCourseUserProgress(course);
        matchesFilter = progress && progress.answeredCount > 0;
      } else if (currentFilter !== 'all') {
        matchesFilter = course.category === currentFilter;
      }

      // 2. Filter theo tìm kiếm
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        matchesSearch = (
          course.title.toLowerCase().includes(q) ||
          course.code.toLowerCase().includes(q) ||
          (course.faculty && course.faculty.toLowerCase().includes(q)) ||
          (course.description && course.description.toLowerCase().includes(q)) ||
          (course.highlights && course.highlights.some(h => h.toLowerCase().includes(q)))
        );
      }

      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: var(--surface-card); border: 1px dashed var(--border-card); border-radius: var(--radius-xl);">
          <div style="font-size: 40px; margin-bottom: 12px;">🔍</div>
          <h3 style="font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Không tìm thấy học phần phù hợp</h3>
          <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 18px;">Thử tìm kiếm với từ khóa khác hoặc đặt lại bộ lọc.</p>
          <button class="hub-pill-btn" onclick="resetFilters()">Đặt lại bộ lọc</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(course => {
      const isReady = course.status === 'ready';
      const progress = isReady ? getCourseUserProgress(course) : null;
      const isFeatured = !!course.featured;

      // HTML cho khối tiến độ nếu có dữ liệu thật
      let progressHtml = '';
      if (isReady) {
        if (progress && progress.answeredCount > 0) {
          progressHtml = `
            <div class="card-progress-box">
              <div class="card-progress-header">
                <span>Tiến độ của bạn</span>
                <span style="color: var(--orange-phenikaa);">${progress.answeredCount}/${progress.total} câu (${progress.percent}%)</span>
              </div>
              <div class="card-progress-bar-bg">
                <div class="card-progress-fill" style="width: ${progress.percent}%;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-top: 6px;">
                <span>Chính xác: <b>${progress.accuracy}%</b></span>
                <span>Đúng: <b>${progress.correctCount}</b> câu</span>
              </div>
            </div>
          `;
        } else {
          progressHtml = `
            <div class="card-progress-box" style="background: var(--surface-subtle); border-style: dashed;">
              <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                <span>✨</span> <span>Chưa bắt đầu ôn tập. Hãy thử sức ngay!</span>
              </div>
            </div>
          `;
        }
      }

      // Nút hành động
      let actionBtnHtml = '';
      if (isReady) {
        actionBtnHtml = `
          <a href="${course.url}" class="card-enter-btn primary" title="Bắt đầu ôn thi môn ${course.title}">
            <span>${progress && progress.answeredCount > 0 ? 'Tiếp tục ôn tập' : 'Vào ôn tập ngay'}</span>
            <span>➔</span>
          </a>
        `;
      } else {
        actionBtnHtml = `
          <button type="button" class="card-enter-btn outline" onclick="openUpcomingModal('${course.id}')" title="Xem chi tiết kế hoạch môn này">
            <span>ℹ️ Xem chi tiết đề cương</span>
          </button>
        `;
      }

      return `
        <article class="course-card ${isFeatured ? 'featured' : ''}" data-course-id="${course.id}" onmouseenter="if(window.trigger3DReaction) window.trigger3DReaction('${course.iconColor}')">
          <div class="card-top-meta">
            <div class="card-icon-badge" style="background: ${course.iconBg || 'rgba(234, 88, 12, 0.1)'}; color: ${course.iconColor || '#ea580c'};">
              ${course.icon || '📚'}
            </div>
            <span class="card-status-pill ${isReady ? 'ready' : 'coming'}">
              ${isReady ? '<span class="status-dot"></span> Sẵn sàng ôn tập' : '⏳ ' + (course.badgeText || 'Đang biên soạn')}
            </span>
          </div>

          <div class="card-info">
            <span class="card-course-code">${course.code} · ${course.credits} Tín chỉ</span>
            <h3 class="card-title">
              ${isReady ? `<a href="${course.url}" style="color: inherit; text-decoration: none;">${course.title}</a>` : course.title}
            </h3>
            <div class="card-faculty">🏛️ ${course.faculty || 'Phenikaa University'}</div>
            <p class="card-desc">${course.description || ''}</p>
          </div>

          <div class="card-chips">
            ${(course.highlights || []).map(chip => `<span class="card-chip">✓ ${chip}</span>`).join('')}
          </div>

          ${progressHtml}

          <div class="card-footer">
            ${actionBtnHtml}
          </div>
        </article>
      `;
    }).join('');
  }

  // Cập nhật số liệu thống kê tổng thể
  function updateGlobalStats() {
    if (typeof COURSES_DATA === 'undefined') return;

    const totalCourses = COURSES_DATA.length;
    let totalQuestions = 0;
    COURSES_DATA.forEach(c => {
      if (c.totalQuestions) totalQuestions += c.totalQuestions;
    });

    const statCountEl = document.getElementById('statTotalCourses');
    if (statCountEl) {
      statCountEl.textContent = `${totalCourses} môn sẵn sàng`;
    }

    const statQuesEl = document.getElementById('statTotalQuestions');
    if (statQuesEl) {
      statQuesEl.textContent = `${totalQuestions} câu hỏi`;
    }
  }

  // Render động các nút bộ lọc theo đúng các môn thực tế
  function renderFilterButtons() {
    const container = document.getElementById('coursesFilterContainer');
    if (!container || typeof COURSES_DATA === 'undefined') return;

    const categoriesMap = new Map();
    COURSES_DATA.forEach(c => {
      const cat = c.category || 'other';
      const label = c.categoryLabel || 'Chuyên ngành';
      if (!categoriesMap.has(cat)) {
        categoriesMap.set(cat, { label, count: 0 });
      }
      categoriesMap.get(cat).count++;
    });

    let buttonsHtml = `<button type="button" class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">Tất cả môn (${COURSES_DATA.length})</button>`;

    if (categoriesMap.size > 1) {
      categoriesMap.forEach((info, catKey) => {
        buttonsHtml += `<button type="button" class="filter-btn ${currentFilter === catKey ? 'active' : ''}" data-filter="${catKey}">${info.label} (${info.count})</button>`;
      });
    }

    buttonsHtml += `<button type="button" class="filter-btn ${currentFilter === 'in_progress' ? 'active' : ''}" data-filter="in_progress">Đang ôn tập</button>`;

    container.innerHTML = buttonsHtml;

    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter') || 'all';
        renderCourses();
      });
    });
  }

  // Modal hiển thị chi tiết môn học sắp ra mắt
  window.openUpcomingModal = function (courseId) {
    if (typeof COURSES_DATA === 'undefined') return;
    const course = COURSES_DATA.find(c => c.id === courseId);
    if (!course) return;

    const modal = document.getElementById('upcomingModal');
    const content = document.getElementById('upcomingModalBody');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="modal-header-row">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="font-size: 32px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: ${course.iconBg}; border-radius: var(--radius-md);">
            ${course.icon}
          </div>
          <div>
            <span style="font-size: 11px; font-weight: 700; color: var(--orange-phenikaa);">${course.code} · ${course.credits} TÍN CHỈ</span>
            <h3 style="font-size: 18px; font-weight: 800; color: var(--navy-phenikaa);">${course.title}</h3>
          </div>
        </div>
        <button class="modal-close-btn" onclick="closeUpcomingModal()">✕</button>
      </div>

      <div style="margin: 16px 0; padding: 14px; background: var(--surface-subtle); border-radius: var(--radius-md); border: 1px solid var(--border-card);">
        <p style="font-size: 13.5px; line-height: 1.6; color: var(--text-main); margin-bottom: 10px;">
          ${course.description}
        </p>
        <div style="font-size: 12px; color: var(--text-muted);">
          📍 <b>Khoa / Bộ môn:</b> ${course.faculty}<br>
          👨‍🏫 <b>Phụ trách:</b> ${course.instructor || 'Bộ môn Phenikaa'}<br>
          📅 <b>Thời gian dự kiến:</b> ${course.updatedAt || 'Kỳ tới'}
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <strong style="display: block; font-size: 13px; margin-bottom: 8px;">Nội dung trọng tâm ôn luyện:</strong>
        <ul style="padding-left: 20px; font-size: 13px; color: var(--text-muted); line-height: 1.8;">
          ${(course.highlights || []).map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>

      <div style="display: flex; gap: 10px;">
        <button class="hub-pill-btn primary" style="width: 100%; justify-content: center;" onclick="closeUpcomingModal(); scrollToCourses();">
          Đã hiểu, quay lại xem môn khác
        </button>
      </div>
    `;

    modal.classList.add('active');
  };

  window.closeUpcomingModal = function () {
    const modal = document.getElementById('upcomingModal');
    if (modal) modal.classList.remove('active');
  };

  // Modal Hướng Dẫn Thêm Môn Mới
  window.openGuideModal = function () {
    const modal = document.getElementById('guideModal');
    if (modal) modal.classList.add('active');
  };

  window.closeGuideModal = function () {
    const modal = document.getElementById('guideModal');
    if (modal) modal.classList.remove('active');
  };

  // Cuộn mượt tới danh sách học phần
  window.scrollToCourses = function () {
    const el = document.getElementById('coursesSection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Reset bộ lọc
  window.resetFilters = function () {
    currentFilter = 'all';
    searchQuery = '';
    const input = document.getElementById('coursesSearchInput');
    if (input) input.value = '';
    
    renderFilterButtons();
    renderCourses();
  };

  // Lắng nghe sự kiện
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Áp dụng theme & kích thước tiêu đề ban đầu
    applyTheme(currentTheme);
    applyHeadingScale(currentHeadingScale);

    // Nút chuyển theme
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
      });
    }

    // 2. Render bộ lọc động, danh sách học phần & thống kê
    renderFilterButtons();
    renderCourses();
    updateGlobalStats();

    // 3. Search input
    const searchInput = document.getElementById('coursesSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderCourses();
      });
    }

    // 4. Mở modal đồng bộ tự động nếu được chuyển hướng từ tmdt/bigdata (openSync=1)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openSync') === '1' && typeof window.openGlobalSyncModal === 'function') {
      setTimeout(() => {
        window.openGlobalSyncModal();
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 200);
    }

    // 4. Đóng modal khi click ra ngoài overlay
    window.addEventListener('click', (e) => {
      const upModal = document.getElementById('upcomingModal');
      const gdModal = document.getElementById('guideModal');
      if (e.target === upModal) closeUpcomingModal();
      if (e.target === gdModal) closeGuideModal();
    });

    // 6. Phím Escape đóng modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeUpcomingModal();
        closeGuideModal();
      }
    });
  });
})();
