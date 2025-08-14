# Thazh Social - Mạng xã hội giống Threads

Ứng dụng mạng xã hội hiện đại với giao diện tối giản, lấy cảm hứng từ Threads của Meta.

## ✨ Tính năng chính

### 🎨 Giao diện hiện đại
- Thiết kế tối giản, sạch sẽ
- Responsive design cho mọi thiết bị
- Màu sắc và typography nhất quán
- Navigation bar cố định với các icon trực quan

### 📝 Quản lý bài viết
- Tạo bài viết với văn bản và hình ảnh
- Hỗ trợ hashtag tự động
- Like và comment bài viết
- Trang chi tiết bài viết với đầy đủ thông tin

### 💬 Chat realtime
- Tin nhắn thời gian thực
- Gửi văn bản và hình ảnh
- Danh sách cuộc trò chuyện
- Tìm kiếm và tạo cuộc trò chuyện mới

### 🔍 Tìm kiếm nâng cao
- Tìm kiếm bài viết, người dùng, hashtag
- Hashtag trending
- Bộ lọc kết quả tìm kiếm
- Gợi ý tìm kiếm thông minh

### #️⃣ Hệ thống Hashtag
- Tự động nhận diện hashtag trong bài viết
- Trang chi tiết hashtag với thống kê
- Hashtag trending theo thời gian thực
- Liên kết hashtag trong nội dung

### 🖼️ Thư viện hình ảnh
- Hiển thị tất cả hình ảnh dạng grid
- Bộ lọc theo thời gian và độ phổ biến
- Trang chi tiết hình ảnh với thông tin đầy đủ
- Tải xuống hình ảnh

### 💬 Comment nâng cao
- Comment bằng văn bản và hình ảnh
- Hỗ trợ hashtag trong comment
- Like comment
- Xóa comment của chính mình

### 🔔 Hệ thống thông báo
- Thông báo khi có người like bài viết
- Thông báo comment mới
- Lịch sử hoạt động chi tiết

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 13, React 18, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage, Realtime)
- **Styling**: Tailwind CSS với custom theme
- **Icons**: Heroicons
- **Deployment**: Vercel (Frontend), Supabase (Backend)

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+
- npm hoặc yarn
- Tài khoản Supabase

### Cài đặt
1. Clone repository:
```bash
git clone <repository-url>
cd thazhsocial
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Cấu hình môi trường:
```bash
cp .env.local.example .env.local
```

Cập nhật các biến môi trường trong `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Chạy ứng dụng:
```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## 🗄️ Cấu trúc cơ sở dữ liệu

### Bảng chính
- `profiles`: Thông tin người dùng
- `posts`: Bài viết
- `comments`: Bình luận
- `likes`: Lượt thích bài viết
- `comment_likes`: Lượt thích bình luận
- `conversations`: Cuộc trò chuyện
- `messages`: Tin nhắn

### Storage
- `images`: Lưu trữ hình ảnh bài viết và comment
- `post-images`: Hình ảnh bài viết
- `comment-images`: Hình ảnh comment

## 📱 Tính năng responsive

Ứng dụng được thiết kế responsive hoàn toàn:
- **Mobile**: Giao diện tối ưu cho điện thoại
- **Tablet**: Layout linh hoạt cho máy tính bảng
- **Desktop**: Tận dụng không gian màn hình lớn

## 🎨 Design System

### Màu sắc
- **Primary**: #1C1C1C (Đen chủ đạo)
- **Secondary**: #65676B (Xám phụ)
- **Accent**: #0095F6 (Xanh dương)
- **Background**: #F9F9F9 (Trắng ngà)
- **Border**: #E0E0E0 (Xám nhạt)

### Typography
- **Font**: System UI fonts (Inter, SF Pro, Roboto, Segoe UI)
- **Sizes**: 12px - 32px với tỷ lệ hài hòa

## 🔐 Bảo mật

- Authentication qua Supabase Auth
- Row Level Security (RLS) cho tất cả bảng
- Validation dữ liệu đầu vào
- Sanitize nội dung người dùng
- Rate limiting cho API calls

## 📈 Performance

- Server-side rendering với Next.js
- Image optimization tự động
- Lazy loading cho hình ảnh
- Code splitting và tree shaking
- Caching thông minh

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📞 Liên hệ

- Email: admin@thazh.is-a.dev
- Website: https://thazh.is-a.dev 
- GitHub: https://github.com/thazh-org

## 🙏 Acknowledgments

- [Threads by Meta](https://threads.net) - Design inspiration
- [Bluesky](https://bsky.social) - Design inspiration
- [Supabase](https://supabase.com) - Backend as a Service
- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - CSS framework
- [Heroicons](https://heroicons.com) - Icon library

