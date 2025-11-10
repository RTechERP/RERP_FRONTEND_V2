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
import { AfterViewInit, ApplicationRef, Component, createComponent, ElementRef, Input, OnInit, Type, ViewChild } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import { NzInputNumberModule } from "ng-zorro-antd/input-number";
import { AppComponent } from '../../../../app.component';
import { forkJoin } from 'rxjs';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { PayrollService } from '../payroll.service';
import { ProjectService } from '../../../old/project/project-service/project.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { ImportExcelComponent } from './import-excel/import-excel.component';
import { EditDetailComponent } from './edit-detail/edit-detail.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-payroll-report',
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
  ],

  templateUrl: './payroll-report.component.html',
  styleUrl: './payroll-report.component.css'
})
export class PayrollReportComponent implements OnInit, AfterViewInit {

  //#region Khai báo các biến
  constructor(
    public activeModal: NgbActiveModal,
    private payrollService: PayrollService,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private modalService: NgbModal,
  ) {
  }

  @ViewChild('tb_payrollReport', { static: false })
  tb_payrollReportContainer!: ElementRef;
  tb_payrollReport: any;
  totalWorkday: number = 0;

  sizeSearch: string = '0';

  @Input() payrollId: any;
  keyWord: string = '';
  year: any = new Date();
  month: any = new Date();

  employeeId: any = 0;
  departmentId: any = 0;

  employees: any[] = [];
  departments: any[] = [];
  selectedEmployeePayrollDetail: Set<any> = new Set<any>();
  isLoadTable: any = true;
  //#endregion

  //#region Các hàm chạy
  ngOnInit(): void {
    this.getEmployee();
    this.getDepartment();


  }

  ngAfterViewInit(): void {
    this.getPayrollByID();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  resetSearch() {
    this.year = new Date();
    this.month = this.year.getMonth() + 1;
    this.employeeId = 0;
    this.departmentId = 0;
    this.keyWord = '';
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

  getPayrollByID() {
    this.payrollService.getEmployeePayrollByID(this.payrollId).subscribe({
      next: (res) => {
        if (res.status === 1) {
          let employeePayroll = res.data;
          this.year = new Date(employeePayroll._Year, 0, 1);
          this.month = employeePayroll._Month;

          this.getPayrollReport();
        }
      },
      error: (err) => {
        console.error('API error:', err);
      }
    });
  }


  async getPayrollReport() {
    this.isLoadTable = true;
    this.payrollService
      .getEmployeePayrollDetail(this.year.getFullYear(), this.month, this.departmentId, this.employeeId, this.keyWord)
      .subscribe({
        next: (res) => {
          if (res.status === 1) {
            
            this.totalWorkday = res.data.totalWorkday;
            this.payrollId = res.data.payrollId;
            this.drawTbEmployeePayrollReport(this.tb_payrollReportContainer.nativeElement);
            this.tb_payrollReport.on("tableBuilt", () => {
              this.tb_payrollReport.setData(res.data.data);
            });
            this.isLoadTable = false;
          }
          else {
            this.notification.error(NOTIFICATION_TITLE.error, 'Không lấy được dữ liệu');
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
            this.payrollService.updateEmployeePayrollDetail(
              this.payrollId,
              this.year.getFullYear(),
              this.month,
              this.employeeId,
              2
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
                  this.getPayrollReport();
                  this.selectedEmployeePayrollDetail.clear();
                } else {
                  this.notification.error(NOTIFICATION_TITLE.error, 'Không lấy được dữ liệu');
                  modalRef.updateConfig({ nzOkLoading: false });
                  reject();
                }
              },
              error: (err) => {
                console.error('API error:', err);
                this.notification.error(NOTIFICATION_TITLE.error, 'Không cập nhật được dữ liệu');
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
        const modalRef = this.modalService.open(EditDetailComponent, {
          backdrop: 'static',
          keyboard: false,
          centered: true,
          scrollable: true,
          size: 'xl'
        });
        modalRef.componentInstance.payrollDetailID = last.ID ?? 0;
        modalRef.componentInstance.TotalWorkday = this.totalWorkday ?? 0;
        modalRef.result.finally(() => {
          this.selectedEmployeePayrollDetail.clear();
          this.getPayrollReport();
        });
        break;
      }
      case 'publish': {
        this.publish(true);
        break;
      }
      case 'unpublish': {
        this.publish(false);
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
              this.payrollService.updateEmployeePayrollDetail(
                this.payrollId,
                this.year.getFullYear(),
                this.month,
                item.employeeID,
                2
              )
            );
            modalRef.updateConfig({ nzOkLoading: true });
            return new Promise<void>((resolve, reject) => {
              forkJoin(requests).subscribe({
                next: (responses) => {
                  modalRef.updateConfig({ nzOkLoading: false });
                  const hasError = responses.some(res => res.status !== 1);
                  if (hasError) {
                    this.notification.error(NOTIFICATION_TITLE.error, 'Một số bảng lương không cập nhật được');
                    reject(); // giữ modal mở để thử lại
                  } else {
                    this.notification.success(NOTIFICATION_TITLE.success, 'Đã cập nhật bảng lương thành công');
                    this.getPayrollReport();
                    this.selectedEmployeePayrollDetail.clear();
                    resolve(); // đóng modal
                  }
                },
                error: (err) => {
                  console.error('API error:', err);
                  this.notification.error(NOTIFICATION_TITLE.error, 'Không cập nhật được dữ liệu');
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

  publish(isPublish: boolean) {
    
    let listID = new Set<number>();

    Array.from(this.selectedEmployeePayrollDetail).forEach(item => {
      if (isPublish && !item.IsPublish) listID.add(item.ID);
      if (!isPublish && item.IsPublish) listID.add(item.ID);
    });

    const count = listID.size;
    let message = isPublish ? "Công bố" : "Hủy công bố";

    if (count === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có bản ghi hợp lệ để ' + message.toLowerCase() + '!');
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

          this.payrollService
            .publishEmployeePayroll(isPublish, Array.from(listID))
            .subscribe({
              next: (res) => {
                modalRef.updateConfig({ nzOkLoading: false });
                if (res.status === 1) {
                  this.notification.success('Thông báo', `${message} thành công ${count} bảng lương!`);
                  this.getPayrollReport();
                  this.selectedEmployeePayrollDetail.clear();
                  resolve();
                } else {
                  this.notification.error(NOTIFICATION_TITLE.error, 'Không lấy được dữ liệu');
                  reject();
                }
              },
              error: (err) => {
                console.error('API error:', err);
                this.notification.error(NOTIFICATION_TITLE.error, 'Không cập nhật được dữ liệu');
                modalRef.updateConfig({ nzOkLoading: false });
                reject();
              }
            });
        });
      }
    });
  }

  importExcel() {
    if(this.payrollId == null || this.payrollId < 0){
      this.notification.warning(NOTIFICATION_TITLE.warning, `Chưa có bảng lương tháng ${this.month} năm ${this.year.getFullYear()}.
      Vui lòng thêm mới trước khi nhập excel!`);
      return;
    }

    const modalRef = this.modalService.open(ImportExcelComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    
    modalRef.componentInstance.payrollId = this.payrollId ?? 0;
    modalRef.componentInstance.totalWorkday = this.totalWorkday ?? 0;
    modalRef.componentInstance.month = this.month ?? 0;
    modalRef.componentInstance.year = this.year.getFullYear() ?? 0;
    modalRef.result.finally(() => {
      this.getPayrollReport();
    });

  }

  //#region  Vẽ bảng
  drawTbEmployeePayrollReport(container: HTMLElement) {
    let rowContextMenu = [
      {
        label: "Sửa",
        action: (e: any, row: any) => {
          this.handlePayrollDetailAction('edit');
        }
      },
      {
        label: "Cập nhật",
        action: (e: any, row: any) => {
          this.handlePayrollDetailAction('update');
        }
      }
    ];

    this.tb_payrollReport = new Tabulator(container, {
      height: '89.6vh',
      pagination: true,
      paginationSize: 100,
      paginationSizeSelector: [10, 30, 50, 100, 300, 500],
      paginationMode: 'local',
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
      columnHeaderVertAlign: "bottom",
      layout: 'fitDataStretch',
      groupBy: (data) => `Phòng ban: ${data.DepartmentName ?? "Chưa xác định"}`,
      groupHeader: function (value, count, data, group) {
        return `${value}`;
      },
      rowContextMenu: rowContextMenu,
      columns: [
        {
          title: "BẢNG THANH TOÁN LƯƠNG THÁNG " + this.month + " NĂM " + this.year.getFullYear(),
          headerHozAlign: "center",
          frozen: true,
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
                  title: "Công bố", field: "IsPublish", width: 40, hozAlign: "center", headerHozAlign: "center",
                  headerSort: false,
                  headerWordWrap: true,
                  formatter: function (cell) {
                    let value = cell.getValue();
                    return value
                      ? "<input type='checkbox' checked readonly style='pointer-events:none'>"
                      : "<input type='checkbox' readonly style='pointer-events:none'>";
                  }

                },
                {
                  title: "Ký nhận", field: "Sign", width: 40, headerHozAlign: "center", hozAlign: "center",
                  headerSort: false,
                  headerWordWrap: true,
                  formatter: function (cell) {
                    let value = cell.getValue();
                    return value
                      ? "<input type='checkbox' checked readonly style='pointer-events:none'>"
                      : "<input type='checkbox' readonly style='pointer-events:none'>";
                  }
                },
                { title: "STT", field: "STT", width: 58, hozAlign: "center", headerHozAlign: "center", headerWordWrap: true, },
                { title: "Mã NV", field: "Code", width: 100, headerHozAlign: "center" },
                { title: "Họ tên", field: "FullName", width: 120, headerHozAlign: "center", formatter: 'textarea', headerWordWrap: true, },
                { title: "Chức vụ", field: "PositionName", width: 120, headerHozAlign: "center", formatter: 'textarea' },
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
                          },
                          width: 120,
                          headerWordWrap: true,
                          bottomCalcFormatter: "money", bottomCalc: "sum"
                        },
                        { title: "Công", hozAlign: "right", field: "TotalMerit", headerHozAlign: "center", bottomCalcFormatter: "money", bottomCalc: "sum" },
                        {
                          title: "Lương", hozAlign: "right", field: "TotalSalaryByDay", headerHozAlign: "center", formatter: "money",
                          formatterParams: {
                            decimal: ".",
                            thousand: ",",
                            precision: false
                          },
                          bottomCalcFormatter: "money", bottomCalc: "sum"
                        },
                        {
                          title: "Đơn giá tiền công/giờ", field: "SalaryOneHour", width: 150, hozAlign: "right", headerHozAlign: "center", formatter: "money",
                          headerWordWrap: true,
                          formatterParams: {
                            decimal: ".",
                            thousand: ",",
                            precision: false
                          },
                          bottomCalcFormatter: "money", bottomCalc: "sum"
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
                          { title: "Số giờ", field: "OT_Hour_WD", hozAlign: "right", headerHozAlign: "center", bottomCalcFormatter: "money", bottomCalc: "sum" },
                          {
                            title: "Thành tiền", field: "OT_Money_WD", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                        ]
                    },
                    {
                      title: "Làm thêm cuối tuần", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          { title: "Số giờ", field: "OT_Hour_WK", hozAlign: "right", headerHozAlign: "center", bottomCalcFormatter: "money", bottomCalc: "sum" },
                          {
                            title: "Thành tiền", field: "OT_Money_WK", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                        ]
                    },
                    {
                      title: "Làm thêm ngày lễ, tết", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          { title: "Số giờ", field: "OT_Hour_HD", hozAlign: "right", headerHozAlign: "center", bottomCalcFormatter: "money", bottomCalc: "sum" },
                          {
                            title: "Thành tiền", field: "OT_Money_HD", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                        ]
                    },
                    {
                      title: "Tổng tiền làm thêm", field: "OT_TotalSalary", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                      formatterParams: {
                        decimal: ".",
                        thousand: ",",
                        precision: false
                      },
                      bottomCalcFormatter: "money", bottomCalc: "sum"
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
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Phụ cấp chuyên cần thực lĩnh", field: "RealIndustry", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
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
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "PC đi làm trước 7h15", field: "Allowance_OT_Early", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Tổng tiền PC", field: "TotalAllowance", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
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
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Tiền công làm đêm", field: "NightShiftMoney", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Chi phí phương tiện công tác", field: "CostVehicleBussiness", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Thưởng KPIs / doanh số", field: "Bonus", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Khác", field: "Other", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Tổng cộng", field: "TotalBonus", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
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
                  },
                  bottomCalcFormatter: "money", bottomCalc: "sum"
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
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Phải thu BHXH", field: "Insurances", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
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
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Ứng lương", field: "AdvancePayment", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Thu hộ phòng ban", field: "DepartmentalFees", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Gửi xe ô tô", field: "ParkingMoney", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Phạt 5s", field: "Punish5S", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Cơm ca đã ăn tại cty", field: "MealUse", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Khác (Phải trừ)", field: "OtherDeduction", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Tổng cộng các khoản phải trừ", field: "TotalDeduction", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
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
                  },
                  bottomCalcFormatter: "money", bottomCalc: "sum"
                },
                { title: "Ghi chú", field: "Note", hozAlign: "right", headerHozAlign: "center" },
              ]
            }
          ]
        }

      ]
    });
    this.tb_payrollReport.on('dataLoading', () => {
      this.tb_payrollReport.deselectRow();
    });
    this.tb_payrollReport.on('rowDblClick', (e: any, row: any) => {
      this.handlePayrollDetailAction('edit');
    })
    // Lắng nghe sự kiện chọn
    this.tb_payrollReport.on('rowSelected', (row: any) => {
      this.selectedEmployeePayrollDetail.add(row.getData());
    });

    // Click vào row (không phải checkbox) → chỉ chọn 1 row
    this.tb_payrollReport.on('rowClick', (e: any, row: any) => {
      const clickedField = e.target.closest('.tabulator-cell')?.getAttribute('tabulator-field');
      if (clickedField !== 'select') {
        // Bỏ chọn hết và chọn row hiện tại
        this.tb_payrollReport.deselectRow();
        row.select();
      }
    });
    // Lắng nghe sự kiện bỏ chọn
    this.tb_payrollReport.on('rowDeselected', (row: any) => {
      this.selectedEmployeePayrollDetail.delete(row.getData());
    });

    this.tb_payrollReport.on("pageLoaded", () => {
      this.tb_payrollReport.redraw();
    });
  }
  //#endregion

  //#region xuất excel
  async exportExcel() {
    const table = this.tb_payrollReport;
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


  //#endregion



}
