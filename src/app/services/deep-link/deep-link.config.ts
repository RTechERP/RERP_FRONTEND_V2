import { Route } from '@angular/router';
import { DeepLinkField, DeepLinkPage } from './deep-link.model';

/**
 * ============================================================================
 * BẢNG KHAI BÁO DEEP-LINK
 * ============================================================================
 *
 * 📖 HƯỚNG DẪN ĐẦY ĐỦ: xem README.md cùng thư mục này.
 *
 * Mục đích: cho phép build động 1 đường link mở thẳng 1 trang kèm bộ lọc,
 * ví dụ:  {{HostLink}}/issuelog?projectCode=RTC-001
 *
 * Thêm 1 trang mới = thêm 1 phần tử vào mảng dưới đây:
 *
 *   {
 *     route: 'ten-route-trong-app.routes.ts',
 *     alias: 'ten-ngan-tren-url',            // tuỳ chọn
 *     fields: {
 *       tenthamso: { key: 'tenBienTrongComponent', type: 'number' },
 *     },
 *   }
 *
 * Điều kiện để trang nhận được filter: component đích phải đọc `tabData`,
 * theo đúng pattern đang dùng trong dự án:
 *
 *   constructor(@Optional() @Inject('tabData') private tabData?: any) {}
 *   ngOnInit() {
 *     if (this.tabData?.projectId !== undefined) this.projectId = this.tabData.projectId;
 *   }
 *
 * `key` khai ở đây phải trùng đúng tên key mà component đọc.
 *
 * ----------------------------------------------------------------------------
 * ⚠ QUAN TRỌNG — THỨ TỰ KHAI BÁO `fields` LÀ MỘT PHẦN CỦA ĐỊNH DẠNG LINK
 *
 * Link mã hoá (?q=...) lưu *chỉ số* của trường chứ không lưu tên, nên:
 *   - Thêm trường mới: LUÔN thêm vào CUỐI object `fields`.
 *   - KHÔNG đổi thứ tự, KHÔNG xoá trường đã có.
 *   - Trường bỏ dùng: giữ lại chỗ, đổi tên thành `_unusedN` thay vì xoá.
 * Vi phạm sẽ làm những link đã phát ra trước đó lọc sai dữ liệu.
 * ----------------------------------------------------------------------------
 */
export const DEEP_LINK_PAGES: DeepLinkPage[] = [
    {
        route: 'project-history-problem-new',
        alias: ['issuelog', 'issue-log'],
        title: 'Lịch sử phát sinh',
        fields: {
            // /issuelog?projectCode=RTC-001
            // Trang lọc theo ProjectID nên mã dự án được tra sang ID trước khi mở tab.
            projectcode: {
                key: 'projectCode',
                type: 'string',
                label: 'Mã dự án',
                resolver: 'projectCodeToId',
                resolveTo: 'projectId',
            },
            // /issuelog?projectId=245  (truyền thẳng ID, bỏ qua bước tra cứu)
            projectid: { key: 'projectId', type: 'number', label: 'Dự án' },
            // /issuelog?pm=145
            pm: { key: 'pmID', type: 'number', label: 'PM', aliases: ['pmid'] },
        },
    },
    {
        route: 'project-gate-step-master-plan',
        alias: ['masterplan', 'master-plan'],
        title: (filters) => {
            const code = filters['projectCode'] || filters['ProjectCode'] || filters['projectcode'];
            return code ? `Master Plan - ${code}` : 'Master Plan';
        },
        fields: {
            projectcode: {
                key: 'projectCode',
                type: 'string',
                label: 'Mã dự án',
                resolver: 'projectCodeToId',
                resolveTo: 'projectId',
            },
            projectid: {
                key: 'projectId',
                type: 'number',
                label: 'Dự án',
                resolver: 'projectIdToCode',
                resolveTo: 'projectCode',
            },
        },
    },
];

// ---------------------------------------------------------------------------
// Tra cứu
// ---------------------------------------------------------------------------

const toArray = (v?: string | string[]): string[] =>
    v === undefined || v === null ? [] : Array.isArray(v) ? v : [v];

const norm = (v: string): string => (v ?? '').trim().replace(/^\/+/, '').toLowerCase();

/** Map: route thật + mọi alias (đã viết thường) -> config trang. */
const PAGE_INDEX: Map<string, DeepLinkPage> = (() => {
    const index = new Map<string, DeepLinkPage>();
    for (const page of DEEP_LINK_PAGES) {
        index.set(norm(page.route), page);
        for (const alias of toArray(page.alias)) {
            if (alias) index.set(norm(alias), page);
        }
    }
    return index;
})();

/** Tìm config trang theo route thật hoặc alias. */
export function findDeepLinkPage(routeOrAlias: string): DeepLinkPage | undefined {
    return PAGE_INDEX.get(norm(routeOrAlias));
}

/** Alias chính (dùng khi build link). Không có alias thì trả về route thật. */
export function primaryPath(page: DeepLinkPage): string {
    return toArray(page.alias)[0] || page.route;
}

/**
 * Tìm field theo tên tham số trên URL (khớp key của config hoặc aliases).
 * Không phân biệt hoa/thường.
 */
export function findFieldByUrlName(
    page: DeepLinkPage,
    urlName: string
): DeepLinkField | undefined {
    const name = norm(urlName);
    for (const [configName, field] of Object.entries(page.fields)) {
        if (norm(configName) === name) return field;
        if (toArray(field.aliases).some(a => norm(a) === name)) return field;
    }
    return undefined;
}

/**
 * Tìm tên tham số nên dùng trên URL cho 1 key của tabData.
 * Dùng khi build link ngược từ object filter.
 */
export function findUrlNameByFieldKey(
    page: DeepLinkPage,
    fieldKey: string
): string | undefined {
    const key = norm(fieldKey);
    for (const [configName, field] of Object.entries(page.fields)) {
        if (norm(field.key) === key) return configName;
    }
    return undefined;
}

/**
 * Sinh các route alias để Angular không báo lỗi khi mở /issuelog.
 * Redirect giữ nguyên query string, nên URL cuối cùng vẫn mang đủ filter.
 * Được spread vào children của MainLayoutComponent trong app.routes.ts.
 */
export function buildDeepLinkAliasRoutes(): Route[] {
    const routes: Route[] = [];
    const seen = new Set<string>();

    for (const page of DEEP_LINK_PAGES) {
        for (const alias of toArray(page.alias)) {
            const path = norm(alias);
            if (!path || path === norm(page.route) || seen.has(path)) continue;
            seen.add(path);
            routes.push({ path, redirectTo: page.route, pathMatch: 'full' });
        }
    }

    return routes;
}
