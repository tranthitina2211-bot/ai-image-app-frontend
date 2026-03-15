# AI Image App Frontend

Frontend Angular cho hệ thống tạo ảnh/video AI.

## Công nghệ

- Angular
- Angular Material
- RxJS

## Cài đặt

npm install

## Chạy local

npm install
Truy cập: http://localhost:4200

## Build production
npm run build

## Cấu hình api
src/environments/environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8000'
};

## Chức năng
* login / register
* generate image
* media gallery
* collections
* favorites
* settings
* payments.

## Commit

git add README.md
git commit -m "rewrite frontend README"
git push
