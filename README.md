# 🧧 CHUM chat

Chat P2P ngang hàng — chủ đề Tết Việt Nam

## ✨ Tính năng

- **📡 Tạo Phòng** — tạo phòng chat với mã 6 ký tự + QR code
- **📱 Quét QR** — quét QR bằng camera → vào chat ngay
- **💬 Chat text** — nhắn tin P2P trực tiếp (không qua server)
- **😊 Emoji** — bảng emoji với 64 icon phổ biến
- **✍️ Đang nhập...** — hiển thị khi bạn chat đang gõ
- **📎 Gửi file** — chia sẻ file qua kết nối P2P
- **🌸 Hoa Mai** — hiệu ứng cánh hoa khi click
- **🌙/☀️ Dark/Light** — chuyển đổi giao diện
- **📦 PWA** — cài đặt như app, hoạt động offline

## 🚀 Cách dùng

### Tạo phòng (Máy A):
1. Mở app → nhấn **📡 Tạo Phòng**
2. QR code + mã phòng hiện ra
3. Đợi bạn bè quét QR

### Vào phòng (Máy B):
1. Quét QR bằng camera điện thoại
2. Mở link → tự động vào chat!

### Chạy local:
```bash
npx http-server -p 8080 -c-1
```
Mở `http://localhost:8080` — hai thiết bị cùng WiFi.

## 🛠 Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| Kết nối P2P | PeerJS + WebRTC |
| QR Code | qrcode-generator |
| UI | Neumorphism CSS |
| PWA | Service Worker |
| Backend | **Không có** — 100% client-side |

## 📁 Cấu trúc

```
chum-p2p-chat/
├── index.html          # Giao diện chính
├── app.js              # Logic app
├── style.css           # Giao diện Neumorphism
├── peerjs.min.js       # PeerJS library
├── qrcode.min.js       # QR code generator
├── manifest.webmanifest
├── sw.js               # Service Worker
├── serve.bat           # Chạy local server
└── assets/
    ├── favicon.ico
    └── icons/
```

---

🧧 CHUM chat — Chúc Mừng Năm Mới 🎊
