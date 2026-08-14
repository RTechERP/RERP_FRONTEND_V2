import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { ProjectHistoryProblemNewService } from '../../pages/project/project-history-problem-new/project-history-problem-service/project-history-problem-new.service';

/**
 * Hàm đổi giá trị thân thiện trên URL sang giá trị mà trang thật sự cần.
 * Trả về undefined nghĩa là không tra được.
 */
export type DeepLinkResolverFn = (value: any) => Observable<any>;

/**
 * Nơi đăng ký các resolver dùng chung cho deep-link.
 *
 * Thêm resolver mới:
 *   this.register('tenResolver', value => this.someService.lookup(value).pipe(map(r => r.ID)));
 * rồi khai `resolver: 'tenResolver'` trong deep-link.config.ts.
 */
@Injectable({ providedIn: 'root' })
export class DeepLinkResolverService {
    private registry = new Map<string, DeepLinkResolverFn>();
    private projects$?: Observable<any[]>;

    constructor(
        private projectHistoryProblemService: ProjectHistoryProblemNewService
    ) {
        // Mã dự án -> ProjectID
        this.register('projectCodeToId', code => this.lookupProjectIdByCode(code));
    }

    register(name: string, fn: DeepLinkResolverFn): void {
        this.registry.set(name, fn);
    }

    has(name: string): boolean {
        return this.registry.has(name);
    }

    /** Chạy resolver theo tên. Tên không tồn tại hoặc lỗi -> undefined. */
    run(name: string, value: any): Observable<any> {
        const fn = this.registry.get(name);
        if (!fn) {
            console.warn(`[DeepLink] Resolver "${name}" chưa được đăng ký.`);
            return of(undefined);
        }
        try {
            return fn(value).pipe(catchError(() => of(undefined)));
        } catch {
            return of(undefined);
        }
    }

    // -----------------------------------------------------------------------

    private lookupProjectIdByCode(code: any): Observable<number | undefined> {
        const target = String(code ?? '').trim().toLowerCase();
        if (!target) return of(undefined);

        return this.projectList().pipe(
            map(list => {
                const found = list.find(
                    p => String(p?.ProjectCode ?? '').trim().toLowerCase() === target
                );
                const id = Number(found?.ID);
                return Number.isFinite(id) && id > 0 ? id : undefined;
            })
        );
    }

    /** Danh sách dự án, cache lại trong phiên để nhiều deep-link không gọi lại API. */
    private projectList(): Observable<any[]> {
        if (!this.projects$) {
            this.projects$ = this.projectHistoryProblemService.getProjects().pipe(
                map((res: any) => (res?.status === 1 && Array.isArray(res.data) ? res.data : [])),
                catchError(() => of([] as any[])),
                shareReplay({ bufferSize: 1, refCount: false })
            );
        }
        return this.projects$;
    }
}
