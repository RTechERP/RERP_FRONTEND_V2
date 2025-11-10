import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, AfterViewChecked, IterableDiffers, TemplateRef, input, Input, inject } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, NonNullableFormBuilder } from '@angular/forms';
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
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import { NzInputNumberModule } from "ng-zorro-antd/input-number";
import { PayrollService } from '../payroll.service';
import { ProjectService } from '../../../old/project/project-service/project.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { BonusDeductionDetailComponent } from './bonus-deduction-detail/bonus-deduction-detail.component';
import { ImportExcelComponent } from './import-excel/import-excel.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';
@Component({
  selector: 'app-bonus-deduction',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
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
    CommonModule,
    NzInputNumberModule
  ],
  templateUrl: './bonus-deduction.component.html',
  styleUrl: './bonus-deduction.component.css'
})
export class BonusDeductionComponent implements OnInit {
  //#region Khai báo biến 
  constructor(
    public activeModal: NgbActiveModal,
    private payrollService: PayrollService,
    private projectService: ProjectService,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) { }

  sizeSearch: string = '0';
  // khai báo table
  @ViewChild('tb_bonusPenaltyDetails', { static: false })
  tb_bonusPenaltyDetailsContainer!: ElementRef;
  tb_bonusPenaltyDetailsBody: any;
  @Input() year: any;
  @Input() month: any;
  @Input() payrollId: any;
  keyWord: string = '';
  employeeId: number = 0;
  departmentId: number = 0;
  // select option 
  employees: any[] = [];
  departments: any[] = [];
  employeePayrollID: number = 0;

  selectedEmployeePayrollBonusDeuctions: Set<any> = new Set<any>();

  employeesToChild: any[] = [];

  ngOnInit() {
    this.getEmployee();
    this.getDepartment();
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  ngAfterViewInit(): void {
    this.drawTbBonusPenaltyDetails(this.tb_bonusPenaltyDetailsContainer.nativeElement);
  }
  //#endregion

  //#region hàm chạy
  drawTbBonusPenaltyDetails(container: HTMLElement) {
    this.tb_bonusPenaltyDetailsBody = new Tabulator(container, {
      layout: 'fitDataStretch',
      pagination: true,
      paginationSize: 50,
      paginationSizeSelector: [10, 30, 50, 100, 300, 500],
      paginationMode: 'remote',
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      //   selectableRows: 1,
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
      height: '100%',
      selectableRows: 1,
      groupBy: (data) => `Bộ phận: ${data.Name ?? "Chưa xác định"}`,
      groupHeader: function (value, count, data, group) {
        return `${value}`;
      },
      ajaxURL: this.payrollService.getEmployeePayrollBonusDeduction(),
      ajaxParams: {
        year: this.year.getFullYear(),
        month: this.month,
        employeeID: this.employeeId,
        departmentID: this.departmentId,
        keyword: this.keyWord
      },
      ajaxResponse: (url, params, res) => {
        return {
          data: res.data.data,
          last_page: res.data.TotalPage,
        };
      },
      columns: [
        { title: "Mã nhân viên", field: "Code", width: 120, headerHozAlign: "center", hozAlign: "center", frozen: true },
        { title: "Tên nhân viên", field: "FullName", width: 200, headerHozAlign: "center", frozen: true },
        { title: "Tổng công", field: "TotalWorkDay", width: 120, headerHozAlign: "center", hozAlign: "right" },
        {
          title: "Thưởng KPIs / doanh số", field: "KPIBonus", width: 150, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          },
          headerWordWrap: true,
        },
        {
          title: "Thưởng khác", field: "OtherBonus", width: 120, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
        },
        {
          title: "Tổng thưởng", field: "TotalBonus", width: 120, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
        },
        {
          title: "Mức thu BHXH", field: "Insurances", width: 150, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
        },
        {
          title: "Gửi xe Ô tô", field: "ParkingMoney", width: 120, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
        },
        {
          title: "Phạt 5s", field: "Punish5S", width: 100, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
        },
        {
          title: "Khoản trừ khác", field: "OtherDeduction", width: 150, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
        },
        {
          title: "Ứng lương", field: "SalaryAdvance", width: 120, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
        },
        {
          title: "Tổng trừ", field: "TotalDeduction", width: 120, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
        },
        { title: "Ghi chú", field: "Note", width: 200, headerHozAlign: "center", hozAlign: "left" }
      ]
    });
    this.tb_bonusPenaltyDetailsBody.on('rowDblClick', (e: any, row: any) => {
      // this.handlePayrollDetailAction('edit');
    })
    // Click vào row (không phải checkbox) → chỉ chọn 1 row
    this.tb_bonusPenaltyDetailsBody.on('rowClick', (e: any, row: any) => {
      const clickedField = e.target.closest('.tabulator-cell')?.getAttribute('tabulator-field');
      if (clickedField !== 'select') {
        // Bỏ chọn hết và chọn row hiện tại
        this.tb_bonusPenaltyDetailsBody.deselectRow();
        row.select();
      }
    });
    // Lắng nghe sự kiện chọn
    this.tb_bonusPenaltyDetailsBody.on('rowSelected', (row: any) => {
      const rowData = row.getData();
      this.selectedEmployeePayrollBonusDeuctions.add(rowData);
    });
    // Lắng nghe sự kiện bỏ chọn
    this.tb_bonusPenaltyDetailsBody.on('rowDeselected', (row: any) => {
      const rowData = row.getData();
      this.selectedEmployeePayrollBonusDeuctions.delete(rowData);
    });

  }

  getEmployee() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getDepartment() {
    this.projectService.getDepartment().subscribe({
      next: (response: any) => {
        this.departments = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  handleAction(action: string) {
    if (action === 'create') {
      const modalRef = this.modalService.open(BonusDeductionDetailComponent, {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        scrollable: true,
        size: "xl"
      });
      modalRef.componentInstance.payrollBonusDeuctions = [];
      modalRef.componentInstance.year = this.year;
      modalRef.componentInstance.month = this.month;
      modalRef.result.finally(() => {
        this.drawTbBonusPenaltyDetails(this.tb_bonusPenaltyDetailsContainer.nativeElement);
      });
      return;
    }
    // // nhập xuất excel ở đây
    debugger
    if (this.selectedEmployeePayrollBonusDeuctions.size === 0) {
      let message = action === 'update' ? 'Sửa' : 'Xoá';
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 nhân viên để ' + message + '!');
      return;
    }

    if (action === 'update') {
      const modalRef = this.modalService.open(BonusDeductionDetailComponent, {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        scrollable: true,
        size: "xl"
      });
      modalRef.componentInstance.payrollBonusDeuctions = Array.from(this.selectedEmployeePayrollBonusDeuctions).at(-1);
      modalRef.result.finally(() => {
        this.drawTbBonusPenaltyDetails(this.tb_bonusPenaltyDetailsContainer.nativeElement);
      });
    }
    let payrollBonusDeduction = Array.from(this.selectedEmployeePayrollBonusDeuctions).at(-1);
    if (action === 'delete') {
      this.modal.confirm({
        nzTitle: 'Xác nhận xoá',
        nzContent: `<b style="color: red;">Bạn có chắc chắn muốn xoá chi tiết thưởng phạt nhân viên ${payrollBonusDeduction.FullName}?</b>`,
        nzOkText: 'Xoá',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzOnOk: () => {
          this.payrollService.deleteEmployeePayrollBonusDeduction(payrollBonusDeduction.ID).subscribe({
            next: (data) => {
              if (data.status == 1) {
                this.notification.create('success', 'Thành công', `Đã xóa chi tiết thưởng phạt nhân viên "${payrollBonusDeduction.FullName}".`);
              } else {
                this.notification.create('error', 'Lỗi', `Không thể xóa chi tiết thưởng phạt nhân viên "${payrollBonusDeduction.FullName}".`);
              }
              this.drawTbBonusPenaltyDetails(this.tb_bonusPenaltyDetailsContainer.nativeElement);
            },
            error: () => {
              this.notification.create('error', 'Lỗi', `Không thể xóa chi tiết thưởng phạt nhân viên "${payrollBonusDeduction.FullName}".`);
            }
          });
        },
        nzCancelText: 'Huỷ',
        nzOnCancel: () => {
          this.drawTbBonusPenaltyDetails(this.tb_bonusPenaltyDetailsContainer.nativeElement);
        }
      });
    }
  }

  filter() {
    this.drawTbBonusPenaltyDetails(this.tb_bonusPenaltyDetailsContainer.nativeElement);
  }
  reset() {
    this.year = new Date();
    this.month = this.year.getMonth() + 1;
    this.keyWord = '';
    this.employeeId = 0;
    this.departmentId = 0;
    this.drawTbBonusPenaltyDetails(this.tb_bonusPenaltyDetailsContainer.nativeElement);
  }

  importexcel() {
    const modalRef = this.modalService.open(ImportExcelComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
      //modalDialogClass: 'modal-fullscreen modal-dialog-scrollable'
    });
    modalRef.componentInstance.month = this.month ?? 0;
    modalRef.componentInstance.year = this.year.getFullYear() ?? 0;
    modalRef.result.finally(() => {
      this.drawTbBonusPenaltyDetails(this.tb_bonusPenaltyDetailsContainer.nativeElement);
    });

  }
  //#region xuất excel
  async exportExcel() {
    const table = this.tb_bonusPenaltyDetailsBody;
    if (!table) return;

    const data = table.getData?.() ?? [];
    if (!data.length) {
      // Nếu bạn dùng NzNotification:
      this.notification?.error?.('', 'Không có dữ liệu xuất Excel!', { nzStyle: { fontSize: '0.75rem' } });

      return;
    }

    let fileName = 'Chi tiết thưởng - phạt ' + this.month + '-' + this.year.getFullYear()

    this.projectService.exportExcelGroup(this.tb_bonusPenaltyDetailsBody, data, 'ChiTietThuongPhat', fileName, 'Name');
  }


  //#endregion

  //#endregion
}
