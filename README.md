# E-ink Board

Trang web điều khiển màn e-ink 2.9" ba màu (SSD1680) chạy firmware
[EPD-nRF5](https://github.com/tsl0922/EPD-nRF5), qua **Web Bluetooth**.

Mục đích: điều khiển thẳng từ điện thoại, không cần máy tính, không cần cài app.

## Dùng trên iPhone

iOS không hỗ trợ Web Bluetooth trong Safari hay Chrome. Phải dùng trình duyệt
**[Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055)**:

1. Cài Bluefy từ App Store.
2. Mở địa chỉ GitHub Pages của repo này trong Bluefy.
3. Bấm **Chia sẻ → Thêm vào MH chính** để dùng như một app.

Trên máy tính thì Chrome hoặc Edge là chạy được, không cần gì thêm.

## Không có thông tin cá nhân trong repo này

Repo công khai (GitHub Pages bản miễn phí bắt buộc vậy), nên **mã nguồn không
chứa tên người, ID lịch hay khoá nào**. Những thứ đó được nhập một lần và lưu
trong `localStorage` của chính điện thoại.

Dữ liệu lịch không bao giờ đi qua máy chủ nào khác: trình duyệt gọi thẳng
Google Calendar rồi gửi thẳng xuống màn qua Bluetooth.

## Thông số panel

Đo trực tiếp trên phần cứng chứ không suy đoán:

| Mục | Giá trị |
|---|---|
| Vùng hiển thị | 296 x 138 (nằm ngang) |
| Cửa sổ RAM | 144 x 296 (làm tròn lên bội số của 8) |
| Lề trên | 5px — vỏ nhựa của thẻ che mất mấy dòng đầu |
| Phép xoay | điểm ngang (x, y) → RAM (y, 295 − x) |
| Quy ước bit | plane đen: 1 = trắng; plane đỏ: 0 = đỏ |

Panel **rộng hơn cửa sổ mình ghi**, mà lệnh refresh lại đẩy toàn bộ RAM ra kính,
nên phải gọi `0x46`/`0x47` xoá sạch RAM trước mỗi lần ghi — nếu không, vùng
ngoài cửa sổ sẽ hiện lại ảnh cũ của firmware.

## Trạng thái

- [x] Kết nối BLE, đọc cấu hình và MTU
- [x] Dựng ảnh trên canvas, đóng gói hai plane, gửi xuống màn
- [x] Bố cục thời khoá biểu
- [ ] Đọc Google Calendar ngay trong trình duyệt

Phần dựng ảnh đã được đối chiếu **khớp từng bit** với bộ render Python trong
`host/` — bộ đã chạy thật trên phần cứng.
