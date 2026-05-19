import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ProjectWorkerService } from '../../project/project-department-summary/project-department-summary-form/project-woker/project-worker-service/project-worker.service';

@Component({
  selector: 'app-project-task-poject-worker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzSelectModule,
    NzInputModule,
    NzButtonModule,
    NzSpinModule,
    NzIconModule,
  ],
  templateUrl: './project-task-poject-worker.component.html',
  styleUrl: './project-task-poject-worker.component.css',
})
export class ProjectTaskPojectWorkerComponent implements OnInit {
  projects: any[] = [];
  solutions: any[] = [];
  solutionVersions: any[] = [];

  selectedProjectId = 0;
  selectedSolutionId = 0;
  selectedVersionId = 0;
  isApprovedTBP = -1;
  isDeleted = 0;
  keyword = '';

  isLoading = false;
  dataProjectWorker: any[] = [];

  // Totals
  totalWorkforce = 0;
  totalPrice = 0;

  constructor(
    private projectWorkerService: ProjectWorkerService,
    private notification: NzNotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  // ===== LOAD DROPDOWN =====

  loadProjects(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.projectWorkerService.getAllProjectTask().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.projects = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không tải được danh sách project');
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Lỗi', 'Không tải được danh sách project');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onProjectChange(projectId: number | null): void {
    this.selectedProjectId = projectId || 0;
    this.selectedSolutionId = 0;
    this.selectedVersionId = 0;
    this.solutions = [];
    this.solutionVersions = [];
    this.clearWorkerTable();

    if (!this.selectedProjectId) return;

    this.isLoading = true;
    this.projectWorkerService.getSolution(this.selectedProjectId).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.solutions = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không tải được danh sách giải pháp');
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Lỗi', 'Không tải được danh sách giải pháp');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onSolutionChange(solutionId: number | null): void {
    this.selectedSolutionId = solutionId || 0;
    this.selectedVersionId = 0;
    this.solutionVersions = [];
    this.clearWorkerTable();

    if (!this.selectedSolutionId) return;

    this.isLoading = true;
    this.projectWorkerService.getSolutionVersion(this.selectedSolutionId).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.solutionVersions = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không tải được phiên bản giải pháp');
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Lỗi', 'Không tải được danh sách phiên bản');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onVersionChange(versionId: number | null): void {
    this.selectedVersionId = versionId || 0;
    this.clearWorkerTable();
    if (this.selectedVersionId) {
      this.previewProjectWorker();
    }
  }

  // ===== PREVIEW =====

  previewProjectWorker(): void {
    if (!this.validateFilterInput()) return;

    this.isLoading = true;
    this.cdr.detectChanges();
    this.projectWorkerService.getProjectWorker(this.buildPayload()).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const rawData = response.data || [];
          this.dataProjectWorker = rawData
            .filter((item: any) => Number(item.AmountPeople || 0) > 0 && Number(item.NumberOfDay || 0) > 0)
            .map((item: any) => ({
              ...item,
              IsApprovedTBPText: item.IsApprovedTBP ? 'Đã duyệt' : 'Chưa duyệt',
              _hasChildren: Number(item.CountChild || 0) > 0,
            }));
          this.calculateTotals();
        } else {
          this.notification.error('Lỗi', response.message || 'Không tải được dữ liệu nhân công');
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Lỗi', 'Không tải được dữ liệu nhân công');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ===== CREATE TASK =====

  createProjectTaskFromWorker(): void {
    if (!this.validateFilterInput()) return;

    this.isLoading = true;
    this.projectWorkerService.createProjectWorkerTask(this.buildPayload()).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Tạo công việc thành công');
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tạo công việc');
        }
        this.isLoading = false;
      },
      error: () => {
        this.notification.error('Lỗi', 'Không thể tạo công việc');
        this.isLoading = false;
      },
    });
  }

  // ===== HELPERS =====

  private buildPayload(): any {
    return {
      projectID: this.selectedProjectId || 0,
      projectWorkerTypeID: 0,
      IsApprovedTBP: this.isApprovedTBP,
      IsDeleted: this.isDeleted,
      KeyWord: (this.keyword || '').trim(),
      versionID: this.selectedVersionId || 0,
    };
  }

  private validateFilterInput(): boolean {
    if (!this.selectedProjectId) {
      this.notification.warning('Thông báo', 'Vui lòng chọn Project');
      return false;
    }
    if (!this.selectedSolutionId) {
      this.notification.warning('Thông báo', 'Vui lòng chọn Giải pháp');
      return false;
    }
    if (!this.selectedVersionId) {
      this.notification.warning('Thông báo', 'Vui lòng chọn Phiên bản giải pháp');
      return false;
    }
    return true;
  }

  private clearWorkerTable(): void {
    this.dataProjectWorker = [];
    this.totalWorkforce = 0;
    this.totalPrice = 0;
  }

  private calculateTotals(): void {
    this.totalWorkforce = this.dataProjectWorker.reduce(
      (sum, row) => sum + (Number(row.TotalWorkforce) || 0), 0
    );
    this.totalPrice = this.dataProjectWorker.reduce(
      (sum, row) => sum + (Number(row.TotalPrice) || 0), 0
    );
  }

  formatMoney(value: any): string {
    if (value == null || value === '') return '';
    return Number(value).toLocaleString('vi-VN');
  }
}
