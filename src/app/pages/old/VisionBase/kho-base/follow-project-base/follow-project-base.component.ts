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
import { CommonModule } from '@angular/common';
import { KhoBaseService } from '../kho-base-service/kho-base.service';
import { group } from '@angular/animations';
import { NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { FollowProjectBaseDetailComponent } from './follow-project-base-detail/follow-project-base-detail.component';
import { ImportExcelComponent } from './import-excel/import-excel.component';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
  selector: 'app-follow-project-base',
  templateUrl: './follow-project-base.component.html',
  styleUrls: ['./follow-project-base.component.css'],
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
    HasPermissionDirective,

  ],
})
export class FollowProjectBaseComponent implements OnInit {
  @ViewChild('tb_followProject', { static: false })
  tb_followProjectContainer!: ElementRef;
  tb_followProjectBody: any;

  @ViewChild('tb_followProjectForSale', { static: false })
  tb_followProjectForSaleContainer!: ElementRef;
  tb_followProjectForSaleBody: any;

  @ViewChild('tb_followProjectForPM', { static: false })
  tb_followProjectForPMContainer!: ElementRef;
  tb_followProjectForPMBody: any;


  sizeSearch: string = '0';
  sizeTbDetail: any = '0';

  selectedFollowProject = new Set<any>();
  dateStart: Date = new Date(new Date().getFullYear(), 0, 1);
  dateEnd: Date = new Date();
  filterText: string = '';
  user: number = 0;
  customerID: number = 0;
  pm: number = 0;
  warehouseID: number = 1;
  groupSaleID: number = 0;


  groupSaleUser: any[] = [];
  customers: any[] = [];
  employees: any[] = [];
  users: any[] = [];



  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private khoBaseService: KhoBaseService,
  ) { }

  ngOnInit() {

  }
  ngAfterViewInit(): void {
    this.drawTbFollowProject(this.tb_followProjectContainer.nativeElement);
    this.drawTbFollowProjectForSale(this.tb_followProjectForSaleContainer.nativeElement);
    this.drawTbFollowProjectForPM(this.tb_followProjectForPMContainer.nativeElement);
    this.getCustomerBase();
    this.getGroupSaleUser();
    this.getUsers();
    this.getEmployee();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  formatDate(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return date.getFullYear() + '-' +
      pad(date.getMonth() + 1) + '-' +
      pad(date.getDate()) + ' ' +
      pad(date.getHours()) + ':' +
      pad(date.getMinutes()) + ':' +
      pad(date.getSeconds());
  }

  toNzTree(data: any[]): NzTreeNodeOptions[] {
    return data.map(item => ({
      title: `${item.FullName} - ${item.GroupSalesName}  `,
      key: item.ID.toString(),
      value: item.ID,
      expanded: true,
      children: item._children ? this.toNzTree(item._children) : []
    }));
  }

  getGroupSaleUser() {
    this.khoBaseService.getGroupSaleUser({ groupID: 0, teamID: 0 }).subscribe({
      next: (response: any) => {
        this.groupSaleUser = this.toNzTree(this.khoBaseService.setDataTree(response.data, "ID"));
      },
      error: (err: any) => {
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi load nhóm groupSaleUser!'
        );
      }
    });
  }
  getUsers() {
    this.khoBaseService.getUsers().subscribe({
      next: (response: any) => {
        this.users = response.data;
      },
      error: (err: any) => {
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi load nhóm users!'
        );
      }
    });
  }
  getEmployee() {
    this.khoBaseService.getEmployee(-1).subscribe({
      next: (response: any) => {
        this.employees = this.khoBaseService.createdDataGroup(response.data, "DepartmentName");
        console.log(this.employees);
      },
      error: (err: any) => {
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi load nhóm getEmployee!'
        );
      }
    });
  }
  getCustomerBase() {
    this.khoBaseService.getCustomerBase().subscribe({
      next: (response: any) => {
        this.customers = response.data;
      },
      error: (err: any) => {
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi load nhóm customers!'
        );
      }
    });
  }

  getFollowProjectBaseDetail(followProjectBaseID: number, projectID: number) {
    this.khoBaseService.getFollowProjectBaseDetail(followProjectBaseID, projectID).subscribe({
      next: (response: any) => {
        if (response.status == 1) {
          this.tb_followProjectForSaleBody.setData(response.dataSale);
          this.tb_followProjectForPMBody.setData(response.dataPM);
        }
      },
      error: (err: any) => {
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi load nhóm getFollowProjectBaseDetail!'
        );
      }
    });
  }
  drawTbFollowProject(container: HTMLElement) {
    let params = {
      dateStart: this.formatDate(this.dateStart),
      dateEnd: this.formatDate(this.dateEnd),
      filterText: this.filterText,
      user: this.user,
      customerID: this.customerID,
      pm: this.pm,
      warehouseID: this.warehouseID,
      groupSaleID: this.groupSaleID
    }
    this.tb_followProjectBody = new Tabulator(container, {
      height: '88vh',
      layout: 'fitDataStretch',
      selectableRows: 1,
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 20,
      paginationSizeSelector: [20, 50, 100, 200, 500, 1000, 10000, 1000000],
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
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        hozAlign: 'left',
        vertAlign: 'middle',
        resizable: true,
      },
      ajaxURL: this.khoBaseService.getAPIFollowProjectBase(),
      ajaxParams: {
        ...params
      },
      ajaxResponse: (url, params, res) => {
        return {
          data: res.data,
          last_page: res.totalPage,
        };
      },
      columns: [
        {
          title: 'FOLLOW DỰ ÁN',
          field: "FollowProject",
          headerHozAlign: 'center',
          hozAlign: 'center',
          headerSort: false,
          cssClass: 'follow-project-base',
          columns: [
            {
              title: 'ID', field: 'ID', headerHozAlign: 'center', hozAlign: 'right', visible: false, headerSort: false,
            },
            {
              title: 'ProjectID', field: 'ProjectID', headerHozAlign: 'center', hozAlign: 'right', visible: false, headerSort: false,
            },
            {
              title: 'UserID', field: 'UserID', headerHozAlign: 'center', hozAlign: 'right', visible: false, headerSort: false,
            },
            { title: "Mã dự án", field: "ProjectCode", headerHozAlign: "center", hozAlign: "left" },
            { title: "Tên dự án", field: "ProjectName", headerHozAlign: "center", hozAlign: "left" },
            { title: "Sale phụ trách", field: "FullName", headerHozAlign: "center", hozAlign: "left" },
            { title: "PM", field: "ProjectManager", headerHozAlign: "center", hozAlign: "left" },
            { title: "Đối tác(KH)", field: "CustomerName", headerHozAlign: "center", hozAlign: "left" },
            { title: "End User", field: "EndUser", headerHozAlign: "center", hozAlign: "left" },
            { title: "Trạng thái", field: "ProjectStatusName", headerHozAlign: "center", hozAlign: "left" },
            {
              title: "Ngày bắt đầu", field: "ProjectStartDate", width: 120, headerHozAlign: "center", hozAlign: "center",
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
            { title: "Loại dự án", field: "ProjectTypeName", headerHozAlign: "center", hozAlign: "left" },
            { title: "Hãng", field: "FirmName", headerHozAlign: "center", hozAlign: "left" },
            { title: "Khả năng có PO", field: "FirmPossibilityPOName", headerHozAlign: "center", hozAlign: "left" },

          ],
        },
        {
          title: 'DỰ KIẾN',
          field: "FollowProject",
          headerHozAlign: 'center',
          hozAlign: 'center',
          headerSort: false,
          cssClass: 'follow-project-plan',
          columns: [

            {
              title: "Ngày lên phương án", field: "ExpectedPlanDate", width: 120, headerHozAlign: "center", hozAlign: "center",
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
              title: "Ngày báo giá", field: "ExpectedQuotationDate", width: 120, headerHozAlign: "center", hozAlign: "center",
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
              title: "Ngày PO", field: "ExpectedPODate", width: 120, headerHozAlign: "center", hozAlign: "center",
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
              title: "Ngày kết thúc dự án", field: "ExpectedProjectEndDate", width: 120, headerHozAlign: "center", hozAlign: "center",
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

          ],
        },
        {
          title: 'THỰC TẾ',
          field: "FollowProject",
          headerHozAlign: 'center',
          hozAlign: 'center',
          headerSort: false,
          cssClass: 'follow-project-actual',
          columns: [

            {
              title: "Ngày lên phương án", field: "RealityPlanDate", width: 120, headerHozAlign: "center", hozAlign: "center",
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
              title: "Ngày báo giá", field: "RealityQuotationDate", width: 120, headerHozAlign: "center", hozAlign: "center",
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
              title: "Ngày PO", field: "RealityPODate", width: 120, headerHozAlign: "center", hozAlign: "center",
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
              title: "Ngày kết thúc dự án", field: "RealityProjectEndDate", width: 120, headerHozAlign: "center", hozAlign: "center",
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

          ],
        },
        {
          title: 'FOLLOW DỰ ÁN',
          field: "FollowProject",
          headerHozAlign: 'center',
          hozAlign: 'center',
          headerSort: false,
          cssClass: 'follow-project-base',
          columns: [
            { title: "Tổng báo giá chưa VAT", field: "TotalWithoutVAT", headerHozAlign: "center", hozAlign: "left" },
            { title: "Người phụ trách chính", field: "ProjectContactName", headerHozAlign: "center", hozAlign: "left" },
            { title: "Ghi chú", field: "Note", headerHozAlign: "center", hozAlign: "left" },

          ],
        }
      ],
    });
    this.tb_followProjectBody.on('dataLoading', () => {
      this.tb_followProjectBody.deselectRow();
    });
    this.tb_followProjectBody.on('rowDblClick', (e: any, row: any) => {
      // this.handleAction('update');
    })
    // Lắng nghe sự kiện chọn
    this.tb_followProjectBody.on('rowSelected', (row: any) => {
      this.selectedFollowProject.add(row.getData());
      this.getFollowProjectBaseDetail(row.getData().ID, row.getData().ProjectID);
      this.sizeTbDetail = '40%';
    });

    // Lắng nghe sự kiện bỏ chọn
    this.tb_followProjectBody.on('rowDeselected', (row: any) => {
      this.selectedFollowProject.delete(row.getData());
      this.tb_followProjectBody.deselectRow();
      this.sizeTbDetail = '0';

    });
  }
  drawTbFollowProjectForSale(container: HTMLElement) {
    this.tb_followProjectForSaleBody = new Tabulator(container, {
      height: '100%',
      layout: 'fitDataStretch',
      selectableRows: 1,
      columns: [
        {
          title: 'UserID', field: 'UserID', headerHozAlign: 'center', hozAlign: 'right', visible: false, headerSort: false,
        },
        { title: "Họ tên", field: "FullName", headerHozAlign: "center", hozAlign: "left", width: 200 },
        {
          title: "Ngày thực hiện gần nhất", field: "ImplementationDate", width: 200, headerHozAlign: "center", hozAlign: "center",
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
          title: "Ngày dự kiến thực hiện", field: "ExpectedDate", width: 200, headerHozAlign: "center", hozAlign: "center",
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
        { title: "Việc đã làm", field: "WorkDone", headerHozAlign: "center", hozAlign: "left" },
        { title: "Kết quả mong đợi", field: "Results", headerHozAlign: "center", hozAlign: "left" },
        { title: "Vấn đề tồn đọng", field: "ProblemBacklog", headerHozAlign: "center", hozAlign: "left" },
        { title: "Kế hoạch tiếp theo", field: "WorkWillDo", headerHozAlign: "center", hozAlign: "left" },
      ],
    });
  }
  drawTbFollowProjectForPM(container: HTMLElement) {
    this.tb_followProjectForPMBody = new Tabulator(container, {
      height: '100%',
      layout: 'fitDataStretch',
      selectableRows: 1,
      columns: [
        {
          title: 'UserID', field: 'UserID', headerHozAlign: 'center', hozAlign: 'right', visible: false, headerSort: false,
        },
        { title: "Họ tên", field: "FullName", headerHozAlign: "center", hozAlign: "left", width: 200 },
        {
          title: "Ngày thực hiện gần nhất", field: "ImplementationDate", width: 200, headerHozAlign: "center", hozAlign: "center",
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
          title: "Ngày dự kiến thực hiện", field: "ExpectedDate", width: 200, headerHozAlign: "center", hozAlign: "center",
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
        { title: "Việc đã làm", field: "WorkDone", headerHozAlign: "center", hozAlign: "left" },
        { title: "Kết quả mong đợi", field: "Results", headerHozAlign: "center", hozAlign: "left" },
        { title: "Vấn đề tồn đọng", field: "ProblemBacklog", headerHozAlign: "center", hozAlign: "left" },
        { title: "Kế hoạch tiếp theo", field: "WorkWillDo", headerHozAlign: "center", hozAlign: "left" },
      ],
    });
  }
  refresh() {
    this.dateStart = new Date(new Date().getFullYear(), 0, 1);
    this.dateEnd = new Date();
    this.filterText = '';
    this.user = 0;
    this.customerID = 0;
    this.pm = 0;
    this.warehouseID = 1;
    this.groupSaleID = 0;
    this.sizeTbDetail = '0';
    this.selectedFollowProject.clear();
    this.tb_followProjectBody.clearFilter();
    this.drawTbFollowProject(this.tb_followProjectContainer.nativeElement);
  }
  filter() {
    this.drawTbFollowProject(this.tb_followProjectContainer.nativeElement);
    this.selectedFollowProject.clear();
    this.sizeTbDetail = '0';
  }

  handleAction(action: string) {
    if (action == 'create') {
      const modalRef = this.modalService.open(FollowProjectBaseDetailComponent, {
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
        modalDialogClass: 'modal-fullscreen modal-dialog-scrollable'
      });
      modalRef.result.finally(() => {
        this.selectedFollowProject.clear();
        this.drawTbFollowProject(this.tb_followProjectContainer.nativeElement);
      });
      return;
    }
    if (action == 'update') {
      if (this.selectedFollowProject.size != 1) {
        this.notification.create(
          'warning',
          'Thông báo',
          'Vui lòng chọn 1 dự án để xem chi tiết!'
        );
        return;
      }
      const modalRef = this.modalService.open(FollowProjectBaseDetailComponent, {
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
        modalDialogClass: 'modal-fullscreen modal-dialog-scrollable'
      });
      modalRef.componentInstance.FollowProject = Array.from(this.selectedFollowProject)[0];
      modalRef.result.finally(() => {
        this.selectedFollowProject.clear();
        this.drawTbFollowProject(this.tb_followProjectContainer.nativeElement);
      });
      return;
    }
    if (action == 'delete') {
      if (this.selectedFollowProject.size != 1) {
        this.notification.create(
          'warning',
          'Thông báo',
          'Vui lòng chọn 1 dự án để xem chi tiết!'
        );
        return;
      }
      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: 'Bạn có chắc chắn muốn xóa dự án <b>' + Array.from(this.selectedFollowProject)[0].ProjectName + '</b> không?',
        nzOkText: 'Xóa',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzOnOk: () => {
          let object = {
            ID: Array.from(this.selectedFollowProject)[0].ID,
            IsDeleted: true
          }
          this.khoBaseService.postSaveFollowProjectBase(object).subscribe({
            next: (response: any) => {
              if (response.status == 1) {
                this.notification.create(
                  'success',
                  'Thông báo',
                  'Xóa thành công!'
                );
                this.selectedFollowProject.clear();
                this.drawTbFollowProject(this.tb_followProjectContainer.nativeElement);
              } else {
                this.notification.create(
                  'error',
                  'Thông báo',
                  response.message
                );
              }
            },
            error: (err: any) => {
              this.notification.create(
                'error',
                'Thông báo',
                'Lỗi xóa dữ liệu!'
              );
            }
          });
        },
        nzCancelText: 'Hủy',
      });
      return;
    }
    if (action == 'importexcel') {
      const modalRef = this.modalService.open(ImportExcelComponent, {
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
        size: 'xl'
      });
      modalRef.result.finally(() => {
        this.selectedFollowProject.clear();
        this.drawTbFollowProject(this.tb_followProjectContainer.nativeElement);
      });

      return;
    }
    if (action == 'exportexcel') {
      this.exportExcelFromAPI();
      return;
    }
    if (action == 'exportexcelclient') {
      this.exportExcel();
      return;
    }
  }
  //#region xuất excel từ API backend
  exportExcelFromAPI() {
    // Lấy thông tin từ các filter hiện tại
    const selectedRow = Array.from(this.selectedFollowProject)[0];
    const followProjectBaseID = selectedRow?.ID || 0;
    const projectID = selectedRow?.ProjectID || 0;

    // Tạo fileNameElement từ các filter giống Winform
    let fileNameElement = '';
    if (this.user && this.user > 0) {
      const userObj = this.users.find(u => u.ID === this.user);
      fileNameElement = userObj?.FullName || '';
    } else if (this.pm && this.pm > 0) {
      const pmObj = this.employees.flatMap(e => e.options).find((o: any) => o.item.ID === this.pm);
      fileNameElement = pmObj?.item?.FullName || '';
    } else if (this.customerID && this.customerID > 0) {
      const customerObj = this.customers.find(c => c.ID === this.customerID);
      fileNameElement = customerObj?.CustomerName || '';
    }

    const params = {
      followProjectBaseID: followProjectBaseID,
      projectID: projectID,
      userID: this.user,
      customerID: this.customerID,
      pm: this.pm,
      warehouseID: this.warehouseID,
      filterText: this.filterText,
      fileNameElement: fileNameElement
    };

    this.notification.info('Thông báo', 'Đang xuất file Excel...', { nzDuration: 2000 });

    this.khoBaseService.exportFollowProjectBaseExcel(params).subscribe({
      next: (blob: Blob) => {
        // Tạo URL và download file
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Tên file từ server hoặc tạo mới
        const fileName = `FollowProject_${fileNameElement}_${new Date().toISOString().slice(2, 10).split('-').reverse().join('')}.xlsx`;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Giải phóng URL
        window.URL.revokeObjectURL(url);

        this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công!');
      },
      error: (err: any) => {
        console.error('Export error:', err);
        this.notification.error('Thông báo', 'Lỗi khi xuất Excel: ' + (err.error?.message || err.message || 'Vui lòng thử lại'));
      }
    });
  }
  //#endregion

  //#region xuất excel từ client (phương án dự phòng)
  async exportExcel() {
    const table = this.tb_followProjectBody;
    if (!table) return;

    const data = table.getData?.() ?? [];
    if (!data.length) {
      // Nếu bạn dùng NzNotification:
      this.notification?.error?.('', 'Không có dữ liệu xuất Excel!', { nzStyle: { fontSize: '0.75rem' } });

      return;
    }

    // Chuẩn bị Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Follow dự án');

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

        // Chuỗi ngày ISO -> Date để format numFmt
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          const d = new Date(value);
          if (!isNaN(d.getTime())) value = d;
        }

        // Note nhiều dòng: giữ xuống dòng bằng \n (Excel wrapText)
        if (typeof value === 'string') {
          value = value.replace(/(\r\n|\n\r|\r)/g, '\n');
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
    a.download = `Follow dự án - ${formattedDate}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  //#endregion

}
