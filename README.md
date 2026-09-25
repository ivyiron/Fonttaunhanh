# Font Tàu Nhanh

**Bộ công cụ xử lý và tinh chỉnh font chữ dành cho tiếng Việt.**

Font Tàu Nhanh tập trung vào những công việc thường gặp khi xử lý font Việt hóa, từ chỉnh sửa ký tự tiếng Việt, căn chỉnh dấu đến tinh chỉnh kerning.

Ứng dụng được xây dựng theo hướng **local-first**: font được xử lý trực tiếp trên trình duyệt, không cần upload file font lên server.

> **Web app:** [fonttaunhanh.vercel.app](https://fonttaunhanh.vercel.app/)

---

## ✦ Công cụ

Font Tàu Nhanh hiện gồm ba công cụ chính, sử dụng chung một hệ thống xử lý font:

### Việt hóa tàu nhanh

Công cụ hỗ trợ xử lý và tinh chỉnh các ký tự tiếng Việt trong font.

Phù hợp cho các trường hợp cần:

* Kiểm tra và chỉnh sửa ký tự tiếng Việt
* Tinh chỉnh vị trí dấu
* Xử lý các vấn đề về cao độ và khoảng cách của dấu
* Áp dụng quy tắc chỉnh sửa cho nhiều glyph

### Sửa font tàu nhanh

Công cụ chỉnh sửa trực tiếp các thành phần của font, hỗ trợ quá trình kiểm tra và tinh chỉnh glyph.

### Kerning tàu nhanh

Công cụ dành cho việc kiểm tra và tinh chỉnh **kerning** giữa các ký tự.

---

## 🔒 Privacy First

Font chữ có thể chứa dữ liệu thiết kế và tài sản thương mại, vì vậy Font Tàu Nhanh được thiết kế theo hướng xử lý cục bộ.

* Font được xử lý trực tiếp trong trình duyệt.
* Không yêu cầu upload font lên backend để thực hiện các thao tác chính.
* Không cần cơ sở dữ liệu để sử dụng các công cụ chỉnh font.
* File font của bạn không được gửi đi chỉ để thực hiện các thao tác chỉnh sửa thông thường.

> **Your font stays on your machine.**

---

## 🚀 Chạy tại máy

### Yêu cầu

* Node.js
* npm

### Cài đặt

```bash
git clone https://github.com/ivyiron/Fonttaunhanh.git

cd Fonttaunhanh

npm install
```

### Development

```bash
npm run dev
```

Sau đó mở:

```text
http://localhost:3000
```

### Build production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Kiểm tra TypeScript

```bash
npm run lint
```

---

## 🧩 Công nghệ

Font Tàu Nhanh được xây dựng với:

* **React** — giao diện ứng dụng
* **TypeScript** — type-safe development
* **Vite** — development & build tooling
* **Tailwind CSS** — UI styling
* **OpenType.js** — đọc và xử lý OpenType font
* **Paper.js** — xử lý vector/path
* **Motion** — animation và interaction
* **Lucide React** — interface icons
* **Google GenAI** — các tính năng AI khi được sử dụng

---

## 🏗 Kiến trúc

Các công cụ được xây dựng trên cùng một nền tảng xử lý font thay vì tách thành những ứng dụng độc lập.

```text
                    Font Tàu Nhanh
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
       Việt hóa        Sửa font       Kerning
       tàu nhanh       tàu nhanh      tàu nhanh
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                    Font Processing
                           │
                           ▼
                     Font Export
```

Cách tổ chức này giúp các công cụ có thể dùng chung logic xử lý font và tạo thành một workflow thống nhất.

---

## 📁 Cấu trúc project

```text
Fonttaunhanh/
├── public/
├── src/
├── .env.example
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🛠 Development

Cài đặt dependencies:

```bash
npm install
```

Chạy development server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Kiểm tra TypeScript:

```bash
npm run lint
```

---

## ⚠️ Lưu ý

Font là tài sản có thể chịu các điều khoản cấp phép riêng. Font Tàu Nhanh chỉ cung cấp công cụ xử lý; người sử dụng chịu trách nhiệm đảm bảo mình có quyền chỉnh sửa, chuyển đổi và phân phối font theo giấy phép tương ứng.

Nếu sử dụng font thương mại, hãy kiểm tra license của font trước khi chỉnh sửa hoặc phân phối phiên bản đã chỉnh sửa.

---

## 📌 Trạng thái

Font Tàu Nhanh đang trong quá trình phát triển.

Các công cụ và workflow có thể tiếp tục được thay đổi, bổ sung và tối ưu trong các phiên bản tiếp theo.

---

## 🤝 Đóng góp

Nếu bạn phát hiện lỗi hoặc có đề xuất cải thiện:

1. Mở một **Issue** trên GitHub.
2. Mô tả vấn đề hoặc đề xuất càng cụ thể càng tốt.
3. Nếu có thể, cung cấp font mẫu hoặc trường hợp tái hiện lỗi.

Pull Request cũng được hoan nghênh.

---

## 📄 License

Xem thông tin license trong repository.

---

**Font Tàu Nhanh**
*Công cụ xử lý font tiếng Việt, nhanh và trực tiếp trên máy của bạn.*
