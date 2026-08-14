import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Link xem công khai — mở một trang ở chế độ chỉ đọc mà không cần đăng nhập.
 *
 * Ghép với PublicLinkController bên backend:
 *   - `sign`   : cần đăng nhập, trả về token đã ký HMAC.
 *   - `getData`: không cần đăng nhập, server verify chữ ký rồi trả dữ liệu.
 *
 * Link không mang ID trần mà mang token ký, nếu không thì ai cũng lặp ID để lấy
 * sạch dữ liệu qua endpoint ẩn danh.
 */
@Injectable({ providedIn: 'root' })
export class PublicLinkService {
    private url = environment.host + 'api/PublicLink/';

    constructor(private http: HttpClient) { }

    /** Tạo token chia sẻ. Chỉ người đã đăng nhập gọi được. */
    sign(route: string, filters: Record<string, any>, expireDays?: number): Observable<any> {
        const body = {
            route,
            filters: this.toStringMap(filters),
            expireDays: expireDays ?? null,
        };
        return this.http.post<any>(this.url + 'sign', body);
    }

    /** Đọc dữ liệu theo token. Không cần đăng nhập. */
    getData(token: string): Observable<any> {
        return this.http.get<any>(this.url + 'data', {
            params: new HttpParams().set('t', token),
        });
    }

    /** Backend nhận Dictionary<string,string> nên mọi giá trị phải về chuỗi. */
    private toStringMap(filters: Record<string, any>): Record<string, string> {
        const out: Record<string, string> = {};
        for (const [key, value] of Object.entries(filters ?? {})) {
            if (value === undefined || value === null || value === '') continue;
            out[key] = Array.isArray(value) ? value.join(',') : String(value);
        }
        return out;
    }
}
