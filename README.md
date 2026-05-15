# TallyPort - Hệ Thống Quản Lý Cảng & Giám Định

TallyPort là giải pháp phần mềm hiện đại hỗ trợ quản lý quy trình giám định (tallying), kiểm soát tải trọng xe, và báo cáo sự cố tại các cảng logistics.

## 🚀 Tính Năng Chính
- **Dashboard Điều Hành**: Theo dõi tổng sản lượng, tiến độ từng hầm tàu (Hold) theo thời gian thực.
- **Tally Check**: Luồng xác nhận phiếu cân nhanh chóng cho nhân viên hiện trường.
- **Quản Lý Đội Xe**: Danh sách xe tùy chỉnh linh hoạt (Dnd columns), hỗ trợ Import/Export Excel.
- **Trợ Lý AI**: Hỗ trợ tra cứu dữ liệu, hướng dẫn quy chuẩn cảng vụ và báo cáo sự cố bằng hình ảnh/video.
- **Chế Độ Tối (Dark Mode)**: Tối ưu hóa cho môi trường làm việc ngoài trời và ban đêm.

## 🛠 Công Nghệ Sử Dụng
- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Zustand (State Management)
- Motion (Animations)
- esbuild (Server Bundling)

## 📦 Hướng Dẫn Cài Đặt (Local)

1. **Clone repository**:
   ```bash
   git clone <your-repo-url>
   cd tallyport
   ```

2. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

3. **Cấu hình môi trường**:
   - Copy `.env.example` thành `.env`
   - Nhập `GEMINI_API_KEY` và các cấu hình khác.

4. **Chạy development server**:
   ```bash
   npm run dev
   ```

## 🌐 Hướng Dẫn Deployment

### 1. GitHub (Source Control)
- Tạo repository mới trên GitHub.
- Push mã nguồn lên:
  ```bash
  git remote add origin <url-github>
  git add .
  git commit -m "Initialize TallyPort Project"
  git push -u origin main
  ```

### 2. Cloudflare Pages (Frontend Hosting)
Cloudflare Pages là giải pháp tốt nhất để host frontend Vite của TallyPort.

1. Truy cập [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Chọn **Workers & Pages** -> **Create application** -> **Pages**.
3. **Connect to Git**: Chọn GitHub repository của bạn.
4. **Build settings**:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. **Environment variables**: Thêm các biến bắt đầu bằng `VITE_` (vd: `VITE_GOOGLE_SHEETS_ID`) trong phần Settings của Pages project.

### 3. Backend Deployment (Nếu sử dụng Express server)
Nếu bạn cần chạy cả backend `server.ts`, Cloudflare Pages *Static* sẽ không đủ. Bạn nên:
- Sử dụng **Cloud Run** hoặc **Render/Railway**.
- Script build đã được cấu hình để tạo ra `dist/server.cjs` (CommonJS bundle) giúp deploy dễ dàng trên các môi trường Node.js.

## 📄 Giấy Phép
Dự án được phát triển cho mục đích quản lý nội bộ cảng vụ.
