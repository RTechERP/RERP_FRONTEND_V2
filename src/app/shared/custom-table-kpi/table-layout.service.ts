import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { UserService } from '../../services/user.service';
import { environment } from '../../../environments/environment';

export interface TableLayoutState {
  hiddenFields: string[];
  columnOrder: string[];   // field names in order (all columns, including hidden)
  widths: { [field: string]: string };
}

interface BackendLayoutPayload {
  UserID: number;
  LoginName: string;
  TableId: string;
  LayoutJson: string;
}

@Injectable({ providedIn: 'root' })
export class TableLayoutService {
  private userService = inject(UserService);
  private http = inject(HttpClient);

  private readonly apiUrl = environment.host + 'api/UserTableLayout/';

  private getUserId(): string {
    return this.userService.getUser()?.LoginName ?? 'anonymous';
  }

  private buildKey(tableId: string): string {
    return `tbl_layout_${this.getUserId()}_${tableId}`;
  }

  // ── localStorage ──────────────────────────────────────────────────────────

  save(tableId: string, state: TableLayoutState): void {
    if (!tableId) return;
    try {
      localStorage.setItem(this.buildKey(tableId), JSON.stringify(state));
    } catch {}
  }

  load(tableId: string): TableLayoutState | null {
    if (!tableId) return null;
    try {
      const raw = localStorage.getItem(this.buildKey(tableId));
      return raw ? (JSON.parse(raw) as TableLayoutState) : null;
    } catch {
      return null;
    }
  }

  reset(tableId: string): void {
    if (!tableId) return;
    localStorage.removeItem(this.buildKey(tableId));
  }

  hasLayout(tableId: string): boolean {
    if (!tableId) return false;
    return localStorage.getItem(this.buildKey(tableId)) !== null;
  }

  // ── Backend sync ───────────────────────────────────────────────────────────

  /**
   * Lưu layout hiện tại của bảng lên BE.
   * Endpoint: POST api/UserTableLayout/save
   * Body: { UserID, LoginName, TableId, LayoutJson }
   */
  saveToBackend(tableId: string, state: TableLayoutState): Observable<any> {
    if (!tableId) return of(null);
    const user = this.userService.getUser();
    const payload: BackendLayoutPayload = {
      UserID: user?.ID ?? 0,
      LoginName: user?.LoginName ?? 'anonymous',
      TableId: tableId,
      LayoutJson: JSON.stringify(state),
    };
    return this.http.post(this.apiUrl + 'save', payload).pipe(
      tap(() => {
        // Sau khi lưu BE thành công, đồng bộ lại localStorage
        this.save(tableId, state);
      }),
      catchError(err => {
        console.error('[TableLayoutService] saveToBackend error:', err);
        return of({ success: false, error: err });
      })
    );
  }

  /**
   * Tải layout từ BE về (dùng khi muốn đồng bộ từ server).
   * Endpoint: GET api/UserTableLayout/get?loginName=&tableId=
   */
  loadFromBackend(tableId: string): Observable<TableLayoutState | null> {
    if (!tableId) return of(null);
    const loginName = this.getUserId();
    return this.http
      .get<{ data: TableLayoutState | null }>(`${this.apiUrl}get?loginName=${loginName}&tableId=${tableId}`)
      .pipe(
        tap(res => {
          if (res?.data) this.save(tableId, res.data);
        }),
        catchError(() => of(null))
      ) as Observable<TableLayoutState | null>;
  }
}
