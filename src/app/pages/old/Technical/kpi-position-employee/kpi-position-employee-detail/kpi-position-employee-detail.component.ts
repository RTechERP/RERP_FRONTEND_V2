import { Component, OnInit, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  GridOption,
  Formatters
} from 'angular-slickgrid';
import { KpiPositionEmployeeService } from '../kpi-position-employee-service/kpi-position-employee.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
  selector: 'app-kpi-position-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzModalModule,
    AngularSlickgridModule
  ],
  templateUrl: './kpi-position-employee-detail.component.html',
  styleUrl: './kpi-position-employee-detail.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KpiPositionEmployeeDetailComponent implements OnInit {
  @Input() departmentId: number = 0;
  @Input() kpiSessionId: number = 0;
  @Input() kpiPositionId: number = 0;
  @Output() onSaved = new EventEmitter<any>();

  // Grid
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  // Track changes
  lstInsert: number[] = [];  // EmployeeIDs to insert
  lstDel: number[] = [];     // PositionEmployeeIDs to delete

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private service: KpiPositionEmployeeService
  ) { }

  ngOnInit(): void {
    this.initGrid();
    this.loadEmployees();
  }

  angularGridReady(event: any): void {
    this.angularGrid = event.detail;

    // Apply grouping after grid is ready
    setTimeout(() => {
      this.applyGrouping();
    }, 100);
  }

  private initGrid(): void {
    this.columnDefinitions = [
      {
        id: 'IsCheck',
        name: '',
        field: 'IsCheck',
        type: 'boolean',
        sortable: false,
        width: 50,
        maxWidth: 50,
        cssClass: 'text-center',
        formatter: Formatters.checkmarkMaterial,
        onCellClick: (e: Event, args: any) => {
          this.onCheckboxClick(args);
        }
      },
      {
        id: 'Code',
        name: 'Mã nhân viên',
        field: 'Code',
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        width: 120
      },
      {
        id: 'FullName',
        name: 'Tên nhân viên',
        field: 'FullName',
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        width: 200
      },
      {
        id: 'DepartmentName',
        name: 'Phòng ban',
        field: 'DepartmentName',
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        width: 150
      },
      {
        id: 'ChucVuName',
        name: 'Chức vụ',
        field: 'ChucVuName',
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        width: 150
      },
      {
        id: 'PositionName',
        name: 'Vị trí',
        field: 'PositionName',
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        width: 150
      }
    ];

    this.gridOptions = {
      autoResize: {
        container: '.modal-body',
        calculateAvailableSizeBy: 'container'
      },
      enableAutoResize: true,
      enableFiltering: true,
      enableSorting: true,
      enableGrouping: true,
      showHeaderRow: true,
      headerRowHeight: 35,
      rowHeight: 30,
      gridHeight: 450,
    };
  }

  private applyGrouping(): void {
    if (!this.angularGrid?.dataView) return;

    this.angularGrid.dataView.setGrouping([
      {
        getter: 'DepartmentName',
        formatter: (g: any) => `Phòng ban: ${g.value} (${g.count} nhân viên)`,
        aggregateCollapsed: false,
        collapsed: false,
      }
    ]);
  }

  private loadEmployees(): void {
    this.service.getPositionEmployeeDetail(this.departmentId, this.kpiSessionId).subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.dataset = response.data.map((item: any, index: number) => ({
            ...item,
            id: `${item.ID}_${index}`,
            IsCheck: item.KPIPosiotionID === this.kpiPositionId
          }));

          setTimeout(() => {
            this.applyGrouping();
          }, 100);
        }
      },
      error: (error: any) => {
        console.error('Error loading employees:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên');
      }
    });
  }

  /**
   * Xử lý click checkbox
   */
  private onCheckboxClick(args: any): void {
    const dataContext = args.dataContext;
    const empId = parseInt(dataContext.ID, 10);
    const positionEmployeeId = parseInt(dataContext.PositionEmployeeID, 10) || 0;
    const currentPositionId = parseInt(dataContext.KPIPosiotionID, 10) || 0;
    const isCurrentlyChecked = dataContext.IsCheck;

    if (isCurrentlyChecked) {
      // Đang checked -> bỏ check (xóa)
      this.modal.confirm({
        nzTitle: 'Xác nhận xóa',
        nzContent: `Bạn có muốn xóa Nhân viên [${dataContext.FullName}] hay không?`,
        nzOkText: 'Xóa',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          // Thêm vào danh sách xóa (dùng PositionEmployeeID)
          if (positionEmployeeId && !this.lstDel.includes(positionEmployeeId)) {
            this.lstDel.push(positionEmployeeId);
          }
          // Xóa khỏi danh sách thêm
          this.lstInsert = this.lstInsert.filter(id => id !== empId);

          // Update UI
          dataContext.IsCheck = false;
          this.angularGrid.gridService.updateItem(dataContext);
        }
      });
    } else {
      // Đang unchecked -> check (thêm)
      if (currentPositionId && currentPositionId !== 0 && currentPositionId === this.kpiPositionId) {
        // Nhân viên đã có đúng KPI Position rồi => không cần insert
        this.lstInsert = this.lstInsert.filter(id => id !== empId);
        dataContext.IsCheck = true;
        this.angularGrid.gridService.updateItem(dataContext);
        return;
      }

      if (currentPositionId && currentPositionId !== 0 && currentPositionId !== this.kpiPositionId) {
        // Nhân viên đã có vị trí khác => hỏi có muốn gán lại không
        this.modal.confirm({
          nzTitle: 'Xác nhận gán lại',
          nzContent: `Nhân viên [${dataContext.FullName}] đã được gán vị trí [${dataContext.PositionName}]! Bạn có muốn gán lại vị trí không?`,
          nzOkText: 'Gán lại',
          nzOkType: 'primary',
          nzCancelText: 'Hủy',
          nzOnOk: () => {
            if (!this.lstInsert.includes(empId)) {
              this.lstInsert.push(empId);
            }
            dataContext.IsCheck = true;
            this.angularGrid.gridService.updateItem(dataContext);
          }
        });
      } else {
        // positionID == 0 => chưa gán bao giờ
        if (!this.lstInsert.includes(empId)) {
          this.lstInsert.push(empId);
        }
        dataContext.IsCheck = true;
        this.angularGrid.gridService.updateItem(dataContext);
      }
    }
  }

  saveAndClose(): void {
    this.save(() => {
      this.activeModal.close({ success: true });
    });
  }

  /**
   * Gọi save-position-employee API với listDel, listInsert, KPIPositionID
   */
  private save(onSuccess: () => void): void {
    if (this.lstDel.length === 0 && this.lstInsert.length === 0) {
      onSuccess();
      return;
    }

    this.service.savePositionEmployee(this.lstDel, this.lstInsert, this.kpiPositionId).subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
          this.lstDel = [];
          this.lstInsert = [];
          this.onSaved.emit({ success: true });
          onSuccess();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu thất bại');
        }
      },
      error: (error: any) => {
        console.error('Error saving:', error);
        const errorMsg = error?.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu';
        this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
      }
    });
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}
