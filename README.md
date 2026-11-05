# 🎓 CSE703102 - Hệ thống Ôn tập & Flashcard Thương Mại Điện Tử

Ứng dụng ôn tập trắc nghiệm và câu hỏi tự luận môn **Thương Mại Điện Tử (CSE703102)** thiết kế theo phong cách hiện đại Wayground / Quizizz, trực quan, sinh động và tối ưu responsive trên mọi thiết bị.

🌐 **Trải nghiệm trực tiếp:** [https://on-tap-cse703102.vercel.app](https://on-tap-cse703102.vercel.app)

---

## ✨ Điểm nổi bật

- 📚 **Ngân hàng câu hỏi đồ sộ**: 300 câu trắc nghiệm và 60 câu tự luận bám sát đề cương 121 trang, phân chia theo 13 buổi học.
- 🎯 **Trực quan & Đối chiếu tức thì**: Hiển thị ảnh chụp trích xuất trực tiếp đáp án và giải thích từ tài liệu gốc ngay khi trả lời, kèm bộ phóng to (Lightbox) xem full trang giáo trình.
- 🎮 **Trải nghiệm Gamification (Wayground Style)**:
  - Hiệu ứng âm thanh chân thực (Ding đúng, Buzzer sai, Streak level-up).
  - Pháo hoa giấy (Confetti) rực rỡ khi trả lời đúng và khi giữ chuỗi liên hoàn.
  - Theo dõi tiến độ, streak chuỗi đúng, độ chính xác %, lưu trữ trực tiếp trên LocalStorage của trình duyệt.
- ⌨️ **Hệ thống phím tắt siêu tốc**:
  - `A`, `B`, `C`, `D` hoặc `1`, `2`, `3`, `4`: Chọn đáp án trắc nghiệm tức thì.
  - `←` / `→`: Chuyển câu hỏi trước / sau.
  - `Enter` / `Space`: Mở ảnh đáp án gốc.
  - `R`: Làm lại câu hiện tại.
  - `S`: Bật / tắt âm thanh.
  - `Esc`: Đóng lightbox ảnh.
- 📱 **Tối ưu Mobile First**: Tự động cuộn mượt đưa câu hỏi lên vị trí trung tâm, nút bấm thân thiện với cảm ứng, giao diện gọn gàng, không bị tràn hay tụt dòng.
- ⚡ **Hoạt động 100% Offline**: Chỉ cần mở trực tiếp file `index.html` trên trình duyệt mà không cần cài đặt môi trường hay internet.

---

## 📂 Cấu trúc thư mục

```text
├── index.html                 # Ứng dụng chính (Single Page App)
├── ngan-hang-cau-hoi.json     # Dữ liệu 300 trắc nghiệm + 60 tự luận
├── de-cuong-goc.pdf          # File đề cương gốc 121 trang
├── vercel.json                # Cấu hình định tuyến & cache Vercel
├── answers/                   # 360 ảnh trích xuất đáp án gốc (q_1.png -> q_300.png, e_1.png -> e_60.png)
├── pages/                     # 46 trang PDF đáp án gốc dạng PNG chất lượng cao
├── HUONG-DAN.txt              # Hướng dẫn mở nhanh
└── README.md
```

---

## 🚀 Hướng dẫn chạy cục bộ (Offline)

1. Clone repository về máy:
   ```bash
   git clone https://github.com/trung1609/TMDT_FLASHCARD.git
   ```
2. Click đúp vào file `index.html` bằng Google Chrome, Microsoft Edge hoặc Safari.
3. Học tập và ôn thi hiệu quả!
