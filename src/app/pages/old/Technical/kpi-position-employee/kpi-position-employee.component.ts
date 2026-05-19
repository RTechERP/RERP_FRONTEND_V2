import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, Optional, Inject, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Menubar } from 'primeng/menubar';
import { TableModule } from 'primeng/table';
import { TreeTableModule } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';
import { KpiPositionEmployeeService, DeleteEmployeeRequest } from './kpi-position-employee-service/kpi-position-employee.service';
import { KpiPositionDetailComponent } from './kpi-position-detail/kpi-position-detail.component';
import { KpiPositionEmployeeDetailComponent } from './kpi-position-employee-detail/kpi-position-employee-detail.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';

type PrimeColumnType = 'text' | 'number' | 'boolean';

interface PrimeColumn {
  id: string;
  name: string;
  field: string;
  width?: number;
  minWidth?: number;
  hidden?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  type?: PrimeColumnType;
  align?: 'left' | 'center' | 'right';
  cssClass?: string;
}

@Component({
  selector: 'app-kpi-position-employee',
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzButtonModule,
    NzSplitterModule,
    NzModalModule,
    NzFormModule,
    TableModule,
    TreeTableModule,
    Menubar,
  ],
  templateUrl: './kpi-position-employee.component.html',
  styleUrl: './kpi-position-employee.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class KpiPositionEmployeeComponent implements OnInit, OnDestroy {
  // ViewChild for copy modal template
  @ViewChild('copyModalContent') copyModalContent!: TemplateRef<any>;

  // Master grid (Positions)
  columnDefinitionsMaster: PrimeColumn[] = [];
  datasetMaster: any[] = [];
  treeDatasetMaster: TreeNode[] = [];
  isLoadingMaster = false;

  // Detail grid (Employees)
  columnDefinitionsDetail: PrimeColumn[] = [];
  datasetDetail: any[] = [];
  isLoadingDetail = false;

  // Menu bars
  masterMenuBars: any[] = [];
  detailMenuBars: any[] = [];

  // Filter data
  departments: any[] = [];
  kpiSessions: any[] = [];
  selectedDepartmentId: number = 0;
  selectedKPISessionId: number = 0;

  // Selected items
  selectedPositionId: number = 0;
  selectedPositionRow: any = null;
  selectedEmployeeRows: any[] = [];

  // Copy modal
  copyFromSessionId: number = 0;
  copyToSessionId: number = 0;

  // Route params
  private queryParamsSubscription?: Subscription;

  constructor(
    private service: KpiPositionEmployeeService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    @Optional() @Inject('tabData') private tabData: any
  ) {
    // Subscribe to queryParams in constructor like approve-tp pattern
    this.route.queryParams.subscribe(params => {
      this.selectedDepartmentId = params['departmentId']
        ? Number(params['departmentId'])
        : (this.tabData?.departmentId ?? 0);
    });
  }

  ngOnInit(): void {
    console.log(this.selectedDepartmentId);
    this.initMasterMenuBar();
    this.initDetailMenuBar();
    this.initGridMaster();
    this.initGridDetail();
    this.loadDepartments();

    // Load initial data with param = 0
    setTimeout(() => {
      this.loadInitialData();
    }, 300);
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription?.unsubscribe();
  }

  initMasterMenuBar(): void {
    this.masterMenuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        command: () => this.onAddPosition(),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        command: () => this.onEditPosition(),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onDeletePosition(),
      },
      {
        label: 'Copy',
        icon: 'fa-solid fa-copy fa-lg text-info',
        command: () => this.onCopyPosition(),
      },
    ];
  }

  initDetailMenuBar(): void {
    this.detailMenuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        command: () => this.onAddEmployee(),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onDeleteEmployee(),
      },
    ];
  }

  //#region Master Grid Setup
  initGridMaster(): void {
    this.columnDefinitionsMaster = [
      this.textCol('PositionCode', 'Mã vị trí', 'PositionCode', 120),
      this.textCol('PositionName', 'Tên vị trí', 'PositionName', 200),
      this.textCol('TypePositionText', 'Chức vụ', 'TypePositionText', 120),
      this.textCol('KPISessionName', 'Kỳ đánh giá', 'KPISessionName', 200),
      this.textCol('YearEvaluation', 'Năm', 'YearEvaluation', 80, { align: 'right' }),
    ];
  }

  onMasterRowClick(rowData: any): void {
    if (rowData && !rowData.isGroup) {
      this.selectedPositionId = rowData.ID;
      this.selectedPositionRow = rowData;
      this.loadEmployeeDetails(this.selectedPositionId);
    }
  }

  onMasterRowDblClick(rowData: any): void {
    if (rowData && !rowData.isGroup) {
      this.selectedPositionId = rowData.ID;
      this.onEditPosition();
    }
  }
  //#endregion

  //#region Detail Grid Setup
  initGridDetail(): void {
    this.columnDefinitionsDetail = [
      this.textCol('Code', 'Mã nhân viên', 'Code', 120),
      this.textCol('FullName', 'Tên nhân viên', 'FullName', 200),
      this.textCol('DepartmentName', 'Phòng ban', 'DepartmentName', 200),
    ];
  }

  onDetailRowDblClick(rowData: any): void {
    this.onAddEmployee();
  }
  //#endregion

  //#region Data Loading
  loadDepartments(): void {
    this.service.getDepartment().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.departments = response.data;
          if (this.departments.length > 0) {
            // Chỉ auto-select department đầu tiên nếu chưa có giá trị từ queryParams/tabData
            if (!this.selectedDepartmentId) {
              this.selectedDepartmentId = this.departments[0].ID;
            }
            this.onDepartmentChange();
          }
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải danh sách phòng ban'
          );
        }
      },
      error: (error) => {
        const errorMessage = error?.error?.message || (typeof error?.error === 'string' ? error.error : error?.message) || error;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi kết nối khi tải phòng ban: ' + errorMessage
        );
      },
    });
  }

  onDepartmentChange(): void {
    if (this.selectedDepartmentId) {
      this.service.getKPISession(this.selectedDepartmentId).subscribe({
        next: (response) => {
          if (response.status === 1) {
            this.kpiSessions = response.data;
            this.selectedKPISessionId = 0;
            this.datasetMaster = [];
            this.datasetDetail = [];
          } else {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Lỗi khi tải kỳ đánh giá'
            );
          }
        },
        error: (error) => {
          const errorMessage = error?.error?.message || (typeof error?.error === 'string' ? error.error : error?.message) || error;
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi kết nối khi tải kỳ đánh giá: ' + errorMessage
          );
        },
      });
    }
  }

  onKPISessionChange(): void {
    if (this.selectedKPISessionId) {
      this.onSearch();
    }
  }

  loadInitialData(): void {
    this.isLoadingMaster = true;
    // Load all data with kpiSessionId = 0
    this.service.getData(0).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.datasetMaster = (response.data || []).map((item: any, index: number) => ({
            ...item,
            id: `${item.ID}_${index}`,
          })).sort((a: any, b: any) => {
            const sessionCompare = (a.KPISessionName || '').localeCompare(b.KPISessionName || '');
            if (sessionCompare !== 0) return sessionCompare;
            return (a.TypePositionText || '').localeCompare(b.TypePositionText || '');
          });
          this.treeDatasetMaster = this.buildTreeDataset(this.datasetMaster);
        }
        this.isLoadingMaster = false;
      },
      error: (error) => {
        console.error('Error loading initial data:', error);
        this.isLoadingMaster = false;
      },
    });
  }

  onSearch(): void {
    if (!this.selectedKPISessionId) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn kỳ đánh giá'
      );
      return;
    }

    this.isLoadingMaster = true;
    this.service.getData(this.selectedKPISessionId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.datasetMaster = (response.data || []).map((item: any, index: number) => ({
            ...item,
            id: `${item.ID}_${index}`,
          })).sort((a: any, b: any) => {
            const sessionCompare = (a.KPISessionName || '').localeCompare(b.KPISessionName || '');
            if (sessionCompare !== 0) return sessionCompare;
            return (a.TypePositionText || '').localeCompare(b.TypePositionText || '');
          });
          this.treeDatasetMaster = this.buildTreeDataset(this.datasetMaster);

          // Update selectedPositionRow với data mới từ dataset
          if (this.selectedPositionId) {
            const updatedRow = this.datasetMaster.find((item: any) => item.ID === this.selectedPositionId);
            if (updatedRow) {
              this.selectedPositionRow = updatedRow;
            }
          }
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải dữ liệu vị trí'
          );
        }
        this.isLoadingMaster = false;
      },
      error: (error) => {
        this.isLoadingMaster = false;
        const errorMessage = error?.error?.message || (typeof error?.error === 'string' ? error.error : error?.message) || error;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi kết nối khi tải dữ liệu: ' + errorMessage
        );
      },
    });
  }

  loadEmployeeDetails(positionId: number): void {
    this.isLoadingDetail = true;
    this.service.getDetail(positionId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.datasetDetail = (response.data || []).map((item: any, index: number) => ({
            ...item,
            id: `${item.ID}_${index}`,
          })).sort((a: any, b: any) => {
            return (a.DepartmentName || '').localeCompare(b.DepartmentName || '');
          });
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải danh sách nhân viên'
          );
        }
        this.isLoadingDetail = false;
      },
      error: (error) => {
        this.isLoadingDetail = false;
        const errorMessage = error?.error?.message || (typeof error?.error === 'string' ? error.error : error?.message) || error;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi kết nối khi tải nhân viên: ' + errorMessage
        );
      },
    });
  }

  getDetailGroupCount(deptName: string): number {
    return this.datasetDetail.filter(item => item.DepartmentName === deptName).length;
  }

  buildTreeDataset(data: any[]): TreeNode[] {
    const tree: TreeNode[] = [];
    const sessionMap = new Map<string, TreeNode>();

    for (const item of data) {
      const sessionName = item.KPISessionName || 'Khác';
      const typePositionName = item.TypePositionText || 'Khác';

      // 1. Get or create Level 0 (Kỳ đánh giá)
      if (!sessionMap.has(sessionName)) {
        const sessionNode: TreeNode = {
          data: {
            isGroup: true,
            isSessionGroup: true,
            KPISessionName: sessionName,
            count: 0
          },
          expanded: true,
          children: []
        };
        sessionMap.set(sessionName, sessionNode);
        tree.push(sessionNode);
      }
      const sessionNode = sessionMap.get(sessionName)!;
      sessionNode.data.count++;

      // 2. Get or create Level 1 (Chức vụ) inside Level 0
      let typeNode = sessionNode.children!.find(c => c.data.TypePositionText === typePositionName);
      if (!typeNode) {
        typeNode = {
          data: {
            isGroup: true,
            isTypeGroup: true,
            TypePositionText: typePositionName,
            count: 0
          },
          expanded: true,
          children: []
        };
        sessionNode.children!.push(typeNode);
      }
      typeNode.data.count++;

      // 3. Add Leaf Node (Item)
      typeNode.children!.push({
        data: item,
        leaf: true
      });
    }

    return tree;
  }
  //#endregion

  //#region CRUD Operations
  onAddPosition(): void {
    const modalRef = this.modalService.open(KpiPositionDetailComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
    modalRef.componentInstance.departmentId = this.selectedDepartmentId;
    modalRef.componentInstance.kpiSessionId = this.selectedKPISessionId;
    modalRef.componentInstance.kpiPosition = {};
    modalRef.componentInstance.isEditMode = false;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.onSearch();
        }
      },
      () => { }
    );
  }

  onEditPosition(): void {
    if (!this.selectedPositionId || !this.selectedPositionRow) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn vị trí cần sửa'
      );
      return;
    }

    const modalRef = this.modalService.open(KpiPositionDetailComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
    modalRef.componentInstance.departmentId = this.selectedDepartmentId;
    modalRef.componentInstance.kpiSessionId = this.selectedKPISessionId;
    modalRef.componentInstance.kpiPosition = this.selectedPositionRow;
    modalRef.componentInstance.isEditMode = true;
    modalRef.componentInstance.id = this.selectedPositionId;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.onSearch();
        }
      },
      () => { }
    );
  }

  onDeletePosition(): void {
    if (!this.selectedPositionId) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn vị trí cần xóa'
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa vị trí này?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        this.service.deletePosition(this.selectedPositionId).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Xóa vị trí thành công'
              );
              this.onSearch();
              this.selectedPositionId = 0;
              this.selectedPositionRow = null;
              this.datasetDetail = [];
            } else {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                response.message || 'Lỗi khi xóa vị trí'
              );
            }
          },
          error: (error) => {
            const errorMessage = error?.error?.message || (typeof error?.error === 'string' ? error.error : error?.message) || error;
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Lỗi khi xóa vị trí: ' + errorMessage
            );
          },
        });
      },
    });
  }

  onCopyPosition(): void {
    // Reset copy session IDs
    this.copyFromSessionId = 0;
    this.copyToSessionId = 0;

    this.modal.create({
      nzTitle: 'Copy vị trí nhân viên',
      nzContent: this.copyModalContent,
      nzOkText: 'Copy',
      nzCancelText: 'Hủy',
      nzWidth: 450,
      nzOnOk: () => {
        // Validate
        if (!this.copyFromSessionId) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Vui lòng chọn kỳ đánh giá nguồn'
          );
          return false;
        }
        if (!this.copyToSessionId) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Vui lòng chọn kỳ đánh giá đích'
          );
          return false;
        }
        if (this.copyFromSessionId === this.copyToSessionId) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Kỳ đánh giá nguồn và đích không được trùng nhau'
          );
          return false;
        }

        // Call API
        this.service.copyPositionEmployee(this.copyFromSessionId, this.copyToSessionId).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Copy thành công'
              );
              this.onSearch();
            } else {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                response.message || 'Lỗi khi copy'
              );
            }
          },
          error: (error) => {
            const errorMessage = error?.error?.message || (typeof error?.error === 'string' ? error.error : error?.message) || error;
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Lỗi khi copy: ' + errorMessage
            );
          },
        });
        return true;
      },
    });
  }

  onAddEmployee(): void {
    if (!this.selectedPositionId) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn vị trí trước khi thêm nhân viên'
      );
      return;
    }

    const modalRef = this.modalService.open(KpiPositionEmployeeDetailComponent, {
      centered: true,
      backdrop: 'static',
      size: 'xl'
    });
    modalRef.componentInstance.departmentId = this.selectedDepartmentId;
    modalRef.componentInstance.kpiSessionId = this.selectedPositionRow?.KPISessionID || this.selectedKPISessionId;
    modalRef.componentInstance.kpiPositionId = this.selectedPositionId;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.loadEmployeeDetails(this.selectedPositionId);
        }
      },
      () => { }
    );
  }

  onDeleteEmployee(): void {
    if (!this.selectedEmployeeRows || this.selectedEmployeeRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn nhân viên cần xóa'
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${this.selectedEmployeeRows.length} nhân viên đã chọn?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const deleteRequests: DeleteEmployeeRequest[] = this.selectedEmployeeRows.map(
          (emp) => ({
            DepartmentID: emp.DepartmentID,
            KPIPositionEmployeeID: emp.KPIPositionEmployeeID,
          })
        );

        this.service.deleteEmployee(deleteRequests).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Xóa nhân viên thành công'
              );
              this.loadEmployeeDetails(this.selectedPositionId);
              this.selectedEmployeeRows = [];
            } else {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                response.message || 'Lỗi khi xóa nhân viên'
              );
            }
          },
          error: (error) => {
            const errorMessage = error?.error?.message || (typeof error?.error === 'string' ? error.error : error?.message) || error;
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Lỗi khi xóa nhân viên: ' + errorMessage
            );
          },
        });
      },
    });
  }
  //#endregion

  visibleColumns(columns: PrimeColumn[]): PrimeColumn[] {
    return columns.filter(col => !col.hidden);
  }

  getColumnWidth(col: PrimeColumn): string {
    return `${col.width || col.minWidth || 120}px`;
  }

  getColumnFilterType(col: PrimeColumn): string {
    return 'text';
  }

  getCellClass(col: PrimeColumn): Record<string, boolean> {
    return {
      'text-end': col.align === 'right' || col.type === 'number' || col.cssClass === 'text-end',
      'text-center': col.align === 'center' || col.type === 'boolean',
    };
  }

  formatCell(row: any, col: PrimeColumn): string {
    const value = row?.[col.field];
    if (value === null || value === undefined || value === '') return '';
    if (col.type === 'number') return this.formatNumber(value);
    if (col.type === 'boolean') return value ? '✓' : '';
    return String(value);
  }

  getCellTitle(row: any, col: PrimeColumn): string {
    if (col.type === 'boolean') return row?.[col.field] ? 'Có' : 'Không';
    return this.formatCell(row, col);
  }

  private formatNumber(value: any): string {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue === 0) return '';
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(numericValue);
  }

  private textCol(id: string, name: string, field: string, width: number, extra: Partial<PrimeColumn> = {}): PrimeColumn {
    return {
      id,
      name,
      field,
      width,
      sortable: true,
      filterable: true,
      type: 'text',
      ...extra,
    };
  }
}
