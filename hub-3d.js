/**
 * hub-3d.js - Three.js Interactive Academic 3D Experience for Phenikaa Quiz Hub
 * Thiết kế giao diện sáng, thanh lịch, học thuật, không "AI quá", tối ưu hiệu năng 60fps.
 */

(function () {
  'use strict';

  const container = document.getElementById('threeCanvasContainer');
  if (!container || typeof THREE === 'undefined') {
    console.info('Three.js or container not available, using elegant CSS fallback.');
    return;
  }

  // Khởi tạo Scene, Camera, Renderer
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 14);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    console.warn('WebGL not supported, falling back to CSS background.', err);
    return;
  }

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  // Group chứa toàn bộ vật thể 3D để xoay theo chuột
  const mainGroup = new THREE.Group();
  scene.add(mainGroup);

  // --- 1. ÁNH SÁNG (LIGHTING) - Thiết kế phong cách Sáng, Ấm, Tự nhiên ---
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambientLight);

  // Ánh sáng mặt trời chính (Warm Sun)
  const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.2);
  dirLight.position.set(12, 18, 15);
  scene.add(dirLight);

  // Ánh sáng cam ấm Phenikaa nhấn cạnh
  const orangePoint = new THREE.PointLight(0xea580c, 1.4, 25);
  orangePoint.position.set(-6, 4, 6);
  scene.add(orangePoint);

  // Ánh sáng xanh Navy nhẹ cho chiều sâu (Soft fill)
  const bluePoint = new THREE.PointLight(0x2563eb, 0.9, 25);
  bluePoint.position.set(8, -6, 5);
  scene.add(bluePoint);

  // --- 2. VẬT THỂ 3D HỌC THUẬT (ACADEMIC GEOMETRIES) ---
  
  // A. Khối Đa Diện Tri Thức Trung Tâm (Faceted Knowledge Icosahedron)
  // Tạo phong cách gốm sứ mờ cao cấp (Matte Ceramic) viền vàng cam
  const icoGeometry = new THREE.IcosahedronGeometry(2.3, 0);
  const icoMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.1,
    flatShading: true
  });
  const icoMesh = new THREE.Mesh(icoGeometry, icoMaterial);
  mainGroup.add(icoMesh);

  // Khung wireframe tinh tế bọc quanh khối
  const wireGeometry = new THREE.IcosahedronGeometry(2.32, 0);
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0xea580c,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });
  const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
  mainGroup.add(wireMesh);

  // B. Cuốn Sách 3D Mở (Stylized Open Book) - Biểu tượng học tập
  function createStylizedBook() {
    const bookGroup = new THREE.Group();

    // Bìa sách
    const coverMat = new THREE.MeshStandardMaterial({
      color: 0x002855, // Navy Phenikaa
      roughness: 0.4,
      metalness: 0.15
    });

    const pageMat = new THREE.MeshStandardMaterial({
      color: 0xfbf9f5, // Ivory paper
      roughness: 0.6
    });

    // Cánh sách trái
    const leftCover = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 2.2), coverMat);
    leftCover.position.set(-0.8, -0.05, 0);
    leftCover.rotation.z = 0.25;
    bookGroup.add(leftCover);

    const leftPages = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.25, 2.1), pageMat);
    leftPages.position.set(-0.75, 0.1, 0);
    leftPages.rotation.z = 0.25;
    bookGroup.add(leftPages);

    // Cánh sách phải
    const rightCover = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 2.2), coverMat);
    rightCover.position.set(0.8, -0.05, 0);
    rightCover.rotation.z = -0.25;
    bookGroup.add(rightCover);

    const rightPages = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.25, 2.1), pageMat);
    rightPages.position.set(0.75, 0.1, 0);
    rightPages.rotation.z = -0.25;
    bookGroup.add(rightPages);

    // Gáy sách dải vàng
    const spineMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Gold
      roughness: 0.3
    });
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.2, 12), spineMat);
    spine.rotation.x = Math.PI / 2;
    spine.position.set(0, -0.15, 0);
    bookGroup.add(spine);

    return bookGroup;
  }

  const book3D = createStylizedBook();
  book3D.scale.set(0.85, 0.85, 0.85);
  book3D.position.set(3.8, 1.8, 1.2);
  book3D.rotation.set(0.3, -0.4, 0.15);
  mainGroup.add(book3D);

  // C. Các khối đa diện vệ tinh (Satellite Orbitals: Octahedron, Torus, Cubes)
  // Khối 1: Bát diện Pha lê (Octahedron)
  const octMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.3,
    metalness: 0.2,
    flatShading: true
  });
  const octMesh = new THREE.Mesh(new THREE.OctahedronGeometry(1.0, 0), octMat);
  octMesh.position.set(-4.2, 1.5, 0.5);
  mainGroup.add(octMesh);

  // Khối 2: Vòng quỹ đạo học phần (Knowledge Orbit Ring)
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.4,
    metalness: 0.3,
    wireframe: false
  });
  const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.05, 16, 64), ringMat);
  ringMesh.rotation.x = Math.PI / 3;
  ringMesh.rotation.y = Math.PI / 6;
  mainGroup.add(ringMesh);

  // Khối 3: Khối Rubik/Quiz Token nhỏ xoay
  const cubeMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.3,
    metalness: 0.15
  });
  const cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), cubeMat);
  cubeMesh.position.set(-2.8, -2.6, 1.5);
  cubeMesh.rotation.set(0.4, 0.6, 0.2);
  mainGroup.add(cubeMesh);

  // Khối 4: Viên ngọc tri thức nhỏ bên phải
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0x6366f1,
    roughness: 0.2,
    metalness: 0.4
  });
  const sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 32), sphereMat);
  sphereMesh.position.set(4.0, -2.2, 0.8);
  mainGroup.add(sphereMesh);

  // --- 3. ĐÁM MÂY HẠT KẾT NỐI TRI THỨC (KNOWLEDGE NETWORK PARTICLES) ---
  const particleCount = 80;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);

  const colorPalette = [
    new THREE.Color(0xea580c), // Phenikaa Orange
    new THREE.Color(0x0284c7), // Sky Blue
    new THREE.Color(0x10b981), // Emerald
    new THREE.Color(0x64748b)  // Slate
  ];

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    particlePositions[i3] = (Math.random() - 0.5) * 22;
    particlePositions[i3 + 1] = (Math.random() - 0.5) * 14;
    particlePositions[i3 + 2] = (Math.random() - 0.5) * 10 - 2;

    const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    particleColors[i3] = col.r;
    particleColors[i3 + 1] = col.g;
    particleColors[i3 + 2] = col.b;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  // Tạo texture tròn mềm mại bằng Canvas
  function createCircleTexture() {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  const particleMat = new THREE.PointsMaterial({
    size: 0.35,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    map: createCircleTexture(),
    depthWrite: false
  });

  const particleSystem = new THREE.Points(particleGeo, particleMat);
  mainGroup.add(particleSystem);

  // --- 4. TƯƠNG TÁC MƯỢT MÀ VỚI CHUỘT & CUỘN (MOUSE / PARALLAX INTERACTION) ---
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let isHovered = false;

  window.addEventListener('mousemove', (e) => {
    // Tọa độ chuẩn hóa -1 đến 1
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  container.addEventListener('mouseenter', () => { isHovered = true; });
  container.addEventListener('mouseleave', () => { isHovered = false; });

  // Hỗ trợ cảm biến xoay điện thoại (Gyroscope)
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma !== null && e.beta !== null) {
        mouse.targetX = Math.max(-1, Math.min(1, e.gamma / 30));
        mouse.targetY = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      }
    }, { passive: true });
  }

  // Click vào canvas tạo xung nhịp xoay nhẹ (gentle impulse)
  let impulse = 0;
  container.addEventListener('click', () => {
    impulse = 0.08;
  });

  // Tương tác hover từ các thẻ học phần bên dưới
  window.trigger3DReaction = function (accentColorHex) {
    impulse = 0.04;
    if (accentColorHex && icoMaterial) {
      // Nhẹ nhàng đổi màu điểm sáng Phenikaa
      orangePoint.color.set(accentColorHex);
    }
  };

  // --- 5. TỐI ƯU HIỆU NĂNG: PAUSE KHI KHÔNG TRÔNG THẤY ---
  let isVisible = true;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.05 });
    observer.observe(container);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) isVisible = false;
    else isVisible = true;
  });

  // --- 6. ANIMATION LOOP ---
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    if (!isVisible) return;

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Lerp góc nhìn mượt mà theo chuột
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Lực xung nhịp phân rã dần
    impulse *= 0.94;

    // Xoay nhẹ nhàng tổng thể cả scene
    mainGroup.rotation.y = mouse.x * 0.45 + elapsedTime * 0.12 + impulse * 2;
    mainGroup.rotation.x = -mouse.y * 0.35 + Math.sin(elapsedTime * 0.4) * 0.08;

    // Chuyển động riêng biệt từng chi tiết:
    // 1. Khối icosahedron trung tâm: tự xoay và thở nhẹ
    icoMesh.rotation.x += 0.008 + impulse;
    icoMesh.rotation.y += 0.012 + impulse;
    wireMesh.rotation.x = icoMesh.rotation.x;
    wireMesh.rotation.y = icoMesh.rotation.y;
    const breathe = 1 + Math.sin(elapsedTime * 1.5) * 0.03;
    icoMesh.scale.set(breathe, breathe, breathe);
    wireMesh.scale.set(breathe, breathe, breathe);

    // 2. Cuốn sách 3D mở: bồng bềnh như trôi trên nước
    book3D.position.y = 1.8 + Math.sin(elapsedTime * 1.2 + 1) * 0.22;
    book3D.rotation.y = -0.4 + Math.sin(elapsedTime * 0.8) * 0.15;
    book3D.rotation.z = 0.15 + Math.cos(elapsedTime * 0.9) * 0.08;

    // 3. Khối bát diện & các vệ tinh
    octMesh.position.y = 1.5 + Math.cos(elapsedTime * 1.4) * 0.25;
    octMesh.rotation.x += 0.015;
    octMesh.rotation.z += 0.01;

    cubeMesh.position.y = -2.6 + Math.sin(elapsedTime * 1.6) * 0.2;
    cubeMesh.rotation.x += 0.012;
    cubeMesh.rotation.y += 0.018;

    sphereMesh.position.y = -2.2 + Math.cos(elapsedTime * 1.1) * 0.18;

    // 4. Vòng ring xoay
    ringMesh.rotation.z += 0.005;

    // 5. Đám mây hạt bay nhẹ
    particleSystem.rotation.y = -elapsedTime * 0.02;

    renderer.render(scene, camera);
  }

  animate();

  // --- 7. RESIZE LISTENER (TỐI ƯU TOÀN DIỆN TỪ 4K ĐẾN FULL HD, LAPTOP, TABLET & MOBILE) ---
  function onWindowResize() {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;

    const winW = window.innerWidth;

    if (winW >= 2560) {
      // Màn hình 4K / Ultra-wide
      camera.fov = 40;
      camera.position.z = 12.0;
      mainGroup.scale.set(1.2, 1.2, 1.2);
    } else if (winW >= 1920) {
      // Màn hình Full HD / 2K
      camera.fov = 43;
      camera.position.z = 13.0;
      mainGroup.scale.set(1.05, 1.05, 1.05);
    } else if (winW >= 1024) {
      // Laptops & Desktops tiêu chuẩn (HD / WXGA)
      camera.fov = 45;
      camera.position.z = 13.8;
      mainGroup.scale.set(1.0, 1.0, 1.0);
    } else if (winW >= 640) {
      // Tablets & màn hình trung bình
      camera.fov = 48;
      camera.position.z = 15.2;
      mainGroup.scale.set(0.9, 0.9, 0.9);
    } else {
      // Điện thoại di động
      camera.fov = 50;
      camera.position.z = 17.0;
      mainGroup.scale.set(0.82, 0.82, 0.82);
    }

    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
  }

  window.addEventListener('resize', onWindowResize);
  onWindowResize();

  // Đổi màu ánh sáng khi chuyển chế độ Sáng / Tối (Dark/Light toggle)
  window.update3DTheme = function (theme) {
    if (theme === 'dark') {
      ambientLight.intensity = 0.45;
      dirLight.intensity = 0.8;
      icoMaterial.roughness = 0.4;
      wireMaterial.opacity = 0.55;
    } else {
      ambientLight.intensity = 0.85;
      dirLight.intensity = 1.2;
      icoMaterial.roughness = 0.25;
      wireMaterial.opacity = 0.35;
    }
  };
})();

