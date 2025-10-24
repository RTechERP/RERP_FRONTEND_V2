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
import { EmployeePayrollService } from '../employee-payroll-service/employee-payroll.service';
import { NzInputNumberModule } from "ng-zorro-antd/input-number";
import { EmployeePayrollBonusDeductionDetailComponent } from './employee-payroll-bonus-deduction-detail/employee-payroll-bonus-deduction-detail.component';
import { ImportExcelComponent } from './import-excel/import-excel.component';


@Component({
  selector: 'app-employee-payroll-bonus-deduction',
  templateUrl: './employee-payroll-bonus-deduction.component.html',
  styleUrls: ['./employee-payroll-bonus-deduction.component.css'],
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
  ]
})
export class EmployeePayrollBonusDeductionComponent implements OnInit {


  constructor(
    private employeePayrollService: EmployeePayrollService,
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

  // param filter
  year: any = new Date().getFullYear();
  month: number = new Date().getMonth() + 1;
  keyWord: string = '';
  employeeID: number = 0;
  departmentID: number = 0;
  // select option 
  employees: any[] = [];
  departments: any[] = [];
  employeePayrollID: number = 0;

  selectedEmployeePayrollBonusDeuctions: Set<any> = new Set<any>();

  employeesToChild: any[] = [];

  ngOnInit() {

    this.route.paramMap.subscribe(params => {
      const id = +(params.get('id') ?? 0);
      this.employeePayrollID = id;
    });
    this.getEmployee();
    this.getDepartment();
    this.loadFromEmployeePayrollID();
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  ngAfterViewInit(): void {
  }
  drawTbBonusPenaltyDetails(container: HTMLElement) {
    this.tb_bonusPenaltyDetailsBody = new Tabulator(container, {
      height: "100%",
      layout: "fitDataStretch",
      selectableRows: true,
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 30,
      paginationSizeSelector: [30, 50, 100, 200, 500, 1000, 10000,1000000],
      groupBy: (data) => `Bộ phận: ${data.Name ?? "Chưa xác định"}`,
      groupHeader: function (value, count, data, group) {
        return `${value}`;
      },
      ajaxURL: this.employeePayrollService.getApiUrlEmployeePayrollBonusDeduction(),
      ajaxParams: {
        year: this.year.getFullYear(),
        month: this.month,
        employeeID: this.employeeID,
        departmentID: this.departmentID,
        keyword: this.keyWord
      },
      ajaxResponse: (url, params, res) => {
        return {
          data: res.data,
          last_page: res.TotalPage,
        };
      },
      columns: [
        { title: "ID", field: "ID", width: 120, headerHozAlign: "center", hozAlign: "center", frozen: true, visible: false },
        { title: "Mã nhân viên", field: "Code", width: 120, headerHozAlign: "center", hozAlign: "center", frozen: true },
        { title: "Tên nhân viên", field: "FullName", width: 200, headerHozAlign: "center", frozen: true },
        { title: "Tổng công", field: "TotalWorkDay", width: 120, headerHozAlign: "center", hozAlign: "right" },
        {
          title: "Thưởng KPIs / doanh số", field: "KPIBonus", width: 150, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
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
  onEmployeeChange(event: number | null) {
    this.employeeID = event ?? 0;
  }

  onDepartmentChange(event: number | null) {
    this.departmentID = event ?? 0;
  }
  getDepartment() {
    this.employeePayrollService.getDepartment().subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.departments = res.data;
        }
        else {
          this.notification.error('Lỗi', 'Không lấy được dữ liệu');
        }
      },
      error: (err) => {
        console.error('API error:', err);
      }
    });
  }
  getEmployee() {
    this.employeePayrollService.getEmployee(0, 0).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.employees = this.employeePayrollService.createdDataGroup(res.data, 'DepartmentName');
        }
        else {
          this.notification.error('Lỗi', 'Không lấy được dữ liệu');
        }
      },
      error: (err) => {
        console.error('API error:', err);
      }
    });
    this.employeePayrollService.getEmployee(-1, 0).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.employeesToChild = this.employeePayrollService.createdDataGroup(res.data, 'DepartmentName');
          console.log(this.employeesToChild);
        }
        else {
          this.notification.error('Lỗi', 'Không lấy được dữ liệu');
        }
      },
      error: (err) => {
        console.error('API error:', err);
      }
    });


  }
  loadFromEmployeePayrollID() {
    // lấy employeepayroll, gán year, month
    this.employeePayrollService.getEmployeePayrollByID(this.employeePayrollID).subscribe({
      next: (res) => {
        if (res.status === 1) {
          let employeePayroll = res.data;
          this.year = new Date(employeePayroll._Year, 0, 1);
          this.month = employeePayroll._Month;
        }
        this.drawTbBonusPenaltyDetails(this.tb_bonusPenaltyDetailsContainer.nativeElement);

      },
      error: (err) => {
        console.error('API error:', err);
      }
    });

  }
  handleAction(action: string) {
    if (action === 'create') {
      const modalRef = this.modalService.open(EmployeePayrollBonusDeductionDetailComponent, {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        scrollable: true,
        size: "xl"
      });
      modalRef.componentInstance.employees = this.employeesToChild;
      return;
    }
    // nhập xuất excel ở đây

    if (this.selectedEmployeePayrollBonusDeuctions.size === 0) {
      let message = action === 'update' ? 'Cập nhật' : 'Xoá';
      this.notification.warning('Cảnh báo', 'Vui lòng chọn nhân viên để ' + message + '!');
      return;
    }
    if (action === 'update') {
      const modalRef = this.modalService.open(EmployeePayrollBonusDeductionDetailComponent, {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        scrollable: true,
        size: "xl"
      });
      modalRef.componentInstance.employees = this.employeesToChild;
      modalRef.componentInstance.EmployeePayrollBonusDeuctions = Array.from(this.selectedEmployeePayrollBonusDeuctions).at(-1);
    }
    if (action === 'delete') {
      this.modal.confirm({
        nzTitle: 'Xác nhận xoá',
        nzContent: `<b style="color: red;">Bạn có chắc chắn muốn xoá ${this.selectedEmployeePayrollBonusDeuctions.size} bản ghi đã chọn?</b>`,
        nzOkText: 'Xoá',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzOnOk: () => {

        },
        nzCancelText: 'Huỷ',
        nzOnCancel: () => {
          // Hành động khi huỷ (nếu cần)
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
    this.employeeID = 0;
    this.departmentID = 0;
    this.drawTbBonusPenaltyDetails(this.tb_bonusPenaltyDetailsContainer.nativeElement);
  }

  importexcel() {
    const modalRef = this.modalService.open(ImportExcelComponent, {
      backdrop: 'static',
      keyboard: false,
      scrollable: true,
      modalDialogClass: 'modal-fullscreen modal-dialog-scrollable'
    });
    modalRef.componentInstance.month = this.month ?? 0;
    modalRef.componentInstance.year = this.year.getFullYear() ?? 0;
    modalRef.result.finally(() => {
      this.loadFromEmployeePayrollID();
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

    // Chuẩn bị Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Chi tiết thưởng - phạt ' + this.month + '-' + this.year.getFullYear());

    // Lấy cột từ Tabulator
    const columns: any[] = table.getColumns?.() ?? [];
    // Bỏ cột đầu nếu là checkbox/STT:
    const filteredColumns = columns.slice(1);



    // Header
    const headers = filteredColumns.map(c => c.getDefinition().title ?? '');
    const headerRow = worksheet.addRow(headers);

    // Style header
    headerRow.eachCell((cell) => {
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

        if (def.formatter === 'tick' || def.formatter === 'tickCross') {
          value = value ? 'TRUE' : 'FALSE';
        }

        // Chuỗi ngày ISO -> Date để format numFmt
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          const d = new Date(value);
          if (!isNaN(d.getTime())) value = d;
        }

        // Note nhiều dòng: giữ xuống dòng bằng \n (Excel wrapText)
        if (typeof value === 'string') {
          value = value.replace(/(\r\n|\n\r|\r)/g, '\n');
        }
        // Nếu là boolean hoặc kiểu dữ liệu giống boolean
        if (
          typeof value === 'boolean' ||
          value === 'true' || value === 'false'
        ) {
          const v = value === true || value === 'true';
          // Bỏ phần tick/tickCross, chỉ xuất TRUE/FALSE
          value = v ? 'TRUE' : 'FALSE';
        }

        return value ?? '';
      });

      const r = worksheet.addRow(rowData);

      // Căn lề theo hozAlign từng cột
      filteredColumns.forEach((col: any, idx: number) => {
        const align = (col.getDefinition?.().hozAlign || 'left') as string;
        r.getCell(idx + 1).alignment = {
          horizontal: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left',
          vertical: 'middle',
          wrapText: true
        };
      });
    });

    // Định dạng cột ngày theo field
    const dateFields = ['DatePromulgate', 'DateEffective'];
    dateFields.forEach(f => {
      const idx = filteredColumns.findIndex(c => c.getDefinition?.().field === f);
      if (idx >= 0) worksheet.getColumn(idx + 1).numFmt = 'dd/mm/yyyy';
    });

    // Auto width + cố định cột 14 (1-based trong Excel)
    worksheet.columns.forEach((column: any) => {
      if (!column) return;


      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const v = cell.value;
        const s =
          v instanceof Date ? 'dd/mm/yyyy' :
            (v ?? '').toString();
        maxLength = Math.max(maxLength, s.length + 2);
      });
      // Giới hạn để tránh cột quá rộng
      column.width = Math.max(8, Math.min(maxLength, 50));
    });

    // AutoFilter trên hàng tiêu đề
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
    a.download = `Chi tiết thưởng/ phạt tháng ${this.month} năm ${this.year.getFullYear()}- ${formattedDate}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }


  //#endregion
}

