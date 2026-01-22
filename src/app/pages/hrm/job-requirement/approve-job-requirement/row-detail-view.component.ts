import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AngularSlickgridModule,
  AngularGridInstance,
  Column,
  GridOption,
  Formatters
} from 'angular-slickgrid';
import { JobRequirementService } from '../job-requirement-service/job-requirement.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-row-detail-view',
  standalone: true,
  imports: [CommonModule, AngularSlickgridModule],
  template: `
    <div class="row-detail-container">
      <div class="loading-overlay" *ngIf="isLoading">
        <i class="fa fa-spinner fa-spin fa-2x text-primary"></i>
      </div>

      <!-- Custom Tab Header like View POKH -->
      <div class="nested-tab-header">
        <button class="nested-tab-btn" [class.active]="activeTab === 'detail'" (click)="selectTab('detail')">
          <i class="fa-solid fa-circle-info me-2"></i>Chi tiết
        </button>
        <button class="nested-tab-btn" [class.active]="activeTab === 'file'" (click)="selectTab('file')">
          <i class="fa-solid fa-paperclip me-2"></i>File đính kèm
        </button>
        <button class="nested-tab-btn" [class.active]="activeTab === 'approve'" (click)="selectTab('approve')">
          <i class="fa-solid fa-clock-rotate-left me-2"></i>Lịch sử phê duyệt
        </button>
      </div>

      <!-- Tab Content with SlickGrid -->
      <div class="nested-tab-content">
        <!-- Tab 1: Nội dung chi tiết -->
        <div [style.display]="activeTab === 'detail' ? 'block' : 'none'" class="tab-pane">
          <angular-slickgrid [gridId]="'detailGrid_' + uniqueId" 
            [columns]="columnDefinitionsDetail" 
            [options]="gridOptionsDetail" 
            [dataset]="datasetDetail"
            (onAngularGridCreated)="angularGridDetailReady($event.detail)">
          </angular-slickgrid>
        </div>

        <!-- Tab 2: File đính kèm -->
        <div [style.display]="activeTab === 'file' ? 'block' : 'none'" class="tab-pane">
          <angular-slickgrid [gridId]="'fileGrid_' + uniqueId" 
            [columns]="columnDefinitionsFile" 
            [options]="gridOptionsFile" 
            [dataset]="datasetFile"
            (onAngularGridCreated)="angularGridFileReady($event.detail)">
          </angular-slickgrid>
        </div>

        <!-- Tab 3: Lịch sử phê duyệt -->
        <div [style.display]="activeTab === 'approve' ? 'block' : 'none'" class="tab-pane">
          <angular-slickgrid [gridId]="'approveGrid_' + uniqueId" 
            [columns]="columnDefinitionsApproved" 
            [options]="gridOptionsApproved" 
            [dataset]="datasetApproved"
            (onAngularGridCreated)="angularGridApprovedReady($event.detail)">
          </angular-slickgrid>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .row-detail-container {
      background: #ffffff;
      padding: 8px;
      height: 280px;
      border-left: 4px solid #1890ff;
      position: relative;
    }

    .loading-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255,255,255,0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10;
    }

    /* Styles matching View POKH */
    .nested-tab-header {
      display: inline-flex;
      background: #e9ecef;
      padding: 3px;
      border-radius: 6px;
      gap: 3px;
      margin-bottom: 8px;
    }

    .nested-tab-btn {
      padding: 4px 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      color: #6c757d;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
    }

    .nested-tab-btn:hover {
      background: rgba(255, 255, 255, 0.6);
      color: #495057;
    }

    .nested-tab-btn.active {
      background: #ffffff;
      color: #1890ff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      font-weight: 600;
    }

    .nested-tab-content {
      height: calc(100% - 40px);
    }

    .tab-pane {
      height: 100%;
    }
  `]
})
export class RowDetailViewComponent implements OnInit {
  @Input() model: any;

  // Unique ID cho mỗi instance để tránh conflict gridId khi mở nhiều row detail
  uniqueId: string = '';

  angularGridDetail!: AngularGridInstance;
  angularGridFile!: AngularGridInstance;
  angularGridApproved!: AngularGridInstance;

  columnDefinitionsDetail: Column[] = [];
  gridOptionsDetail: GridOption = {};
  datasetDetail: any[] = [];

  columnDefinitionsFile: Column[] = [];
  gridOptionsFile: GridOption = {};
  datasetFile: any[] = [];

  columnDefinitionsApproved: Column[] = [];
  gridOptionsApproved: GridOption = {};
  datasetApproved: any[] = [];

  isLoading = false;
  activeTab: 'detail' | 'file' | 'approve' = 'detail';

  constructor(private jobService: JobRequirementService) { }

  ngOnInit() {
    // Tạo uniqueId để tránh conflict gridId khi mở nhiều row detail
    this.uniqueId = this.model?.ID ? `${this.model.ID}_${Date.now()}` : `${Date.now()}`;

    this.initGrids();
    if (this.model && this.model.ID) {
      this.getData(this.model.ID);
    }
  }

  initGrids() {
    const commonOptions: GridOption = {
      enableAutoResize: true,
      autoResize: {
        container: '.nested-tab-content',
        calculateAvailableSizeBy: 'container'
      },
      enableCellNavigation: true,
      enableSorting: true,
      rowHeight: 30,
      headerRowHeight: 30,
      forceFitColumns: true,
      gridWidth: '100%',
      gridHeight: 200
    };

    // Tab 1: Chi tiết
    this.columnDefinitionsDetail = [
      { id: 'STT', name: 'STT', field: 'STT', width: 35, maxWidth: 35, cssClass: 'text-center' },
      { id: 'Category', name: 'Đề mục', field: 'Category', width: 150, maxWidth: 200, sortable: true },
      { id: 'Description', name: 'Diễn giải', field: 'Description', width: 250, minWidth: 150, sortable: true },
      { id: 'Target', name: 'Mục tiêu cần đạt', field: 'Target', width: 200, minWidth: 150, sortable: true },
      { id: 'Note', name: 'Ghi chú', field: 'Note', width: 150, minWidth: 100, sortable: true }
    ];
    this.gridOptionsDetail = { ...commonOptions };

    // Tab 2: File đính kèm
    this.columnDefinitionsFile = [
      { id: 'STT', name: 'STT', field: 'STT', width: 35, maxWidth: 35, cssClass: 'text-center' },
      { id: 'FileName', name: 'File đính kèm', field: 'FileName', width: 400, minWidth: 200, sortable: true },
      {
        id: 'action', name: 'Thao tác', field: 'ID', width: 80, maxWidth: 80, cssClass: 'text-center',
        formatter: () => `<span class="text-primary me-2 cursor-pointer"><i class="fa fa-eye"></i></span><span class="text-success cursor-pointer"><i class="fa fa-download"></i></span>`,
        onCellClick: (e, args) => {
          const item = args.dataContext;
          const target = e.target as HTMLElement;
          if (target.classList.contains('fa-eye') || target.parentElement?.classList.contains('text-primary')) {
            this.viewFile(item);
          } else if (target.classList.contains('fa-download') || target.parentElement?.classList.contains('text-success')) {
            this.downloadFile(item);
          }
        }
      }
    ];
    this.gridOptionsFile = { ...commonOptions };

    // Tab 3: Phê duyệt
    this.columnDefinitionsApproved = [
      { id: 'STT', name: 'STT', field: 'STT', width: 35, maxWidth: 35, cssClass: 'text-center' },
      { id: 'StepName', name: 'Tên bước', field: 'StepName', width: 150, maxWidth: 200, sortable: true },
      { id: 'DateApproved', name: 'Ngày duyệt', field: 'DateApproved', width: 120, maxWidth: 150, sortable: true, formatter: Formatters.dateTimeIsoAmPm },
      { id: 'IsApprovedText', name: 'Trạng thái', field: 'IsApprovedText', width: 120, maxWidth: 150, sortable: true },
      { id: 'EmployeeName', name: 'Người thực hiện', field: 'EmployeeName', width: 150, maxWidth: 200, sortable: true },
      { id: 'EmployeeActualName', name: 'Người duyệt', field: 'EmployeeActualName', width: 150, maxWidth: 200, sortable: true },
      { id: 'ReasonCancel', name: 'Lý do hủy duyệt', field: 'ReasonCancel', width: 200, minWidth: 150, sortable: true }
    ];
    this.gridOptionsApproved = { ...commonOptions };
  }

  getData(id: number) {
    this.isLoading = true;
    this.jobService.getJobrequirementbyID(id).subscribe({
      next: (res: any) => {
        const data = res.data || {};
        this.datasetDetail = (data.details || []).map((x: any, i: number) => ({ ...x, id: x.ID || i, STT: i + 1 }));
        this.datasetFile = (data.files || []).map((x: any, i: number) => ({ ...x, id: x.ID || i, STT: i + 1 }));
        this.datasetApproved = (data.approves || []).map((x: any, i: number) => ({ ...x, id: x.ID || i, STT: i + 1 }));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  selectTab(tab: 'detail' | 'file' | 'approve') {
    this.activeTab = tab;
    // Trigger resize for the grid in the new tab after a short delay
    setTimeout(() => {
      if (tab === 'detail' && this.angularGridDetail) this.angularGridDetail.resizerService.resizeGrid();
      if (tab === 'file' && this.angularGridFile) this.angularGridFile.resizerService.resizeGrid();
      if (tab === 'approve' && this.angularGridApproved) this.angularGridApproved.resizerService.resizeGrid();
    }, 50);
  }

  angularGridDetailReady(angularGrid: AngularGridInstance) { this.angularGridDetail = angularGrid; }
  angularGridFileReady(angularGrid: AngularGridInstance) { this.angularGridFile = angularGrid; }
  angularGridApprovedReady(angularGrid: AngularGridInstance) {
    this.angularGridApproved = angularGrid;

    // Cấu hình bôi màu dòng dựa trên trạng thái duyệt
    if (this.angularGridApproved?.dataView) {
      this.angularGridApproved.dataView.getItemMetadata = (row: number) => {
        const item = this.angularGridApproved.dataView.getItem(row);
        if (item) {
          // IsApproved: 1 - Đã duyệt, 2 - Không duyệt/Hủy duyệt
          if (item.IsApproved === 1 || item.IsApproved === '1') {
            return { cssClasses: 'row-approved' };
          } else if (item.IsApproved === 2 || item.IsApproved === '2') {
            return { cssClasses: 'row-cancelled' };
          }
        }
        return null;
      };
    }
  }

  viewFile(file: any) {
    const path = file.FilePath || '';
    if (path) {
      const url = `${environment.host}api/share/${path.replace(/\\/g, '/')}`;
      window.open(url, '_blank');
    }
  }

  downloadFile(file: any) {
    this.jobService.downloadFile(file.FilePath).subscribe((blob: any) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.FileName;
      link.click();
    });
  }
}
