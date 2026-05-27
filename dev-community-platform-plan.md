# Dự án: Nền tảng cộng đồng Dev (Forum + Marketplace + Anti-Scam + Việc làm/Freelance)

## 1) Tầm nhìn sản phẩm
Xây một nền tảng all-in-one cho cộng đồng developer Việt Nam, nơi người dùng có thể:
- thảo luận kỹ thuật (forum/Q&A),
- mua bán sản phẩm số/dịch vụ dev (marketplace),
- báo cáo & tra cứu scam (anti-scam hub),
- tuyển dụng, tìm việc, tìm freelance, tìm team (jobs/freelance matching).

Mục tiêu là tạo “vibe code” thân thiện: minh bạch, thực chiến, ít rác, ưu tiên uy tín cá nhân và chất lượng nội dung.

## 2) Persona chính
1. **Sinh viên/Junior Dev**: học hỏi, hỏi đáp, kiếm việc intern/fresher.
2. **Mid/Senior Dev**: chia sẻ kiến thức, tuyển người, nhận freelance.
3. **Freelancer/Agency nhỏ**: tìm khách, bán template/tool/service.
4. **Founder/HR Tech**: đăng tuyển, săn ứng viên, xây thương hiệu tuyển dụng.
5. **Người mua sản phẩm dev**: mua source, plugin, automation, tư vấn kỹ thuật.

## 3) Các module cốt lõi (MVP -> V2)

### A. Forum / Q&A (MVP)
- Chủ đề theo tag (React, Node, DevOps, AI, Career, Remote).
- Bài viết dạng thảo luận + dạng hỏi đáp (accepted answer).
- Upvote/downvote, bookmark, theo dõi tag.
- Mention @user, trích code markdown, highlight syntax.
- Tìm kiếm full-text + lọc theo tag/độ uy tín/ngày đăng.

**V2**
- AI assistant gợi ý câu trả lời từ knowledge base nội bộ.
- Wiki post cộng tác cho các chủ đề nền tảng.

### B. Marketplace (MVP)
- Người bán tạo gian hàng, hồ sơ xác minh cơ bản (KYC lite).
- Listing sản phẩm: source code, template, khoá học mini, dịch vụ code theo yêu cầu.
- Giỏ hàng, thanh toán online, escrow tạm giữ tiền.
- Review sau giao dịch (chỉ buyer thực mới được đánh giá).
- Cơ chế dispute khi có tranh chấp.

**V2**
- Subscription cho sản phẩm update định kỳ.
- Affiliate/referral cho creator.

### C. Anti-Scam Hub (MVP)
- Trang tố cáo scam có form chuẩn (bằng chứng, timeline, mức thiệt hại).
- Cơ chế kiểm duyệt 2 lớp: auto-flag + moderator review.
- Trang tra cứu username/email/domain/wallet bị report.
- Điểm tin cậy báo cáo (trust score) dựa vào độ tin cậy tài khoản + bằng chứng.

**V2**
- Mô hình phát hiện pattern scam (trùng lặp nội dung, wallet, hành vi).
- API công khai cho cộng đồng tích hợp tra cứu scam.

### D. Jobs & Freelance Matching (MVP)
- Job board: fulltime/part-time/remote/intern.
- Freelance board: post task, nhận báo giá, milestone.
- Hồ sơ dev: stack, years exp, expected salary, availability.
- Tìm kiếm ứng viên theo skill + location + seniority.
- Ứng tuyển 1-click bằng profile nội bộ.

**V2**
- Matching score tự động job-candidate bằng embedding.
- Lịch phỏng vấn, ATS mini cho nhà tuyển dụng.

## 4) Hệ thống uy tín & chống spam (điểm khác biệt)
- **Reputation score hợp nhất**: forum + marketplace + jobs + anti-scam.
- **Badge uy tín**: Verified Seller, Trusted Mentor, Reliable Freelancer.
- **Progressive trust**: tài khoản mới bị giới hạn đăng bài/link cho đến khi đủ điểm.
- **Risk engine**: chặn spam/scam dựa trên hành vi (IP, device, tần suất, pattern).

## 5) Luồng người dùng tiêu biểu

### Luồng 1: Dev mới tham gia
1. Đăng ký -> chọn stack quan tâm.
2. Follow tag -> nhận feed cá nhân hoá.
3. Đặt câu hỏi -> nhận trả lời -> upvote người hỗ trợ.
4. Hoàn thiện hồ sơ -> bật trạng thái “open to work/freelance”.

### Luồng 2: Freelancer kiếm khách
1. Tạo portfolio + dịch vụ + pricing.
2. Ứng tuyển task freelance.
3. Chốt milestone + escrow.
4. Hoàn thành -> nhận review -> tăng trust score.

### Luồng 3: Cộng đồng tố cáo scam
1. Submit report kèm bằng chứng.
2. Hệ thống auto-check trùng lặp + gắn mức rủi ro.
3. Moderator duyệt.
4. Public report + cảnh báo tới user liên quan.

## 6) Kiến trúc đề xuất

### Frontend
- Web app: Vue.js 3 + TypeScript + Tailwind (ưu tiên Nuxt cho SSR/SEO).
- SSR/SEO cho forum/jobs/public profiles.
- Realtime notification bằng WebSocket/SSE.

### Backend
- API gateway/realtime: Node.js (NestJS/Fastify) cho notification, websocket, queue jobs.
- Core business services: PHP 8.3 + Laravel (Auth, Forum, Marketplace, Jobs, Admin).
- Auth: Email + OAuth + 2FA.
- RBAC: User / Seller / Recruiter / Moderator / Admin.

### Data layer
- MongoDB (core transactional data + nội dung linh hoạt cho forum/listings/jobs).
- Elasticsearch/Meilisearch (search forum/jobs/listings) đồng bộ từ MongoDB.
- Redis (cache, rate-limit, queue nhẹ, session).
- Object storage (S3 compatible) cho evidence/attachments.

### Infra
- Docker + CI/CD + staging/prod.
- CDN + WAF + bot protection.
- Observability: logs, metrics, tracing, alerting.

## 7) Data model mức cao
- `users`, `profiles`, `skills`, `badges`, `reputation_events`
- `posts`, `post_comments`, `post_votes`, `tags`, `post_tags`
- `listings`, `orders`, `escrows`, `transactions`, `reviews`, `disputes`
- `scam_reports`, `scam_evidences`, `report_verdicts`, `risk_signals`
- `jobs`, `job_applications`, `freelance_projects`, `proposals`, `milestones`
- `notifications`, `moderation_logs`, `audit_logs`

## 8) Monetization
1. **Marketplace fee**: 5–12% mỗi giao dịch.
2. **Gói Pro** cho seller/freelancer (boost profile/listing).
3. **Gói Recruiter**: đăng job nổi bật, mở kho ứng viên.
4. **Ads native** (chọn lọc, tránh phá UX).
5. **Escrow/dispute fee** cho case đặc biệt.

## 9) KPI quan trọng
- DAU/MAU, retention D1/D7/D30.
- Số bài chất lượng (được upvote/accepted answer).
- GMV marketplace + tỷ lệ hoàn tiền/dispute.
- Time-to-hire cho jobs.
- Tỷ lệ scam report hợp lệ, thời gian xử lý trung bình.
- Trust score distribution toàn hệ thống.

## 10) Lộ trình triển khai (gợi ý 16 tuần)

### Giai đoạn 1 (Tuần 1-4): Foundation
- Auth, profile, RBAC, feed cơ bản.
- Forum core + tag + tìm kiếm cơ bản.
- Logging, rate limit, moderation nền tảng.

### Giai đoạn 2 (Tuần 5-8): Marketplace + Payments
- Listing, checkout, order lifecycle.
- Review, dispute, escrow căn bản.
- Seller verification & basic anti-fraud.

### Giai đoạn 3 (Tuần 9-12): Jobs/Freelance + Anti-Scam
- Job board, ứng tuyển, freelance proposals.
- Scam report workflow + moderation queue.
- Reputation engine bản v1.

### Giai đoạn 4 (Tuần 13-16): Polish + Growth
- Recommendation cơ bản (tag/job/listing).
- SEO, analytics funnel, referral.
- Hardening bảo mật + tối ưu hiệu năng.

## 11) Team đề xuất tối thiểu
- 1 Product Manager
- 1 UX/UI Designer
- 2 Frontend Engineers
- 2 Backend Engineers
- 1 QA
- 1 Part-time DevOps/SRE
- 2 Moderator cộng đồng (part-time giai đoạn đầu)

## 12) Rủi ro & cách giảm thiểu
- **Scam/phốt pháp lý**: quy trình tố cáo rõ ràng, điều khoản sử dụng, lưu audit log.
- **Nội dung rác**: rate-limit + trust gate + moderator + ML flagging.
- **Thanh toán/dispute phức tạp**: chuẩn hoá milestone, SLA xử lý khiếu nại.
- **Cold start cộng đồng**: seeding nội dung chất lượng + mời KOL dev + referral.

## 13) Đề xuất MVP cực gọn (nếu muốn launch nhanh trong 6-8 tuần)
- Forum + Job board + Hồ sơ dev + Anti-scam cơ bản.
- Tạm hoãn escrow đầy đủ, chỉ mở marketplace dịch vụ nhỏ có verify thủ công.
- Tập trung growth qua community và nội dung kỹ thuật chất lượng cao.

---

## 14) Backlog tính năng chi tiết để bắt đầu sprint đầu
1. Đăng ký/đăng nhập, onboarding chọn tech stack.
2. CRUD bài forum + comments + votes + tags.
3. Trang hồ sơ dev + portfolio link.
4. Job posting + apply + dashboard recruiter đơn giản.
5. Form tố cáo scam + upload bằng chứng + moderator queue.
6. Hệ thống notification trong app + email.
7. Admin panel cơ bản: user/report/post moderation.
8. Tracking sự kiện sản phẩm (analytics).

Nếu bạn muốn, bước tiếp theo mình có thể lên luôn:
- **sơ đồ DB chi tiết (ERD)**,
- **user stories + acceptance criteria**,
- **kế hoạch sprint 1/2/3 theo Jira format**,
- **wireframe màn hình chính**.
