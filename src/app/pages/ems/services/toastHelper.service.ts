import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ToastrService, ActiveToast, IndividualConfig } from 'ngx-toastr';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

@Injectable({ providedIn: 'root' })
export class ToastHelper {
  constructor(private toastr: ToastrService, private sanitizer: DomSanitizer) {}

  /**
   * Shows a custom toast.
   *
   * @param type          'success' | 'error' | 'info' | 'warning'
   * @param message       The main message in the toast
   * @param btn1Text      Label for button 1
   * @param btn1Callback  Callback for button 1
   * @param btn2Text      Label for button 2
   * @param btn2Callback  Callback for button 2
   * @param configOverride Optional extra Toastr config
   */
  showToast(
    type: ToastType,
    message: string,
    btn1Text: string,
    btn1Callback: () => void,
    btn2Text: string,
    btn2Callback: () => void,
    configOverride: Partial<IndividualConfig> = {}
  ) {
    const html = `
        <div class="d-flex align-items-center">
          <div class="flex-grow-1 pe-2">${message}</div>
          <div class="d-flex gap-1">
            <a
              class="btn btn-sm btn-success rounded-circle btn-confirm"
              style="width: 28px; height: 28px; line-height: 1;"
              title="Confirm"
            >${btn1Text}</a>
            <a
              class="btn btn-sm btn-danger rounded-circle btn-cancel"
              style="width: 28px; height: 28px; line-height: 1;"
              title="Cancel"
            >${btn2Text}</a>
          </div>
        </div>`;
    const safeHtml = this.sanitizer.bypassSecurityTrustHtml(html);
    const opts: Partial<IndividualConfig> = {
      enableHtml: true,
      timeOut: 0,
      extendedTimeOut: 0,
      tapToDismiss: false,
      closeButton: false,
      ...configOverride,
    };

    const toast: ActiveToast<any> = (this.toastr as any)[type](
      safeHtml,
      'Thông báo',
      opts
    );

    setTimeout(() => {
      const container = document.querySelector('.toast-container');
      const el = container?.lastElementChild as HTMLElement;
      if (!el) {
        return;
      }

      const btn1 = el.querySelector<HTMLButtonElement>('.btn-confirm');
      const btn2 = el.querySelector<HTMLButtonElement>('.btn-cancel');

      btn1?.addEventListener('click', () => {
        try {
          btn1Callback();
        } catch {}
        toast.toastRef.close();
      });
      btn2?.addEventListener('click', () => {
        try {
          btn2Callback();
        } catch {}
        toast.toastRef.close();
      });
    }, 0);
  }
}
