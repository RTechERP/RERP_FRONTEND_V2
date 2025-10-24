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
import { AppComponent } from '../../../../../app.component';
import { EmployeePayrollDetailEditComponent } from './employee-payroll-detail-edit/employee-payroll-detail-edit.component';
import { forkJoin } from 'rxjs';
import { ImportExcelComponent } from './import-excel/import-excel.component';

@Component({
  selector: 'app-employee-payroll-report',
  templateUrl: './employee-payroll-report.component.html',
  styleUrls: ['./employee-payroll-report.component.css'],
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
    NzInputNumberModule,
    CommonModule
  ]
})
export class EmployeePayrollReportComponent implements OnInit {

  constructor(
    private employeePayrollService: EmployeePayrollService,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private app: AppComponent,
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) { }
  // size spilitder filter
  sizeSearch: string = '0';
  // khai báo table
  @ViewChild('tb_employeePayrollReport', { static: false })
  tb_employeePayrollReportContainer!: ElementRef;
  tb_employeePayrollReportBody: any;
  totalWorkday: number = 0;
  // param filter
  year: any = new Date();
  month: number = new Date().getMonth() + 1;
  keyWord: string = '';
  employeeID: number = 0;
  departmentID: number = 0;
  // select option 
  employees: any[] = [];
  employeesToChild: any[] = [];
  departments: any[] = [];
  // id lấy từ form cha
  employeePayrollID: number = 0;
  selectedEmployeePayrollDetail: Set<any> = new Set<any>();
  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = +(params.get('id') ?? 0);
      this.employeePayrollID = id;
    });

    this.getEmployee();
    this.getDepartment();
    this.loadFromEmployeePayrollID();
  }
  ngAfterViewInit(): void {
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  update() {

  }
  updateAll() {

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
  onEmployeeChange(event: number | null) {
    this.employeeID = event ?? 0;
  }

  onDepartmentChange(event: number | null) {
    this.departmentID = event ?? 0;
  }

  drawTbEmployeePayrollReport(container: HTMLElement) {
    this.tb_employeePayrollReportBody = new Tabulator(container, {
      height: "100%",
      layout: "fitDataStretch",
      selectableRows: true,
      pagination: true,
      paginationMode: 'local',
      paginationSize: 20,
      paginationSizeSelector: [20, 50, 100, 200, 500, 1000, 10000,1000000],
      columnHeaderVertAlign: "bottom",
      groupBy: (data) => `Phòng ban: ${data.DepartmentName ?? "Chưa xác định"}`,
      groupHeader: function (value, count, data, group) {
        return `${value}`;
      },
      rowContextMenu: [
        {
          label: "Sửa",
          action: (e, row) => {
            this.handlePayrollDetailAction('edit');
          }
        },
        {
          label: "Cập nhật",
          action: (e, row) => {
            this.handlePayrollDetailAction('update');
          }
        }
      ],
      columns: [
        {
          title: "BẢNG THANH TOÁN LƯƠNG THÁNG " + this.month + " NĂM " + this.year.getFullYear(),
          headerHozAlign: "center",
          // frozen: true,
          columns: [

            // Nhóm Công tiêu chuẩn + Lương cơ bản
            {
              title: "CÔNG TIÊU CHUẨN " + this.totalWorkday,
              headerHozAlign: "center",
              columns: [
                // Cột lẻ bên trái
                { title: 'ID', field: 'ID', width: 100, visible: false },
                { title: 'EmployeeID', field: 'EmployeeID', width: 100, visible: false },
                {
                  title: '',
                  field: '',
                  headerHozAlign: 'center',
                  formatter: 'rowSelection',
                  titleFormatter: 'rowSelection',
                  hozAlign: 'center',
                  headerSort: false,
                  width: 50,
                  cellClick: function (e, cell) {
                    // Để Tabulator tự xử lý tick checkbox
                    e.stopPropagation(); // Ngăn click lan ra rowClick
                  },
                },
                {
                  title: "Công bố", field: "IsPublish", width: 80, hozAlign: "center", headerHozAlign: "center",
                  headerSort: false,
                  formatter: function (cell) {
                    let value = cell.getValue();
                    return value
                      ? "<input type='checkbox' checked readonly style='pointer-events:none'>"
                      : "<input type='checkbox' readonly style='pointer-events:none'>";
                  }

                },
                {
                  title: "Ký nhận", field: "Sign", width: 100, headerHozAlign: "center", hozAlign: "center",
                  headerSort: false,
                  formatter: function (cell) {
                    let value = cell.getValue();
                    return value
                      ? "<input type='checkbox' checked readonly style='pointer-events:none'>"
                      : "<input type='checkbox' readonly style='pointer-events:none'>";
                  }
                },
                { title: "STT", field: "STT", width: 60, hozAlign: "center", headerHozAlign: "center" },
                { title: "Mã NV", field: "Code", width: 100, headerHozAlign: "center" },
                { title: "Họ tên", field: "FullName", width: 200, headerHozAlign: "center" },
                { title: "Chức vụ", field: "PositionName", width: 150, headerHozAlign: "center" },
                {
                  title: "Ngày vào", field: "StartWorking", width: 120, headerHozAlign: "center", hozAlign: "center",
                  formatter: function (cell) {
                    const raw = cell.getValue();
                    if (!raw) return "";
                    try {
                      return DateTime.fromISO(raw).toFormat('dd/MM/yyyy');
                    } catch {
                      return raw;
                    }
                  }
                },
                {
                  title: "LƯƠNG CƠ BẢN",
                  headerHozAlign: "center",
                  columns: [
                    {
                      title: "Lương thực lĩnh", hozAlign: "right", headerHozAlign: "center",
                      columns: [
                        {
                          title: "Lương cơ bản tham chiếu", field: "BasicSalary", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                          formatterParams: {
                            decimal: ".",
                            thousand: ",",
                            precision: false
                          }
                        },
                        { title: "Công", hozAlign: "right", field: "TotalMerit", headerHozAlign: "center" },
                        {
                          title: "Lương", hozAlign: "right", field: "TotalSalaryByDay", headerHozAlign: "center", formatter: "money",
                          formatterParams: {
                            decimal: ".",
                            thousand: ",",
                            precision: false
                          }
                        },
                        {
                          title: "Đơn giá tiền công/giờ", field: "SalaryOneHour", width: 150, hozAlign: "right", headerHozAlign: "center", formatter: "money",
                          formatterParams: {
                            decimal: ".",
                            thousand: ",",
                            precision: false
                          }
                        },
                      ]
                    },
                  ]
                }
              ]
            }
          ]
        },
        {
          title: "",
          headerHozAlign: "center",
          columns: [
            {
              title: "",
              headerHozAlign: "center",
              columns: [
                {
                  title: "Làm thêm",
                  headerHozAlign: "center",
                  columns: [
                    {
                      title: "Làm thêm ngày thường", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          { title: "Số giờ", field: "OT_Hour_WD", hozAlign: "right", headerHozAlign: "center" },
                          {
                            title: "Thành tiền", field: "OT_Money_WD", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                        ]
                    },
                    {
                      title: "Làm thêm cuối tuần", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          { title: "Số giờ", field: "OT_Hour_WK", hozAlign: "right", headerHozAlign: "center" },
                          {
                            title: "Thành tiền", field: "OT_Money_WK", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                        ]
                    },
                    {
                      title: "Làm thêm ngày lễ, tết", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          { title: "Số giờ", field: "OT_Hour_HD", hozAlign: "right", headerHozAlign: "center" },
                          {
                            title: "Thành tiền", field: "OT_Money_HD", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                        ]
                    },
                    {
                      title: "Tổng tiền làm thêm", field: "OT_TotalSalary", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                      formatterParams: {
                        decimal: ".",
                        thousand: ",",
                        precision: false
                      }
                    },
                  ]
                },
                {
                  title: "Phụ cấp",
                  headerHozAlign: "center",
                  columns: [
                    {
                      title: "PCCC", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          {
                            title: "Phụ cấp chuyên cần tham chiếu", field: "ReferenceIndustry", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "Phụ cấp chuyên cần thực lĩnh", field: "RealIndustry", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                        ]
                    },
                    {
                      title: "", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          {
                            title: "PC ăn cơm", field: "AllowanceMeal", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "PC đi làm trước 7h15", field: "Allowance_OT_Early", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "Tổng tiền PC", field: "TotalAllowance", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                        ]
                    },

                  ]
                },
                {
                  title: "Các khoản cộng khác",
                  headerHozAlign: "center",
                  columns: [
                    {
                      title: "", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          {
                            title: "Tiền công tác phí", field: "BussinessMoney", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "Tiền công làm đêm", field: "NightShiftMoney", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "Chi phí phương tiện công tác", field: "CostVehicleBussiness", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "Thưởng KPIs / doanh số", field: "Bonus", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "Khác", field: "Other", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "Tổng cộng", field: "TotalBonus", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                        ]
                    },


                  ]
                },
                {
                  title: "Tổng thu nhập", field: "RealSalary", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                  formatterParams: {
                    decimal: ".",
                    thousand: ",",
                    precision: false
                  }
                },
                {
                  title: "Các khoản phải trừ",
                  headerHozAlign: "center",
                  columns: [
                    {
                      title: "BHXH, BHYT, BHTN", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          {
                            title: "Mức đóng", field: "SocialInsurance", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "Phải thu BHXH", field: "Insurances", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                        ]
                    },
                    {
                      title: "", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          {
                            title: "Công đoàn", field: "UnionFees", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "Ứng lương", field: "AdvancePayment", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "Thu hộ phòng ban", field: "DepartmentalFees", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "Gửi xe ô tô", field: "ParkingMoney", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "Phạt 5s", field: "Punish5S", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "Cơm ca đã ăn tại cty", field: "MealUse", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "Khác (Phải trừ)", field: "OtherDeduction", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                          {
                            title: "Tổng cộng các khoản phải trừ", field: "TotalDeduction", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            }
                          },
                        ]
                    },
                  ]
                },
                {
                  title: "Thực lĩnh", field: "ActualAmountReceived", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                  formatterParams: {
                    decimal: ".",
                    thousand: ",",
                    precision: false
                  }
                },
                { title: "Ghi chú", field: "Note", hozAlign: "right", headerHozAlign: "center" },
              ]
            }
          ]
        }

      ]
    });
    this.tb_employeePayrollReportBody.on('dataLoading', () => {
      this.tb_employeePayrollReportBody.deselectRow();
    });
    this.tb_employeePayrollReportBody.on('rowDblClick', (e: any, row: any) => {
      this.handlePayrollDetailAction('edit');
    })
    // Lắng nghe sự kiện chọn
    this.tb_employeePayrollReportBody.on('rowSelected', (row: any) => {
      this.selectedEmployeePayrollDetail.add(row.getData());
    });

    // Click vào row (không phải checkbox) → chỉ chọn 1 row
    this.tb_employeePayrollReportBody.on('rowClick', (e: any, row: any) => {
      const clickedField = e.target.closest('.tabulator-cell')?.getAttribute('tabulator-field');
      if (clickedField !== 'select') {
        // Bỏ chọn hết và chọn row hiện tại
        this.tb_employeePayrollReportBody.deselectRow();
        row.select();
      }
    });
    // Lắng nghe sự kiện bỏ chọn
    this.tb_employeePayrollReportBody.on('rowDeselected', (row: any) => {
      this.selectedEmployeePayrollDetail.delete(row.getData());
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
          this.getEmployeePayrollReport();
        }
      },
      error: (err) => {
        console.error('API error:', err);
      }
    });

  }
  filter() {
    this.getEmployeePayrollReport();
  }
  reset() {
    this.year = new Date();
    this.month = this.year.getMonth() + 1;
    this.keyWord = '';
    this.employeeID = 0;
    this.departmentID = 0;
    this.getEmployeePayrollReport();
  }
  getEmployeePayrollReport() {
    this.employeePayrollService
      .getEmployeePayrollDetail(this.year.getFullYear(), this.month, this.departmentID, this.employeeID, this.keyWord)
      .subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.totalWorkday = res.totalWorkday; // get totalWorkday
            this.drawTbEmployeePayrollReport(this.tb_employeePayrollReportContainer.nativeElement);
            this.tb_employeePayrollReportBody.on("tableBuilt", () => {
              this.tb_employeePayrollReportBody.setData(res.data);
            });
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
  handlePayrollDetailAction(type: string) {
    if (type == 'updateall') {
      const modalRef = this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc chắn muốn cập nhật tất cả bảng lương không?`,
        nzOkText: 'Xác nhận',
        nzCancelText: 'Hủy',
        nzOkLoading: false,   // ban đầu chưa loading
        nzOnOk: () => {
          modalRef.updateConfig({ nzOkLoading: true }); // bật loading
          return new Promise<void>((resolve, reject) => {
            this.employeePayrollService.getUpdateEmployeePayrollDetail(
              this.employeePayrollID,
              this.year.getFullYear(),
              this.month,
              0,
              this.employeePayrollService.LoginName,
              'updateall'
            ).subscribe({
              next: (res) => {
                if (res.status === 1) {
                  this.notification.create(
                    'success',
                    'Thông báo',
                    'Đã cập nhật bảng lương thành công'
                  );
                  modalRef.updateConfig({ nzOkLoading: false });
                  resolve(); // đóng modal
                  this.getEmployeePayrollReport();
                  this.selectedEmployeePayrollDetail.clear();
                } else {
                  this.notification.error('Lỗi', 'Không lấy được dữ liệu');
                  modalRef.updateConfig({ nzOkLoading: false });
                  reject();
                }
              },
              error: (err) => {
                console.error('API error:', err);
                this.notification.error('Lỗi', 'Không cập nhật được dữ liệu');
                modalRef.updateConfig({ nzOkLoading: false });
                reject();
              }
            });
          });
        }
      });
      return;
    }

    if (this.selectedEmployeePayrollDetail.size <= 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        `Vui lòng chọn bảng lương chi tiết cần ${type === 'edit' ? 'cập nhật' : type === 'update' ? 'cập nhật' : type === 'publish' ? 'công bố' : 'hủy công bố'}.`
      );
      return;
    }
    const last: any = Array.from(this.selectedEmployeePayrollDetail).at(-1);

    switch (type) {
      case 'edit': {
        const modalRef = this.modalService.open(EmployeePayrollDetailEditComponent, {
          backdrop: 'static',
          keyboard: false,
          centered: true,
          scrollable: true,
          size: 'xl'
        });
        modalRef.componentInstance.employeePayrollDetailID = last.ID ?? 0;
        modalRef.componentInstance.employees = this.employeesToChild;
        modalRef.result.finally(() => {
          this.selectedEmployeePayrollDetail.clear();
          this.getEmployeePayrollReport();
        });
        break;
      }
      case 'publish': {
        this.publish(1);
        break;
      }
      case 'unpublish': {
        this.publish(0);
        break;
      }
      case 'update': {
        const modalRef = this.modal.confirm({
          nzTitle: 'Xác nhận cập nhật',
          nzContent: `Bạn có chắc chắn muốn cập nhật các bảng lương đã chọn không?`,
          nzOkText: 'Xác nhận',
          nzCancelText: 'Hủy',
          nzOkLoading: false,
          nzOnOk: () => {
            const arrEmployeePayrollDetail = Array.from(this.selectedEmployeePayrollDetail);
            const requests = arrEmployeePayrollDetail.map(item =>
              this.employeePayrollService.getUpdateEmployeePayrollDetail(
                this.employeePayrollID,
                this.year.getFullYear(),
                this.month,
                item.EmployeeID,
                this.employeePayrollService.LoginName,
                'update'
              )
            );
            modalRef.updateConfig({ nzOkLoading: true });
            return new Promise<void>((resolve, reject) => {
              forkJoin(requests).subscribe({
                next: (responses) => {
                  modalRef.updateConfig({ nzOkLoading: false });
                  const hasError = responses.some(res => res.status !== 1);
                  if (hasError) {
                    this.notification.error('Lỗi', 'Một số bảng lương không cập nhật được');
                    reject(); // giữ modal mở để thử lại
                  } else {
                    this.notification.success('Thành công', 'Đã cập nhật bảng lương thành công');
                    this.getEmployeePayrollReport();
                    this.selectedEmployeePayrollDetail.clear();
                    resolve(); // đóng modal
                  }
                },
                error: (err) => {
                  console.error('API error:', err);
                  this.notification.error('Lỗi', 'Không cập nhật được dữ liệu');
                  modalRef.updateConfig({ nzOkLoading: false });
                  reject();
                }
              });
            });
          }
        });
        break;
      }


    }
  }
  publish(isPublish: number) {
    // lọc trước khi mở confirm
    let listID = new Set<number>();

    Array.from(this.selectedEmployeePayrollDetail).forEach(item => {
      if (isPublish === 1 && !item.IsPublish) {
        listID.add(item.ID);
      }
      if (isPublish === 0 && item.IsPublish) {
        listID.add(item.ID);
      }
    });

    const count = listID.size;
    let message = isPublish == 1 ? "Công bố" : "Hủy công bố";

    if (count === 0) {
      this.notification.warning('Thông báo', 'Không có bản ghi hợp lệ để ' + message.toLowerCase() + '!');
      return;
    }

    const modalRef = this.modal.confirm({
      nzTitle: 'Xác nhận ' + message,
      nzContent: `Bạn có chắc chắn muốn ${message.toLowerCase()} ${this.selectedEmployeePayrollDetail.size} bảng lương đã chọn không?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkLoading: false,
      nzOnOk: () => {
        modalRef.updateConfig({ nzOkLoading: true });

        return new Promise<void>((resolve, reject) => {
          this.employeePayrollService
            .postUpdatePublishEmployeePayroll(isPublish, Array.from(listID))
            .subscribe({
              next: (res) => {
                modalRef.updateConfig({ nzOkLoading: false });
                if (res.status === 1) {
                  this.notification.success('Thông báo', `${message} thành công ${count} bảng lương!`);
                  this.getEmployeePayrollReport();
                  this.selectedEmployeePayrollDetail.clear();
                  resolve();
                } else {
                  this.notification.error('Lỗi', 'Không lấy được dữ liệu');
                  reject();
                }
              },
              error: (err) => {
                console.error('API error:', err);
                this.notification.error('Lỗi', 'Không cập nhật được dữ liệu');
                modalRef.updateConfig({ nzOkLoading: false });
                reject();
              }
            });
        });
      }
    });
  }
  importexcel(){
      const modalRef = this.modalService.open(ImportExcelComponent, {
            backdrop: 'static',
            keyboard: false,
            scrollable: true,
            modalDialogClass: 'modal-fullscreen modal-dialog-scrollable'
          });
          modalRef.componentInstance.PayrollID =  this.employeePayrollID ?? 0;
           modalRef.result.finally(() => {
            this.getEmployeePayrollReport();
          });
    
  }

  //#region xuất excel
  async exportExcel() {
    const table = this.tb_employeePayrollReportBody;
    if (!table) return;

    const data = table.getData?.() ?? [];
    if (!data.length) {
      // Nếu bạn dùng NzNotification:
      this.notification?.error?.('', 'Không có dữ liệu xuất Excel!', { nzStyle: { fontSize: '0.75rem' } });

      return;
    }

    // Chuẩn bị Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bảng lương ' + this.month + '-' + this.year.getFullYear());

    // Lấy cột từ Tabulator
    const columns: any[] = table.getColumns?.() ?? [];
    // Bỏ cột đầu nếu là checkbox/STT:
    const filteredColumns = columns.slice(3);



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
    a.download = `Bảng lương tháng ${this.month} năm ${this.year.getFullYear()}- ${formattedDate}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }


  //#endregion




}
