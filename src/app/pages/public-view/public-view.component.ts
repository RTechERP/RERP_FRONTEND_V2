import { CommonModule } from '@angular/common';
import { Component, Injector, OnInit, Type } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzAlertModule } from 'ng-zorro-antd/alert';

import { PublicLinkService } from '../../services/deep-link/public-link.service';
import { findDeepLinkPage } from '../../services/deep-link/deep-link.config';
import { ProjectHistoryProblemNewComponent } from '../project/project-history-problem-new/project-history-problem-new.component';
import { ProjectGateStepMasterPlanComponent } from '../project/project-gate/project-gate-step/project-gate-step-master-plan/project-gate-step-master-plan.component';

/**
 * Bản đồ route -> component được phép xem công khai.
 *
 * Phải khớp với danh sách trong switch của PublicLinkController.GetData bên
 * backend. Mở thêm trang nào thì sửa cả hai nơi.
 */
const PUBLIC_VIEW_COMPONENTS: Record<string, Type<any>> = {
  'issuelog': ProjectHistoryProblemNewComponent,
  'issue-log': ProjectHistoryProblemNewComponent,
  'project-history-problem-new': ProjectHistoryProblemNewComponent,
  'masterplan': ProjectGateStepMasterPlanComponent,
  'master-plan': ProjectGateStepMasterPlanComponent,
  'project-gate-step-master-plan': ProjectGateStepMasterPlanComponent,
};

/**
 * Vỏ hiển thị cho link công khai: `/view?t=<token>`.
 *
 * Nằm NGOÀI MainLayoutComponent và không qua authGuard, vì người xem chưa đăng
 * nhập nên không có menu, không có tab, và mọi API cần token đều sẽ 401.
 *
 * Vỏ này tự gọi API ẩn danh rồi truyền dữ liệu xuống trang con qua `tabData`,
 * nhờ vậy trang con không cần biết gì về cơ chế link công khai — nó chỉ cần
 * dùng `tabData.publicData` nếu có thay vì tự gọi API.
 */
@Component({
  selector: 'app-public-view',
  standalone: true,
  imports: [CommonModule, NzSpinModule, NzResultModule, NzAlertModule],
  template: `
    <div class="public-view">
      <div *ngIf="loading" class="public-view__center">
        <nz-spin nzSize="large" nzTip="Đang mở dữ liệu..."></nz-spin>
      </div>

      <nz-result
        *ngIf="!loading && errorMessage"
        nzStatus="warning"
        [nzTitle]="errorMessage"
        nzSubTitle="Liên hệ người gửi link để được cấp lại đường dẫn mới.">
      </nz-result>

      <ng-container *ngIf="!loading && !errorMessage && comp">
        <nz-alert
          nzType="info"
          nzMessage="Chế độ chỉ xem"
          nzDescription="Bạn đang xem qua link chia sẻ. Các thao tác thêm, sửa, xoá, duyệt đã bị ẩn."
          nzShowIcon>
        </nz-alert>

        <div class="public-view__body">
          <ng-container *ngComponentOutlet="comp; injector: childInjector"></ng-container>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .public-view { height: 100%; display: flex; flex-direction: column; }
    .public-view__center { display: flex; justify-content: center; align-items: center; height: 60vh; }
    .public-view__body { flex: 1; min-height: 0; overflow: auto; }
  `],
})
export class PublicViewComponent implements OnInit {
  loading = true;
  errorMessage = '';
  comp: Type<any> | null = null;
  // Phải là undefined chứ không phải null: ngComponentOutletInjector
  // nhận `Injector | undefined`.
  childInjector?: Injector;

  constructor(
    private route: ActivatedRoute,
    private publicLink: PublicLinkService,
    private injector: Injector,
    private titleService: Title
  ) { }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('t') ?? '';

    if (!token) {
      this.loading = false;
      this.errorMessage = 'Link không hợp lệ.';
      return;
    }

    this.publicLink.getData(token).subscribe({
      next: res => {
        this.loading = false;

        if (res?.status !== 1 || !res?.data) {
          this.errorMessage = res?.message || 'Link không hợp lệ hoặc đã hết hạn.';
          return;
        }

        const data = res.data;
        const comp = PUBLIC_VIEW_COMPONENTS[String(data.route ?? '').toLowerCase()];

        if (!comp) {
          this.errorMessage = 'Trang này không hỗ trợ xem công khai.';
          return;
        }

        // Ép kiểu số cho các filter vì backend trả về dạng chuỗi.
        const filters: Record<string, any> = {};
        for (const [key, value] of Object.entries(data.filters ?? {})) {
          const n = Number(value);
          filters[key] = value !== '' && Number.isFinite(n) ? n : value;
        }

        const firstItem = data.timelineData?.[0] || data.dtMaster?.[0] || data.dtDetail?.[0];
        if (firstItem) {
          if (!filters['projectCode'] && firstItem.ProjectCode) {
            filters['projectCode'] = firstItem.ProjectCode;
          }
          if (!filters['projectName'] && firstItem.ProjectName) {
            filters['projectName'] = firstItem.ProjectName;
          }
          if (!filters['projectStatusName'] && firstItem.ProjectStatusName) {
            filters['projectStatusName'] = firstItem.ProjectStatusName;
          }
        }

        const page = findDeepLinkPage(data.route);
        if (page) {
          const title = typeof page.title === 'function' ? page.title(filters) : page.title;
          if (title) {
            this.titleService.setTitle(title);
          }
        }

        this.childInjector = Injector.create({
          providers: [{
            provide: 'tabData',
            useValue: {
              ...filters,
              readOnly: true,
              publicData: data,
              // Trang con cần token để tự gọi API chi tiết khi click 1 dòng.
              publicToken: token,
            },
          }],
          parent: this.injector,
        });

        this.comp = comp;
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Không mở được link chia sẻ.';
      },
    });
  }
}
