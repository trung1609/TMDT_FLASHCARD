/**
 * courses.js - Danh mục Học Phần Phenikaa Quiz Hub (Dữ liệu học phần thực tế)
 */

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
    statsStorageKey: "cse703102-v1",
    totalQuestions: 360,
    featured: true,
    updatedAt: "10/2026",
    instructor: "Bộ môn TMĐT Phenikaa",
    semester: "Học kỳ 1 & 2"
  },
  {
    id: "bigdata",
    code: "CSE405",
    title: "Tích Hợp & Phân Tích Dữ Liệu Lớn",
    faculty: "Khoa Công nghệ thông tin",
    category: "cntt",
    categoryLabel: "Công nghệ thông tin",
    credits: 3,
    status: "ready",
    url: "bigdata.html",
    icon: "🐘",
    iconBg: "rgba(14, 165, 233, 0.12)",
    iconColor: "#0284c7",
    badgeText: "319 Câu hỏi · 5 Batch đề",
    description: "Ngân hàng 319 câu hỏi thực hành & trắc nghiệm Dữ liệu lớn (Hadoop, HDFS, MapReduce, Apache Spark, NoSQL, Neo4j Graph Cypher, MongoDB Aggregation và so sánh hệ thống). Phân chia 5 Batch chuyên sâu kèm giải thích.",
    highlights: [
      "319 câu trắc nghiệm chuẩn 100%",
      "5 Batch phân chia theo chuyên đề",
      "Code truy vấn Cypher & MongoDB",
      "Đối chiếu tài liệu kỹ thuật & Word"
    ],
    statsStorageKey: "big-data-practice-v1",
    totalQuestions: 319,
    featured: true,
    updatedAt: "11/2026",
    instructor: "Bộ môn Khoa học Dữ liệu",
    semester: "Học kỳ 1 & 2"
  }
];

// Helper lấy tiến độ học thật từ LocalStorage (Tương thích cả TMĐT và Big Data)
function getCourseUserProgress(course) {
  if (!course.statsStorageKey) return null;
  try {
    const raw = localStorage.getItem(course.statsStorageKey);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const answers = data.answers || {};
    
    // Đếm số câu đã hoàn thành/kiểm tra
    const answeredKeys = Object.keys(answers).filter(k => {
      const item = answers[k];
      return item && (item.checked === true || item.isCorrect !== undefined || (Array.isArray(item.selected) && item.selected.length > 0));
    });
    const answeredCount = answeredKeys.length;
    
    let correctCount = 0;
    answeredKeys.forEach(k => {
      const item = answers[k];
      if (item && (item.isCorrect === true || item.correct === true)) {
        correctCount++;
      }
    });

    const total = course.totalQuestions || 360;
    return {
      answeredCount,
      correctCount,
      total,
      percent: Math.min(100, Math.round((answeredCount / total) * 100)),
      accuracy: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0
    };
  } catch (e) {
    return null;
  }
}
