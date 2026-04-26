# TypeORM Migrations Guide

## Overview
Project đã chuyển từ `synchronize: true` sang dùng TypeORM migrations để quản lý database schema changes.

## Setup đã hoàn thành

✅ Đã cài TypeORM CLI + ts-node
✅ Đã tạo `data-source.ts` cho TypeORM CLI
✅ Đã cập nhật `app.module.ts` dùng env variables + migrations
✅ Đã thêm migration scripts vào `package.json`
✅ Đã tạo migration init đầu tiên từ các entity hiện tại

## Cách sử dụng

### 1. Khi thay đổi entity (thêm/sửa field, table)

**Ví dụ:** Thêm field `avatarUrl` vào `Staff` entity

```typescript
// src/staffs/staff.entity.ts
@Column({ nullable: true })
avatarUrl: string;
```

**Sau đó generate migration:**

```bash
npm run build
npm run migration:generate -- src/migrations/AddStaffAvatarUrl
```

→ File migration mới sẽ tạo ở `src/migrations/TIMESTAMP-AddStaffAvatarUrl.ts`

### 2. Chạy migration (áp dụng thay đổi vào DB)

```bash
npm run migration:run
```

Hoặc để app tự chạy migration khi start (đã bật `migrationsRun: true` trong `app.module.ts`):

```bash
npm run start:dev
```

### 3. Tạo migration trống (tự viết SQL thủ công)

```bash
npm run migration:create -- src/migrations/CustomMigration
```

### 4. Revert migration (rollback)

```bash
npm run migration:revert
```

### 5. Xem các migration đã chạy

```bash
npm run migration:show
```

## Scripts trong package.json

| Script | Mô tả |
|--------|-------|
| `npm run migration:generate -- <path>` | Tạo migration từ entity changes |
| `npm run migration:create -- <path>` | Tạo migration file trống |
| `npm run migration:run` | Chạy pending migrations |
| `npm run migration:revert` | Rollback migration gần nhất |
| `npm run migration:show` | Xem tất cả migrations |

## Quy trình làm việc khuyến nghị

1. Sửa entity file (`.entity.ts`)
2. `npm run build`
3. `npm run migration:generate -- src/migrations/Description`
4. Review file migration đã tạo
5. `npm run migration:run`
6. Test application
7. Commit cả entity + migration

## Quy trình chuẩn khi đổi schema

Khi bạn muốn thêm/sửa/xóa cột hoặc table, hãy đi theo đúng thứ tự này:

1. **Sửa entity trong NestJS**
   - Ví dụ: thêm `avatarUrl` vào `Staff`
   - Đây mới chỉ là thay đổi ở code, chưa đụng DB

2. **Build project**
   ```bash
   npm run build
   ```

3. **Generate migration**
   ```bash
   npm run migration:generate -- src/migrations/YourChangeName
   ```

4. **Review file migration**
   - Kiểm tra SQL có đúng ý bạn không
   - Đặc biệt cẩn thận với các lệnh `DROP COLUMN`, `DROP TABLE`, `ALTER TABLE`

5. **Run migration**
   ```bash
   npm run migration:run
   ```

6. **Kiểm tra lại kết quả**
   ```bash
   npm run migration:show
   ```
   - Nếu migration đã chạy rồi, nó sẽ nằm trong danh sách executed
   - Nếu `migration:generate` tiếp tục báo không có thay đổi mới thì backend và database đang khớp

7. **Commit cả 2 phần**
   - File entity đã đổi
   - File migration mới tạo

## Cách kiểm tra database và backend đã khớp chưa

Bạn có thể dùng 1 trong 2 cách sau:

### Cách nhanh nhất

```bash
npm run build
npm run migration:generate -- src/migrations/TestSync
```

- Nếu TypeORM báo **No changes in database schema were found** → đã khớp
- Nếu nó tạo ra migration mới → còn chênh lệch giữa entity và database

### Cách xem migration đã chạy

```bash
npm run migration:show
```

- Nếu danh sách trống → chưa có migration nào được apply
- Nếu thấy migration trong danh sách → migration đó đã được chạy

## Environment Variables

Đảm bảo `.env` có đủ DB config:

```env
DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.jxzhloosntfeitpbylzp
DB_PASSWORD=your_password
DB_DATABASE=postgres
DB_SSL=true
DB_LOGGING=false
```

Xem `.env.example` cho template.

## Lưu ý

- **KHÔNG BẬT `synchronize: true`** trong production
- `data-source.ts` đã được thêm vào `.gitignore` (chứa credentials)
- `src/migrations/*.ts` nên commit vào git
- `dist/migrations/*.js` được ignore (tự generate từ build)
