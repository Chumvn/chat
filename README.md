# CHUM p2p_chat

> Chat P2P ngang hàng - Chủ đề Tết Việt Nam 🧧

## Tính năng

- 🔗 Kết nối P2P qua WebRTC (không cần server)
- 📱 Chia sẻ kết nối qua QR code hoặc link
- 💬 Gửi tin nhắn text realtime
- 📁 Chia sẻ file trực tiếp
- 🌸 Hiệu ứng hoa mai khi nhấn vào chat
- 🍚 Tên ngẫu nhiên theo đồ ăn Tết + icon
- 🌙 Chế độ sáng/tối (mặc định tối)
- 📲 PWA - cài đặt như app

## Cách dùng

1. Mở `index.html` trong trình duyệt
2. Nhấn **Tạo Phòng** → chia sẻ mã cho bạn bè
3. Bạn bè nhấn **Tham Gia** → dán mã kết nối
4. Trao đổi mã phản hồi → bắt đầu chat!

## Deploy

Push toàn bộ repo lên GitHub → Settings → Pages → Deploy from main branch.

## Cấu trúc

```
├── index.html
├── style.css
├── app.js
├── manifest.webmanifest
├── sw.js
├── assets/
│   ├── favicon.ico
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
└── README.md
```

---

CHUM WEBAPP | No backend | GitHub Pages only
