# SHOWROOM Ô TÔ 3D VIỆT NAM - KẾ HOẠCH KIẾN TRÚC & TRIỂN KHAI KỸ THUẬT

## 1. Tổng Quan Dự Án & Tầm Nhìn
Xây dựng ứng dụng web 3D tương tác đa chiều, mô phỏng showroom ô tô cao cấp hiển thị các mẫu xe thông dụng tại Việt Nam (VinFast VF8, Mazda CX-5, Toyota Vios, Ford Everest). Ứng dụng cung cấp khả năng xoay tự do 360 độ, chuyển đổi góc nhìn buồng lái nội thất và chế độ bóc tách khung gầm/động cơ dạng tia X (X-ray exploded view) kèm các điểm chạm (hotspot) phân tích kết cấu kỹ thuật.

### Mục Tiêu Cốt Lõi:
* **Khử bỏ cảm giác hình hộp/đồ chơi:** Chuyển sang mô hình PBR chân thực (sơn bóng hai lớp Clearcoat, hệ thống ánh sáng studio phản xạ, sàn gương đổ bóng mềm, viền phát quang kỹ thuật CAD tinh tế).
* **Điều khiển camera mượt mà:** Nội suy vị trí trơn tru (damping/lerp), chiếu tọa độ hotspot 3D chuẩn xác lên giao diện 2D.
* **Dữ liệu kỹ thuật Việt hóa 100%:** Thuật ngữ chính xác theo thông số xe tại thị trường Việt Nam.

---

## 2. Công Nghệ & Thư Viện Sử Dụng (Tech Stack)
* **Khung ứng dụng:** React 18+ với TypeScript (khởi tạo qua Vite hoặc Next.js)
* **Giao diện & Biểu tượng:** Tailwind CSS + Lucide React
* **Engine Đồ Họa 3D:** Three.js kết hợp `@react-three/fiber` và `@react-three/drei` (hoặc quản lý Three.js native)
* **Hiệu ứng chuyển động:** Framer Motion (hoặc CSS backdrop transition)
* **Triển khai hosting:** Vercel hoặc Netlify

---

## 3. Cấu Trúc Thư Mục Dự Án

```text
showroom-3d/
├── public/
│   └── models/                      # Chứa tài nguyên mô hình 3D (.glb / .gltf)
├── src/
│   ├── components/
│   │   ├── 3d/
│   │   │   ├── ShowroomStage.tsx     # Sân khấu studio, ánh sáng 3 điểm, sàn gương, camera rig
│   │   │   ├── VehicleModel.tsx      # Quản lý mesh xe, vật liệu sơn Clearcoat, chế độ tia X/bóc tách
│   │   │   └── HotspotBeacon.tsx     # Điểm neo 3D phát sáng chiếu tọa độ ra màn hình phẳng 2D
│   │   ├── ui/
│   │   │   ├── TopNavigation.tsx     # Menu chọn xe, thanh tìm kiếm nhanh, chuyển đổi ngôn ngữ
│   │   │   ├── SpecsHUD.tsx          # Thẻ HUD hiển thị thông số nhanh (Công suất, Mô-men xoắn, Dẫn động)
│   │   │   ├── PaintSelector.tsx     # Bảng chọn mã màu sơn kim loại / ngọc trai thực tế
│   │   │   ├── ModeSwitchDock.tsx    # Thanh dock chuyển 3 chế độ (Ngoại thất, Nội thất, Khung gầm)
│   │   │   └── ComponentModal.tsx    # Bảng kính trượt hiển thị chi tiết cơ cấu kỹ thuật khi click bộ phận
│   ├── data/
│   │   └── carDatabase.ts            # Cơ sở dữ liệu thông số kỹ thuật xe chuẩn Việt Nam & tọa độ hotspot
│   ├── hooks/
│   │   ├── useShowroomCamera.ts      # Hook điều khiển xoay, zoom, lerp góc nhìn camera
│   │   └── useHotspotRaycast.ts      # Bắt tọa độ click và tính toán góc nhìn tương ứng
│   ├── types/
│   │   └── automotive.d.ts           # Khai báo kiểu TypeScript (Xe, Thông số, Điểm chạm, Màu sơn)
│   ├── App.tsx                       # Component chính kết nối giao diện và 3D viewport
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── PLAN.md
```

---

## 4. Dữ Liệu 4 Dòng Xe Mục Tiêu Tại Việt Nam

1. **VinFast VF8 Plus (SUV Điện Cỡ D):** 2 Mô-tơ điện e-AWD 402 HP, Pin CATL đặt sàn chống nước IP67, cụm Radar sóng milimet ADAS Level 2+, màn hình trung tâm 15.6 inch & trợ lý ViVi.
2. **Mazda CX-5 Premium (Crossover Cỡ C):** Động cơ xăng SkyActiv-G 2.0L tỷ số nén 13:1, hộp số tự động 6 cấp SkyActiv-Drive, kiểm soát gia tốc GVC Plus, đèn pha thích ứng ALH Matrix LED.
3. **Toyota Vios 1.5G (Sedan Cỡ B):** Động cơ 2NR-FE 1.5L Dual VVT-i siêu bền bỉ, hộp số vô cấp CVT 7 cấp ảo, điều hòa Denso làm lạnh nhanh nhiệt đới hóa, Toyota Safety Sense.
4. **Ford Everest Titanium+ 4WD (SUV 7 Chỗ Khung Gầm Rời):** Động cơ Diesel 2.0L Bi-Turbo 500 Nm, hộp số tự động 10 cấp, lội nước sâu 800mm, khóa vi sai cầu sau điện tử.

---

## 5. Lộ Trình Triển Khai Từng Bước (Roadmap)

### Giai đoạn 1: Khởi Tạo Môi Trường & Dữ Liệu (`types/` & `data/`)
* Tạo file `types/automotive.d.ts` định nghĩa rõ kiểu dữ liệu: xe, màu sơn, tọa độ 3D vector, mô tả kỹ thuật song ngữ.
* Xây dựng file `carDatabase.ts` chứa toàn bộ thông số, cấu trúc hoạt động và tùy chọn nâng cấp bằng tiếng Việt.

### Giai đoạn 2: Thiết Lập Showroom Studio & Vật Liệu PBR (`components/3d/`)
* Xây dựng `ShowroomStage.tsx`:
  * Ánh sáng studio 3 điểm (Key Light rọi chính + Đèn môi trường + Đèn hắt viền Rim Light xanh Cyan/Tím Indigo).
  * Sàn quay tròn phản xạ bóng mờ (Reflective floor) kết hợp bóng đổ mềm `PCFSoftShadowMap`.
  * Vòng đèn neon trần tạo điểm nhấn công nghệ.
* Thiết lập vật liệu xe bằng `MeshPhysicalMaterial`:
  * Thuộc tính `clearcoat: 1.0` và `clearcoatRoughness: 0.05` để mô phỏng lớp phủ bóng gương của xe hơi thật.
  * Tinh chỉnh độ nhám (roughness) và kim loại (metalness) để tái hiện ánh kim loại đa góc nhìn.

### Giai đoạn 3: Logic Điều Khiển Camera & Chế Độ Xem (`hooks/useShowroomCamera.ts`)
* Điều phối tọa độ cầu (Spherical Coordinates) với nội suy mượt mà:
  * **360° Ngoại thất:** Kéo xoay tự do quanh tâm, giới hạn zoom an toàn, nút bật/tắt tự động xoay.
  * **Nội thất Cockpit:** Đưa camera vào trong khoang lái, giảm độ mờ (opacity) trần xe và kính để thấy rõ cụm vô-lăng, màn hình và ghế da.
  * **Khung gầm & Động cơ (X-Ray):** Nâng vỏ xe lên theo trục đứng ($\Delta Y = +1.2m$), chuyển vỏ sang khung dây trong suốt (wireframe) để lộ rõ khối pin, động cơ, hộp số và hệ thống treo.

### Giai đoạn 4: Giao Diện HUD & Điểm Tương Tác Kỹ Thuật (`components/ui/`)
* **Hotspot phát sáng (`HotspotBeacon.tsx`):** Chuyển đổi tọa độ 3D thành tọa độ pixel 2D trên màn hình, hiệu ứng sóng lan tỏa (radar ping).
* **Bảng bóc tách kỹ thuật (`ComponentModal.tsx`):**
  * Giao diện kính mờ cao cấp (Frosted Glassmorphism: `backdrop-blur-2xl` trên nền đen than chì).
  * Trình bày thông số kỹ thuật cốt lõi, nguyên lý vận hành cơ khí và trạng thái tùy chọn phiên bản.
* Thanh điều khiển dock nổi phía dưới màn hình hỗ trợ thao tác nhanh.

### Giai đoạn 5: Tối Ưu Hóa & Kiểm Thử
* Hỗ trợ cử chỉ vuốt xoay và chụm ngón tay phóng to (pinch-to-zoom) trên điện thoại/máy tính bảng.
* Duy trì hiệu năng ổn định 60 FPS trên trình duyệt WebGL.

---

## 6. Tiêu Chí Nghiệm Thu (Acceptance Checklist)
- [ ] Xe phản xạ ánh sáng kim loại sang trọng, không còn hình khối vuông vức kiểu đồ chơi hoạt hình.
- [ ] Thao tác xoay 360 độ mượt mà, không bị lật ngược camera đột ngột.
- [ ] Đổi màu sơn phản hồi tức thì với độ bóng rõ nét.
- [ ] Chuyển đổi trơn tru giữa 3 chế độ (Ngoại thất, Nội thất, Khung gầm X-Ray).
- [ ] Nhấp vào bất kỳ điểm phát sáng nào đều tự động lia camera phóng to và mở bảng thông số kỹ thuật tiếng Việt.