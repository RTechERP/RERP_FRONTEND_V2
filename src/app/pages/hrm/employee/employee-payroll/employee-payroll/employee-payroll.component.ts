import { Component, ViewEncapsulation } from '@angular/core';
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
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EmployeePayrollService } from '../employee-payroll-service/employee-payroll.service';
import { EmployeePayrollDetailComponent } from '../employee-payroll-detail/employee-payroll-detail.component';
import { EmployeePayrollReportComponent } from '../employee-payroll-report/employee-payroll-report.component';
import { AppComponent } from '../../../../../app.component';
@Component({
  selector: 'app-employee-payroll',
  templateUrl: './employee-payroll.component.html',
  styleUrls: ['./employee-payroll.component.css'],
  imports: [
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
    CommonModule,
  ],
})
export class EmployeePayrollComponent implements OnInit {
  @ViewChild('tb_employeePayroll', { static: false })
  tb_employeePayrollContainer!: ElementRef;
  tb_employeePayrollBody: any;

  // param filter
  sizeSearch: string = '0';
  keyWord: string = '';
  year: Date = new Date();

  selectedArrEmployeePayroll: Set<any> = new Set();


  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private employeePayrollService: EmployeePayrollService,
    private app: AppComponent
  ) { }

  ngOnInit() {
  }
  ngAfterViewInit(): void {
    this.drawTbEmployeePayroll(this.tb_employeePayrollContainer.nativeElement);
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  refresh() {
    this.year = new Date();
    this.keyWord = '';
    this.selectedArrEmployeePayroll.clear();
    this.drawTbEmployeePayroll(this.tb_employeePayrollContainer.nativeElement);
  }
  filter() {
    this.selectedArrEmployeePayroll.clear();
    this.drawTbEmployeePayroll(this.tb_employeePayrollContainer.nativeElement);
  }
  drawTbEmployeePayroll(container: HTMLElement) {
    this.tb_employeePayrollBody = new Tabulator(container, {
      height: '100%',
      layout: 'fitDataStretch',
      selectableRows: 1,
      rowContextMenu: [
        {
          label: "Xem báo cáo",
          action: (e, row) => {
            this.handlePayrollAction('payrollReport');
          }
        },
        {
          label: "Sửa",
          action: (e, row) => {
            this.handlePayrollAction('update');
          }
        },
        {
          label: "Xóa",
          action: (e, row) => {
            this.handlePayrollAction('delete');
          }
        },
      ],
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 20,
      paginationSizeSelector: [20, 50, 100, 200, 500, 1000, 10000,1000000],
      ajaxURL: this.employeePayrollService.getEmployeePayroll(),
      ajaxParams: {
        keyWord: this.keyWord ?? '',
        year: this.year.getFullYear() ?? new Date().getFullYear(),
      },
      ajaxResponse: (url, params, res) => {
        let totalPage = 0
        if (res.data.length != 0) {
          totalPage = res.data[0].TotalPage;
        }
        return {
          data: res.data,
          last_page: totalPage,
        };
      },
      columns: [
        { title: 'ID', field: 'ID', visible: false },
        { title: 'Kiểu thời gian', field: 'TimeTypeText', visible: false },
        {
          title: "Duyệt",
          field: "isApproved",
          hozAlign: "center",
          headerSort: false,
          formatter: function (cell) {
            let value = cell.getValue();
            return value
              ? "<input type='checkbox' checked readonly style='pointer-events:none'>"
              : "<input type='checkbox' readonly style='pointer-events:none'>";
          }
        }
        ,
        { title: 'Năm', field: '_Year', headerHozAlign: 'center', hozAlign: 'right' },
        { title: 'Tháng', field: '_Month', headerHozAlign: 'center', hozAlign: 'right' },
        { title: 'Tên bảng chấm công', field: 'Name', headerHozAlign: 'center', hozAlign: 'left' },
        { title: 'Ghi chú', field: 'Note', headerHozAlign: 'center', hozAlign: 'left' },
      ],
    });
    this.tb_employeePayrollBody.on('dataLoading', () => {
      this.tb_employeePayrollBody.deselectRow();
    });
    this.tb_employeePayrollBody.on('rowDblClick', (e: any, row: any) => {
      this.handlePayrollAction('update');
    })
    // Lắng nghe sự kiện chọn
    this.tb_employeePayrollBody.on('rowSelected', (row: any) => {
      const id = row.getData().ID;
      this.selectedArrEmployeePayroll.add(row.getData());
    });

    // Click vào row (không phải checkbox) → chỉ chọn 1 row
    this.tb_employeePayrollBody.on('rowClick', (e: any, row: any) => {
      const clickedField = e.target.closest('.tabulator-cell')?.getAttribute('tabulator-field');
      if (clickedField !== 'select') {
        // Bỏ chọn hết và chọn row hiện tại
        this.tb_employeePayrollBody.deselectRow();
        row.select();
      }
    });
    // Lắng nghe sự kiện bỏ chọn
    this.tb_employeePayrollBody.on('rowDeselected', (row: any) => {
      const id = row.getData().ID;
      this.selectedArrEmployeePayroll.delete(row.getData());

    });
  }
  handlePayrollAction(type: string) {
    if (type === 'create') {
      const modalRef = this.modalService.open(EmployeePayrollDetailComponent, {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        scrollable: true,
        size: 'xl'
      });
      modalRef.result.finally(() => {
        this.selectedArrEmployeePayroll.clear();
        this.drawTbEmployeePayroll(this.tb_employeePayrollContainer.nativeElement);
      });
      return;
    }

    if (this.selectedArrEmployeePayroll.size <= 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        `Vui lòng chọn bảng lương cần ${type === 'update' ? 'cập nhật' : type === 'delete' ? 'xóa' : type === 'approve' ? 'duyệt' : type === 'payrollReport' ? 'xem báo cáo' : type === 'bonusPenaltyDetails' ? 'xem chi tiết thưởng phạt' : 'hủy duyệt'}.`
      );
      return;
    }

    const last: any = Array.from(this.selectedArrEmployeePayroll).at(-1);

    switch (type) {
      case 'update': {
        if (last?.isApproved === true) {
          this.notification.create(
            'warning',
            'Thông báo',
            `${last.Name} đã được duyệt, vui lòng hủy duyệt trước khi sửa!`
          );
          return;
        }
        const modalRef = this.modalService.open(EmployeePayrollDetailComponent, {
          backdrop: 'static',
          keyboard: false,
          centered: true,
          scrollable: true,
          size: 'xl'
        });
        modalRef.componentInstance.employeePayrollID = last.ID ?? 0;
        modalRef.result.finally(() => {
          this.selectedArrEmployeePayroll.clear();
          this.drawTbEmployeePayroll(this.tb_employeePayrollContainer.nativeElement);
        });
        break;
      }

      case 'delete': {
        if (last?.isApproved === true) {
          this.notification.create(
            'warning',
            'Thông báo',
            `${last.Name} đã được duyệt, không thể xóa!`
          );
          return;
        }
        this.modal.confirm({
          nzTitle: 'Xác nhận xóa',
          nzContent: `Bạn có chắc chắn muốn xóa bảng lương "${last.Name}" không?`,
          nzOkText: 'Xóa',
          nzCancelText: 'Hủy',
          nzOnOk: () => {
            this.employeePayrollService.postSaveEmployeePayroll({ ID: last.ID, IsDeleted: true }).subscribe({
              next: (data) => {
                if (data.status == 1) {
                  this.notification.create('success', 'Thành công', `Đã xóa bảng lương "${last.Name}".`);
                } else {
                  this.notification.create('error', 'Lỗi', `Không thể xóa bảng lương "${last.Name}".`);
                }
                this.selectedArrEmployeePayroll.clear();
                this.drawTbEmployeePayroll(this.tb_employeePayrollContainer.nativeElement);
              },
              error: () => {
                this.notification.create('error', 'Lỗi', `Không thể xóa bảng lương "${last.Name}".`);
              }
            });
          }
        });
        break;
      }

      case 'approve': {
        if (last?.isApproved === true) {
          this.notification.create('info', 'Thông báo', `${last.Name} đã được duyệt rồi.`);
          return;
        }
        this.modal.confirm({
          nzTitle: 'Xác nhận duyệt',
          nzContent: `Bạn có chắc chắn muốn duyệt bảng lương "${last.Name}" không?`,
          nzOkText: 'Duyệt',
          nzOkType: 'primary',
          nzCancelText: 'Hủy',
          nzOnOk: () => {
            this.employeePayrollService.postSaveEmployeePayroll({ ID: last.ID, isApproved: true }).subscribe({
              next: (data) => {
                if (data.status == 1) {
                  this.notification.create('success', 'Thành công', `Đã duyệt bảng lương "${last.Name}".`);
                } else {
                  this.notification.create('error', 'Lỗi', `Không thể duyệt bảng lương "${last.Name}".`);
                }
                this.selectedArrEmployeePayroll.clear();
                this.drawTbEmployeePayroll(this.tb_employeePayrollContainer.nativeElement);
              },
              error: () => {
                this.notification.create('error', 'Lỗi', `Không thể duyệt bảng lương "${last.Name}".`);
              }
            });
          }
        });
        break;
      }

      case 'unapprove': {
        if (last?.isApproved !== true) {
          this.notification.create('info', 'Thông báo', `${last.Name} chưa được duyệt, không thể hủy.`);
          return;
        }
        this.modal.confirm({
          nzTitle: 'Xác nhận hủy duyệt',
          nzContent: `Bạn có chắc chắn muốn hủy duyệt bảng lương "${last.Name}" không?`,
          nzOkText: 'Hủy duyệt',
          nzOkDanger: true,
          nzCancelText: 'Thoát',
          nzOnOk: () => {
            this.employeePayrollService.postSaveEmployeePayroll({ ID: last.ID, isApproved: false }).subscribe({
              next: (data) => {
                if (data.status == 1) {
                  this.notification.create('success', 'Thành công', `Đã hủy duyệt bảng lương "${last.Name}".`);
                } else {
                  this.notification.create('error', 'Lỗi', `Không thể hủy duyệt bảng lương "${last.Name}".`);
                }
                this.selectedArrEmployeePayroll.clear();
                this.drawTbEmployeePayroll(this.tb_employeePayrollContainer.nativeElement);
              },
              error: () => {
                this.notification.create('error', 'Lỗi', `Không thể hủy duyệt bảng lương "${last.Name}".`);
              }
            });
          }
        });
        break;
      }
      // // báo cáo bảng lương
      // case 'payrollReport': {
      //   this.app.newTab(['/employeePayrollReport', last.ID]);
      //   return;
      // }
      // // chi tiết thưởng phạt
      // case 'bonusPenaltyDetails': {
      //   this.app.newTab(['/employeePayrollBonusDeduction', last.ID]);
      //   return;
      // }
    }

  }

  private notifyResult(action: string, successCount: number, errorCount: number, total: number) {
    if (successCount > 0 && errorCount === 0) {
      this.notification.create('success', 'Thành công', `Đã ${action} ${total} bảng lương.`);
    } else if (successCount > 0 && errorCount > 0) {
      this.notification.create('warning', 'Kết quả', `${action.charAt(0).toUpperCase() + action.slice(1)} thành công ${successCount} bảng lương, lỗi ${errorCount} bảng lương.`);
    } else {
      this.notification.create('error', 'Lỗi', `Không thể ${action} bất kỳ bảng lương nào.`);
    }
    this.selectedArrEmployeePayroll.clear();
    this.drawTbEmployeePayroll(this.tb_employeePayrollContainer.nativeElement);
  }

  async exportExcel() {
    const table = this.tb_employeePayrollBody;
    if (!table) return;

    const data = table.getData?.() ?? [];
    if (!data.length) {
      this.notification?.error?.('', 'Không có dữ liệu để xuất Excel!', {
        nzStyle: { fontSize: '0.75rem' }
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bảng lương');

    // 🔥 Lấy cột đang hiển thị (visible !== false và bỏ rowSelection)
    const columns: any[] = table.getColumns?.() ?? [];
    const filteredColumns = columns.filter(c => {
      const def = c.getDefinition?.();
      return def && def.visible !== false && def.formatter !== 'rowSelection';
    });

    // Header
    const headers = filteredColumns.map(c => c.getDefinition().title ?? '');
    const headerRow = worksheet.addRow(headers);

    headerRow.eachCell(cell => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
      cell.border = { bottom: { style: 'thin' } };
    });

    // Dữ liệu
    data.forEach((row: any) => {
      const rowData = filteredColumns.map((col: any) => {
        const def = col.getDefinition?.() ?? {};
        const field = col.getField?.();
        let value = field ? row[field] : '';

        // isApproved → ✓ / ✗
        if (field === 'isApproved') {
          value = row.isApproved ? '✓' : '✗';
        }

        if (typeof value === 'string') {
          value = value.replace(/(\r\n|\n\r|\r)/g, '\n');
        }

        return value ?? '';
      });

      const r = worksheet.addRow(rowData);

      filteredColumns.forEach((col: any, idx: number) => {
        const align = (col.getDefinition?.().hozAlign || 'left') as string;
        r.getCell(idx + 1).alignment = {
          horizontal: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left',
          vertical: 'middle',
          wrapText: true
        };
      });
    });

    // Auto width
    worksheet.columns.forEach((column: any) => {
      if (!column) return;
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const v = cell.value;
        const s = v instanceof Date ? 'dd/mm/yyyy' : (v ?? '').toString();
        maxLength = Math.max(maxLength, s.length + 2);
      });
      column.width = Math.max(8, Math.min(maxLength, 50));
    });

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length }
    };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const formattedDate = new Date().toISOString().slice(2, 10).split('-').reverse().join('');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BangLuong-${formattedDate}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }


}
