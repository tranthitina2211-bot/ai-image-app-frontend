PROJECT: DevelopAppsPaintingAI
STACK:
- Frontend: Angular
- Backend: Laravel
- AI pipeline: ComfyUI
- Realtime/progress: polling hiện có, có broadcast/log progress ở backend
- Local environment: máy local đang yếu, cần phân biệt rõ đâu là do tài nguyên máy, đâu là do kiến trúc app chưa tối ưu

====================================================================
1. MỤC TIÊU CHUNG
====================================================================

Mục tiêu hiện tại không phải thêm quá nhiều tính năng mới ngay, mà là:

1. Ổn định dữ liệu thật giữa frontend và backend
2. Đồng bộ state UI với dữ liệu lưu trong database
3. Cải thiện UX loading/progress để app trông chuyên nghiệp hơn
4. Tăng tốc trải nghiệm thực tế khi login, load media, generate
5. Sửa các tính năng đang hỏng hoặc chưa hoàn chỉnh
6. Chuẩn bị nền tảng tốt cho payment, social login, realtime, retry job, job history

Ưu tiên sửa các lỗi có ảnh hưởng trực tiếp đến niềm tin của user:
- reload bị mất dữ liệu
- settings hiển thị sai state
- favourite không hoạt động
- collection tạo/xóa bị lỗi UX
- browser confirm chưa đồng bộ với Angular dialog
- loading chậm nhưng không có feedback rõ ràng

====================================================================
2. TÌNH TRẠNG HIỆN TẠI / CÁC VẤN ĐỀ CẦN XỬ LÝ
====================================================================

[1] STACK MERGE / SPLIT CHƯA PERSIST DATABASE
- Hiện tại trong trang create, thao tác gộp stack và tách stack mới chỉ phản ánh ở state frontend.
- Khi reload page thì dữ liệu quay lại như cũ.
- Cần chuyển thành luồng chuẩn:
  + frontend gọi API backend để merge/split
  + backend cập nhật database
  + frontend patch local state theo response
  + reload lại vẫn giữ nguyên kết quả

[2] SETTINGS HIỂN THỊ SAI GIÁ TRỊ ĐANG LƯU
- Ví dụ: chọn theme light, giao diện thực tế là light nhưng trong settings vẫn hiển thị option dark.
- Cần kiểm tra kỹ:
  + mapping API response -> model frontend
  + local snapshot có đang ghi đè server response không
  + form init có lấy state cũ không
  + save xong có reload/patch state chuẩn không
  + backend settings response có field sai hoặc thiếu không

[3] UX LOADING CHƯA CHUYÊN NGHIỆP
- Login hiện tại chỉ block button, chưa block full screen.
- Generate cũng chưa có loading UX tốt.
- Cần nâng cấp:
  + login: fullscreen blocking overlay + spinner + text trạng thái
  + generate: loading lúc submit job + ghost/skeleton/progress đẹp hơn
  + mọi tác vụ chậm đều nên có feedback trực quan

[4] FAVOURITE CHƯA HOẠT ĐỘNG
- Cần kiểm tra đầy đủ frontend và backend:
  + toggle ở frontend
  + API favourite
  + media response có trả đúng trạng thái favourite theo user hay không
  + query/join/relation có đúng không

[5] NOTIFICATION CHƯA HOẠT ĐỘNG ĐÚNG
- Cần rà luồng notification/toast:
  + không hiện
  + hiện sai thời điểm
  + không tự tắt
  + state/event bus/service chưa đúng
- Mục tiêu là thông báo rõ cho các hành động:
  + save settings
  + create/delete collection
  + generate success/fail
  + favourite add/remove
  + cancel/retry

[6] PAYMENT CHƯA HOẠT ĐỘNG
- Mong muốn nghiệp vụ:
  + User ở Việt Nam: dùng tiếng Việt + phương thức thanh toán nội địa/ngân hàng Việt Nam
  + User ở quốc gia khác: dùng tiếng Anh + thanh toán quốc tế qua Visa/card quốc tế
- Không nên chỉ dựa hoàn toàn vào IP.
- Thiết kế đúng:
  + IP/geolocation chỉ dùng để gợi ý mặc định lần đầu
  + user có thể đổi lại ngôn ngữ/quốc gia trong settings
  + lưu lựa chọn vào database/profile/settings
- Cần chốt sau:
  + VN gateway: VNPay / MoMo / Napas / chuyển khoản
  + Global gateway: Stripe / PayPal / Paddle
- Hiện tại mới cần thiết kế và chuẩn bị phần logic phân nhánh theo quốc gia/ngôn ngữ/payment type

[7] SOCIAL LOGIN CHƯA HOẠT ĐỘNG
- Cần kiểm tra:
  + Socialite config
  + routes callback
  + redirect URL frontend/backend
  + token handoff / Sanctum / JWT
  + callback page frontend
  + .env config provider
- Đây là nhóm cần thiết kế và rà flow kỹ trước khi fix hoàn chỉnh

[8] COLLECTION CREATE / DELETE BỊ LỖI UX
- Khi tạo mới collection thì bị trắng giao diện, phải chuyển trang rồi vào lại mới thấy button và nội dung.
- Khi xóa collection thì có delay 1-2 giây rồi mới biến mất, gây cảm giác app bị đơ.
- Cần xử lý:
  + patch state/local list ngay sau create/delete
  + detectChanges hoặc refresh luồng data đúng lúc
  + thêm pending state / fade out / collapse animation khi delete

[9] HIỆU NĂNG TRẢI NGHIỆM ĐANG CHẬM
- Login mất khoảng 7-10 giây
- Sau login load media thêm khoảng 3-5 giây
- Đây không chỉ là do máy yếu, mà nhiều khả năng là do:
  + local machine yếu
  + backend local chậm
  + payload tải quá lớn
  + app gọi quá nhiều request cùng lúc
  + media load quá nhiều item ngay khi vào app
  + render nặng
- Cần tối ưu để cảm giác nhanh hơn rõ rệt:
  + login xong vào app sớm hơn
  + media load lazy/paginated
  + chỉ fetch page đầu
  + các phần khác load sau
  + skeleton/loading overlay thay vì màn hình trắng

[10] BROWSER CONFIRM PHẢI ĐỔI THÀNH ANGULAR DIALOG
- Tất cả confirm kiểu window.confirm / confirm() cần đổi sang Angular dialog đã thiết kế sẵn.
- Áp dụng cho:
  + delete media
  + delete collection
  + cancel generate
  + remove favorite
  + các destructive action khác

[11] ATTACH FILE CẦN NÂNG CẤP
- Phần Attach file phải được nâng cấp để hành vi giống tinh thần của các trang hiện hành, không chỉ đơn giản là upload file.
- Yêu cầu nghiệp vụ:
  + Nếu attach 1 image và bấm generate khi KHÔNG có prompt:
    -> hệ thống phải hiểu đây là luồng image-to-video
  + Nếu attach 1 image và có prompt:
    -> hệ thống phải dùng image + prompt để generate theo nội dung prompt
- Cần thiết kế rõ:
  + UI attach file
  + loại file được hỗ trợ
  + mapping action generate theo ngữ cảnh
  + backend workflow selection theo:
    - text-only
    - image-to-video
    - image + prompt
  + hiển thị ghost/progress phù hợp với từng loại job

====================================================================
3. KẾT LUẬN PHÂN NHÓM ƯU TIÊN
====================================================================

NHÓM CẦN XỬ LÝ NGAY
1. stack merge/split chưa lưu DB
2. settings hiển thị sai state
3. loading/overlay UX cho login và generate
4. favourite chưa hoạt động
5. notification chưa đúng
6. collection create/delete bug
7. tốc độ trải nghiệm chậm
8. confirm browser đổi sang dialog Angular
9. attach file nâng cấp theo logic generate thực tế

NHÓM CẦN THIẾT KẾ KỸ TRƯỚC KHI CODE
10. geo IP + language + payment theo quốc gia
11. social login

====================================================================
4. ROADMAP TRIỂN KHAI ĐỀ XUẤT
====================================================================

--------------------------------
BATCH A — ỔN ĐỊNH DỮ LIỆU VÀ STATE
--------------------------------

Mục tiêu:
- reload lại trang vẫn đúng
- UI không bị lệch với DB
- các hành động chính phải persist thật

Thứ tự làm:
1. Stack persistence (merge/split stack phải lưu backend)
2. Settings sync bug
3. Favourite
4. Collection create/delete bug
5. Confirm dialog Angular

Chi tiết:
- Stack merge/split:
  + cần API merge stack
  + cần API split/drop-out stack
  + frontend gọi API rồi patch state
  + backend persist DB
- Settings:
  + rà service, model, form init, response backend
- Favourite:
  + rà toggle flow và media response
- Collection:
  + sửa state refresh, detectChanges, animation delete
- Confirm:
  + gom hết confirm browser sang một ConfirmDialogComponent dùng lại toàn app

--------------------------------
BATCH B — UX LOADING + PHẢN HỒI GIAO DIỆN
--------------------------------

Mục tiêu:
- dù có delay user vẫn hiểu app đang xử lý
- trải nghiệm nhìn chuyên nghiệp hơn

Thứ tự làm:
6. Login full-screen blocking overlay
7. Generate loading UX
8. Notification
9. Attach file UX + flow generate theo ngữ cảnh

Chi tiết:
- Login:
  + overlay full screen
  + spinner
  + text “Đang đăng nhập...”
  + chặn click toàn màn hình
  + timeout/error rõ ràng
- Generate:
  + loading khi submit job
  + ghost item/skeleton ngay khi tạo job
  + progress ring/bar mượt
  + trạng thái queued/generating/finalizing/completed
- Notification:
  + chuẩn hóa service hiển thị toast/snackbar
- Attach file:
  + nếu chỉ có image, không prompt -> image-to-video
  + nếu có image + prompt -> generate theo prompt có điều kiện từ image
  + cần đồng bộ UI, service, backend workflow selection

--------------------------------
BATCH C — PERFORMANCE PASS 1
--------------------------------

Mục tiêu:
- giảm cảm giác chậm rõ rệt
- tối ưu các điểm nghẽn dễ thấy nhất

Thứ tự làm:
10. Login flow optimization
11. Media load optimization
12. Reduce initial payload
13. Skeleton/lazy loading

Chi tiết:
- Không load quá nặng ngay sau login
- Chỉ lấy page đầu của media, ví dụ 30-50 item
- Collections/favorites/settings có thể load sau
- Hạn chế full refresh list
- Tăng cảm giác nhanh bằng skeleton thay vì chờ trắng màn hình

--------------------------------
BATCH D — PAYMENT / GEO / SOCIAL LOGIN
--------------------------------

Mục tiêu:
- chuẩn bị cho production flow theo vùng
- không thiết kế sai từ đầu

Thứ tự làm:
14. Geo IP + language/payment strategy
15. Social login flow audit và fix

Chi tiết:
- Geo/payment:
  + IP chỉ để gợi ý
  + user có thể đổi tay
  + lưu country/language/payment preference vào profile/settings
  + VN -> tiếng Việt + cổng thanh toán nội địa
  + ngoài VN -> tiếng Anh + cổng quốc tế
- Social login:
  + kiểm tra provider config, routes, callback, token handoff, frontend callback page

====================================================================
5. ROADMAP HỆ THỐNG GENERATE / AI PIPELINE
====================================================================

Đây là roadmap kỹ thuật backend/generate đã được xác định trước, vẫn cần giữ để tối ưu hệ thống.

PHASE 1 — ỔN ĐỊNH HỆ THỐNG GENERATE
1. Giới hạn polling thông minh
- Hiện polling 1200ms
- Nên nâng lên 2000ms để giảm load server
- Trong GenerateService:
  this.scheduleNextPoll(jobId, mediaId, stackIdForAutoOpen, 2000);

2. Thêm timeout job
- Hiện polling/job tối đa khoảng 6 phút
- Cần fail safe nếu ComfyUI treo
- Trong GenerateImageJob:
  if ($attempt >= 180) {
      throw new RuntimeException('ComfyUI timeout');
  }

3. Dọn file ComfyUI input
- File copy vào ComfyUI/input hiện không bị xóa
- Sau khi job hoàn thành nên delete input file
- Ví dụ:
  File::delete($inputPath);

PHASE 2 — UX TỐT HƠN
4. Hiển thị progress đẹp hơn
- Không chỉ hiển thị số %
- Mapping trạng thái:
  0-10 -> queued
  10-95 -> generating
  95-100 -> finalizing
  100 -> completed

5. Cho phép generate nhiều job song song có kiểm soát
- Có thể giới hạn max concurrent jobs per user
- Ví dụ tối đa 5 jobs đang queued/generating

6. Retry job
- Nếu job failed, user có thể bấm Retry
- Frontend gọi lại /api/generate với payload cũ

PHASE 3 — TỐI ƯU AI PIPELINE
7. Queue priority
- Tách queue generate / video / upscale
- Video không block image

8. Cache workflow template
- Cache các workflow JSON của ComfyUI
- Tránh load file lại mỗi job

9. Batch generate
- Hỗ trợ variation x4 / x8 / x16 sau này

PHASE 4 — PRODUCTION ARCHITECTURE
10. Chuyển polling -> hybrid realtime
- Websocket cho realtime UI
- Polling làm fallback

11. Media CDN
- Từ local storage -> S3 / Cloudflare R2

12. ComfyUI worker scaling
- Tách Laravel server / queue workers / ComfyUI nodes khi scale

====================================================================
6. NHỮNG VIỆC NÊN LÀM NGAY
====================================================================

3 việc backend/generate nên làm trước để hệ thống ổn định hơn:
1. Giảm polling xuống 2000ms
2. Thêm timeout job
3. Dọn input file ComfyUI

3 việc dữ liệu/UI nên làm trước để user tin app hơn:
4. Fix settings hiển thị sai
5. Fix favourite
6. Fix stack merge/split persistence

Sau đó nên làm ngay:
7. Job History + Retry
- Trang /my-jobs
- Hiển thị:
  + Queued
  + Generating
  + Failed
  + Completed
- Và có:
  + Retry
  + Cancel
  + Open result

8. Auto resume polling nếu refresh page
- Nếu user reload mà job đang chạy thì UI phải khôi phục polling/progress

====================================================================
7. NHẬN ĐỊNH RIÊNG VỀ HIỆU NĂNG
====================================================================

Kết luận hiện tại:
- Không phải chỉ do máy local yếu
- Nhiều khả năng là do kết hợp của:
  + máy local yếu
  + backend local
  + request boot quá nhiều
  + media payload lớn
  + render danh sách nặng
  + loading UX chưa tốt nên tạo cảm giác chờ đợi nặng hơn

Cần đánh giá khi audit repo:
- sau login đang gọi những API nào
- media load per_page bao nhiêu
- có preload thừa không
- có polling/request lặp dư không
- component nào render nặng
- có use trackBy, OnPush, virtual scroll hợp lý chưa
- collection/favorite/settings có đang refresh toàn list không

====================================================================
8. KỲ VỌNG KHI CHATGPT ĐỌC REPO NÀY
====================================================================

Khi đọc repo, cần ưu tiên phân tích theo thứ tự:

Ưu tiên 1:
- stack persistence
- settings sync
- favourite
- collection create/delete
- confirm dialog Angular

Ưu tiên 2:
- login/generate loading UX
- notification
- attach file flow

Ưu tiên 3:
- performance pass 1

Ưu tiên 4:
- geo IP + language/payment
- social login

Cần rà đặc biệt các file/nhóm file sau:
- frontend create page / overlay / stack related components
- MediaService
- SettingsService + settings page
- favourite toggle UI/service
- collection components/dialogs/services
- confirm dialog Angular component
- auth/login flow
- loading overlay / spinner / global blocking UI
- generate service
- attach file UI/service/workflow mapping
- backend controllers:
  + SettingsController
  + CollectionController
  + FavoriteController
  + StackController
  + Auth/Social login controllers
  + Generate related controllers/jobs/resources
- backend models/resources/routes/migrations liên quan

====================================================================
9. ĐỊNH HƯỚNG TRIỂN KHAI KHI BẮT ĐẦU SỬA
====================================================================

Nguyên tắc:
- Không đoán nếu repo đã có sẵn flow thật
- Ưu tiên sửa đúng kiến trúc hiện tại của repo
- Không chỉ fix giao diện mà phải fix cả state và persistence
- Với tác vụ chậm:
  + phải có loading
  + phải có optimistic/pending state nếu phù hợp
  + phải có notification success/error rõ ràng
- Với mọi destructive action:
  + dùng Angular dialog thay cho browser confirm
- Với feature attach file:
  + xử lý theo ngữ cảnh thực tế thay vì chỉ upload file đơn thuần

====================================================================
10. YÊU CẦU BỔ SUNG QUAN TRỌNG VỀ ATTACH FILE
====================================================================

Phần Attach file phải được nâng cấp lên cho giống các chức năng của các trang hiện hành.

Nghiệp vụ cụ thể:
- Upload 1 image
- Khi generate:
  1. Nếu không có nội dung prompt:
     -> chuyển image thành video
  2. Nếu có nội dung prompt:
     -> dựa vào nội dung prompt để generate từ image đó

Điều này có nghĩa là cần phân loại rõ luồng generate:
- text-to-image
- image-to-video
- image + prompt guided generation

Cần rà:
- UI attach file
- form state prompt/file
- action generate submit
- backend payload parsing
- workflow selector
- progress/ghost UI theo loại job

====================================================================
11. MỤC TIÊU CUỐI CÙNG
====================================================================

Sau các đợt sửa, hệ thống cần đạt được:
- reload không mất trạng thái dữ liệu thật
- settings hiển thị đúng với DB
- favourite/collection hoạt động ổn định
- mọi confirm đồng bộ bằng Angular dialog
- login/generate có loading UX chuyên nghiệp
- attach file hoạt động đúng theo ngữ cảnh
- app nhanh hơn rõ rệt về cảm giác sử dụng
- sẵn sàng mở rộng sang retry/history/realtime/payment/social login