import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as tus from 'tus-js-client';

export interface UploadState {
    lessonId: number;
    fileName: string;
    pathServer: string;
    progress: number;
    speed: string;
    status: 'uploading' | 'completed' | 'error';
    url: string;
}

/**
 * Singleton service để quản lý video uploads.
 * Tự render toast progress UI ở góc trên phải bằng DOM thuần.
 */
@Injectable({
    providedIn: 'root',
})
export class VideoUploadStateService {
    private activeUploads = new Map<
        string, // uploadKey = `${lessonId}_${timestamp}`
        {
            upload: tus.Upload;
            state$: BehaviorSubject<UploadState>;
        }
    >();

    private toastContainer: HTMLElement | null = null;

    constructor() {
        this.injectStyles();
    }

    // ─── Toast DOM helpers ───────────────────────────────────────────────────

    /** Inject CSS một lần vào <head> */
    private injectStyles(): void {
        if (document.getElementById('vut-styles')) return;
        const s = document.createElement('style');
        s.id = 'vut-styles';
        s.textContent = `
            .vut-wrap {
                position: fixed; top: 64px; right: 16px;
                z-index: 999; width: 320px;
                display: flex; flex-direction: column; gap: 8px;
                pointer-events: none;
            }
            .vut-card {
                pointer-events: all;
                background: #ffffff; color: #1a1a2e;
                border-radius: 8px; padding: 11px 13px;
                box-shadow: 0 2px 12px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06);
                border-left: 3px solid #1677ff;
                animation: vut-in .22s ease-out;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            .vut-card.done  { border-left-color: #52c41a; }
            .vut-card.fail  { border-left-color: #ff4d4f; }
            .vut-head { display:flex; align-items:center; gap:6px; margin-bottom:7px; }
            .vut-name {
                font-size:12px; font-weight:600; color:#1f2937;
                white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;
            }
            .vut-row { display:flex; align-items:center; gap:7px; margin-bottom:5px; }
            .vut-track {
                flex:1; height:6px;
                background:#e8edf3; border-radius:99px; overflow:hidden;
            }
            .vut-bar {
                height:100%; border-radius:99px; background:#1677ff; width:0%;
                transition: width .35s ease, background-color .3s ease;
            }
            .vut-bar.done { background:#52c41a; }
            .vut-bar.fail { background:#ff4d4f; }
            .vut-pct {
                font-size:12px; font-weight:700; color:#374151;
                min-width:30px; text-align:right; font-variant-numeric:tabular-nums;
            }
            .vut-speed { font-size:11px; color:#6b7280; font-variant-numeric:tabular-nums; }
            .vut-ok  { font-size:11px; font-weight:600; color:#16a34a; }
            .vut-err { font-size:11px; font-weight:600; color:#dc2626; }
            @keyframes vut-in  { from{opacity:0;transform:translateX(22px)} to{opacity:1;transform:translateX(0)} }
            @keyframes vut-out { from{opacity:1;max-height:120px} to{opacity:0;max-height:0;padding:0;margin:0} }
        `;
        document.head.appendChild(s);
    }

    private ensureContainer(): HTMLElement {
        if (!this.toastContainer || !document.body.contains(this.toastContainer)) {
            const el = document.createElement('div');
            el.className = 'vut-wrap';
            document.body.appendChild(el);
            this.toastContainer = el;
        }
        return this.toastContainer;
    }

    private createCard(key: string, fileName: string): void {
        const wrap = this.ensureContainer();
        const card = document.createElement('div');
        card.className = 'vut-card';
        card.id = `vut-${key}`;
        card.innerHTML = `
            <div class="vut-head">
                <span>🎬</span>
                <span class="vut-name" title="${this.esc(fileName)}">${this.esc(fileName)}</span>
            </div>
            <div class="vut-row">
                <div class="vut-track"><div class="vut-bar" id="vut-bar-${key}"></div></div>
                <span class="vut-pct" id="vut-pct-${key}">0%</span>
            </div>
            <div id="vut-bot-${key}">
                <span class="vut-speed">⬆&nbsp;0 KB/s</span>
            </div>`;
        wrap.appendChild(card);
    }

    private refreshCard(key: string, state: UploadState): void {
        const card = document.getElementById(`vut-${key}`);
        const bar = document.getElementById(`vut-bar-${key}`) as HTMLElement | null;
        const pct = document.getElementById(`vut-pct-${key}`) as HTMLElement | null;
        const bot = document.getElementById(`vut-bot-${key}`) as HTMLElement | null;
        if (!card) return;

        if (bar) bar.style.width = `${state.progress}%`;
        if (pct) pct.textContent = `${state.progress}%`;

        if (state.status === 'uploading') {
            if (bot) bot.innerHTML = `<span class="vut-speed">⬆&nbsp;${this.esc(state.speed)}</span>`;
        } else if (state.status === 'completed') {
            card.className = 'vut-card done';
            if (bar) bar.className = 'vut-bar done';
            if (bot) bot.innerHTML = `<span class="vut-ok">✓ Upload hoàn thành</span>`;
        } else {
            card.className = 'vut-card fail';
            if (bar) bar.className = 'vut-bar fail';
            if (bot) bot.innerHTML = `<span class="vut-err">✗ Upload thất bại</span>`;
        }
    }

    private removeCard(key: string, delayMs: number): void {
        setTimeout(() => {
            const card = document.getElementById(`vut-${key}`);
            if (!card) return;
            card.style.animation = 'vut-out .35s ease-in forwards';
            setTimeout(() => card.remove(), 380);
        }, delayMs);
    }

    private esc(str: string): string {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Bắt đầu upload video cho lesson.
     * Toast tự hiển thị ở góc trên phải với tên file, progress bar, %, tốc độ.
     */
    startUpload(
        lessonId: number,
        file: File,
        endpoint: string,
        customFileName?: string,
        pathServer?: string,
    ): Observable<UploadState> {
        const uploadFileName = customFileName || file.name;
        const uploadKey = `${lessonId}_${Date.now()}`;

        const initialState: UploadState = {
            lessonId,
            fileName: uploadFileName,
            pathServer: pathServer || '',
            progress: 0,
            speed: '0 KB/s',
            status: 'uploading',
            url: '',
        };

        const state$ = new BehaviorSubject<UploadState>(initialState);
        let lastUploadedBytes = 0;
        let lastTimestamp = Date.now();

        // Hiển thị toast ngay khi bắt đầu
        this.createCard(uploadKey, uploadFileName);

        const tusUpload = new tus.Upload(file, {
            endpoint,
            retryDelays: [0, 1000, 3000, 5000, 10000],
            storeFingerprintForResuming: true,
            removeFingerprintOnSuccess: true,
            chunkSize: 5 * 1024 * 1024,
            metadata: {
                filename: uploadFileName,
                pathServer: pathServer || '',
                filetype: file.type,
                filesize: file.size.toString(),
                lessonId: lessonId.toString(),
            },

            onError: (error: any) => {
                console.error('Upload failed:', error);
                const next: UploadState = { ...state$.value, progress: 0, status: 'error' };
                state$.next(next);
                this.refreshCard(uploadKey, next);
                this.removeCard(uploadKey, 4000);
                setTimeout(() => {
                    this.activeUploads.delete(uploadKey);
                    state$.complete();
                }, 5000);
            },

            onProgress: (bytesUploaded: any, bytesTotal: any) => {
                const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
                const now = Date.now();
                const timeDiff = (now - lastTimestamp) / 1000;
                let speed = state$.value.speed;

                if (timeDiff > 0) {
                    speed = this.formatSpeed((bytesUploaded - lastUploadedBytes) / timeDiff);
                    lastUploadedBytes = bytesUploaded;
                    lastTimestamp = now;
                }

                const next: UploadState = { ...state$.value, progress: percentage, speed };
                state$.next(next);
                this.refreshCard(uploadKey, next);
            },

            onSuccess: () => {
                console.log('Upload completed successfully');
                const next: UploadState = {
                    ...state$.value,
                    progress: 100,
                    status: 'completed',
                    url: tusUpload.url || '',
                };
                state$.next(next);
                this.refreshCard(uploadKey, next);
                this.removeCard(uploadKey, 3000);
                setTimeout(() => {
                    this.activeUploads.delete(uploadKey);
                    state$.complete();
                }, 4000);
            },
        });

        this.activeUploads.set(uploadKey, { upload: tusUpload, state$ });
        tusUpload.start();

        return state$.asObservable();
    }

    /** Lấy upload state cho lesson (lấy cái đầu tiên đang chạy) */
    getUploadState(lessonId: number): Observable<UploadState> | null {
        for (const [_, entry] of this.activeUploads) {
            if (entry.state$.value.lessonId === lessonId) {
                return entry.state$.asObservable();
            }
        }
        return null;
    }

    /** Lấy URL của upload (sau khi TUS tạo) */
    getUploadUrl(lessonId: number): string | null {
        for (const [_, entry] of this.activeUploads) {
            if (entry.state$.value.lessonId === lessonId) {
                return entry.upload.url || null;
            }
        }
        return null;
    }

    /** Kiểm tra có upload đang chạy cho lesson không */
    hasActiveUpload(lessonId: number): boolean {
        for (const [_, entry] of this.activeUploads) {
            if (entry.state$.value.lessonId === lessonId &&
                entry.state$.value.status === 'uploading') {
                return true;
            }
        }
        return false;
    }

    /** Cancel upload */
    cancelUpload(lessonId: number): void {
        for (const [key, entry] of this.activeUploads) {
            if (entry.state$.value.lessonId === lessonId) {
                entry.upload.abort();
                this.activeUploads.delete(key);
                document.getElementById(`vut-${key}`)?.remove();
                entry.state$.complete();
                break;
            }
        }
    }

    /** Kiểm tra có bất kỳ upload nào đang chạy không */
    hasAnyActiveUpload(): boolean {
        for (const [_, entry] of this.activeUploads) {
            if (entry.state$.value.status === 'uploading') return true;
        }
        return false;
    }

    private formatSpeed(bytesPerSecond: number): string {
        if (bytesPerSecond < 1024) {
            return `${bytesPerSecond.toFixed(0)} B/s`;
        } else if (bytesPerSecond < 1024 * 1024) {
            return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
        } else {
            return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
        }
    }
}
