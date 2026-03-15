# AI Image App Frontend

Frontend Angular cho hệ thống tạo ảnh/video AI.

## Công nghệ sử dụng

- Angular
- Angular Material
- RxJS
- SCSS

## Yêu cầu môi trường

- Node.js 18+
- npm 9+
- Angular CLI

## Cài đặt

```bash
npm install

Chạy local
ng serve

Sau đó mở trình duyệt:

http://localhost:4200
Build production
npm run build
Cấu hình API

Chỉnh trong file:

src/environments/environment.ts

Ví dụ:

export const environment = {
  production: false,
  apiBaseUrl: 'http://127.0.0.1:8000'
};
Chức năng chính

đăng nhập / đăng ký

generate image

generate video từ image

media gallery

favorites

collections

settings
