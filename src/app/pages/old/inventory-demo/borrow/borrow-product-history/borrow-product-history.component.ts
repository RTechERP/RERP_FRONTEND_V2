import {
  Component,
  ViewEncapsulation,
  Input,
  Output,
  EventEmitter,
  inject,
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
import { EnvironmentInjector, Inject, Optional } from '@angular/core';
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
import { BorrowService } from '../borrow-service/borrow.service';
import { BorrowProductHistoryDetailComponent } from './borrow-product-history-detail/borrow-product-history-detail.component';
import { firstValueFrom } from 'rxjs';
import { BorrowProductHistoryBorrowDetailAdminComponent } from './borrow-product-history-borrow-detail-admin/borrow-product-history-borrow-detail-admin.component';
import { BorrowProductHistoryLogComponent } from './borrow-product-history-log/borrow-product-history-log.component';
import { BorrowProductHistoryAddErrorPersonalComponent } from './borrow-product-history-add-error-personal/borrow-product-history-add-error-personal.component';
import { CommonModule } from '@angular/common';
import { BorrowProductHistoryEditPersonComponent } from './borrow-product-history-edit-person/borrow-product-history-edit-person.component';
import { BorrowProductHistoryPersonalHistoryErrorComponent } from './borrow-product-history-personal-history-error/borrow-product-history-personal-history-error.component';
import { AppUserService } from '../../../../../services/app-user.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MenuEventService } from '../../../../systems/menus/menu-service/menu-event.service';
import { MaterialDetailOfProductRtcComponent } from '../../material-detail-of-product-rtc/material-detail-of-product-rtc.component';
import { BillExportTechnicalFormComponent } from '../../../bill-export-technical/bill-export-technical-form/bill-export-technical-form.component';

@Component({
  selector: 'app-borrow-product-history',
  templateUrl: './borrow-product-history.component.html',
  styleUrls: ['./borrow-product-history.component.css'],
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
  encapsulation: ViewEncapsulation.None,
})
export class BorrowProductHistoryComponent implements OnInit {
  // INTEGRATION: Input/Output để hoạt động như modal từ bill import technical
  @Input() isModalMode: boolean = false; // Chế độ modal hay standalone
  @Output() productsExported = new EventEmitter<any[]>(); // Emit data khi xuất
  public activeModal = inject(NgbActiveModal, { optional: true }); // Để đóng modal
  warehouseType: number = 0;

  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private borrowService: BorrowService,
    private appUserService: AppUserService,
    private menuEventService: MenuEventService,
    @Optional() @Inject('tabData') private tabData: any
  ) {}

  @ViewChild('tb_productHistory', { static: false })
  tb_productHistoryContainer!: ElementRef;
  tb_productHistoryBody: any;

  sizeSearch: string = '0';

  // param ajax
  keyWords: string = '';
  dateStart: string = '';
  dateEnd: string = '';
  warehouseID: number = 1;
  userID: number = 0;
  status: string = '1,2,3,4,5,6,7,8';
  selectedStatus: string[] = ['1']; // Multi-select trạng thái
  dateExtend: any = new Date(Date.now());

  // list employee from db
  employees: any[] = [];

  selectedArrHistoryProductID: Set<number> = new Set();
  selectedProductName: any = '';
  selectedProductCode: any = '';
  selectedProductsMap: Map<number, any> = new Map(); // Lưu thông tin chi tiết của từng sản phẩm được chọn

  //#endregion
  //#region Hàm chạy khi mở chương trình
  ngOnInit(): void {
    if (this.tabData) {
      this.warehouseID = this.tabData.warehouseID;
      this.warehouseType = this.tabData.warehouseType;
    }
    this.loadDate();
    this.loadEmployee();
  }

  ngAfterViewInit(): void {
    this.loadDate();
    this.drawTbProductHistory(this.tb_productHistoryContainer.nativeElement);
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  loadDate() {
    const now = new Date();

    // Đầu tháng -1s
    const from = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    );
    from.setUTCSeconds(from.getUTCSeconds() - 1);

    // Cuối tháng +1s
    const to = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    );
    to.setUTCSeconds(to.getUTCSeconds());

    this.dateStart = this.borrowService.formatDateVN(from); // "2025-08-01 00:00:00"
    this.dateEnd = this.borrowService.formatDateVN(to); // "2025-08-31 23:59:59"
  }
  onEmployeeChange(event: number | null) {
    this.userID = event ?? 0;
  }

  onStatusChange(event: string[] | null) {
    this.selectedStatus = event ?? [];
    // Chuyển đổi array thành string để gửi lên API
    this.status = this.selectedStatus.join(',');
  }

  loadEmployee() {
    this.borrowService.getEmployeeTeamAndDepartment().subscribe({
      next: (data) => {
        if (data.status == 1) {
          let datas = data.data;
          this.employees = this.borrowService.createdDataGroup(
            datas,
            'DepartmentName'
          );
        } else {
          this.notification.create(
            'warning',
            'Thông báo',
            'Không có dữ liệu nào được tìm thấy.'
          );
        }
      },
      error: (error) => {
        this.notification.create(
          'error',
          'Lỗi',
          'Không thể tải dữ liệu. Vui lòng thử lại sau.'
        );
      },
    });
  }
  // Service grouping theo DepartmentName -> TeamName
  createdNestedGroup(items: any[], groupByDept: string, groupByTeam: string) {
    const deptGrouped: Record<string, any[]> = items.reduce((acc, item) => {
      const deptKey = item[groupByDept] || 'Khác';
      if (!acc[deptKey]) acc[deptKey] = [];
      acc[deptKey].push(item);
      return acc;
    }, {});

    return Object.entries(deptGrouped).map(([deptLabel, deptItems]) => {
      const teamGrouped: Record<string, any[]> = deptItems.reduce(
        (acc, item) => {
          const teamKey = item[groupByTeam] || 'Khác';
          if (!acc[teamKey]) acc[teamKey] = [];
          acc[teamKey].push(item);
          return acc;
        },
        {}
      );

      return {
        label: deptLabel,
        teams: Object.entries(teamGrouped).map(([teamLabel, teamItems]) => ({
          label: teamLabel,
          options: teamItems.map((item) => ({ item })),
        })),
      };
    });
  }

  filter() {
    // Check null và normalize dữ liệu trước khi filter
    this.keyWords = this.keyWords?.trim() || '';
    this.userID = this.userID ?? 0;

    // Đảm bảo status luôn có giá trị hợp lệ
    if (!this.selectedStatus || this.selectedStatus.length === 0) {
      this.selectedStatus = ['1'];
    }
    this.status = this.selectedStatus.join(',');

    this.drawTbProductHistory(this.tb_productHistoryContainer.nativeElement);
    this.toggleSearchPanel();
  }
  resetFilter() {
    this.refresh();
    this.toggleSearchPanel();
  }
  expiredProduct() {
    this.keyWords = '';
    this.dateStart = '';
    this.dateEnd = '';
    this.warehouseID = 1;
    this.userID = 0;
    this.selectedStatus = ['5'];
    this.status = '5';
    this.loadDate();
    this.drawTbProductHistory(this.tb_productHistoryContainer.nativeElement);
  }
  refresh() {
    this.keyWords = '';
    this.dateStart = '';
    this.dateEnd = '';
    this.warehouseID = 1;
    this.userID = 0;
    this.selectedStatus = ['1'];
    this.status = '1';
    this.loadDate();
    this.drawTbProductHistory(this.tb_productHistoryContainer.nativeElement);
  }
  returnProduct() {
    if (this.selectedArrHistoryProductID.size == 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn sản phẩm cần trả!.'
      );
      return;
    } else {
      this.modal.confirm({
        nzTitle: 'Xác nhận trả ',
        nzContent: `Bạn có chắc chắn muốn trả sản phẩm này không?`,
        nzOkText: 'Xác nhận',
        nzCancelText: 'Hủy',

        nzOnOk: () => {
          const IDAdminDemo = [24, 1434, 88, 1534];
          const userId = this.appUserService?.id || 0;
          const isAdmin = IDAdminDemo.includes(userId);
          const isGlobalAdmin = this.appUserService?.isAdmin || false;
          const employeeID = this.appUserService?.employeeID || 0;
          const arrIds = Array.from(this.selectedArrHistoryProductID);

          // Validate và filter các ID hợp lệ trước khi gọi API
          const validateAndProcess = async () => {
            const validItems: Array<{ id: number; modulaLocationDetailID: number }> = [];

            // Validate từng item trước
            for (const id of arrIds) {
              try {
                // Get the row data from selectedProductsMap
                const rowData = this.selectedProductsMap.get(id);
                if (!rowData) {
                  continue; // Bỏ qua nếu không có data
                }

                // Get full history product data
                const historyRes = await firstValueFrom(
                  this.borrowService.getHistoryProductRTCByID(id)
                );

                if (historyRes?.status !== 1 || !historyRes?.data) {
                  continue; // Bỏ qua nếu không lấy được data
                }

                const model = historyRes.data;
                const status = model.Status || 0;
                const modulaLocationDetailID = model.ModulaLocationDetailID || 0;
                const statusPerson = model.StatusPerson || 0;

                // Check if Status is 1, 4, or 7
                if (status !== 1 && status !== 4 && status !== 7) {
                  // Status không hợp lệ, bỏ qua item này
                  continue;
                }

                // Process based on admin status
                if (isGlobalAdmin || isAdmin) {
                  // Check condition: modulaLocationDetailID > 0 && StatusPerson <= 0 && !(IsAdmin && EmployeeID <= 0)
                  if (
                    modulaLocationDetailID > 0 &&
                    statusPerson <= 0 &&
                    !(isGlobalAdmin && employeeID <= 0)
                  ) {
                    this.notification.error(
                      'Thông báo',
                      'Nhân viên chưa hoàn thành thao tác trả hàng.\nBạn không thể duyệt trả!'
                    );
                    return; // Stop processing on validation error, matching C# behavior
                  }
                }

                // Nếu pass validation thì thêm vào danh sách để gọi API
                validItems.push({ id, modulaLocationDetailID });
              } catch (error) {
                // Bỏ qua item này và tiếp tục
              }
            }

            // Nếu không có ID nào hợp lệ thì return
            if (validItems.length === 0) {
              this.notification.warning('Thông báo', 'Không có sản phẩm nào hợp lệ để trả!');
              return;
            }

            // Gọi API cho các ID hợp lệ (giữ nguyên logic cũ)
            const tasks = validItems.map((item) =>
              firstValueFrom(
                this.borrowService.postReturnProductRTC(
                  item.id,
                  isGlobalAdmin || isAdmin,
                  item.modulaLocationDetailID
                )
              )
                .then(() => ({ id: item.id, success: true, message: null }))
                .catch((error) => {
                  const message = error?.error?.message || 'Lỗi không xác định!';
                  return { id: item.id, success: false, message };
                })
            );

            return Promise.all(tasks).then((results) => {
              const ok = results.filter((r) => r.success).length;
              const failed = results.filter((r) => !r.success);

              if (ok > 0)
                this.notification.success(
                  'Thông báo',
                  `Trả thành công ${ok} sản phẩm.`
                );
              if (failed.length > 0)
                failed.forEach((item) => {
                  this.notification.error('Trả thất bại', item.message);
                });
              this.drawTbProductHistory(
                this.tb_productHistoryContainer.nativeElement
              );
              this.selectedArrHistoryProductID.clear();
              this.selectedProductsMap.clear();
            });
          };

          return validateAndProcess();
        },
      });
    }
  }
  extendBorrowing() {
    if (this.selectedArrHistoryProductID.size == 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn sản phẩm gia hạn!.'
      );
      return;
    } else {
      this.modal.confirm({
        nzTitle: 'Xác nhận gia hạn',
        nzContent: `Bạn có chắc chắn muốn gia hạn sản phẩm này không?`,
        nzOkText: 'Xác nhận',
        nzCancelText: 'Hủy',

        // Trả về Promise để modal quản lý loading
        nzOnOk: async () => {
          const ids = Array.from(this.selectedArrHistoryProductID);
          if (!ids.length) {
            this.notification.warning('Thông báo', 'Chưa chọn sản phẩm nào.');
            return;
          }
          const dateExtend = this.dateExtend.toISOString();

          const tasks = ids.map(async (id) => {
            try {
              const res = await firstValueFrom(
                this.borrowService.getHistoryProductRTCByID(id)
              );
              if (res?.status !== 1) throw new Error('Truy vấn thất bại');

              const history = {
                ...res.data,
                DateReturnExpected: dateExtend,
                UpdatedDate: new Date().toISOString(),
              };
              const up = await firstValueFrom(
                this.borrowService.postSaveHistoryProduct(history)
              );
              if (up?.status !== 1) throw new Error('Cập nhật thất bại');

              const logObj = {
                HistoryProductRTCID: id,
                DateReturnExpected: dateExtend,
              };
              const log = await firstValueFrom(
                this.borrowService.postSaveHistoryProductRTCLog(logObj)
              );
              if (log?.status !== 1) throw new Error('Lưu log thất bại');

              return { id, success: true };
            } catch (err) {
              return { id, success: false, err };
            }
          });

          const results = await Promise.allSettled(tasks);
          const flat = results.map((r) =>
            r.status === 'fulfilled' ? r.value : r.reason
          );
          const ok = flat.filter((x: any) => x?.success).length;
          const fail = flat.length - ok;

          if (ok)
            this.notification.success(
              'Thông báo',
              `Gia hạn thành công ${ok} sản phẩm.`
            );
          if (fail)
            this.notification.error(
              'Thông báo',
              `Gia hạn thất bại ${fail} sản phẩm.`
            );

          // refresh UI
          this.drawTbProductHistory(
            this.tb_productHistoryContainer?.nativeElement
          );
          this.selectedArrHistoryProductID.clear();
        },
      });
    }
  }
  approveBorrowing() {
    if (this.selectedArrHistoryProductID.size == 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn sản phẩm cần duyệt!.'
      );
      return;
    } else {
      this.modal.confirm({
        nzTitle: 'Xác nhận trả ',
        nzContent: `Bạn có chắc chắn muốn duyệt sản phẩm này không?`,
        nzOkText: 'Xác nhận',
        nzCancelText: 'Hủy',

        nzOnOk: () => {
          const isAdmin = this.appUserService.isAdmin;
          const arrIds = Array.from(this.selectedArrHistoryProductID);

          const tasks = arrIds.map((id) => {
            // Lấy thông tin row từ Map đã lưu khi chọn
            const rowData = this.selectedProductsMap.get(id);
            const productCode =
              rowData?.ProductCodeRTC || rowData?.ProductCode || 'N/A';

            return firstValueFrom(
              this.borrowService.postApproveBorrowingRTC(id, isAdmin)
            )
              .then(() => ({
                id,
                success: true,
                message: null,
                ProductNewCode: productCode,
              }))
              .catch((error) => {
                const message = error?.error?.message || 'Lỗi không xác định!';
                return {
                  id,
                  success: false,
                  message,
                  ProductNewCode: productCode,
                };
              });
          });

          return Promise.all(tasks).then((results) => {
            const ok = results.filter((r) => r.success).length;
            const failed = results.filter((r) => !r.success);

            if (ok > 0)
              this.notification.success(
                'Thông báo',
                `Duyệt thành công ${ok} sản phẩm.`
              );

            if (failed.length > 0) {
              failed.forEach((item) => {
                this.notification.error(
                  'Duyệt thất bại',
                  `Thiết bị ${item.ProductNewCode}: ${item.message}`
                );
              });
            }

            this.drawTbProductHistory(
              this.tb_productHistoryContainer.nativeElement
            );
            this.selectedArrHistoryProductID.clear();
            this.selectedProductsMap.clear();
          });
        },
      });
    }
  }
  drawTbProductHistory(container: HTMLElement) {
    this.tb_productHistoryBody = new Tabulator(container, {
      height: '100%',
      layout: 'fitDataStretch',
      selectableRows: true,

      rowContextMenu: [
        {
          label: 'Lịch sử gia hạn',
          action: (e, row) => {
            let rowData = row.getData();
            let ID = rowData['ID'];
            this.historyProductRTCLog(ID);
          },
        },
        // {
        //   label: 'Ghi lại lỗi quy trình nhập xuất kho cá nhân',
        //   action: (e, row) => {
        //     let rowData = row.getData();
        //     let ID = rowData['ID'];
        //     this.addErrorPersonal(ID);
        //   },
        // },
        {
          label: 'Chi tiết',
          action: (e, row) => {
            const rowData = row.getData();
            this.openDetailTab(rowData);
          },
        },
        {
          label: 'Xem phiếu xuất',
          action: (e, row) => {
            const rowData = row.getData();
            this.showBillExport(rowData);
          },
        },
        {
          label: 'Xóa',
          action: (e, row) => {},
        },
      ],
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 30,
      paginationSizeSelector: [30, 50, 100, 200, 500],
      ajaxURL: this.borrowService.getApiUrlProductHistory(),
      ajaxParams: {
        keyWords: this.keyWords?.trim() || '',
        dateStart: this.dateStart
          ? this.borrowService.formatDateVN(new Date(this.dateStart as any))
          : '',
        dateEnd: this.dateEnd
          ? this.borrowService.formatDateVN(new Date(this.dateEnd as any))
          : '',
        warehouseID: this.warehouseID ?? 0,
        userID: this.userID ?? 0,
        status:
          this.selectedStatus && this.selectedStatus.length > 0
            ? this.selectedStatus.join(',')
            : '1',

        isDeleted: 0,
        warehouseType: this.warehouseType ?? 1,
      },
      ajaxResponse: (url, params, res) => {
        let totalPage = 0;
        if (res.data.length != 0) {
          totalPage = res.data[0].TotalPage;
        }
        return {
          data: res.data,
          last_page: totalPage,
        };
      },
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

      columns: [
        {
          title: '',
          field: '',
          headerHozAlign: 'center',
          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          hozAlign: 'center',
          headerSort: false,
          width: 50,
          frozen: true,
          cellClick: function (e, cell) {
            // Để Tabulator tự xử lý tick checkbox
            e.stopPropagation(); // Ngăn click lan ra rowClick
          },
        },
        {
          title: 'Trạng thái',
          field: 'StatusText',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Duyệt',
          field: 'AdminConfirm',
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked =
              value === true ||
              value === 'true' ||
              value === 1 ||
              value === '1';
            return `<input type="checkbox" ${
              checked ? 'checked' : ''
            } style="pointer-events: none; accent-color: #1677ff;" />`;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Tên',
          field: 'ProductName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductCodeRTC',
          hozAlign: 'left',
          headerHozAlign: 'center',
          
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã QR',
          field: 'ProductQRCode',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
        {
          title: 'Serial',
          field: 'SerialNumber',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Part Number',
          field: 'PartNumber',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Code',
          field: 'Serial',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Hãng',
          field: 'Maker',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Số lượng mượn',
          field: 'NumberBorrow',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
        {
          title: 'Vị trí hộp',
          field: 'AddressBox',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Vị trí trả',
          field: 'AddressBoxActual',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Người mượn',
          field: 'FullName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: function (cell) {
            let rowData = cell.getRow().getData();
            if (rowData['StatusNew'] == 6) {
              //sắp đến ngày
              cell.getElement().style.backgroundColor = 'rgb(255, 255, 74)';
              cell.getElement().style.color = 'black';
            }
            if (rowData['StatusNew'] == 5) {
              //quá hạn
              cell.getElement().style.backgroundColor = 'rgb(239, 31, 62)';
              cell.getElement().style.color = 'white';
            }
            if (rowData['Status'] == 4) {
              //đăng kí trả
              cell.getElement().style.backgroundColor = 'rgb(0, 255, 0)';
              cell.getElement().style.color = 'black';
            }
            //nếu phiếu mượn được tạo từ phiếu xuất thì sẽ có màu xanh da giời nhạt nhạt
            if (rowData['BillExportTechnicalID'] > 0) {
              cell.getElement().style.backgroundColor = 'rgb(128, 255, 255)';
              cell.getElement().style.color = 'black';
            }

            return cell.getValue();
          },
        },
        {
          title: 'Ngày mượn',
          field: 'DateBorrow',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: function (cell) {
            const raw = cell.getValue();
            if (!raw) return '';
            try {
              return DateTime.fromISO(raw).toFormat('dd/MM/yyyy');
            } catch {
              return raw;
            }
          },
        },
        {
          title: 'Ngày trả dự kiến',
          field: 'DateReturnExpected',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: function (cell) {
            const raw = cell.getValue();
            if (!raw) return '';
            try {
              return DateTime.fromISO(raw).toFormat('dd/MM/yyyy');
            } catch {
              return raw;
            }
          },
        },
        {
          title: 'Ngày trả',
          field: 'DateReturn',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: function (cell) {
            const raw = cell.getValue();
            if (!raw) return '';
            try {
              return DateTime.fromISO(raw).toFormat('dd/MM/yyyy');
            } catch {
              return raw;
            }
          },
        },
        {
          title: 'Dự án',
          field: 'Project',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Note',
          field: 'Note',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã phiếu xuất',
          field: 'BillExportCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Loại phiếu',
          field: 'BillTypeText',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
      ],
    });
    this.selectedArrHistoryProductID.clear();
    this.selectedProductsMap.clear();
    this.tb_productHistoryBody.on('dataLoading', () => {
      this.tb_productHistoryBody.deselectRow();
    });
    this.tb_productHistoryBody.on('rowDblClick', (e: any, row: any) => {
      this.productHistoryBorrowDetail();
    });
    // Lắng nghe sự kiện chọn
    this.tb_productHistoryBody.on('rowSelected', (row: any) => {
      const rowData = row.getData();
      const id = rowData.ID;
      this.selectedArrHistoryProductID.add(id);
      this.selectedProductCode = rowData.ProductCode;
      this.selectedProductName = rowData.ProductName;
      // Lưu toàn bộ thông tin row vào Map
      this.selectedProductsMap.set(id, rowData);
    });

    // Click vào row (không phải checkbox) → chỉ chọn 1 row
    this.tb_productHistoryBody.on('rowClick', (e: any, row: any) => {
      const clickedField = e.target
        .closest('.tabulator-cell')
        ?.getAttribute('tabulator-field');
      if (clickedField !== 'select') {
        // Bỏ chọn hết và chọn row hiện tại
        this.tb_productHistoryBody.deselectRow();
        row.select();
      }
    });
    // Lắng nghe sự kiện bỏ chọn
    this.tb_productHistoryBody.on('rowDeselected', (row: any) => {
      const id = row.getData().ID;
      this.selectedArrHistoryProductID.delete(id);
      // Xóa khỏi Map khi bỏ chọn
      this.selectedProductsMap.delete(id);
    });
  }

  historyProductRTCLog(ID: number) {
    const modalRef = this.modalService.open(BorrowProductHistoryLogComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true,
      size: 'xl',
    });
    modalRef.componentInstance.HistoryProductID = ID;
    modalRef.componentInstance.warehouseType = this.warehouseType;
  }
  addErrorPersonal(ID: number) {
    const modalRef = this.modalService.open(
      BorrowProductHistoryAddErrorPersonalComponent,
      {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        scrollable: true,
        size: 'xl',
      }
    );
    modalRef.componentInstance.HistoryProductID = ID;
  }
  historyError() {
    const modalRef = this.modalService.open(
      BorrowProductHistoryPersonalHistoryErrorComponent,
      {
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
        modalDialogClass: 'modal-fullscreen modal-dialog-scrollable',
      }
    );
  }
  editBorrower() {
    if (this.selectedArrHistoryProductID.size == 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn sản phẩm cần chuyển người mượn!.'
      );
      return;
    } else {
      const modalRef = this.modalService.open(
        BorrowProductHistoryEditPersonComponent,
        {
          backdrop: 'static',
          keyboard: false,
          centered: true,
          scrollable: true,
          size: 'xl',
        }
      );
      modalRef.componentInstance.arrHistoryProductID = Array.from(
        this.selectedArrHistoryProductID
      );
      modalRef.componentInstance.ProductName = this.selectedProductName;
      modalRef.componentInstance.ProductCode = this.selectedProductCode;
      modalRef.result.finally(() => {
        this.drawTbProductHistory(
          this.tb_productHistoryContainer.nativeElement
        );
      });
    }
  }

  // INTEGRATION: Xuất sản phẩm đã chọn sang bill import technical
  exportSelectedProducts() {
    if (this.selectedArrHistoryProductID.size === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn sản phẩm cần xuất!'
      );
      return;
    }

    // Lấy data từ selectedProductsMap
    const selectedProducts = Array.from(this.selectedArrHistoryProductID)
      .map((id) => {
        return this.selectedProductsMap.get(id);
      })
      .filter((product) => product != null);

    if (selectedProducts.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không có sản phẩm hợp lệ để xuất!'
      );
      return;
    }

    // Emit data về parent component
    this.productsExported.emit(selectedProducts);

    // Đóng modal (chỉ khi được mở như modal)
    this.activeModal?.close(selectedProducts);
  }

  // INTEGRATION: Đóng modal khi click nút đóng
  closeModal() {
    if (this.activeModal) {
      this.activeModal.dismiss('cancel');
    }
  }

  productHistoryBorrowDetail() {
    const modalRef = this.modalService.open(
      BorrowProductHistoryBorrowDetailAdminComponent,
      {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        scrollable: true,
        size: 'xl',
      }
    );
    modalRef.componentInstance.HistoryProductID =
      Array.from(this.selectedArrHistoryProductID).at(-1) ?? 0;
  }
  productHistoryDetail() {
    const modalRef = this.modalService.open(
      BorrowProductHistoryDetailComponent,
      {
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
        modalDialogClass: 'modal-fullscreen modal-dialog-scrollable',
      }
    );
    modalRef.componentInstance.warehouseType = this.warehouseType;

    modalRef.result.finally(() => {
      this.drawTbProductHistory(this.tb_productHistoryContainer.nativeElement);
    });
  }

  //#region xuất excel
  async exportExcel() {
    const table = this.tb_productHistoryBody;
    if (!table) return;

    const data = table.getData?.() ?? [];
    if (!data.length) {
      // Nếu bạn dùng NzNotification:
      this.notification?.error?.('', 'Không có dữ liệu xuất Excel!', {
        nzStyle: { fontSize: '0.75rem' },
      });

      return;
    }

    // Chuẩn bị Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lịch sử mượn');

    // Lấy cột từ Tabulator
    const columns: any[] = table.getColumns?.() ?? [];
    // Bỏ cột đầu nếu là checkbox/STT:
    const filteredColumns = columns.slice(1);

    // Header
    const headers = filteredColumns.map((c) => c.getDefinition().title ?? '');
    const headerRow = worksheet.addRow(headers);

    // Style header
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEFEFEF' },
      };
      cell.border = { bottom: { style: 'thin' } };
    });

    // Dữ liệu
    data.forEach((row: any) => {
      const rowData = filteredColumns.map((col: any) => {
        const def = col.getDefinition?.() ?? {};
        const field = col.getField?.();
        let value = field ? row[field] : '';

        // Map formatter tick/tickCross -> Excel text
        if (def.formatter === 'tick' || def.formatter === 'tickCross') {
          const v = !!value;
          value = v ? '✓' : def.formatter === 'tickCross' ? '✗' : '';
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

        return value ?? '';
      });

      const r = worksheet.addRow(rowData);

      // Căn lề theo hozAlign từng cột
      filteredColumns.forEach((col: any, idx: number) => {
        const align = (col.getDefinition?.().hozAlign || 'left') as string;
        r.getCell(idx + 1).alignment = {
          horizontal:
            align === 'center'
              ? 'center'
              : align === 'right'
              ? 'right'
              : 'left',
          vertical: 'middle',
          wrapText: true,
        };
      });
    });

    // Định dạng cột ngày theo field
    const dateFields = ['DatePromulgate', 'DateEffective'];
    dateFields.forEach((f) => {
      const idx = filteredColumns.findIndex(
        (c) => c.getDefinition?.().field === f
      );
      if (idx >= 0) worksheet.getColumn(idx + 1).numFmt = 'dd/mm/yyyy';
    });

    // Auto width + cố định cột 14 (1-based trong Excel)
    worksheet.columns.forEach((column: any) => {
      if (!column) return;

      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const v = cell.value;
        const s = v instanceof Date ? 'dd/mm/yyyy' : (v ?? '').toString();
        maxLength = Math.max(maxLength, s.length + 2);
      });
      // Giới hạn để tránh cột quá rộng
      column.width = Math.max(8, Math.min(maxLength, 50));
    });

    // AutoFilter trên hàng tiêu đề
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lịch Sử Mượn - ${formattedDate}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  //#endregion

  /**
   * Xem phiếu xuất kỹ thuật
   * Tương tự btnShowBillExport_Click trong WinForm
   * Mở modal ở chế độ xem/sửa (giống như onEditExportTechnical)
   */
  showBillExport(rowData: any): void {
    const billExportID = rowData.BillExportTechnicalID || 0;
    
    if (billExportID <= 0) {
      this.notification.warning('Thông báo', 'Không có phiếu xuất liên kết!');
      return;
    }

    // Mở modal giống như chế độ edit (onEditExportTechnical)
    const modalRef = this.modalService.open(BillExportTechnicalFormComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });

    // Set masterId để form tự load data từ API (giống onEditExportTechnical)
    modalRef.componentInstance.masterId = billExportID;
    modalRef.componentInstance.warehouseID = this.warehouseID;
    modalRef.componentInstance.warehouseType = this.warehouseType;
    modalRef.componentInstance.fromBorrowHistory = true; // Flag để phân biệt luồng này

    // Xử lý kết quả khi modal đóng
    modalRef.result.then(
      (result) => {
        if (result === true) {
          // Reload data after save
          this.drawTbProductHistory(
            this.tb_productHistoryContainer.nativeElement
          );
        }
      },
      (dismissed) => {
        // Modal dismissed
      }
    );
  }

  /**
   * Mở tab chi tiết sản phẩm (MaterialDetailOfProductRTC)
   * Tương tự như btnDetail_Click trong WinForm
   */
  openDetailTab(rowData: any): void {
    const title = `Chi tiết: ${rowData.ProductName || rowData.ProductCode}`;
    const data = {
      productRTCID1: rowData.ProductRTCID || 0,
      warehouseID1: this.warehouseID || 1,
      ProductCode: rowData.ProductCode || '',
      ProductName: rowData.ProductName || '',
      NumberBegin: rowData.Number || 0,
      InventoryLatest: rowData.InventoryLatest || 0,
      NumberImport: rowData.NumberImport || 0,
      NumberExport: rowData.NumberExport || 0,
      NumberBorrowing: rowData.NumberBorrowing || 0,
      InventoryReal: rowData.InventoryReal || 0,
    };

    this.menuEventService.openNewTab(
      MaterialDetailOfProductRtcComponent,
      title,
      data
    );
  }
}
