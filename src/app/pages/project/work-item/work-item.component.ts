import { Title } from '@angular/platform-browser';
import {
  Component,
  Input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { AuthService } from '../../../auth/auth.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { WorkItemServiceService } from './work-item-service/work-item-service.service';
import { SelectControlComponent } from '../../old/Sale/BillExport/Modal/select-control/select-control.component';
import { ProjectItemFileComponent } from './work-item-form/project-item-file/project-item-file.component';
import { ProjectItemProblemComponent } from './work-item-form/project-item-problem/project-item-problem.component';
@Component({
  selector: 'app-work-item',
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    NzCheckboxModule,
    // SelectControlComponent,
  ],
  templateUrl: './work-item.component.html',
  styleUrl: './work-item.component.css',
})
export class WorkItemComponent implements OnInit, AfterViewInit {
  @Input() projectId: number = 0;
  @Input() projectCode: string = '';
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private workItemService: WorkItemServiceService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private authService: AuthService
  ) {}
  sizeSearch: string = '0';
  keyword: string = '';
  isLoadTable: boolean = false;
  dataTableWorkItem: any[] = [];
  @ViewChild('tb_workItem', { static: false })
  tb_workItemElement!: ElementRef;
  tb_workItem: any;

  dataStatus: any[] = []; // trạng thái duyệt
  dataStatusApproved: any[] = []; // trạng thái duyệt kế hoạch
  cbbEmployeeRequest: any[] = []; // người giao việc
  cbbTypeProject: any[] = []; // loại dự án
  cbbUser: any[] = []; // mã người yêu cầu
  cbbEmployee: any[] = []; // người phụ trách
  nextRowId: number = 0; // ID tạm thời cho row mới (âm)
  selectedRow: any = null; // Row component đã chọn để thêm con
  deletedIdsWorkItem: number[] = []; // ID của hạng mục đã xóa
  currentUser: any = null;
  //tree
  treeWorkItemData: any = [];
  filterStatus: number[] = [0, 1]; // Mặc định chọn "Chưa làm" (0) và "Đang làm" (1)

  ngOnInit(): void {
    this.dataStatus = [
      { id: 0, name: 'Chưa làm' },
      { id: 1, name: 'Đang làm' },
      { id: 2, name: 'Hoàn thành' },
      { id: 3, name: 'Pending' },
    ];
    this.dataStatusApproved = [
      { id: 0, name: 'Chờ duyệt kế hoạch' },
      { id: 1, name: 'Duyệt thực tế' },
      { id: 2, name: 'Chờ duyệt thực tế' },
      { id: 3, name: 'Duyệt thực tế' },
    ];
    this.getCurrentUser();
    // Load tất cả dropdown trước, sau đó mới load data bảng
    this.loadAllDropdowns().then(() => {
      this.loadData();
    });
  }
  ngAfterViewInit(): void {
    this.drawTbWorkItem(this.tb_workItemElement!.nativeElement);
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch === '0' ? '250px' : '0';
  }
  resetSearch() {
    this.keyword = '';
  }
  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      if (res && res.status === 1 && res.data) {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        this.currentUser = data;
        // Đảm bảo có đầy đủ thông tin cần thiết
        console.log('CurrentUser', this.currentUser);
        console.log('EmployeeID:', this.currentUser?.EmployeeID);
        console.log('HeadofDepartment:', this.currentUser?.HeadofDepartment || this.currentUser?.HeadOfDepartment);
        console.log('PositionCode:', this.currentUser?.PositionCode);
        console.log('IsAdmin:', this.currentUser?.IsAdmin || this.currentUser?.ISADMIN);
      }
    });
  }

  // Kiểm tra quyền edit - tương tự checkIsPermission trong WinForm
  checkIsPermission(
    createdBy: string,
    userID: number,
    employeeIDRequest: number
  ): boolean {
    if (!this.currentUser) return false;

    const currentUserID = this.currentUser.UserID || this.currentUser.ID || 0;
    const currentEmployeeID = this.currentUser.EmployeeID || 0;
    const currentUserName = (
      this.currentUser.UserName ||
      this.currentUser.FullName ||
      ''
    ).trim();

    // Kiểm tra nếu là người tạo
    if (createdBy && createdBy.trim() === currentUserName) {
      return true;
    }

    // Kiểm tra nếu là người phụ trách
    if (userID && userID === currentUserID) {
      return true;
    }

    // Kiểm tra nếu là người giao việc
    if (employeeIDRequest && employeeIDRequest === currentEmployeeID) {
      return true;
    }

    return false;
  }

  // Validate cell editing - tương tự ValidatingEditor trong WinForm
  validateCellEditing(cell: any): { valid: boolean; errorText?: string } {
    const row = cell.getRow();
    if (!row) return { valid: true };

    const rowData = row.getData();
    const fieldName = cell.getField();
    const id = rowData.ID || 0;
    const stt = rowData.STT || '';

    // Validate cột "Người phụ trách" (UserID) chỉ cho dòng mới (ID <= 0)
    if (fieldName === 'UserID' && id <= 0) {
      const userID = cell.getValue();
      if (!userID || userID === 0) {
        return {
          valid: false,
          errorText: `Dòng STT: ${stt}\nVui lòng chọn người phụ trách!`,
        };
      }
    }

    // Chỉ validate quyền cho row có ID > 0 (đã lưu vào DB)
    if (id <= 0) {
      return { valid: true };
    }

    // Kiểm tra IsAdmin (giống WinForm: Global.IsAdmin)
    const isAdmin = this.currentUser?.IsAdmin || this.currentUser?.ISADMIN || false;
    if (isAdmin) {
      return { valid: true };
    }

    const isApproved = rowData.IsApproved || 0;
    const createdBy = (rowData.CreatedBy || '').trim();
    const userID = rowData.UserID || 0;
    const employeeIDRequest = rowData.EmployeeIDRequest || 0;

    // Kiểm tra nếu đã duyệt thực tế (IsApproved == 3)
    if (isApproved === 3) {
      return {
        valid: false,
        errorText: `Dòng STT: ${stt}\nĐã duyệt thực tế.\nBạn không thể cập nhật!`,
      };
    }

    // Kiểm tra quyền
    if (!this.checkIsPermission(createdBy, userID, employeeIDRequest)) {
      return {
        valid: false,
        errorText: `Dòng STT: ${stt}\nBạn không thể cập nhật hạng mục của người khác!`,
      };
    }

    // Kiểm tra các cột Mission và Plan (PlanStartDate, PlanEndDate)
    const isMissionColumn = fieldName === 'Mission';
    const isPlanColumn = ['PlanStartDate', 'PlanEndDate'].includes(fieldName);

    if (isMissionColumn || isPlanColumn) {
      const statusUpdate = rowData.StatusUpdate || 0;
      if (statusUpdate !== 2 && statusUpdate !== 1) {
        // Cập nhật StatusUpdate = 2
        row.update({ StatusUpdate: 2 });
      }
    }

    return { valid: true };
  }

  // Xử lý thay đổi giá trị cell - tương tự CellValueChanged trong WinForm
  handleCellValueChanged(cell: any): void {
    const row = cell.getRow();
    if (!row) return;

    const rowData = row.getData();
    const fieldName = cell.getField();
    const id = rowData.ID || 0;
    const now = DateTime.now();

    console.log(`📝 Cell changed: Field="${fieldName}", ID=${id}`);

    // Cập nhật StatusUpdate cho Mission và Plan columns
    if (id > 0) {
      const isMissionColumn = fieldName === 'Mission';
      const isPlanColumn = [
        'PlanStartDate',
        'PlanEndDate',
        'TotalDayPlan',
      ].includes(fieldName);

      if (isMissionColumn || isPlanColumn) {
        const statusUpdate = rowData.StatusUpdate || 0;
        if (statusUpdate !== 2 && statusUpdate !== 1) {
          row.update({ StatusUpdate: 2 });
        }
      }
    }

    // Xử lý các cột ngày tháng Plan
    const planStartDate = rowData.PlanStartDate
      ? DateTime.fromISO(rowData.PlanStartDate)
      : null;
    const planEndDate = rowData.PlanEndDate
      ? DateTime.fromISO(rowData.PlanEndDate)
      : null;
    const totalDayPlan = rowData.TotalDayPlan || 0;

    // Xử lý thay đổi ngày bắt đầu
    if (fieldName === 'PlanStartDate') {
      if (planStartDate && planStartDate.isValid) {
        // Validate: ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc
        if (planEndDate && planEndDate.isValid) {
          const daysDiff = planEndDate.diff(planStartDate, 'days').days;
          if (daysDiff < 0) {
            // Ngày bắt đầu lớn hơn ngày kết thúc - không hợp lệ
            this.notification.warning(
              'Cảnh báo',
              'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc!'
            );
            // Revert về giá trị cũ
            const oldValue = cell.getOldValue();
            cell.setValue(oldValue);
            return;
          }
        }

        if (totalDayPlan > 0) {
          const newEndDate = planStartDate.plus({ days: totalDayPlan - 1 });
          row.update({ PlanEndDate: newEndDate.toISO() });
        } else if (planEndDate && planEndDate.isValid) {
          const days = planEndDate.diff(planStartDate, 'days').days + 1;
          row.update({ TotalDayPlan: Math.max(0, Math.round(days)) });
        }
      }
      this.updatePercent();
    }
    // Xử lý thay đổi tổng số ngày
    else if (fieldName === 'TotalDayPlan') {
      if (totalDayPlan > 0) {
        if (planStartDate && planStartDate.isValid) {
          const newEndDate = planStartDate.plus({ days: totalDayPlan - 1 });
          row.update({ PlanEndDate: newEndDate.toISO() });
        } else if (planEndDate && planEndDate.isValid) {
          const newStartDate = planEndDate.minus({ days: totalDayPlan - 1 });
          row.update({ PlanStartDate: newStartDate.toISO() });
        }
      }
      this.updatePercent();
    }
    // Xử lý thay đổi ngày kết thúc
    else if (fieldName === 'PlanEndDate') {
      if (planEndDate && planEndDate.isValid) {
        // Validate: ngày kết thúc phải lớn hơn ngày bắt đầu
        if (planStartDate && planStartDate.isValid) {
          const daysDiff = planEndDate.diff(planStartDate, 'days').days;
          if (daysDiff < 0) {
            // Ngày kết thúc nhỏ hơn ngày bắt đầu - không hợp lệ
            this.notification.warning(
              'Cảnh báo',
              'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!'
            );
            // Revert về giá trị cũ
            const oldValue = cell.getOldValue();
            cell.setValue(oldValue);
            return;
          }
          const days = daysDiff + 1;
          row.update({ TotalDayPlan: Math.max(0, Math.round(days)) });
        } else if (totalDayPlan > 0) {
          const newStartDate = planEndDate.minus({ days: totalDayPlan - 1 });
          row.update({ PlanStartDate: newStartDate.toISO() });
        }
      }
      this.updatePercent();
    }

    // Tính toán ItemLate cho tất cả rows (sau khi thay đổi dữ liệu)
    // Sử dụng setTimeout để đảm bảo dữ liệu đã được cập nhật
    setTimeout(() => {
      this.updateItemLate();
    }, 0);

    // Cập nhật trạng thái hoàn thành
    if (fieldName === 'ActualStartDate' || fieldName === 'ActualEndDate') {
      const newActualStartDate = rowData.ActualStartDate
        ? DateTime.fromISO(rowData.ActualStartDate)
        : null;
      const newActualEndDate = rowData.ActualEndDate
        ? DateTime.fromISO(rowData.ActualEndDate)
        : null;

      // Validate: ngày kết thúc thực tế phải lớn hơn hoặc bằng ngày bắt đầu thực tế
      if (
        fieldName === 'ActualEndDate' &&
        newActualEndDate &&
        newActualEndDate.isValid
      ) {
        if (newActualStartDate && newActualStartDate.isValid) {
          const daysDiff = newActualEndDate.diff(
            newActualStartDate,
            'days'
          ).days;
          if (daysDiff < 0) {
            // Ngày kết thúc nhỏ hơn ngày bắt đầu - không hợp lệ
            this.notification.warning(
              'Cảnh báo',
              'Ngày kết thúc thực tế phải lớn hơn hoặc bằng ngày bắt đầu thực tế!'
            );
            // Revert về giá trị cũ
            const oldValue = cell.getOldValue();
            cell.setValue(oldValue);
            return;
          }
        }
      }

      // Validate: ngày bắt đầu thực tế phải nhỏ hơn hoặc bằng ngày kết thúc thực tế
      if (
        fieldName === 'ActualStartDate' &&
        newActualStartDate &&
        newActualStartDate.isValid
      ) {
        if (newActualEndDate && newActualEndDate.isValid) {
          const daysDiff = newActualEndDate.diff(
            newActualStartDate,
            'days'
          ).days;
          if (daysDiff < 0) {
            // Ngày bắt đầu lớn hơn ngày kết thúc - không hợp lệ
            this.notification.warning(
              'Cảnh báo',
              'Ngày bắt đầu thực tế phải nhỏ hơn hoặc bằng ngày kết thúc thực tế!'
            );
            // Revert về giá trị cũ
            const oldValue = cell.getOldValue();
            cell.setValue(oldValue);
            return;
          }
        }
      }

      if (newActualEndDate && newActualEndDate.isValid) {
        row.update({
          UpdatedDateActual: now.toISO(),
          Status: 2,
        });

        if (planEndDate && planEndDate.isValid) {
          const endDiff = newActualEndDate
            .startOf('day')
            .diff(planEndDate.startOf('day'), 'days').days;
          if (endDiff > 0) {
            row.update({ IsUpdateLate: true });
          }
        }
      } else {
        const hasActualStart = newActualStartDate && newActualStartDate.isValid;
        row.update({
          UpdatedDateActual: null,
          Status: hasActualStart ? 1 : 0,
        });
      }
    }

    // Xử lý thay đổi trạng thái
    if (fieldName === 'Status') {
      const status = rowData.Status || 0;
      if (status === 1) {
        row.update({ ActualStartDate: now.toISO() });
      } else if (status === 2) {
        row.update({ ActualEndDate: now.toISO() });
      }
    }
  }

  // Tính toán phần trăm - tương tự updatePercent trong WinForm
  // Thay thế phương thức updatePercent() của bạn bằng code này:

  updatePercent(): void {
    console.log('🔄 BẮT ĐẦU TÍNH PHẦN TRĂM...');

    try {
      // Lấy root rows
      const rootRows = this.tb_workItem.getRows();

      if (!rootRows || rootRows.length === 0) {
        console.log('⚠️ Không có rows trong table');
        return;
      }

      // ✅ QUAN TRỌNG: Flatten tree để lấy TẤT CẢ rows (bao gồm children)
      const allRows = this.flattenTreeRows(rootRows);

      console.log(
        `📊 Root rows: ${rootRows.length}, Tổng tất cả rows: ${allRows.length}`
      );

      // Thu thập dữ liệu từ tất cả rows
      let totalDays = 0;
      const rowsInfo: Array<{ row: any; data: any; days: number }> = [];

      allRows.forEach((row: any) => {
        const data = row.getData();
        const days = parseFloat(data.TotalDayPlan) || 0;

        totalDays += days;
        rowsInfo.push({ row, data, days });

        if (days > 0) {
          console.log(`  ├─ ID: ${data.ID}, Code: ${data.Code}, Ngày: ${days}`);
        }
      });

      console.log(`📈 TỔNG SỐ NGÀY: ${totalDays}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Cập nhật phần trăm
      if (totalDays > 0) {
        let updatedCount = 0;

        rowsInfo.forEach(({ row, data, days }) => {
          const percent = (days * 100) / totalDays;
          const roundedPercent = Math.round(percent * 100) / 100;
          const currentPercent = parseFloat(data.PercentItem) || 0;

          // Chỉ update nếu khác biệt > 0.01%
          if (Math.abs(currentPercent - roundedPercent) > 0.01) {
            row.update({ PercentItem: roundedPercent });
            updatedCount++;
            console.log(`  ✓ Updated ID ${data.ID}: ${roundedPercent}%`);
          }
        });

        console.log(`✅ Đã cập nhật ${updatedCount} rows!`);
      } else {
        // Reset tất cả về 0
        rowsInfo.forEach(({ row }) => {
          row.update({ PercentItem: 0 });
        });
        console.log('⚠️ Tổng ngày = 0, reset tất cả về 0%');
      }
    } catch (error) {
      console.error('❌ LỖI khi tính phần trăm:', error);
    }
  }

  // Tính toán ItemLate cho tất cả rows - tương tự updateItemLate trong WinForm
  updateItemLate(): void {
    if (!this.tb_workItem) return;

    try {
      // Lấy tất cả rows (bao gồm children)
      const rootRows = this.tb_workItem.getRows();
      if (!rootRows || rootRows.length === 0) {
        return;
      }

      const allRows = this.flattenTreeRows(rootRows);
      const now = DateTime.now();

      allRows.forEach((row: any) => {
        const data = row.getData();

        const planStartDate = data.PlanStartDate
          ? DateTime.fromISO(data.PlanStartDate)
          : null;
        const planEndDate = data.PlanEndDate
          ? DateTime.fromISO(data.PlanEndDate)
          : null;
        const actualStartDate = data.ActualStartDate
          ? DateTime.fromISO(data.ActualStartDate)
          : null;
        const actualEndDate = data.ActualEndDate
          ? DateTime.fromISO(data.ActualEndDate)
          : null;

        let itemLate = 0;

        // Logic xử lý trễ - giống WinForm
        if (
          actualStartDate &&
          actualStartDate.isValid &&
          !actualEndDate &&
          planEndDate &&
          planEndDate.isValid
        ) {
          const startDiff = actualStartDate
            .startOf('day')
            .diff(planEndDate.startOf('day'), 'days').days;
          const nowDiff = now
            .startOf('day')
            .diff(planEndDate.startOf('day'), 'days').days;
          if (startDiff > 0 || nowDiff > 0) {
            itemLate = 2;
          }
        }

        if (
          actualStartDate &&
          actualStartDate.isValid &&
          actualEndDate &&
          actualEndDate.isValid &&
          planEndDate &&
          planEndDate.isValid
        ) {
          const endDiff = actualEndDate
            .startOf('day')
            .diff(planEndDate.startOf('day'), 'days').days;
          if (endDiff > 0) {
            itemLate = 1;
          }
        }

        if (
          !actualStartDate &&
          !actualEndDate &&
          planEndDate &&
          planEndDate.isValid
        ) {
          const nowDiff = now
            .startOf('day')
            .diff(planEndDate.startOf('day'), 'days').days;
          if (nowDiff > 0) {
            itemLate = 2;
          }
        }

        if (
          planStartDate &&
          planStartDate.isValid &&
          !planEndDate &&
          !actualStartDate &&
          !actualEndDate
        ) {
          const nowDiff = now
            .startOf('day')
            .diff(planStartDate.startOf('day'), 'days').days;
          if (nowDiff > 0) {
            itemLate = 2;
          }
        }

        // Cập nhật ItemLate cho row
        const currentItemLate = data.ItemLate || 0;
        if (currentItemLate !== itemLate) {
          row.update({ ItemLate: itemLate });
        }
      });

      // Redraw với false để chỉ redraw cells, không reset scroll (Tabulator tự động giữ scroll position)
      this.tb_workItem.redraw(false);
    } catch (error) {
      console.error('❌ LỖI khi tính ItemLate:', error);
    }
  }

  // Method để tạo dropdown control trong tabulator
  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    getData: () => any[],
    config: {
      valueField: string;
      labelField: string;
      placeholder?: string;
    }
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.display = 'block';
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      const data = getData();
      componentRef.instance.id = cell.getValue();
      componentRef.instance.data = data;

      componentRef.instance.valueField = config.valueField;
      componentRef.instance.labelField = config.labelField;
      if (config.placeholder) {
        componentRef.instance.placeholder = config.placeholder;
      }

      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      const hostEl = (componentRef.hostView as any).rootNodes[0];
      if (hostEl && hostEl.style) {
        hostEl.style.width = '100%';
        hostEl.style.display = 'block';
      }
      container.appendChild(hostEl);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {});

      return container;
    };
  }
  // Custom date editor để xử lý date picker đúng cách
  dateEditor(cell: any, onRendered: any, success: any, cancel: any) {
    const input = document.createElement('input');
    input.type = 'date';

    // Lấy giá trị hiện tại và chuyển đổi sang format yyyy-MM-dd
    const currentValue = cell.getValue();
    if (currentValue) {
      let dateValue = '';
      if (currentValue instanceof Date) {
        dateValue = DateTime.fromJSDate(currentValue).toFormat('yyyy-MM-dd');
      } else if (typeof currentValue === 'string') {
        const dt = DateTime.fromISO(currentValue);
        if (dt.isValid) {
          dateValue = dt.toFormat('yyyy-MM-dd');
        } else {
          // Thử format khác
          const dt2 = DateTime.fromFormat(currentValue, 'dd/MM/yyyy');
          if (dt2.isValid) {
            dateValue = dt2.toFormat('yyyy-MM-dd');
          }
        }
      }
      input.value = dateValue;
    }

    onRendered(() => input.focus());

    input.addEventListener('change', () => {
      if (input.value) {
        // Chuyển đổi từ yyyy-MM-dd sang ISO string
        const dt = DateTime.fromFormat(input.value, 'yyyy-MM-dd');
        if (dt.isValid) {
          success(dt.toISO());
        } else {
          success(input.value);
        }
      } else {
        success(null);
      }
    });

    input.addEventListener('blur', () => {
      if (input.value) {
        const dt = DateTime.fromFormat(input.value, 'yyyy-MM-dd');
        if (dt.isValid) {
          success(dt.toISO());
        } else {
          success(input.value);
        }
      } else {
        success(null);
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (input.value) {
          const dt = DateTime.fromFormat(input.value, 'yyyy-MM-dd');
          if (dt.isValid) {
            success(dt.toISO());
          } else {
            success(input.value);
          }
        } else {
          success(null);
        }
      }
      if (e.key === 'Escape') {
        cancel();
      }
    });

    return input;
  }
  // Load tất cả dropdown và đợi hoàn thành
  loadAllDropdowns(): Promise<void> {
    return new Promise((resolve) => {
      let completedCount = 0;
      const totalCount = 3; // Số lượng dropdown cần load

      const checkComplete = () => {
        completedCount++;
        if (completedCount === totalCount) {
          console.log('✅ Tất cả dropdown đã load xong');
          resolve();
        }
      };

      // Load EmployeeRequest
      this.workItemService.cbbEmployeeRequest().subscribe(
        (response: any) => {
          if (response.status === 1) {
            console.log('cbbEmployeeRequest', response.data);
            this.cbbEmployeeRequest = response.data.map((item: any) => ({
              id: item.ID,
              name: item.FullName,
            }));
          }
          checkComplete();
        },
        () => checkComplete()
      ); // Hoàn thành ngay cả khi lỗi

      // Load TypeProject
      this.workItemService.cbbTypeProject().subscribe(
        (response: any) => {
          if (response.status === 1) {
            console.log('cbbTypeProject response.data', response.data);
            this.cbbTypeProject = response.data.map((item: any) => ({
              id: item.ID,
              name: item.ProjectTypeName,
            }));
            console.log('cbbTypeProject mapped', this.cbbTypeProject);
          }
          checkComplete();
        },
        () => checkComplete()
      );

      // Load Employee/User
      this.workItemService.cbbUser().subscribe(
        (response: any) => {
          if (response.status === 1) {
            console.log('cbbUser response.data', response.data);
            // Map cả ID và UserID để hỗ trợ cả hai trường hợp
            this.cbbEmployee = response.data.map((item: any) => ({
              id: item.UserID || item.ID, // Ưu tiên UserID, nếu không có thì dùng ID
              name: item.FullName,
            }));
            this.cbbUser = response.data.map((item: any) => ({
              id: item.ID,
              name: item.Code + ' - ' + item.FullName,
              code: item.Code,
              fullName: item.FullName,
            }));
            console.log('cbbUser', this.cbbUser);
          }
          checkComplete();
        },
        () => checkComplete()
      );
    });
  }

  loadCbbEmployeeRequest(): void {
    this.workItemService.cbbEmployeeRequest().subscribe((response: any) => {
      if (response.status === 1) {
        console.log('cbbEmployeeRequest', response.data);
        this.cbbEmployeeRequest = response.data.map((item: any) => ({
          id: item.ID,
          name: item.FullName,
        }));
        // Reload bảng để cập nhật label
        this.reloadTableData();
      }
    });
  }
  loadCbbTypeProject(): void {
    this.workItemService.cbbTypeProject().subscribe((response: any) => {
      if (response.status === 1) {
        console.log('cbbTypeProject response.data', response.data);
        this.cbbTypeProject = response.data.map((item: any) => ({
          id: item.ID,
          name: item.ProjectTypeName,
        }));
        console.log('cbbTypeProject mapped', this.cbbTypeProject);
        // Reload bảng để cập nhật label
        this.reloadTableData();
      }
    });
  }
  loadCbbEmployee(): void {
    this.workItemService.cbbUser().subscribe((response: any) => {
      if (response.status === 1) {
        console.log('cbbUser response.data', response.data);
        // Map cả ID và UserID để hỗ trợ cả hai trường hợp
        this.cbbEmployee = response.data.map((item: any) => ({
          id: item.UserID || item.ID, // Ưu tiên UserID, nếu không có thì dùng ID
          name: item.FullName,
        }));
        this.cbbUser = response.data.map((item: any) => ({
          id: item.ID,
          name: item.Code + ' - ' + item.FullName,
          code: item.Code,
          fullName: item.FullName,
        }));
        console.log('cbbUser', this.cbbUser);
        // Reload bảng để cập nhật label
        this.reloadTableData();
      }
    });
  }

  // Reload lại dữ liệu bảng để cập nhật label của dropdown
  reloadTableData(): void {
    if (
      this.tb_workItem &&
      this.dataTableWorkItem &&
      this.dataTableWorkItem.length > 0
    ) {
      // Redraw với false để chỉ redraw cells, không reset scroll (Tabulator tự động giữ scroll position)
      this.tb_workItem.redraw(false);
    }
  }
  loadData(): void {
    this.isLoadTable = true;
    this.workItemService
      .getWorkItems(this.projectId)
      .subscribe((response: any) => {
        if (response.status === 1) {
          const flatData = response.data || [];
          this.dataTableWorkItem = this.buildTree(
            flatData,
            'ID',
            'ParentID',
            '_children'
          ); // Chuyển sang tree
          console.log('Tree data:', this.dataTableWorkItem);

          if (this.tb_workItem) {
            this.tb_workItem.setData(this.dataTableWorkItem).then(() => {
              // Áp dụng filter ngay sau setData, trước khi redraw để tránh hiển thị tất cả dữ liệu
              this.filterByStatus();
              
              // Redraw với false để chỉ redraw cells, không reset scroll
              setTimeout(() => {
                this.tb_workItem.redraw(false);
                // Tính toán ItemLate cho tất cả rows
                this.updateItemLate();
              }, 100);
            });
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
        this.isLoadTable = false;
      });
  }
  openModalReson() {
    this.notification.info('dhjd', 'thêm');
  }
  openModalProjectItemFile() {
    this.notification.info('dhjd', 'File');
  }
  // Hàm flatten tree data thành flat array
  private flattenTreeData(
    treeData: any[],
    flatList: any[] = [],
    parentId: number | null = null
  ): any[] {
    treeData.forEach((item: any) => {
      // Lấy dữ liệu từ item, loại bỏ _children
      const { _children, ...itemData } = item;

      // Tạo item mới với ParentID đúng
      const flatItem = {
        ...itemData,
        ParentID: parentId !== null ? parentId : itemData.ParentID || 0,
      };

      flatList.push(flatItem);

      // Đệ quy xử lý children nếu có
      if (_children && Array.isArray(_children) && _children.length > 0) {
        this.flattenTreeData(_children, flatList, itemData.ID);
      }
    });

    return flatList;
  }

  saveData(): void {
    if (!this.tb_workItem) {
      this.notification.warning(
        'Thông báo',
        'Bảng dữ liệu chưa được khởi tạo!'
      );
      return;
    }

    // Lấy tất cả dữ liệu từ Tabulator (tree structure)
    const treeData = this.tb_workItem.getData('tree');

    if (!treeData || treeData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      return;
    }

    console.log('Tree data before flatten:', treeData);

    // Flatten tree thành flat array
    const flatData = this.flattenTreeData(treeData);

    console.log('Flat data:', flatData);

    // Map dữ liệu theo format API yêu cầu
    const projectItems = flatData.map((item: any) => {
      return {
        ID: item.ID || 0,
        Status: item.Status ?? 0,
        STT:
          item.STT !== null && item.STT !== undefined ? String(item.STT) : '',
        UserID: item.UserID ?? 0,
        ProjectID: this.projectId,
        Mission: item.Mission || '',
        PlanStartDate: item.PlanStartDate
          ? new Date(item.PlanStartDate).toISOString()
          : null,
        PlanEndDate: item.PlanEndDate
          ? new Date(item.PlanEndDate).toISOString()
          : null,
        ActualStartDate: item.ActualStartDate
          ? new Date(item.ActualStartDate).toISOString()
          : null,
        ActualEndDate: item.ActualEndDate
          ? new Date(item.ActualEndDate).toISOString()
          : null,
        Note: item.Note || '',
        TotalDayPlan: item.TotalDayPlan ?? 0,
        PercentItem: item.PercentItem ?? 0,
        ParentID: item.ParentID ?? 0,
        TotalDayActual: item.TotalDayActual ?? 0,
        ItemLate: item.ItemLate ?? 0,
        TimeSpan: item.TimeSpan ?? 0,
        TypeProjectItem: item.TypeProjectItem ?? 0,
        PercentageActual: item.PercentageActual || 0,
        EmployeeIDRequest: item.EmployeeIDRequest ?? 0,
        UpdatedDateActual: item.UpdatedDateActual
          ? new Date(item.UpdatedDateActual).toISOString()
          : null,
        IsApproved: item.IsApproved ?? 0,
        Code: item.Code || '',
        CreatedDate: item.CreatedDate
          ? new Date(item.CreatedDate).toISOString()
          : null,
        CreatedBy: item.CreatedBy || '',
        UpdatedDate: item.UpdatedDate
          ? new Date(item.UpdatedDate).toISOString()
          : null,
        UpdatedBy: item.UpdatedBy || '',
        IsUpdateLate: item.IsUpdateLate ?? false,
        ReasonLate: item.ReasonLate || '',
        UpdatedDateReasonLate: item.UpdatedDateReasonLate
          ? new Date(item.UpdatedDateReasonLate).toISOString()
          : null,
        IsApprovedLate: item.IsApprovedLate ?? false,
        EmployeeRequestID: item.EmployeeRequestID ?? 0,
        EmployeeRequestName: item.EmployeeRequestName || '',
        IsDeleted: item.IsDeleted ?? false,
      };
    });

    // Tạo payload
    const payload = {
      projectItem: projectItems,
      ProjectID: this.projectId,
      DeletedIdsprojectItem: this.deletedIdsWorkItem,
    };

    console.log('Payload to send:', payload);

    // Gửi lên API
    this.isLoadTable = true;
    this.workItemService.saveData(payload).subscribe({
      next: (response: any) => {
        this.isLoadTable = false;
        if (response.status === 1) {
          this.notification.success('Thông báo', 'Lưu dữ liệu thành công!');
          // Reload data sau khi lưu thành công
          this.loadData();
        } else {
          this.notification.error(
            'Lỗi',
            response.message || 'Có lỗi xảy ra khi lưu dữ liệu!'
          );
        }
      },
      error: (error: any) => {
        this.isLoadTable = false;
        console.error('Error saving data:', error);
        this.notification.error(
          'Lỗi',
          error.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu!'
        );
      },
    });
  }
  private flattenTreeRows(rows: any[]): any[] {
    const result: any[] = [];

    rows.forEach((row: any) => {
      result.push(row);

      // Lấy tree children từ Tabulator
      const treeChildren = row.getTreeChildren();
      if (treeChildren && treeChildren.length > 0) {
        // Đệ quy flatten children
        const flatChildren = this.flattenTreeRows(treeChildren);
        result.push(...flatChildren);
      }
    });

    return result;
  }

  // Helper function để tính Code mới - tương tự logic WinForm
  private getNewCode(): string {
    // Lấy tất cả Code từ dataTableWorkItem (flatten tree để lấy tất cả rows)
    const getAllCodes = (items: any[]): string[] => {
      const codes: string[] = [];
      items.forEach((item: any) => {
        if (item.Code) {
          codes.push(item.Code);
        }
        if (item._children && item._children.length > 0) {
          codes.push(...getAllCodes(item._children));
        }
      });
      return codes;
    };

    const allCodes = this.dataTableWorkItem
      ? getAllCodes(this.dataTableWorkItem)
      : [];

    // Tách số sau dấu "_" từ mỗi Code
    const codeNumbers: number[] = [];
    allCodes.forEach((code: string) => {
      const parts = code.split('_');
      if (parts.length > 1) {
        const num = parseInt(parts[parts.length - 1], 10); // Lấy phần cuối sau dấu "_"
        if (!isNaN(num) && num > 0) {
          codeNumbers.push(num);
        }
      }
    });

    // Tìm số lớn nhất và +1
    const maxCodeNumber = codeNumbers.length > 0 ? Math.max(...codeNumbers) : 0;
    const newCodeNumber = maxCodeNumber + 1;

    // Trả về Code mới: ProjectCode_<số>
    return `${this.projectCode}_${newCodeNumber}`;
  }

  addNewRow(): void {
    let maxSTT = 0;

    if (this.dataTableWorkItem && this.dataTableWorkItem.length > 0) {
      const sttValues = this.dataTableWorkItem
        .map((item: any) => parseInt(item.STT, 10))
        .filter((stt: number) => !isNaN(stt) && stt > 0);

      if (sttValues.length > 0) {
        maxSTT = Math.max(...sttValues);
      }
    }

    const newSTT = maxSTT + 1;
    this.nextRowId = this.nextRowId - 1;

    // Tính Code mới dựa trên số lớn nhất trong tất cả Code hiện có
    const newCode = this.getNewCode();

    const newRow = {
      ParentID: 0,
      ID: this.nextRowId,
      STT: newSTT,
      TotalDayPlan: 0,
      PercentItem: 0,
      Status: 0,
      UserID: this.currentUser.ID,
      IsApprovedText: 'Chờ duyệt kế hoạch',
      Code: newCode,
      _children: [],
    };

    // Thêm dòng mới vào đầu mảng để nó hiển thị đầu tiên
    this.dataTableWorkItem = [newRow, ...this.dataTableWorkItem];
    
    // Sort dataTableWorkItem theo STT giảm dần (chỉ sort các parent rows, giữ nguyên children)
    this.dataTableWorkItem.sort((a: any, b: any) => {
      const aSTT = parseInt(a.STT, 10) || 0;
      const bSTT = parseInt(b.STT, 10) || 0;
      return bSTT - aSTT; // Giảm dần
    });

    // Reload table
    if (this.tb_workItem) {
      this.tb_workItem.setData(this.dataTableWorkItem);

      // Đợi table render xong rồi focus vào row mới
      setTimeout(() => {
        // Tìm row mới theo ID
        const newRowInstance = this.tb_workItem.getRow(this.nextRowId);
        if (newRowInstance) {
          // Select và scroll đến row mới
          newRowInstance.select();
          newRowInstance.scrollTo();
          // Cập nhật selectedRow để có thể thêm con ngay
          this.selectedRow = newRowInstance;
          // Trigger click để focus
          const rowElement = newRowInstance.getElement();
          if (rowElement) {
            rowElement.click();
          }

        }

        // Tính lại phần trăm
        this.updatePercent();
      }, 150);
    }
  }

  // Helper function để tìm node trong tree data
  private findNodeInTree(items: any[], targetId: number): any | null {
    for (const item of items) {
      if (item.ID === targetId) {
        return item;
      }
      if (item._children && item._children.length > 0) {
        const found = this.findNodeInTree(item._children, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  addChildRow(): void {
    const selectedRows = this.tb_workItem.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một hạng mục trước khi thêm hạng mục con!'
      );
      return;
    }

    const selectedRow = selectedRows[0]; // Lấy row đầu tiên
    const parentData = selectedRow.getData();
    const parentId = parentData.ID;

    // Kiểm tra cấp độ: chỉ cho phép thêm con đến cấp < 2
    // Nếu parent đã có ParentID > 0 (tức là parent đã là con - cấp 1), thì không cho thêm con (cấp 2)
    const parentParentID = parentData.ParentID || 0;
    if (parentParentID > 0) {
      this.notification.warning(
        'Thông báo',
        'Không thể thêm hạng mục cấp thấp hơn!'
      );
      return;
    }

    this.nextRowId = this.nextRowId - 1;
    // ✅ QUAN TRỌNG: Lấy children từ dataTableWorkItem (source data) để đảm bảo dữ liệu mới nhất
    const parentNode = this.findNodeInTree(this.dataTableWorkItem, parentId);
    const currentChildren = parentNode ? parentNode._children || [] : [];

    // Tìm STT lớn nhất trong các anh em (children cùng parent)
    let maxSTT = 0;
    if (currentChildren.length > 0) {
      const sttValues = currentChildren
        .map((child: any) => {
          const stt = parseInt(child.STT, 10);
          console.log(
            `  - Child ID: ${child.ID}, STT: ${child.STT} (parsed: ${stt})`
          );
          return stt;
        })
        .filter((stt: number) => !isNaN(stt) && stt > 0);

      if (sttValues.length > 0) {
        maxSTT = Math.max(...sttValues);
        console.log(`📊 Max STT trong children: ${maxSTT}`);
      }
    }

    // STT mới = STT lớn nhất của anh em + 1
    const newSTT = maxSTT + 1;
    console.log(`✅ STT mới sẽ là: ${newSTT}`);

    // Tính Code mới dựa trên số lớn nhất trong tất cả Code hiện có (không phân biệt cha hay con)
    const newCode = this.getNewCode();

    const childRow: any = {
      ID: this.nextRowId,
      STT: newSTT,
      ParentID: parentData.ID || 0,
      Code: newCode,
      TotalDayPlan: 0,
      PercentItem: 0,
      Status: 0,
      UserID: this.currentUser.ID,
      IsApprovedText: 'Chờ duyệt kế hoạch',
      IsDeleted: false,
      Mission: '',
      ReasonLate: '',
      _children: [],
      // Không copy các trường này từ cha để row con có màu trắng (mặc định)
      ItemLate: 0,
      ItemLateActual: 0,
      ActualEndDate: null,
      PlanEndDate: null,
      TotalDayExpridSoon: 0,
    };

    // Copy các trường từ parent (loại trừ các trường không cần copy)
    Object.keys(parentData).forEach((key) => {
      // Loại trừ các trường không nên copy từ parent
      const excludeFields = [
        'ID',
        'STT',
        'ParentID',
        'Code',
        '_children',
        'IsDeleted',
        'IsApprovedText',
        'TotalDayPlan',
        'PercentItem',
        'ItemLate', // Không copy ItemLate từ cha
        'ItemLateActual', // Không copy ItemLateActual từ cha
        'ActualEndDate', // Không copy ActualEndDate từ cha
        'PlanEndDate', // Không copy PlanEndDate từ cha
        'TotalDayExpridSoon', // Không copy TotalDayExpridSoon từ cha
      ];

      if (!excludeFields.includes(key)) {
        childRow[key] = parentData[key];
      }
    });

    console.log('✅ Đã tạo child row:', childRow);

    // Update tree data
    const updateTreeData = (items: any[]): any[] => {
      return items.map((item) => {
        if (item.ID === parentId) {
          return {
            ...item,
            _children: [...(item._children || []), childRow],
          };
        } else if (item._children && item._children.length > 0) {
          return {
            ...item,
            _children: updateTreeData(item._children),
          };
        }
        return item;
      });
    };

    this.dataTableWorkItem = updateTreeData(this.dataTableWorkItem);

    console.log('🔄 Reloading table với data mới...');
    this.tb_workItem.setData(this.dataTableWorkItem);
    setTimeout(() => {
      console.log('🔍 Tìm parent row để expand...');
      const parentRow = this.tb_workItem.getRow(parentId);

      if (parentRow) {
        console.log('✓ Tìm thấy parent, expanding...');
        parentRow.treeExpand();
        this.selectedRow = parentRow;

        // Đợi expand xong
        setTimeout(() => {
          console.log('🔍 Tìm child row mới...');

          // Kiểm tra xem child đã được render chưa
          const treeChildren = parentRow.getTreeChildren();
          console.log('Tree children:', treeChildren.length);

          if (treeChildren && treeChildren.length > 0) {
            const newChildRow = treeChildren[treeChildren.length - 1];
            console.log('✓ Tìm thấy child row mới');

            // Select và scroll đến child row mới
            newChildRow.select();
            newChildRow.scrollTo();
            // Cập nhật selectedRow để có thể thêm con tiếp nếu cần
            this.selectedRow = newChildRow;
            // Trigger click để focus
            const rowElement = newChildRow.getElement();
            if (rowElement) {
              rowElement.click();
            }
          }

          // ✅ TÍNH LẠI PHẦN TRĂM SAU KHI EXPAND
          console.log('📊 Tính lại phần trăm...');
          this.updatePercent();
        }, 150);
      } else {
        console.error('❌ Không tìm thấy parent row!');
        // Vẫn tính phần trăm dù không tìm thấy parent
        this.updatePercent();
      }
    }, 100);
  }
  buildTree(
    data: any[],
    idField = 'ID',
    parentField = 'ParentID',
    childrenField = '_children'
  ) {
    const tree: any[] = [];
    const lookup: { [key: string]: any } = {};

    // Tạo lookup nhanh theo ID
    data.forEach((item) => {
      lookup[item[idField]] = { ...item, [childrenField]: [] };
    });

    // Duyệt data để gán con vào cha
    data.forEach((item) => {
      const parentId = item[parentField];
      if (parentId && lookup[parentId]) {
        lookup[parentId][childrenField].push(lookup[item[idField]]);
      } else {
        tree.push(lookup[item[idField]]);
      }
    });

    return tree;
  }
  private removeFromTree(items: any[], idToRemove: number): any[] {
    return items
      .filter((item) => item.ID !== idToRemove) // Lọc bỏ item có ID trùng
      .map((item) => {
        // Nếu có children, đệ quy xóa trong children
        if (item._children && item._children.length > 0) {
          return {
            ...item,
            _children: this.removeFromTree(item._children, idToRemove),
          };
        }
        return item;
      });
  }
  // Method 1: Thu thập tất cả ID trong cây (cha + con + con của con...)
  private collectAllIds(item: any): number[] {
    const ids: number[] = [item.ID]; // Bắt đầu với ID của cha

    // Nếu có children, đệ quy thu thập ID của children
    if (item._children && item._children.length > 0) {
      item._children.forEach((child: any) => {
        ids.push(...this.collectAllIds(child)); // Đệ quy
      });
    }

    return ids;
  }
  //#region vẽ bảng
  drawTbWorkItem(container: HTMLElement) {
    this.tb_workItem = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      //data: this.dataTableWorkItem,
      dataTree: true,
      dataTreeStartExpanded: true,
      dataTreeChildField: '_children', // Quan trọng: dùng _children
      paginationMode: 'local',
      layout: 'fitDataStretch',
      selectableRows: 1,
      history: true,
      rowFormatter: (row: any) => {
        const data = row.getData();

        // Reset màu mặc định
        row.getElement().style.backgroundColor = '';
        row.getElement().style.color = '';

        // Kiểm tra xem có children không (parent node)
        const hasChildren = data._children && data._children.length > 0;

        // Lấy giá trị ItemLate và ItemLateActual
        const itemLate = parseInt(data['ItemLate'] || '0');
        const itemLateActual = parseInt(data['ItemLateActual'] || '0');
        const totalDayExpridSoon = parseInt(data['TotalDayExpridSoon'] || '0');
        const planEndDate = data['PlanEndDate']
          ? DateTime.fromISO(data['PlanEndDate'])
          : null;
        const actualEndDate = data['ActualEndDate']
          ? DateTime.fromISO(data['ActualEndDate'])
          : null;
        const hasActualEndDate = actualEndDate && actualEndDate.isValid;

        // Áp dụng màu theo thứ tự ưu tiên (giống WinForm)
        // Lưu ý: Màu đỏ (ItemLate = 2) ưu tiên cao nhất, kể cả parent nodes

        // 1. ItemLate = 2 hoặc ItemLateActual = 2: Red + White text (ưu tiên cao nhất, kể cả parent)
        if (itemLate === 2 || itemLateActual === 2) {
          row.getElement().style.backgroundColor = 'Red';
          row.getElement().style.color = 'White';
          return; // Dừng lại
        }

        // 2. ItemLate = 1 hoặc ItemLateActual = 1: Orange (ưu tiên cao hơn parent)
        if (itemLate === 1 || itemLateActual === 1) {
          row.getElement().style.backgroundColor = 'Orange';
          return; // Dừng lại
        }

        // 3. Parent nodes: LightGray (chỉ khi không có ItemLate = 1 hoặc 2)
        if (hasChildren) {
          row.getElement().style.backgroundColor = 'LightGray';
          return; // Dừng lại
        }

        // 4. Sắp hết hạn: LightYellow (ưu tiên thấp nhất)
        // Điều kiện: PlanEndDate != null AND TotalDayExpridSoon <= 3 AND (ActualEndDate is null or empty)
        if (
          planEndDate &&
          planEndDate.isValid &&
          totalDayExpridSoon <= 3 &&
          !hasActualEndDate
        ) {
          row.getElement().style.backgroundColor = 'LightYellow';
        }
      },
      columns: [
        {
          title: '',
          field: 'addRow',
          hozAlign: 'center',
          width: 40,
          frozen: true,
          headerSort: false,
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-white cursor-pointer" title="Thêm dòng"></i></div>`,
          headerClick: () => {
            this.addNewRow();
          },
          formatter: (cell) => {
            const data = cell.getRow().getData();
            let isDeleted = data['IsDeleted'];
            if (isDeleted) {
              return '';
            }

            // Kiểm tra màu nền của row để set màu button phù hợp
            const itemLate = parseInt(data['ItemLate'] || '0');
            const itemLateActual = parseInt(data['ItemLateActual'] || '0');

            // Nếu row có nền đỏ (ItemLate = 2) hoặc cam (ItemLate = 1), button phải màu trắng
            let buttonColor = 'text-danger'; // Mặc định màu đỏ
            if (
              itemLate === 1 ||
              itemLate === 2 ||
              itemLateActual === 1 ||
              itemLateActual === 2
            ) {
              buttonColor = 'text-white'; // Màu trắng cho nền đỏ/cam
            }

            return `<button id="btn-header-click" class="btn ${buttonColor} p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`;
          },
          cellClick: (e, cell) => {
            let data = cell.getRow().getData();
            let id = data['ID'];
            let isDeleted = data['IsDeleted'];

            if (isDeleted) {
              return;
            }

            this.modal.confirm({
              nzTitle: `Bạn có chắc chắn muốn xóa hạng mục `,
              nzContent: `${data['Code']}?\nThao tác này sẽ xóa tất cả các hạng mục con của hạng mục này!`,
              nzOkText: 'Xóa',
              nzOkType: 'primary',
              nzCancelText: 'Hủy',
              nzOkDanger: true,
              nzOnOk: () => {
                // Kiểm tra quyền trước (giống WinForm)
                debugger;
                if (data['ID'] > 0) {
                  // Kiểm tra IsAdmin trước
                  const isAdmin = this.currentUser?.IsAdmin || this.currentUser?.ISADMIN || false;
                  
                  if (!isAdmin) {
                    const isApproved = data['IsApproved'] || 0;
                    const isApprovedText = data['IsApprovedText'] || '';
                    
                    if (isApproved > 0) {
                      this.notification.warning(
                        'Thông báo',
                        `Hạng mục này đang ${isApprovedText}!`
                      );
                      return;
                    }

                    // Kiểm tra quyền TBP và PBP (giống WinForm)
                    const currentEmployeeID = this.currentUser?.EmployeeID || 0;
                    const headOfDepartment = this.currentUser?.HeadofDepartment || this.currentUser?.HeadOfDepartment || 0;
                    const positionCode = this.currentUser?.PositionCode || '';
                    
                    const isTBP = 
                      currentEmployeeID == 54 || 
                      currentEmployeeID == headOfDepartment;
                    const isPBP = 
                      positionCode == 'CV57' || 
                      positionCode == 'CV28';

                    if (!isTBP && !isPBP) {
                      this.notification.warning(
                        'Thông báo',
                        'Bạn không thể xoá.\nVui lòng liên hệ TBP'
                      );
                      return;
                    }
                  }
                }
                const idsToDelete = this.collectAllIds(data);
                console.log('IDs sẽ xóa (bao gồm children):', idsToDelete);
                idsToDelete.forEach((deleteId) => {
                  if (
                    deleteId > 0 &&
                    !this.deletedIdsWorkItem.includes(deleteId)
                  ) {
                    this.deletedIdsWorkItem.push(deleteId);
                  }
                });

                //  Xóa trong source data
                this.dataTableWorkItem = this.removeFromTree(
                  this.dataTableWorkItem,
                  id
                );

                // Dùng setData thay vì deleteRow để tránh lỗi
                this.tb_workItem.setData(this.dataTableWorkItem);

                // Tính lại phần trăm sau khi table render xong
                setTimeout(() => {
                  this.updatePercent();
                }, 100);

                console.log('deletedIdsWorkItem:', this.deletedIdsWorkItem);
                console.log(
                  'dataTableWorkItem sau khi xóa:',
                  this.dataTableWorkItem
                );
              },
            });
          },
        },
        {
          title: 'ID',
          field: 'ID',
          visible: false,
        },
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'center',
          width:70,
        },
        {
          title: 'ParentID',
          field: 'ParentID',
          visible: false,
        },
        {
          title: 'Tình trạng',
          field: 'IsApprovedText',
          hozAlign: 'center',
          width: 150,
        },
        { title: 'Mã', field: 'Code', hozAlign: 'center', width: 130 },
        {
          title: 'Kiểu dự án',
          field: 'TypeProjectItem',
          hozAlign: 'center',
          width: 150,
          editor: this.createdControl(
            SelectControlComponent,
            this.injector,
            this.appRef,
            () => this.cbbTypeProject,
            {
              valueField: 'id',
              labelField: 'name',
              placeholder: 'Chọn kiểu dự án',
            }
          ),
          formatter: (cell: any) => {
            const val = cell.getValue();
            if (!val && val !== 0) {
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted">Chọn kiểu dự án</p> <i class="fas fa-angle-down"></i></div>';
            }
            // So sánh với cả number và string
            const valNum = Number(val);
            const valStr = String(val);
            const typeProject = this.cbbTypeProject.find((t: any) => {
              const tIdNum = Number(t.id);
              const tIdStr = String(t.id);
              return (
                t.id == val ||
                t.id === val ||
                tIdNum === valNum ||
                tIdStr === valStr
              );
            });
            if (!typeProject) {
              console.log(
                'Không tìm thấy typeProject với val:',
                val,
                'cbbTypeProject:',
                this.cbbTypeProject
              );
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
            }
            const typeProjectName = typeProject.name;
            return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${typeProjectName}</p> <i class="fas fa-angle-down"></i></div>`;
          },
        },
        {
          title: 'Trạng thái',
          field: 'Status',
          hozAlign: 'center',
          editor: this.createdControl(
            SelectControlComponent,
            this.injector,
            this.appRef,
            () => this.dataStatus,
            {
              valueField: 'id',
              labelField: 'name',
              placeholder: 'Chọn trạng thái',
            }
          ),
          formatter: (cell: any) => {
            const val = cell.getValue();
            if (val === null || val === undefined) {
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted">Chọn trạng thái</p> <i class="fas fa-angle-down"></i></div>';
            }
            const status = this.dataStatus.find((s: any) => s.id === val);
            if (!status) {
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
            }
            const statusName = status.name;
            return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${statusName}</p> <i class="fas fa-angle-down"></i></div>`;
          },
        },
        {
          title: 'Người phụ trách',
          field: 'UserID',
          hozAlign: 'center',
          width: 150,
          editor: this.createdControl(
            SelectControlComponent,
            this.injector,
            this.appRef,
            () => this.cbbEmployee,
            {
              valueField: 'id',
              labelField: 'name',
              placeholder: 'Chọn người phụ trách',
            }
          ),
          formatter: (cell: any) => {
            const val = cell.getValue();
            if (!val && val !== 0) {
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted">Chọn người phụ trách</p> <i class="fas fa-angle-down"></i></div>';
            }
            // So sánh với cả number và string, và cả ID và UserID
            const valNum = Number(val);
            const valStr = String(val);
            const employee = this.cbbEmployee.find((e: any) => {
              const eIdNum = Number(e.id);
              const eIdStr = String(e.id);
              return (
                e.id == val ||
                e.id === val ||
                eIdNum === valNum ||
                eIdStr === valStr
              );
            });
            if (!employee) {
              console.log(
                'Không tìm thấy employee với val:',
                val,
                'cbbEmployee:',
                this.cbbEmployee
              );
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
            }
            const employeeName = employee.name;
            return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
          },
        },
        {
          title: 'Người giao việc',
          field: 'EmployeeIDRequest',
          hozAlign: 'center',
          width: 250,
          editor: this.createdControl(
            SelectControlComponent,
            this.injector,
            this.appRef,
            () => this.cbbEmployeeRequest,
            {
              valueField: 'id',
              labelField: 'name',
              placeholder: 'Chọn người giao việc',
            }
          ),
          formatter: (cell: any) => {
            const val = cell.getValue();
            if (!val) {
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted">Chọn người giao việc</p> <i class="fas fa-angle-down"></i></div>';
            }
            const employee = this.cbbEmployeeRequest.find(
              (e: any) => e.id === val
            );
            if (!employee) {
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
            }
            const employeeName = employee.name;
            return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
          },
        },
        {
          title: 'Mã người yêu cầu',
          field: 'EmployeeRequestID',
          hozAlign: 'center',
          width:250,
          editor: this.createdControl(
            SelectControlComponent,
            this.injector,
            this.appRef,
            () => this.cbbUser,
            {
              valueField: 'id',
              labelField: 'name',
            }
          ),
          formatter: (cell: any) => {
            const val = cell.getValue();
            if (!val) {
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted">Chọn người yêu cầu</p> <i class="fas fa-angle-down"></i></div>';
            }
            const user = this.cbbUser.find((u: any) => u.id === val);
            if (!user) {
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted">Chọn người yêu cầu</p> <i class="fas fa-angle-down"></i></div>';
            }
            const userCode = user.code;
            return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${userCode}</p> <i class="fas fa-angle-down"></i></div>`;
          },
          cellEdited: (cell: any) => {
            const row = cell.getRow();
            const newValue = cell.getValue();
            const selectedUser = this.cbbUser.find(
              (u: any) => u.id === newValue
            );
            if (selectedUser) {
              row.update({
                EmployeeRequestName: selectedUser.fullName,
              });
            }
          },
        },
        {
          title: 'Tên người yêu cầu',
          field: 'EmployeeRequestName',
          hozAlign: 'left',
          editor: 'input',
        },

        {
          title: '%',
          field: 'PercentItem',
          hozAlign: 'right',
          editor: 'input',
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') {
              return '';
            }
            const numValue = Number(value);
            if (isNaN(numValue)) {
              return value;
            }
            return numValue.toFixed(2) + '%';
          },
        },
        {
          title: 'Công việc',
          field: 'Mission',
          hozAlign: 'left',
          editor: 'textarea',
          formatter: 'textarea',
          width: 300,
        },

        // --- KẾ HOẠCH ---
        {
          title: 'KẾ HOẠCH',
          columns: [
            {
              title: 'Ngày bắt đầu',
              field: 'PlanStartDate',
              hozAlign: 'center',
              editor: this.dateEditor.bind(this),
              formatter: (cell: any) => {
                const value = cell.getValue();
                if (!value) return '';
                const dt = DateTime.fromISO(value);
                return dt.isValid ? dt.toFormat('dd/MM/yyyy') : value;
              },
            },
            { title: 'Số ngày', field: 'TotalDayPlan', hozAlign: 'center' },
            {
              title: 'Ngày kết thúc',
              field: 'PlanEndDate',
              hozAlign: 'center',
              editor: this.dateEditor.bind(this),
              formatter: (cell: any) => {
                const value = cell.getValue();
                if (!value) return '';
                const dt = DateTime.fromISO(value);
                return dt.isValid ? dt.toFormat('dd/MM/yyyy') : value;
              },
            },
          ],
        },

        // --- THỰC TẾ ---
        {
          title: 'THỰC TẾ',
          columns: [
            {
              title: 'Ngày bắt đầu',
              field: 'ActualStartDate',
              hozAlign: 'center',
              editor: this.dateEditor.bind(this),
              formatter: (cell: any) => {
                const value = cell.getValue();
                if (!value) return '';
                const dt = DateTime.fromISO(value);
                return dt.isValid ? dt.toFormat('dd/MM/yyyy') : value;
              },
            },
            {
              title: 'Ngày kết thúc',
              field: 'ActualEndDate',
              hozAlign: 'center',
              editor: this.dateEditor.bind(this),
              formatter: (cell: any) => {
                const value = cell.getValue();
                if (!value) return '';
                const dt = DateTime.fromISO(value);
                return dt.isValid ? dt.toFormat('dd/MM/yyyy') : value;
              },
            },
            {
              title: '%',
              field: 'PercentageActual',
              hozAlign: 'right',
              editor: 'input',
            },
          ],
        },

        {
          title: 'Lý do phát sinh',
          field: 'ReasonLate',
          hozAlign: 'left',
          formatter: 'textarea',
          width: 300,
        },
        {
          title: 'Thêm phát sinh',
          field: 'openModalReson',
          hozAlign: 'center',
          width: 40,
          headerSort: false,
          formatter: (cell) => {
            const data = cell.getRow().getData();
            let isDeleted = data['IsDeleted'];
            return !isDeleted
              ? `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`
              : '';
          },
          cellClick: (e, cell) => {
            let data = cell.getRow().getData();
            let projectItemId = data['ID'];
            if (projectItemId > 0) {
              this.openProjectItemProblemDetail(projectItemId);
            } else {
              this.notification.warning(
                'Thông báo',
                'Hạng mục chưa được thêm vào dự án'
              );
              return;
            }
          },
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          hozAlign: 'left',
          editor: 'input',
          formatter: 'textarea',
        },
        {
          title: 'Ngày cập nhật',
          field: 'UpdatedDateActual',
          hozAlign: 'center',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'dd/MM/yyyy HH:mm' },
        },
        { title: 'Người tạo', field: 'CreatedName', hozAlign: 'left' },
        {
          title: 'File đính kèm',
          field: 'openModalProjectItemFile',
          hozAlign: 'center',
          width: 40,
          headerSort: false,
          formatter: (cell) => {
            const data = cell.getRow().getData();
            let isDeleted = data['IsDeleted'];
            return !isDeleted
              ? `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm tệp đính kèm"></i></div>`
              : '';
          },
          cellClick: (e, cell) => {
            let data = cell.getRow().getData();
            let projectItemId = data['ID'];
            if (projectItemId > 0) {
              this.openProjectItemFileDetail(projectItemId);
            } else {
              this.notification.warning(
                'Thông báo',
                'Hạng mục chưa được thêm vào dự án'
              );
              return;
            }
          },
        },
      ],
    });

    // Lưu row đã chọn để thêm con - tham khảo logic từ pokh-detail
    this.tb_workItem.on('rowClick', (e: any, row: any) => {
      this.selectedRow = row;
      console.log('selectedRow', this.selectedRow);
      console.log('_children: ', this.selectedRow.getData()['_children']);
    });

    // Validate cell editing - tương tự ValidatingEditor trong WinForm
    this.tb_workItem.on('cellEditing', (cell: any) => {
      const validation = this.validateCellEditing(cell);
      if (!validation.valid) {
        // Prevent edit và hiển thị thông báo lỗi
        this.notification.warning(
          'Cảnh báo',
          validation.errorText || 'Không thể chỉnh sửa!'
        );
        // Cancel edit
        setTimeout(() => {
          cell.cancelEdit();
        }, 0);
      }
    });

    // Xử lý sau khi edit - tương tự CellValueChanged trong WinForm
    this.tb_workItem.on('cellEdited', (cell: any) => {
      this.handleCellValueChanged(cell);
    });
    // tránh mất scroll position khi reload page
    this.tb_workItem.on("pageLoaded", () => {
      this.tb_workItem.redraw();
    });
  }
  //#endregion

  exportExcel(): void {
    if (!this.tb_workItem) return;

    const treeData = this.tb_workItem.getData('tree');
    if (!treeData || treeData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }

    const allColumns = this.tb_workItem.getColumns();
    const visibleColumns = allColumns.filter((col: any, index: number) => {
      // Bỏ qua cột đầu tiên (cột action) và các cột ẩn
      if (index === 0) return false;
      const colDef = col.getDefinition();
      // Bỏ qua các cột không cần xuất Excel
      const excludeFields = [
        'IsApproved',
        'openModalProjectItemFile', // File đính kèm
        'openModalReson', // Thêm phát sinh
        'addRow'
      ];
      if (excludeFields.includes(colDef.field)) return false;
      return colDef.visible !== false;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Hạng mục công việc');

    // === HEADER ===
    const headerRow = worksheet.addRow(
      visibleColumns.map((col: any) => col.getDefinition().title)
    );
    headerRow.font = {
      bold: true,
      color: { argb: 'FFFFFF' },
      name: 'Times New Roman',
      size: 12,
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD700' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // === Hàm thêm node (đệ quy) ===
    const addNodeToSheet = (node: any, level: number = 0) => {
      const row = worksheet.addRow([]);

      visibleColumns.forEach((col: any, idx: any) => {
        const field = col.getDefinition().field;
        let value = node[field] ?? '';

        const cell = row.getCell(idx + 1);
        cell.font = { name: 'Times New Roman', size: 11 };

        // 1. Thụt lề cho cột Code và STT (tree structure)
        if ((field === 'Code' || field === 'STT') && level > 0) {
          value = '  '.repeat(level * 2) + value;
        }

        // 2. Xử lý ngày tháng
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          try {
            const dateValue = new Date(value);
            if (!isNaN(dateValue.getTime())) {
              value = dateValue;
              cell.numFmt = 'dd/mm/yyyy';
            }
          } catch (e) {
            // Giữ nguyên giá trị string nếu không parse được
          }
        }

        // 3. Xử lý datetime (UpdatedDateActual)
        if (field === 'UpdatedDateActual' && value) {
          try {
            const dateValue = new Date(value);
            if (!isNaN(dateValue.getTime())) {
              value = dateValue;
              cell.numFmt = 'dd/mm/yyyy hh:mm';
            }
          } catch (e) {
            // Giữ nguyên giá trị string
          }
        }

        // 4. Map value sang label cho các cột có createdControl (dropdown) - phải làm trước khi xử lý number
        // Status
        if (field === 'Status' && value !== null && value !== undefined) {
          const status = this.dataStatus.find((s: any) => s.id === value);
          if (status) {
            value = status.name;
          }
        }

        // 5. Cột số: TotalDayPlan, TotalDayActual, PercentItem, PercentageActual, ItemLate
        const numberFields = [
          'TotalDayPlan',
          'TotalDayActual',
          'PercentItem',
          'PercentageActual',
          'ItemLate',
          'IsApproved',
        ];
        if (numberFields.includes(field)) {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            value = num;
            if (field === 'PercentItem' || field === 'PercentageActual') {
              cell.numFmt = '0.00';
              cell.alignment = { horizontal: 'right' };
            } else {
              cell.numFmt = '0';
              cell.alignment = { horizontal: 'right' };
            }
          } else {
            value = '';
          }
        }

        // 5. Format phần trăm với dấu %
        if (
          (field === 'PercentItem' || field === 'PercentageActual') &&
          value !== ''
        ) {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            cell.numFmt = '0.00"%"';
          }
        }

        // 6. Map value sang label cho các cột có createdControl (dropdown)
        // Nếu không tìm thấy label thì để trống
        // TypeProjectItem
        if (field === 'TypeProjectItem' && value !== null && value !== undefined && value !== '') {
          const valNum = Number(value);
          const valStr = String(value);
          const typeProject = this.cbbTypeProject.find((t: any) => {
            const tIdNum = Number(t.id);
            const tIdStr = String(t.id);
            return (
              t.id == value ||
              t.id === value ||
              tIdNum === valNum ||
              tIdStr === valStr
            );
          });
          if (typeProject) {
            value = typeProject.name;
          } else {
            value = ''; // Không tìm thấy label thì để trống
          }
        }
        
        // Status
        if (field === 'Status' && value !== null && value !== undefined) {
          const status = this.dataStatus.find((s: any) => s.id === value);
          if (status) {
            value = status.name;
          } else {
            value = ''; // Không tìm thấy label thì để trống
          }
        }
        
        // UserID (Người phụ trách) - nếu value = 0 hoặc không có label thì để trống
        if (field === 'UserID') {
          if (value === null || value === undefined || value === 0 || value === '') {
            value = '';
          } else {
            const valNum = Number(value);
            const valStr = String(value);
            const employee = this.cbbEmployee.find((e: any) => {
              const eIdNum = Number(e.id);
              const eIdStr = String(e.id);
              return (
                e.id == value ||
                e.id === value ||
                eIdNum === valNum ||
                eIdStr === valStr
              );
            });
            if (employee) {
              value = employee.name;
            } else {
              value = ''; // Không tìm thấy label thì để trống
            }
          }
        }
        
        // EmployeeIDRequest (Người giao việc/Người yêu cầu) - nếu value = 0 hoặc không có label thì để trống
        if (field === 'EmployeeIDRequest') {
          if (value === null || value === undefined || value === 0 || value === '') {
            value = '';
          } else {
            const employee = this.cbbEmployeeRequest.find((e: any) => e.id === value);
            if (employee) {
              value = employee.name;
            } else {
              value = ''; // Không tìm thấy label thì để trống
            }
          }
        }
        
        // EmployeeRequestID (Mã người yêu cầu) - nếu value = 0 hoặc không có label thì để trống
        if (field === 'EmployeeRequestID') {
          if (value === null || value === undefined || value === 0 || value === '') {
            value = '';
          } else {
            const user = this.cbbUser.find((u: any) => u.id === value);
            if (user) {
              value = user.code || user.name;
            } else {
              value = ''; // Không tìm thấy label thì để trống
            }
          }
        }
        
        // EmployeeRequestName (Tên người yêu cầu) - nếu không có giá trị thì để trống
        if (field === 'EmployeeRequestName') {
          if (!value || value === null || value === undefined || value === '') {
            value = '';
          }
        }

        // 7. Căn chỉnh text
        if (field === 'Mission' || field === 'Note' || field === 'ReasonLate') {
          cell.alignment = {
            horizontal: 'left',
            vertical: 'top',
            wrapText: true,
          };
          row.height = Math.max(row.height || 20, 30); // Tăng chiều cao cho textarea
        } else if (['Code', 'STT', 'IsApprovedText'].includes(field)) {
          cell.alignment = { horizontal: 'center' };
        } else if (numberFields.includes(field)) {
          cell.alignment = { horizontal: 'right' };
        } else {
          cell.alignment = { horizontal: 'left' };
        }

        cell.value = value;
      });

      // Thêm con
      if (node._children && node._children.length > 0) {
        node._children.forEach((child: any) =>
          addNodeToSheet(child, level + 1)
        );
      }
    };

    // === Duyệt root ===
    treeData.forEach((root: any) => addNodeToSheet(root));

    // === Tự động width ===
    worksheet.columns.forEach((column: any, index: number) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const val = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, val.length + 3);
      });
      // Giới hạn width tối đa và tối thiểu
      const colDef = visibleColumns[index]?.getDefinition();
      if (colDef) {
        if (colDef.width) {
          column.width = Math.min(Math.max(colDef.width / 7, 10), 50); // Chuyển đổi từ pixel sang Excel width
        } else {
          column.width = Math.min(Math.max(maxLength, 10), 50);
        }
      } else {
        column.width = Math.min(Math.max(maxLength, 10), 50);
      }
    });

    // === Auto filter ===
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: visibleColumns.length },
    };

    // === Freeze header row ===
    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 1,
      },
    ];

    // === Xuất file ===
    workbook.xlsx
      .writeBuffer()
      .then((buffer) => {
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `HangMucCongViec_${this.projectCode || 'DuAn'}.xlsx`;
        link.click();
        URL.revokeObjectURL(link.href);
        this.notification.success('Thành công', 'Xuất Excel thành công!');
      })
      .catch((error) => {
        console.error('Error exporting Excel:', error);
        this.notification.error('Lỗi', 'Không thể xuất Excel!');
      });
  }
  onsearchData() {}
  onCloseModal(): void {
    this.modalService.dismissAll();
  }

  //#region Xử lý filter trạng thái
  filterByStatus(): void {
    if (!this.tb_workItem) return;

    // Nếu không có trạng thái nào được chọn, hiển thị tất cả
    if (!this.filterStatus || this.filterStatus.length === 0) {
      this.tb_workItem.clearFilter();
      return;
    }

    // Filter theo các giá trị Status đã chọn
    this.tb_workItem.setFilter((data: any) => {
      const status = data.Status;
      // Kiểm tra xem Status có trong danh sách filterStatus không
      return this.filterStatus.includes(status);
    });
  }
  //#endregion

  //#region mở modal
  openProjectItemFileDetail(projectItemId: number): void {
    const modalRef = this.modalService.open(ProjectItemFileComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
    });

    // Set các Input properties
    modalRef.componentInstance.projectItemId = projectItemId;
    modalRef.result
      .then((result: any) => {
        if (result && result.success) {
          this.loadData();
        }
      })
      .catch((error: any) => {
        console.error('Error opening project item file detail:', error);
      });
  }
  openProjectItemProblemDetail(projectItemId: number): void {
    const modalRef = this.modalService.open(ProjectItemProblemComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
    });
    modalRef.componentInstance.projectItemId = projectItemId;
    modalRef.result
      .then((result: any) => {
        if (result && result.success) {
          // Cập nhật cột ReasonLate cho row tương ứng (giống logic WinForm)
          if (result.contentProblem !== undefined && this.tb_workItem) {
            // Flatten tất cả rows (bao gồm children) để tìm row có ID tương ứng
            const rootRows = this.tb_workItem.getRows();
            const allRows = this.flattenTreeRows(rootRows);

            // Tìm row có ID tương ứng với projectItemId
            const targetRow = allRows.find((row: any) => {
              const rowData = row.getData();
              return rowData.ID === projectItemId;
            });

            if (targetRow) {
              // Cập nhật cột ReasonLate với chuỗi đã nối
              targetRow.update({ ReasonLate: result.contentProblem });
            }
          }
        }
      })
      .catch((error: any) => {
        console.error('Error opening project item problem detail:', error);
      });
  }
  //#endregion
}
