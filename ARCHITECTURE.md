# Nền tảng chỉnh sửa font — kiến trúc

Ba công cụ, một font session, một đường xuất file.

## Vì sao phải gộp ngay

Hai codebase hiện tại đã fork và đã trôi. Bảy hàm trùng tên nằm ở cả hai nơi
với nội dung khác nhau:

| Hàm | Viethoa_taunhanh | font-editer |
|---|---|---|
| `buildKernTable` | chia nhiều subtable, giữ đủ 74.540 cặp | cắt cứng ở 10.920 cặp |
| `buildGPOSTable` | có, Extension lookup, không tràn 64 KB | **không có** |
| `injectAdvancedLayoutTables` | 6 tham số, nhận kern + GPOS | 4 tham số, chỉ nhận kern |
| `parseSvgPath` | giống | giống |
| `transformCommands` | giống | giống |
| `getExactBoundingBox` | giống | giống |
| `ensureKerningPairsPopulated` | giống | giống |

Font xuất từ Sửa font mất phần lớn kerning và không có ccmp, OS/2 range hay
combining marks — không phải vì thiết kế như vậy, mà vì bản fork ra đời trước
khi những thứ đó được viết. Mỗi lần sửa lỗi ở một bên là một lần khoảng cách
rộng thêm.

## Ba tầng

```
core/     không import React. Chạy được trong worker và trong test Node.
  font/       io, metrics (stem, contrast, stress angle), glyph inventory
  geometry/   parseSvgPath, transformCommands, bbox, boolean union
  tables/     kern, gpos, ccmp/gsub, os2, sfnt inject, parseFontResilient
  kerning/    class expansion, inheritance, optical measurement
  compile/    pipeline.ts  ← đường xuất file duy nhất
              preview.ts   ← đường xem trước, không đụng bảng nhị phân

ui/       React dùng chung, không biết gì về ba công cụ
  shell/      StudioShell, StudioHeader, StatusBar
  glyph/      GlyphCanvas, GlyphCell, GlyphGrid
  inspector/  NumericInput, SliderRow, SvgPasteCard, SectionGroup
  preview/    FontPlayground, KerningProof
  state/      useFontSession, useEditSet, useCompiler

tools/    chỉ chứa panel riêng của từng công cụ
  viethoa/    MarkLibraryPanel, MarkInspector, VietGlyphListPanel, ComposeInspector
  editor/     GlyphListPanel, OutlineInspector
  kerning/    PairListPanel, KerningInspector

app/      registry + router
```

Quy tắc một chiều: `tools/` được import `ui/` và `core/`; `ui/` được import
`core/`; `core/` không import gì của hai tầng trên. Vi phạm chiều này là cách
fork bắt đầu.

## Mô hình dữ liệu

Font được nạp một lần vào `FontSession` và **không bao giờ bị sửa**. Công cụ
sinh ra `Edit`, `compileFont()` áp dụng. Ba loại edit:

- `OutlineEdit` — outline đưa vào nguyên khối. Sửa font dùng, và Việt hóa cũng
  dùng khi người dùng dán SVG đè lên một dấu.
- `ComposeEdit` — glyph lắp từ chữ nền + thành phần dấu. Việt hóa dùng.
- `SpacingEdit` — cặp kerning và delta advance, kèm `intervention: 0|1|2|3`.

Hệ quả đáng giá: undo là stack của `EditSet` chứ không phải clone font; file
`.ftn` chính là `JSON.stringify(EditSet)`; và ba công cụ dùng chung một session
nên vẽ glyph ở Sửa font rồi sinh dấu ở Việt hóa rồi chỉnh cặp ở Kerning là một
mạch liền, không phải ba lần upload và ba lần export.

## Mức can thiệp

`SpacingEdit.intervention` là cách "tôn trọng kerning gốc" trở thành thứ đo được:

| Mức | Nghĩa | Ghi đè cặp gốc |
|---|---|---|
| 0 | Kế thừa nguyên trạng | 0 |
| 1 | Nhân bản kerning sang glyph mới (mặc định) | 0 |
| 2 | Thêm sửa các cặp đo được là chạm nhau | chỉ những cặp đó |
| 3 | Dựng lại toàn bộ | tất cả |

`InterventionReport` trả về bốn con số hiện thường trực dưới canvas. Người dùng
thấy ngay cái giá khi bấm sang mức 3, thay vì một hộp cảnh báo bấm một lần rồi
quên.

## Bố cục

`StudioShell` là khung `h-screen`, chỉ panel mới cuộn. Canvas và dock proof
không bao giờ trôi khỏi tầm mắt của điều khiển đang chỉnh.

| Công cụ | Trái | Giữa | Phải | Dưới |
|---|---|---|---|---|
| Việt hóa · tab Dấu | 9 dấu + dấu hai tầng | canvas một dấu | slider, số liệu, dán SVG, hoa/thường | FontPlayground |
| Việt hóa · tab Chi tiết | 134 ký tự đã dựng | canvas ký tự | inspector lắp ghép | FontPlayground |
| Sửa font | toàn bộ ký tự trong font | canvas ký tự | transform, SVG, alt glyph | FontPlayground |
| Kerning | cặp đã có + cặp mới + cặp cảnh báo | proof cặp và văn bản chạy | mức can thiệp, auto kerning, spacing | — |

Kerning không có dock riêng vì canvas của nó chính là proof — không ai đánh giá
được kerning trên một glyph đơn lẻ.

## Trạng thái

Cả 5 bước đã xong. `core/` là 23 file, không file nào import React; `ui/` dùng chung
cho ba tool; `tools/` chỉ còn panel riêng. Hai đường biên dịch — `compileVietnameseFont`
và `compileEditedFont` — dùng chung bộ dựng bảng, bộ đặt tên, ccmp và OS/2, và cùng
đi qua `buildKerningPlan` cho mức can thiệp.

## Thứ tự làm (đã hoàn thành)

**Bước 1 — dựng `core/`, chưa đụng giao diện.** Chuyển các hàm từ
`Viethoa_taunhanh/src/utils.ts` (3.000 dòng) sang `core/geometry`,
`core/tables`, `core/kerning`. Xoá hẳn `font-editer/src/utils.ts`. Viết
`compileFont()` bọc đúng luồng `handleCompileFont` hiện tại. Kiểm chứng bằng
bộ test đã chạy: 45 font, so số cặp kerning, feature GSUB, bit OS/2, và shaping
bằng HarfBuzz. Bước này không đổi hành vi của app nào, nên rủi ro thấp nhất và
phải làm trước.

**Bước 2 — tách `preview` khỏi `compile`.** Đây là điều kiện tiên quyết của
toàn bộ phần giao diện: kéo slider phải phản hồi dưới 16 ms, trong khi một lần
biên dịch mất khoảng 900 ms. Chưa làm xong bước này thì đừng vẽ lại UI.

**Bước 3 — `StudioShell` + Sửa font.** Công cụ này đã sẵn bố cục đúng, chuyển
sang shell chung là nhanh nhất và cho phép kiểm thử shell trên codebase nhỏ hơn.
Nhân tiện xoá `GlyphStudio.tsx` (1.362 dòng) và `GlyphBrowser.tsx` (355 dòng) —
hiện không file nào import chúng.

**Bước 4 — Việt hóa hai tab.** `DiacriticStudio.tsx` 2.347 dòng tách thành
`MarkLibraryPanel` + `MarkInspector` + `ComposeInspector`. Đây là bước nặng nhất.

**Bước 5 — Kerning.** Tách khỏi hàng tab, xuất hiện khi hệ thống phát hiện cặp
chạm, kèm mức can thiệp.

## Dọn dẹp kèm theo

Cả hai `package.json` khai báo `@google/genai`, `express`, `dotenv` mà không
file nào trong `src/` dùng; `font-editer` thêm `motion`. `README.md` của
font-editer vẫn là template AI Studio và yêu cầu `GEMINI_API_KEY` không tồn tại.
Script `clean` xoá `server.js` không có thật ở cả hai repo.


## Kiểm chứng

Bốn bộ test chạy trên 45 font mẫu của opentype.js, kiểm bằng fontTools và HarfBuzz:

- `leveltest.mjs` — bốn đảm bảo của mức can thiệp (mức 0 tái tạo nguyên bản, mức 1
  không sửa cặp gốc nào, mức 2 chưa duyệt thì bằng mức 1, duyệt một cặp thì đúng một
  cặp đổi).
- `incr.mjs` — session dựng tăng dần cho kết quả giống hệt dựng mới, 8 kịch bản × 3 font.
- `drag.mjs` — chi phí mỗi frame khi kéo slider.
- `featuretest.mjs` — trích dấu từ ký tự có sẵn, so chồng glyph dựng mới với glyph gốc.

## Còn nợ

- `EditSet` chung: hai đường biên dịch vẫn nhận tham số riêng thay vì một tập edit
  thống nhất. Gộp được sau khi có bộ đối chiếu output đủ chặt.
- GDEF vẫn chép nguyên khối từ font gốc, nên combining mark mới thêm chưa được phân
  loại là mark. Không ảnh hưởng chữ tiếng Việt vì chúng đi qua ccmp.
- `createPreviewSession` dựng lại toàn bộ 134 glyph; có thể thu hẹp theo viewport.
