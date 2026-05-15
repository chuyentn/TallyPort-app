# Project Context: TallyPort

TallyPort là ứng dụng quản lý cảng (Port Management) và giám định hàng hóa (Tally) chuyên dụng. 
Hệ thống được thiết kế để thay thế quy trình nhập liệu thủ công bằng giao diện hiện đại, hỗ trợ đa thiết bị và tích hợp AI.

## Technical Architecture
- **Frontend**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS 4.
- **State Management**: Zustand.
- **Icons**: Lucide React.
- **Animations**: Motion (motion/react).
- **Backend (Development)**: Express.js (serving Vite as middleware).
- **Database (Mock)**: `src/services/mockService.ts` (Dễ dàng chuyển đổi sang Google Sheets API hoặc Firestore).
- **AI Assistant**: Tích hợp Gemini Pro thông qua `@google/generative-ai`.

## Business Rules & Logic
- **Tally Check**: Công nhân kiểm đếm (Tally staff) xác nhận phiếu cân ngay tại hiện trường qua tablet/mobile.
- **Truck Management**: Quản lý danh sách xe, đơn vị chủ quản, đơn giá vận chuyển. Hỗ trợ Drag-and-Drop column reordering/resizing (Excel-like experience).
- **Data Export/Import**: Hỗ trợ xuất/nhập danh sách xe qua file Excel (.xlsx) sử dụng thư viện `xlsx`.
- **Incident Reporting**: Cho phép chụp ảnh/quay video sự cố ngay tại bãi và gửi báo cáo về trung tâm.

## File Naming Conventions
- Components: PascalCase (e.g., `TruckList.tsx`).
- Sub-components: Thường nằm trong thư mục của component chính hoặc `Shared/`.
- Hooks: camelCase starting with "use" (e.g., `useAuth.ts`).

## Future Roadmap
- Kết nối thực tế với Google Sheets API để lưu trữ dữ liệu.
- Tích hợp OCR (Optical Character Recognition) để tự động hóa việc đọc phiếu cân từ ảnh chụp.
- Hệ thống thông báo thời gian thực (WebSockets/Firebase Cloud Messaging).
