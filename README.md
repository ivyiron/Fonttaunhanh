# Nền tảng chỉnh sửa font

Ba công cụ — **Việt hóa tàu nhanh**, **Sửa font tàu nhanh**, **Kerning tàu nhanh** —
dùng chung một font session, một lớp xử lý type, một đường xuất file.

Toàn bộ xử lý chạy trong trình duyệt. Không có backend, không upload font đi đâu.

## Chạy tại máy

```bash
npm install
npm run dev
```

## Deploy lên Vercel

Vercel tự nhận diện Vite. Nếu import repo từ Git thì không cần cấu hình gì thêm —
`vercel.json` đã khai sẵn build command và thư mục output.

Deploy trực tiếp từ thư mục này:

```bash
npm i -g vercel
vercel
```

Không cần biến môi trường nào.

## Cấu trúc

```
src/
  core/     lớp xử lý type, không import React, chạy được trong Node
  ui/       component dùng chung cho cả ba tool
  tools/    panel riêng của từng tool
  app/      registry tool
```

Chiều import một chiều: `tools/` → `ui/` → `core/`. `core/` không import ngược lên.
Vi phạm chiều này chính là cách hai codebase cũ fork ra khỏi nhau.

Xem `ARCHITECTURE.md` cho mô hình dữ liệu, bốn mức can thiệp kerning, và những
việc còn nợ.

## Mức can thiệp

Kerning có bốn mức, mặc định là mức 1:

| Mức | Nghĩa | Ghi đè cặp gốc |
|---|---|---|
| 0 | Kế thừa nguyên trạng | 0 |
| 1 | Nhân bản kerning sang glyph mới | 0 |
| 2 | Thêm sửa các cặp đo được là chạm nhau | chỉ cặp đã duyệt |
| 3 | Dựng lại toàn bộ | tất cả |

Bốn con số dưới canvas cho biết app đang đụng vào dữ liệu gốc bao nhiêu.

## Test

Các script trong `tests/` chạy bằng Node trên core đã bundle, không cần trình duyệt.

```bash
npm run build:core          # bundle core -> tests/core.mjs
node tests/leveltest.mjs    # bốn đảm bảo của mức can thiệp
node tests/incr.mjs         # session tăng dần == dựng mới
node tests/drag.mjs         # chi phí mỗi frame khi kéo slider
node tests/featuretest.mjs  # trích dấu, so chồng glyph
```

Chúng cần một thư mục font mẫu; đường dẫn nằm ở đầu mỗi file, sửa lại cho khớp máy bạn.
