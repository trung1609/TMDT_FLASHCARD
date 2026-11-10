# 🎓 Phenikaa Quiz Hub - Cổng Học Phần & Ôn Thi Trắc Nghiệm Thông Minh

Hệ thống kho quiz tài liệu học tập và ôn thi trắc nghiệm theo từng môn học dành cho sinh viên **Phenikaa University**. Thiết kế giao diện sáng, hiện đại, thanh lịch (Clean Academic UI), tích hợp đồ họa **Three.js 3D** tương tác trực quan và tối ưu 100% trên cả máy tính lẫn điện thoại.

🌐 **Trải nghiệm trực tiếp:** [https://on-tap-cse703102.vercel.app](https://on-tap-cse703102.vercel.app)

---

## 🏛️ Danh mục học phần trong kho

1. 🛒 **Thương Mại Điện Tử (CSE703102)** - `tmdt.html`
   - **Trạng thái:** Sẵn sàng ôn tập (Hoạt động chính thức)
   - **Nội dung:** 300 câu trắc nghiệm & 60 câu tự luận bám sát đề cương 121 trang, phân chia theo 13 buổi học.
   - **Tính năng nổi bật:** Đối chiếu ảnh trích xuất giáo trình gốc tức thì, Sổ tay công thức 3D & Máy tính mô phỏng, Gamification âm thanh & chuỗi streak, Đồng bộ 2 chiều Máy tính ⇆ Điện thoại bằng mã rút gọn và mã QR.

2. 🐘 **Tích Hợp & Phân Tích Dữ Liệu Lớn (CSE405)** - `bigdata.html`
   - **Trạng thái:** Sẵn sàng ôn tập (Chuẩn 100% từ Big Data Practice Lab)
   - **Nội dung:** 319 câu hỏi trắc nghiệm & thực hành chia thành 5 Batch chuyên đề:
     - **Batch 1 (46 câu):** Tổng quan Dữ liệu lớn, HDFS, Mô hình 3V/5V & Nguồn dữ liệu.
     - **Batch 2 (52 câu):** Hệ sinh thái Hadoop, MapReduce, Cơ sở dữ liệu NoSQL & Định lý CAP.
     - **Batch 3 (45 câu):** Xử lý phân tán Apache Spark, RDD Transformations & Streaming.
     - **Batch 4 (60 câu):** Cơ sở dữ liệu đồ thị Neo4j, Cypher Query & MongoDB Aggregation.
     - **Batch 5 (116 câu):** Ôn tập nền tảng, cú pháp thực hành & 16 câu so sánh hệ thống dữ liệu.
   - **Tính năng nổi bật:** Highlight khối mã lệnh Cypher/MongoDB, giải thích đối chiếu kỹ thuật, phím tắt nhanh A/B/C/D & Enter, chuỗi Streak và lưu tiến độ tự động.

*(Các học phần tiếp theo sẽ tiếp tục được mở rộng vào `courses.js`)*

---

## ✨ Điểm nổi bật hệ thống

- 🧭 **Cổng điều hướng thông minh (`index.html`)**: Tìm kiếm theo tên môn, mã học phần, bộ lọc theo khối ngành (CNTT, Kinh tế số, Đại cương) và tự động nhận diện tiến độ học từ LocalStorage.
- 🎨 **Không gian 3D Three.js tinh tế**: Trải nghiệm mô hình 3D tương tác nhẹ nhàng (khối đa diện tri thức, cuốn sách mở 3D, mạng lưới liên kết hạt kiến thức) phản hồi mượt mà theo di chuột và cảm biến xoay điện thoại.
- 🎯 **Trực quan & Đối chiếu tức thì**: Trích xuất đáp án và giải thích từ tài liệu gốc ngay khi trả lời, kèm bộ phóng to (Lightbox) xem full trang giáo trình.
- 🎮 **Trải nghiệm Gamification (Wayground / Quizizz Style)**:
  - Hiệu ứng âm thanh sống động (Ding đúng, Buzzer sai, Streak level-up).
  - Pháo hoa giấy (Confetti) khi đúng và giữ chuỗi.
  - Theo dõi tiến độ, streak chuỗi đúng, tỷ lệ % chính xác.
- ⌨️ **Hệ thống phím tắt siêu tốc**:
  - `A`, `B`, `C`, `D` hoặc `1`, `2`, `3`, `4`: Chọn đáp án trắc nghiệm tức thì.
  - `←` / `→`: Chuyển câu hỏi trước / sau.
  - `Enter` / `Space`: Mở ảnh đáp án gốc.
  - `R`: Làm lại câu hiện tại.
  - `S`: Bật / tắt âm thanh.
  - `Esc`: Đóng lightbox ảnh.
- ⚡ **Hoạt động 100% Offline**: Tích hợp sẵn toàn bộ thư viện (Three.js, QR, jsqr) cục bộ, chỉ cần mở trực tiếp file `index.html` trên trình duyệt mà không cần cài đặt môi trường hay internet.

---

## 📂 Cấu trúc thư mục

```text
├── index.html                 # Cổng Hub chọn học phần (Trang chủ /)
├── courses.js                 # Danh mục khai báo các học phần trong kho
├── hub.css                    # Giao diện sáng, hiện đại của Kho học phần
├── hub.js                     # Điều hướng, tìm kiếm, lọc và tiến độ học
├── hub-3d.js                  # Không gian 3D tương tác Three.js
├── three.min.js               # Thư viện Three.js offline
├── tmdt.html                  # Trang ôn tập môn Thương Mại Điện Tử (CSE703102)
├── app.js                     # Core logic ôn thi môn TMĐT
├── data.js                    # Dữ liệu 300 trắc nghiệm + 60 tự luận TMĐT
├── formulas.js                # Sổ tay công thức 3D & Máy tính TMĐT
├── style.css                  # Giao diện trang ôn tập TMĐT
├── answers/                   # 360 ảnh trích xuất đáp án gốc TMĐT
├── pages/                     # 46 trang PDF đáp án gốc chất lượng cao
├── api/sync.js                # Vercel Serverless Function đồng bộ đám mây
├── vercel.json                # Cấu hình định tuyến Clean URLs & Cache
└── README.md
```

---

## 🛠️ Hướng dẫn thêm một học phần mới

1. **Chuẩn bị dữ liệu câu hỏi**: Soạn câu hỏi trắc nghiệm dưới dạng mảng JSON hoặc file JS tương tự `data.js`.
2. **Tạo trang ôn thi**: Nhân bản từ `tmdt.html` thành tên môn mới (VD: `web.html`, `csdl.html`) và liên kết đến file dữ liệu tương ứng.
3. **Đăng ký vào kho**: Mở file `courses.js`, thêm object học phần mới:
   ```javascript
   {
     id: "cse3020",
     code: "CSE3020",
     title: "Lập Trình Web & Ứng Dụng",
     faculty: "Khoa Công nghệ thông tin",
     category: "cntt",
     credits: 3,
     status: "ready", // Đặt là ready khi đã hoàn thiện trang ôn thi
     url: "web.html",
     icon: "🌐",
     badgeText: "250 Câu hỏi",
     description: "HTML5, CSS3, ES6+, RESTful API...",
     highlights: ["JavaScript ES6+", "REST API", "Responsive Layout"],
     statsStorageKey: "cse3020-v1",
     totalQuestions: 250
   }
   ```
4. Lưu file và mở lại `index.html`, môn học mới sẽ ngay lập tức xuất hiện trên trang chủ!

---

## 🚀 Hướng dẫn chạy cục bộ (Offline)

1. Clone repository về máy:
   ```bash
   git clone https://github.com/trung1609/TMDT_FLASHCARD.git
   ```
2. Click đúp vào file `index.html` bằng Google Chrome, Microsoft Edge hoặc Safari.
3. Chọn học phần và bắt đầu ôn tập hiệu quả!
