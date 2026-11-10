
const COURSES_DATA = [
  {
    id: "cse703102",
    code: "CSE703102",
    title: "Thương Mại Điện Tử",
    faculty: "Khoa CNTT & Kinh tế số",
    category: "cntt",
    categoryLabel: "CNTT & Kinh tế số",
    credits: 3,
    status: "ready",
    url: "tmdt.html",
    icon: "🛒",
    iconBg: "rgba(234, 88, 12, 0.12)",
    iconColor: "#ea580c",
    badgeText: "300 Trắc nghiệm · 60 Tự luận",
    description: "Ngân hàng 300 câu trắc nghiệm bám sát đề cương 121 trang, chia thành 13 buổi học đầy đủ. Kèm 60 câu tự luận trọng tâm, đối chiếu ảnh trích xuất giáo trình gốc và Flashcard 3D công thức.",
    highlights: [
      "300 câu trắc nghiệm chuẩn",
      "60 câu tự luận chi tiết",
      "13 buổi học có lộ trình",
      "Đối chiếu ảnh đề cương gốc",
      "Flashcard 3D & Máy tính công thức"
    ],
    statsStorageKey: "cse703102-v1", // Đọc tiến độ học từ localStorage
    totalQuestions: 360,
    featured: true,
    updatedAt: "10/2026",
    instructor: "Bộ môn TMĐT Phenikaa",
    semester: "Học kỳ 1 & 2"
  }
];

// Helper lấy tiến độ học thật từ LocalStorage
function getCourseUserProgress(course) {
  if (!course.statsStorageKey) return null;
  try {
    const raw = localStorage.getItem(course.statsStorageKey);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const answers = data.answers || {};
    const answeredCount = Object.keys(answers).length;
    let correctCount = 0;
    Object.values(answers).forEach(item => {
      if (item && item.isCorrect) correctCount++;
    });
    return {
      answeredCount,
      correctCount,
      total: course.totalQuestions || 360,
      percent: Math.min(100, Math.round((answeredCount / (course.totalQuestions || 360)) * 100)),
      accuracy: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0
    };
  } catch (e) {
    return null;
  }
}
