import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { DateTime } from 'luxon';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
    findDeepLinkPage,
    findFieldByUrlName,
    findUrlNameByFieldKey,
    primaryPath,
} from './deep-link.config';
import {
    DeepLinkField,
    DeepLinkPage,
    DeepLinkValueType,
    ParsedDeepLink,
} from './deep-link.model';
import { DeepLinkResolverService } from './deep-link-resolver.service';
import { PublicLinkService } from './public-link.service';

/** Tên tham số chứa token đã mã hoá. */
export const DEEP_LINK_TOKEN_PARAM = 'q';

/**
 * Tham số dành riêng bật chế độ chỉ xem: `?q=...&ro=1`.
 *
 * Để ngoài token (không mã hoá) vì đây chỉ là chế độ hiển thị, không phải dữ liệu
 * nhạy cảm, và giữ cho định dạng token không phải cấp phát chỉ số đặc biệt.
 *
 * Giá trị được đổ vào `tabData.readOnly` để trang đích tự tắt các nút thao tác.
 * Đây là ràng buộc GIAO DIỆN, không phải ràng buộc bảo mật — quyền ghi thật sự
 * vẫn do phân quyền của trang và của API quyết định.
 */
export const DEEP_LINK_READONLY_PARAM = 'ro';

/** Phiên bản định dạng token, đứng ở ký tự đầu tiên của token. */
const TOKEN_VERSION = '1';

/** Ngăn cách giữa chỉ số trường và giá trị bên trong payload trước khi base64. */
const PAIR_SEP = '\x1e';

/** Ngăn cách giữa các trường bên trong payload trước khi base64. */
const ENTRY_SEP = '\x1f';

export interface BuildLinkOptions {
    /** true (mặc định): gộp filter thành 1 token ?q=. false: query string dễ đọc. */
    encode?: boolean;
    /** true (mặc định): dùng alias ngắn nếu trang có khai. */
    useAlias?: boolean;
    /** true: mở trang ở chế độ chỉ xem, các nút thao tác bị tắt. */
    readOnly?: boolean;
}

/**
 * Parse / build đường link động mở thẳng 1 trang kèm bộ lọc.
 *
 * 📖 HƯỚNG DẪN ĐẦY ĐỦ: xem README.md cùng thư mục này.
 *
 * Build:
 *   deepLink.buildAbsolute('issuelog', { projectCode: 'RTC-001' })
 *   -> https://host/rerpweb/issuelog?q=1MB5SVEMtMDAx
 *
 * Mở trong app:
 *   deepLink.navigate('issuelog', { projectCode: 'RTC-001' })
 *
 * Khai báo trang/trường: xem deep-link.config.ts
 */
@Injectable({ providedIn: 'root' })
export class DeepLinkService {
    constructor(
        private router: Router,
        private resolvers: DeepLinkResolverService,
        private notification: NzNotificationService,
        private publicLink: PublicLinkService
    ) { }

    // =======================================================================
    // PARSE
    // =======================================================================

    /**
     * Tách URL thành route thật + bộ filter đã ép kiểu.
     * Chấp nhận cả `?q=<token>` lẫn query string thường (`?projectCode=...`).
     * URL không đăng ký deep-link vẫn trả về route để giữ nguyên luồng cũ.
     */
    parse(url: string): ParsedDeepLink {
        const [rawPath, rawQuery] = (url ?? '').split('?');

        // Giữ nguyên path cho URL không phải deep-link: các route nhiều segment
        // (vd: project-task-detail/123) phải được trả về đầy đủ, đúng như hành vi cũ.
        const cleanPath = this.stripSlash(rawPath ?? '');
        const page = findDeepLinkPage(cleanPath.split('/')[0] ?? '');

        if (!page) {
            return { route: cleanPath, filters: {}, isDeepLink: false };
        }

        const params = new URLSearchParams(rawQuery ?? '');
        const filters: Record<string, any> = {};

        // 1. Token đã mã hoá
        const token = params.get(DEEP_LINK_TOKEN_PARAM);
        if (token) {
            Object.assign(filters, this.decode(token, page));
        }

        // 2. Query string thường (ghi đè token nếu trùng, tiện khi sửa tay để debug)
        params.forEach((value, name) => {
            if (name === DEEP_LINK_TOKEN_PARAM) return;
            if (name === DEEP_LINK_READONLY_PARAM) return;
            const field = findFieldByUrlName(page, name);
            if (!field) return;
            const parsed = this.coerce(value, field.type);
            if (parsed !== undefined) filters[field.key] = parsed;
        });

        // 3. Chế độ chỉ xem
        if (this.coerce(params.get(DEEP_LINK_READONLY_PARAM) ?? '', 'boolean') === true) {
            filters['readOnly'] = true;
        }

        const titleStr = typeof page.title === 'function' ? page.title(filters) : page.title;

        return {
            route: page.route,
            title: titleStr,
            page,
            filters,
            isDeepLink: Object.keys(filters).length > 0,
        };
    }

    /**
     * Chạy các resolver đã khai (ví dụ mã dự án -> ProjectID).
     * Trả về bộ filter cuối cùng để đổ vào `tabData`.
     */
    resolve(parsed: ParsedDeepLink): Observable<Record<string, any>> {
        const page = parsed.page;
        if (!page) return of(parsed.filters);

        type Job = { field: DeepLinkField; target: string; value$: Observable<any> };
        const jobs: Job[] = [];

        for (const field of Object.values(page.fields)) {
            if (!field.resolver) continue;

            const raw = parsed.filters[field.key];
            if (raw === undefined || raw === null || raw === '') continue;

            const target = field.resolveTo || field.key;

            // URL đã truyền thẳng giá trị đích thì không cần tra cứu nữa.
            if (target !== field.key && parsed.filters[target] !== undefined) continue;

            jobs.push({ field, target, value$: this.resolvers.run(field.resolver, raw) });
        }

        if (!jobs.length) return of(parsed.filters);

        return forkJoin(jobs.map(j => j.value$)).pipe(
            map(values => {
                const out = { ...parsed.filters };

                values.forEach((value, i) => {
                    const { field, target } = jobs[i];

                    if (value === undefined || value === null || value === '') {
                        const label = field.label || field.key;
                        this.notification.warning(
                            'Không mở được bộ lọc',
                            `${label} "${parsed.filters[field.key]}" không tồn tại hoặc bạn không có quyền xem.`
                        );
                        return;
                    }

                    out[target] = value;
                    if (field.keepRaw === false && target !== field.key) {
                        delete out[field.key];
                    }
                });

                return out;
            }),
            catchError(() => of(parsed.filters))
        );
    }

    /** parse + resolve trong 1 bước. */
    parseAndResolve(url: string): Observable<ParsedDeepLink> {
        const parsed = this.parse(url);
        if (!parsed.isDeepLink) return of(parsed);
        return this.resolve(parsed).pipe(
            map(filters => {
                const titleStr = typeof parsed.page?.title === 'function' ? parsed.page.title(filters) : (parsed.page?.title ?? parsed.title);
                return { ...parsed, filters, title: titleStr };
            })
        );
    }

    // =======================================================================
    // BUILD
    // =======================================================================

    /**
     * Sinh đường dẫn tương đối, ví dụ: `issuelog?q=W1swLCJSVEMtMDAxIl1d`
     * `filters` dùng đúng tên key mà component đọc từ tabData (vd: projectCode).
     */
    build(
        routeOrAlias: string,
        filters: Record<string, any> = {},
        options: BuildLinkOptions = {}
    ): string {
        const { encode = true, useAlias = true, readOnly = false } = options;
        const page = findDeepLinkPage(routeOrAlias);

        if (!page) {
            console.warn(`[DeepLink] Trang "${routeOrAlias}" chưa khai báo trong DEEP_LINK_PAGES.`);
            return this.stripSlash(routeOrAlias);
        }

        const path = useAlias ? primaryPath(page) : page.route;
        const parts = [
            encode ? this.buildTokenQuery(page, filters) : this.buildPlainQuery(page, filters),
            readOnly ? `${DEEP_LINK_READONLY_PARAM}=1` : '',
        ].filter(Boolean);

        return parts.length ? `${path}?${parts.join('&')}` : path;
    }

    /** Đường link tuyệt đối để gửi ra ngoài (mail, thông báo, chat). */
    buildAbsolute(
        routeOrAlias: string,
        filters: Record<string, any> = {},
        options: BuildLinkOptions = {}
    ): string {
        return this.toAbsolute(this.build(routeOrAlias, filters, options));
    }

    private toAbsolute(relative: string): string {
        try {
            // document.baseURI đã bao gồm baseHref (/rerpweb) do Angular cấu hình.
            return new URL(relative, document.baseURI).toString();
        } catch {
            return relative;
        }
    }

    /**
     * Tạo link xem công khai (người nhận không cần đăng nhập, chỉ đọc).
     *
     * Khác `buildAbsolute` ở chỗ phải gọi backend để ký, nên trả về Observable.
     * `filters` nên dùng ID đã giải sẵn (projectId) thay vì mã (projectCode),
     * vì endpoint ẩn danh không tra cứu mã.
     */
    sharePublic(
        routeOrAlias: string,
        filters: Record<string, any> = {},
        expireDays?: number
    ): Observable<string> {
        const page = findDeepLinkPage(routeOrAlias);
        const route = page ? primaryPath(page) : this.stripSlash(routeOrAlias);

        return this.publicLink.sign(route, filters, expireDays).pipe(
            map(res => {
                if (res?.status !== 1 || !res?.data?.token) {
                    throw new Error(res?.message || 'Không tạo được link chia sẻ.');
                }
                return this.toAbsolute(`view?t=${res.data.token}`);
            })
        );
    }

    /** Mở deep-link ngay trong app (không reload trang). */
    navigate(
        routeOrAlias: string,
        filters: Record<string, any> = {},
        options: BuildLinkOptions = {}
    ): Promise<boolean> {
        return this.router.navigateByUrl('/' + this.build(routeOrAlias, filters, options));
    }

    // =======================================================================
    // MÃ HOÁ / GIẢI MÃ TOKEN
    // =======================================================================

    /**
     * Token = TOKEN_VERSION + base64url(payload nén).
     *
     * Payload là chuỗi các cặp `<chỉ số trường base36>\x1e<giá trị>` nối bằng `\x1f`.
     * Không dùng JSON vì dấu ngoặc/nháy làm token phình to sau base64 — với 1 trường
     * thì bản JSON còn dài hơn cả query string thường.
     *
     *   { projectCode: 'RTC-001' }  ->  1MB5SVEMtMDAx
     *   /issuelog?q=1MB5SVEMtMDAx           (25 ký tự)
     *   /issuelog?projectCode=RTC-001       (29 ký tự)
     *
     * Dùng chỉ số thay vì tên trường để token ngắn và không lộ tên field nội bộ.
     * Đánh đổi: thứ tự khai báo `fields` trong config là một phần của định dạng link
     * (xem cảnh báo ở deep-link.config.ts).
     *
     * Kiểu dữ liệu không nằm trong token — khi giải mã, giá trị được ép lại theo
     * `type` khai trong config.
     */
    encode(page: DeepLinkPage, filters: Record<string, any>): string {
        const names = Object.keys(page.fields);
        const parts: string[] = [];

        names.forEach((name, index) => {
            const field = page.fields[name];
            const value = filters[field.key];
            if (value === undefined || value === null || value === '') return;

            const text = String(this.serialize(value))
                .split(PAIR_SEP).join('')
                .split(ENTRY_SEP).join('');

            parts.push(index.toString(36) + PAIR_SEP + text);
        });

        if (!parts.length) return '';
        return TOKEN_VERSION + this.toBase64Url(parts.join(ENTRY_SEP));
    }

    /** Giải mã token về bộ filter. Token hỏng -> trả về object rỗng. */
    decode(token: string, page: DeepLinkPage): Record<string, any> {
        const out: Record<string, any> = {};
        if (!token) return out;

        try {
            const version = token[0];
            if (version !== TOKEN_VERSION) {
                console.warn(`[DeepLink] Token phiên bản "${version}" không được hỗ trợ.`);
                return out;
            }

            const names = Object.keys(page.fields);

            for (const entry of this.fromBase64Url(token.slice(1)).split(ENTRY_SEP)) {
                const at = entry.indexOf(PAIR_SEP);
                if (at <= 0) continue;

                const index = parseInt(entry.slice(0, at), 36);
                const name = names[index];
                if (!name) continue;

                const field = page.fields[name];
                const parsed = this.coerce(entry.slice(at + 1), field.type);
                if (parsed !== undefined) out[field.key] = parsed;
            }
        } catch {
            console.warn('[DeepLink] Token không hợp lệ, bỏ qua bộ lọc.');
        }

        return out;
    }

    // =======================================================================
    // Helpers
    // =======================================================================

    private buildTokenQuery(page: DeepLinkPage, filters: Record<string, any>): string {
        const token = this.encode(page, filters);
        return token ? `${DEEP_LINK_TOKEN_PARAM}=${token}` : '';
    }

    private buildPlainQuery(page: DeepLinkPage, filters: Record<string, any>): string {
        const params = new URLSearchParams();

        for (const [key, value] of Object.entries(filters)) {
            if (value === undefined || value === null || value === '') continue;
            const name = findUrlNameByFieldKey(page, key);
            if (!name) continue;
            params.append(name, String(this.serialize(value)));
        }

        return params.toString();
    }

    /** Đưa giá trị về dạng JSON-friendly trước khi mã hoá. */
    private serialize(value: any): any {
        if (value instanceof Date) return DateTime.fromJSDate(value).toFormat('yyyy-MM-dd');
        if (Array.isArray(value)) return value.join(',');
        return value;
    }

    /** Ép chuỗi trên URL về đúng kiểu khai trong config. */
    private coerce(raw: string, type: DeepLinkValueType = 'string'): any {
        const value = (raw ?? '').trim();
        if (value === '') return undefined;

        switch (type) {
            case 'number': {
                const n = Number(value);
                return Number.isFinite(n) ? n : undefined;
            }
            case 'boolean':
                return ['1', 'true', 'yes', 'y'].includes(value.toLowerCase());
            case 'date': {
                const iso = DateTime.fromISO(value);
                if (iso.isValid) return iso.toJSDate();
                const vn = DateTime.fromFormat(value, 'dd/MM/yyyy');
                return vn.isValid ? vn.toJSDate() : undefined;
            }
            case 'number[]': {
                const arr = value
                    .split(',')
                    .map(s => Number(s.trim()))
                    .filter(n => Number.isFinite(n));
                return arr.length ? arr : undefined;
            }
            case 'string[]': {
                const arr = value.split(',').map(s => s.trim()).filter(Boolean);
                return arr.length ? arr : undefined;
            }
            default:
                return value;
        }
    }

    private stripSlash(v: string): string {
        return (v ?? '').replace(/^\/+/, '');
    }

    /** base64url an toàn với tiếng Việt (btoa chỉ nhận latin1). */
    private toBase64Url(text: string): string {
        const bytes = new TextEncoder().encode(text);
        let binary = '';
        bytes.forEach(b => (binary += String.fromCharCode(b)));
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    private fromBase64Url(token: string): string {
        let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        const binary = atob(base64);
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
    }
}
