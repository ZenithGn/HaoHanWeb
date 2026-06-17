# Hướng Dẫn Kiểm Thử API Bằng Postman (Không Cần Server Minecraft Live)

Tài liệu này hướng dẫn chi tiết cách kiểm thử các API đã phát triển bằng **Postman**. 

Vì server Minecraft hiện tại chưa hoạt động, các chức năng RCON sẽ tự động bỏ qua (không gây lỗi crash hệ thống). Bạn vẫn có thể kiểm thử toàn bộ luồng từ **Đăng ký/Đăng nhập**, **Tạo link thanh toán**, **Giả lập nạp thành công (PayOS & Thẻ cào)** và **Bảng xếp hạng**.

---

## Cấu Hình Chung
* **Base URL:** `http://localhost:8080`
* **Content-Type:** `application/json` (đối với tất cả request POST)

---

## 1. Đăng Ký Tài Khoản Web (Register)
Đăng ký một tài khoản web mới hoặc đăng ký mật khẩu cho tài khoản game sẵn có.
* **Method:** `POST`
* **URL:** `http://localhost:8080/api/auth/register`
* **Body (raw - JSON):**
```json
{
  "username": "haohanplayer",
  "password": "mysecurepassword123"
}
```
* **Kết quả mong đợi (201 Created):** 
  Trả về thông báo đăng ký thành công, token đăng nhập và UUID offline được sinh tự động.

---

## 2. Đăng Nhập Tài Khoản Web (Login)
Đăng nhập để nhận mã Token phục vụ cho các API yêu cầu quyền đăng nhập.
* **Method:** `POST`
* **URL:** `http://localhost:8080/api/auth/login`
* **Body (raw - JSON):**
```json
{
  "username": "haohanplayer",
  "password": "mysecurepassword123"
}
```
* **Kết quả mong đợi (200 OK):**
  Trả về thông tin user và mã `"token"`.
* **Cần làm:** Sao chép chuỗi `"token"` này. Trong các request tiếp theo yêu cầu xác thực, hãy thêm Header:
  * Key: `Authorization`
  * Value: `Bearer <chuỗi_token_vừa_copy>`

---

## 3. Tạo Đơn Quyên Góp Qua PayOS (PayOS Create)
Khởi tạo đơn quyên góp và nhận link thanh toán/VietQR động từ PayOS.
* **Method:** `POST`
* **URL:** `http://localhost:8080/api/donations/payos/create`
* **Headers:**
  * `Authorization`: `Bearer <your_login_token>`
* **Body (raw - JSON):**
```json
{
  "amount": 20000,
  "message": "Ung ho may chu duy tri"
}
```
* **Kết quả mong đợi (200 OK):**
  Trả về link thanh toán (`checkoutUrl`), mã QR và mã đơn hàng `"orderCode"` (ví dụ: `1718610492`). Hãy **sao chép mã `"orderCode"`** này để kiểm thử bước tiếp theo.

---

## 4. Giả Lập Webhook PayOS Báo Nạp Thành Công
Do PayOS yêu cầu chữ ký số bảo mật trên dữ liệu Webhook, chúng tôi đã tạo sẵn API tiện ích hỗ trợ sinh chữ ký tự động cho bạn khi kiểm thử ở local.

### Bước A: Tạo payload có chữ ký hợp lệ
* **Method:** `POST`
* **URL:** `http://localhost:8080/api/test/payos-signature`
* **Body (raw - JSON):**
```json
{
  "orderCode": 1718610492, 
  "amount": 20000,
  "description": "Nap game haohanplayer"
}
```
*(Thay thế `orderCode` bằng mã bạn nhận được từ bước 3)*
* **Kết quả mong đợi (200 OK):** Trả về một JSON chứa các thông tin thanh toán kèm mã hóa `"signature"`. **Hãy copy toàn bộ kết quả JSON này**.

### Bước B: Gửi Webhook giả lập tới API của hệ thống
* **Method:** `POST`
* **URL:** `http://localhost:8080/api/donations/payos/webhook`
* **Body (raw - JSON):** *(Dán toàn bộ kết quả vừa copy từ Bước A vào đây)*
```json
{
  "success": true,
  "code": "00",
  "data": {
    "orderCode": 1718610492,
    "amount": 20000,
    "description": "Nap game haohanplayer",
    "accountNumber": "123456789",
    "reference": "test_ref",
    "transactionDateTime": "2026-06-17 13:10:00"
  },
  "signature": "chuỗi_mã_hóa_tự_sinh_từ_bước_A"
}
```
* **Kết quả mong đợi (200 OK):** Trả về `{ "success": true }`. Hệ thống sẽ tự động cập nhật trạng thái đơn hàng thành `SUCCESS` và cộng dồn tiền quyên góp của bạn trong CSDL.

---

## 5. Nạp Thẻ Cào Điện Thoại (Card Submit)
* **Method:** `POST`
* **URL:** `http://localhost:8080/api/donations/card/submit`
* **Headers:**
  * `Authorization`: `Bearer <your_login_token>`
* **Body (raw - JSON):**
```json
{
  "card_type": "VIETTEL",
  "serial": "10008593849384",
  "pin": "2839483928394",
  "declared_value": 50000,
  "message": "Nap card viettel 50k"
}
```
* **Kết quả mong đợi (200 OK):**
  Trả về thông tin nạp thẻ và mã giao dịch `"tx_ref"` (ví dụ: `CD_abcdef123456`). Hãy **copy mã `"tx_ref"`** này.

---

## 6. Giả Lập Cổng Thẻ Cào Gửi Callback Báo Thẻ Đúng
Giống như PayOS, cổng thẻ cào sẽ gửi callback có kèm chữ ký số để xác nhận thẻ đúng/sai.

### Bước A: Tạo dữ liệu Callback đã ký
* **Method:** `POST`
* **URL:** `http://localhost:8080/api/test/card-signature`
* **Body (raw - JSON):**
```json
{
  "request_id": "CD_abcdef123456",
  "status": 1,
  "value": 50000,
  "code": "2839483928394",
  "serial": "10008593849384"
}
```
*(Thay thế `request_id` bằng mã `tx_ref` bạn nhận từ bước 5)*
* **Kết quả mong đợi (200 OK):** Copy toàn bộ kết quả JSON trả về.

### Bước B: Gửi Callback tới API của hệ thống
* **Method:** `POST`
* **URL:** `http://localhost:8080/api/donations/card/callback`
* **Body (raw - JSON):** *(Dán toàn bộ kết quả vừa copy từ Bước A vào đây)*
```json
{
  "request_id": "CD_abcdef123456",
  "status": 1,
  "value": 50000,
  "code": "2839483928394",
  "serial": "10008593849384",
  "sign": "chuỗi_chữ_ký_tự_sinh_bước_A"
}
```
* **Kết quả mong đợi (200 OK):** Trả về `{ "message": "Callback received successfully" }`. Tài khoản của bạn sẽ được cập nhật trạng thái đơn thành `SUCCESS` và cộng tiền nạp thành công.

---

## 7. Xem Bảng Xếp Hạng (Leaderboards)
API công khai lấy danh sách Top Donors và Top Playtime.
* **Method:** `GET`
* **URL:** `http://localhost:8080/api/leaderboards`
* **Kết quả mong đợi (200 OK):**
  Trả về danh sách 10 người nạp nhiều nhất và 10 người có thời gian chơi cao nhất để hiển thị trực quan.

---

## 8. Kiểm Tra Trạng Thái Server Minecraft (Status)
* **Method:** `GET`
* **URL:** `http://localhost:8080/api/server/status`
* **Kết quả mong đợi (200 OK):**
  Trả về trạng thái offline (`"online": false`) do server Minecraft chưa được bật, nhưng API vẫn hoạt động đúng cấu trúc JSON không bị lỗi crash.
