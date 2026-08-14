# Deep-link — link động mở thẳng một trang kèm bộ lọc

Sinh ra một đường link, gửi cho người khác, họ bấm vào là mở đúng trang đã lọc sẵn.

```
https://host/rerpweb/issuelog?q=1MB5SVEMtMDAx          -> Lịch sử phát sinh, lọc dự án RTC-001
https://host/rerpweb/issuelog?q=1MB5SVEMtMDAx&ro=1     -> như trên, chế độ chỉ xem
https://host/rerpweb/view?t=eyJyb3V0ZSI6...J9.Kx8fA2   -> chỉ xem, KHÔNG cần đăng nhập
```

---

## 1. Hai loại link — đừng nhầm

| | Link nội bộ | Link công khai |
|---|---|---|
| Dạng | `/issuelog?q=<token>` | `/view?t=<token>` |
| Đăng nhập | **Bắt buộc** | Không cần |
| Phân quyền | Giữ nguyên như bình thường | Không có — ai cầm link là xem được |
| Ghi dữ liệu | Được (trừ khi có `&ro=1`) | Không, luôn chỉ đọc |
| Cần backend | Không | **Có** (`PublicLinkController`) |
| Sinh link | Đồng bộ, không gọi API | Phải gọi API để server ký |

Mặc định dùng **link nội bộ**. Chỉ dùng link công khai khi người nhận thật sự không có tài khoản ERP.

---

## 2. Dùng nhanh

Inject `DeepLinkService`, rồi:

```ts
// Link nội bộ, tuyệt đối, dán vào mail/chat được luôn
this.deepLink.buildAbsolute('issuelog', { projectCode: 'RTC-001' });
// -> https://host/rerpweb/issuelog?q=1MB5SVEMtMDAx

// Link nội bộ, chế độ chỉ xem (ẩn các nút thao tác)
this.deepLink.buildAbsolute('issuelog', { projectCode: 'RTC-001' }, { readOnly: true });
// -> .../issuelog?q=1MB5SVEMtMDAx&ro=1

// Query string dễ đọc, tiện lúc debug
this.deepLink.buildAbsolute('issuelog', { projectCode: 'RTC-001' }, { encode: false });
// -> .../issuelog?projectcode=RTC-001

// Mở ngay trong app, không reload trang
this.deepLink.navigate('issuelog', { projectCode: 'RTC-001' });

// Link công khai — trả Observable vì phải gọi backend để ký
this.deepLink.sharePublic('issuelog', { projectId: 245 }).subscribe(url => { ... });
```

`filters` dùng **đúng tên biến mà component đích đọc từ `tabData`** (ví dụ `projectCode`,
`projectId`), không phải tên tham số trên URL.

Xem ví dụ thật ở `copyDeepLink()` và `copyPublicLink()` trong
`pages/project/project-history-problem-new/project-history-problem-new.component.ts`.

---

## 3. Thêm một trang mới (link nội bộ)

### Bước 1 — Trang đích phải đọc `tabData`

Đây là pattern chung của dự án, phần lớn trang đã có sẵn:

```ts
constructor(
  @Optional() @Inject('tabData') private tabData?: any
) { }

ngOnInit(): void {
  if (this.tabData) {
    if (this.tabData.projectId !== undefined) this.projectId = this.tabData.projectId;
    if (this.tabData.readOnly  !== undefined) this.readOnly  = !!this.tabData.readOnly;
  }
  this.loadData();
}
```

### Bước 2 — Khai báo trong `deep-link.config.ts`

```ts
{
  route: 'bill-import',      // route thật trong app.routes.ts
  alias: 'nhaphang',         // tên ngắn trên URL (tuỳ chọn)
  title: 'Nhập hàng',        // tiêu đề tab (tuỳ chọn, bỏ trống thì lấy title menu)
  fields: {
    // key của object = tên tham số trên URL
    // key bên trong  = tên biến component đọc từ tabData
    sophieu: { key: 'billCode',  type: 'string' },
    tungay:  { key: 'dateStart', type: 'date'   },
    kho:     { key: 'stockIds',  type: 'number[]' },
  },
}
```

Xong. Route alias `/nhaphang` được sinh tự động, không phải sửa `app.routes.ts`.

### Các `type` hỗ trợ

| type | URL | Giá trị nhận được |
|---|---|---|
| `string` (mặc định) | `RTC-001` | `'RTC-001'` |
| `number` | `245` | `245` |
| `boolean` | `1`/`true`/`yes`/`y` | `true` |
| `date` | `2026-08-14` hoặc `14/08/2026` | `Date` |
| `number[]` | `1,2,3` | `[1,2,3]` |
| `string[]` | `a,b,c` | `['a','b','c']` |

### Các thuộc tính khác của một field

```ts
{
  key: 'projectCode',
  type: 'string',
  aliases: ['macode'],   // tên khác cũng chấp nhận trên URL
  label: 'Mã dự án',     // dùng trong thông báo lỗi khi tra không ra
  resolver: 'projectCodeToId',  // xem mục 5
  resolveTo: 'projectId',
  keepRaw: false,        // xoá giá trị gốc sau khi resolve (mặc định giữ lại)
}
```

---

## 4. ⚠ Ràng buộc bắt buộc nhớ: thứ tự khai báo `fields`

Token mã hoá lưu **chỉ số** của field chứ không lưu tên, để link ngắn và không lộ
tên trường nội bộ. Hệ quả:

- Thêm trường mới: **luôn thêm vào CUỐI** object `fields`
- **Không** đổi thứ tự, **không** xoá trường đã có
- Trường bỏ dùng: giữ lại chỗ, đổi tên thành `_unusedN`, đừng xoá

Vi phạm sẽ làm mọi link đã phát ra trước đó lọc **sai dữ liệu** mà không báo lỗi gì.

---

## 5. Resolver — đổi giá trị thân thiện sang ID

Trang issuelog lọc theo `ProjectID`, nhưng link muốn mang mã dự án cho người đọc
hiểu. Resolver làm cầu nối đó.

Khai trong config:

```ts
projectcode: {
  key: 'projectCode',
  resolver: 'projectCodeToId',   // tên resolver
  resolveTo: 'projectId',        // ghi kết quả vào key này
}
```

Đăng ký hàm trong `deep-link-resolver.service.ts`:

```ts
constructor(private someService: SomeService) {
  this.register('projectCodeToId', code => this.lookupProjectIdByCode(code));
}
```

Tra không ra thì hiện notification cảnh báo và bỏ qua filter đó, không làm vỡ trang.

Nếu URL đã truyền thẳng giá trị đích (`?projectid=245`) thì resolver được bỏ qua.

---

## 6. Chế độ chỉ xem (`&ro=1`)

Tham số `ro` để **ngoài** token vì nó chỉ là chế độ hiển thị, không phải dữ liệu
nhạy cảm. Nó được đổ vào `tabData.readOnly`.

Trang đích tự quyết định làm gì với nó. Ở issuelog, quy ước là **ẩn hẳn** mọi nút,
chỉ chừa *Tải lại* và *Xuất Excel*:

```ts
const canEdit = !this.readOnly;
// ... visible: canEdit  cho từng nút thao tác
```

**Ẩn nút là giao diện, không phải bảo mật.** Double-click trên lưới hay context menu
vẫn gọi thẳng vào hàm được, nên phải chặn thêm ở tầng hàm:

```ts
private blockedByReadOnly(): boolean {
  if (!this.readOnly) return false;
  this.notification.info('Chế độ chỉ xem', 'Link này chỉ dùng để xem, không thao tác được.');
  return true;
}

addHistoryRow(): void {
  if (this.blockedByReadOnly()) return;
  ...
}
```

Quyền ghi thật sự vẫn do phân quyền của trang và của API quyết định.

---

## 7. Thêm một trang cho link công khai

Khác link nội bộ, phải sửa **ba nơi** — cố ý để danh sách trang công khai luôn tường minh:

1. **Backend** `RERPAPI/Controllers/PublicLinkController.cs` — thêm nhánh vào `switch`
   trong `GetData` và viết hàm truy vấn tương ứng
2. **Frontend** `pages/public-view/public-view.component.ts` — thêm vào map
   `PUBLIC_VIEW_COMPONENTS`
3. **Trang đích** — phải tránh mọi API cần token (xem dưới)

### Trang đích ở chế độ công khai

Người xem chưa đăng nhập. Gọi bất kỳ API `[Authorize]` nào sẽ nhận 401, và
`authInterceptor` sẽ `window.location.href` về trang login, đá văng họ ra.

Quy ước: vỏ `PublicViewComponent` lấy dữ liệu sẵn rồi truyền xuống qua
`tabData.publicData`. Trang đích chỉ cần:

```ts
private publicData: any = null;
get isPublicMode(): boolean { return !!this.publicData; }

ngOnInit() {
  if (this.tabData?.publicData) {
    this.publicData = this.tabData.publicData;
    this.readOnly = true;          // link công khai luôn chỉ đọc
  }
  ...
}

loadData(): void {
  if (this.isPublicMode) {         // dùng dữ liệu có sẵn, không gọi API
    this.dataHistory = (this.publicData?.dtMaster ?? []).map(x => this.mapMasterDataToTable(x));
    return;
  }
  ...
}

loadProjectInfo(): void {
  if (this.isPublicMode) return;   // API cần token -> bỏ qua
  ...
}
```

**Rà cho hết** các hàm gọi API, kể cả hàm chạy khi click vào một dòng. Ở issuelog,
`onRowClickForPreview()` gọi `getFiles()` nên cũng phải chặn — đổi lại là link công
khai không xem được ảnh đính kèm.

---

## 8. Bảo mật — đọc trước khi mở rộng

**Link nội bộ:** token base64url, ai cũng decode được trong vài giây. Nó chỉ giấu
tên trường nội bộ, **không phải mã hoá**. An toàn vì vẫn qua `authGuard` và phân quyền.

**Link công khai:** token ký HMACSHA256 bằng secret của server.

- Endpoint ẩn danh **không bao giờ được nhận ID trần** từ URL. Nếu nhận, ai cũng lặp
  `projectID = 1..N` để lấy sạch dữ liệu. Đó là lý do có lớp ký này.
- Ai cầm link là xem được. Không phân biệt người nhận, không log ai đã xem.
- Token stateless, **không thu hồi được từng link**. Muốn huỷ toàn bộ link đã phát
  thì đổi `PublicLinkSettings:SecretKey`.
- Mặc định hết hạn sau `ExpireDays` ngày (đang là 90). Đặt `0` để vĩnh viễn.

Cấu hình backend trong `RERPAPI/appsettings.json`:

```json
"PublicLinkSettings": {
  "SecretKey": "...",   // PHẢI đổi trước khi lên production, không trùng JwtSettings
  "ExpireDays": 90
}
```

---

## 9. Luồng hoạt động

**Link nội bộ** `/issuelog?q=...`

```
1. Angular khớp route alias 'issuelog' -> redirect sang 'project-history-problem-new'
   (redirect giữ nguyên query string)
2. Chưa đăng nhập -> authGuard đẩy sang /login?returnUrl=...  -> login xong quay lại
3. MainLayoutComponent.getCompMenus() tải xong menu
4. openTabFromUrl() -> deepLink.parse(url) -> giải mã token thành filters
5. deepLink.resolve() -> chạy resolver (projectCode -> projectId)
6. newTabComp(comp, title, key, { ...menu.data, ...filters })
7. Component đọc tabData trong ngOnInit và tự lọc
```

Điều hướng giữa phiên (không reload) do subscription `NavigationEnd` trong
`MainLayoutComponent` xử lý, và chỉ can thiệp khi URL đúng là deep-link.

**Link công khai** `/view?t=...`

```
1. Route 'view' — ngoài MainLayout, không authGuard
2. PublicViewComponent gọi GET api/PublicLink/data?t=...
3. Server verify chữ ký HMAC + hạn dùng, trả route + filters + dữ liệu
4. Dựng component theo map PUBLIC_VIEW_COMPONENTS, truyền tabData
   { ...filters, readOnly: true, publicData }
```

---

## 10. Định dạng token nội bộ

```
token = "1" + base64url( "<chỉ số base36>\x1e<giá trị>" nối bằng "\x1f" )
```

Ký tự đầu là số hiệu phiên bản, để sau này đổi định dạng mà không vỡ link cũ.

Không dùng JSON vì dấu ngoặc và nháy làm token phình sau base64 — bản JSON còn dài
hơn cả query string thường:

| Cách | Ví dụ | Độ dài |
|---|---|---|
| Query thường | `/issuelog?projectCode=RTC-001` | 29 |
| base64 của JSON | `/issuelog?q=eyJwcm9qZWN0Y29kZSI6...` | 45 |
| **Đang dùng** | `/issuelog?q=1MB5SVEMtMDAx` | **25** |

Kiểu dữ liệu không nằm trong token; lúc giải mã, giá trị được ép lại theo `type`
khai trong config.

Muốn link thật sự ngắn (kiểu `/s/a7Bx9`) thì phải có bảng lưu token ở backend —
phương án này đã được cân nhắc và không chọn.

---

## 11. Các file

| File | Vai trò |
|---|---|
| `deep-link.model.ts` | Kiểu dữ liệu cho config |
| `deep-link.config.ts` | **Bảng khai báo trang/trường** — nơi sửa nhiều nhất |
| `deep-link.service.ts` | parse / resolve / build / encode / decode / sharePublic |
| `deep-link-resolver.service.ts` | Đăng ký các hàm tra cứu (mã -> ID) |
| `public-link.service.ts` | Gọi API ký và đọc dữ liệu công khai |
| `../../pages/public-view/public-view.component.ts` | Vỏ hiển thị `/view?t=...` |
| `../../layouts/main-layout/main-layout.component.ts` | `openTabFromUrl()` — nơi cắm vào luồng mở tab |
| `../../app.routes.ts` | `buildDeepLinkAliasRoutes()` + route `view` |

Backend: `RERPAPI/Controllers/PublicLinkController.cs`,
`RERPAPI.Model/Common/PublicLinkSigner.cs`.

---

## 12. Gỡ lỗi

**Link mở ra nhưng không lọc gì**
Tên trường trên URL không khớp config. Thử dạng dễ đọc để kiểm tra:
`deepLink.buildAbsolute('issuelog', {...}, { encode: false })`.
Query string thường luôn được chấp nhận song song với token, sửa tay trên thanh
địa chỉ được.

**Hiện cảnh báo "Không mở được bộ lọc"**
Resolver tra không ra giá trị. Kiểm tra mã có tồn tại không, và tài khoản có
quyền thấy bản ghi đó không.

**Console báo `[DeepLink] Token không hợp lệ`**
Token hỏng hoặc thứ tự `fields` trong config đã bị đổi sau khi link được phát ra.
Xem lại mục 4.

**Link công khai bị đá về trang login**
Trang đích còn gọi một API cần token mà chưa chặn bằng `isPublicMode`. Mở tab
Network, tìm request trả 401.

**Link công khai báo "không hợp lệ hoặc đã hết hạn"**
Hết hạn theo `ExpireDays`, hoặc `SecretKey` đã bị đổi, hoặc token bị cắt cụt lúc
copy (token có dấu `.` ở giữa, một số công cụ chat cắt mất).
