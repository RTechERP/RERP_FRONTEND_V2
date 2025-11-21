import { ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { inject } from '@angular/core';
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
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import { VehicleBookingManagementService } from './vehicle-booking-management.service';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import { CommonModule } from '@angular/common'; // ← Thêm dòng này
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { VehicleScheduleFormComponent } from './vehicle-schedule-form/vehicle-schedule-form.component';
import { ExportVehicleScheduleFormComponent } from './export-vehicle-schedule-form/export-vehicle-schedule-form.component';
import { VehicleBookingFileImagesFormComponent } from './vehicle-booking-file-images-form/vehicle-booking-file-images-form.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../../auth/auth.service';
@Component({
  selector: 'app-vehicle-booking-management',
  imports: [
    NzCardModule,
    NzCheckboxModule,
    FormsModule,
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
    CommonModule,
    HasPermissionDirective
  ],
  templateUrl: './vehicle-booking-management.component.html',
  styleUrl: './vehicle-booking-management.component.css'
})
export class VehicleBookingManagementComponent implements OnInit, AfterViewInit {

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private vehicleBookingManagementService: VehicleBookingManagementService,
    private cdRef: ChangeDetectorRef,
    private authService: AuthService

  ) { }
  private ngbModal = inject(NgbModal);
  @ViewChild('dataTableVehicleBookingManagement', { static: false }) tableElementRef!: ElementRef;
  vehicleBookingManagementTable: Tabulator | null = null;
  vehicleBookingManagementList: any[] = [];
  keyWord: string = '';
  searchText: string = '';
  isSearchVisible: boolean = false;
  checked = false;
  selected: any;
  vehicleBookingListId: any[] = [];
  dateStart: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0 })
    .toISO();
  dateEnd: any = DateTime.local()
    .set({ hour: 23, minute: 59, second: 59 })
    .toISO();
  getDay() {
    console.log(
      DateTime.fromJSDate(new Date(this.dateStart))
        .set({ hour: 23, minute: 59, second: 59 })
        .toFormat('yyyy-MM-dd HH:mm:ss'),
      DateTime.fromJSDate(this.dateStart)
        .set({ hour: 23, minute: 59, second: 59 })
        .toFormat('yyyy-MM-dd HH:mm:ss')
    );
  }
  categoryId: any = 0;
  statusId: any = 0;

  // Tạo mảng category
  lstCategory = [
    { Category: 0, CategoryText: "Tất cả" },
    { Category: 1, CategoryText: "Đăng ký đi" },
    { Category: 5, CategoryText: "Đăng ký về" },
    { Category: 4, CategoryText: "Chủ động phương tiện" },
    { Category: 2, CategoryText: "Đăng ký giao hàng" },
    { Category: 6, CategoryText: "Đăng ký lấy hàng" }
  ];
  lstStatus = [
    { Status: 0, StatusText: "Tất cả" },
    { Status: 1, StatusText: "Chờ xếp" },
    { Status: 2, StatusText: "Đã xếp" },
    { Status: 4, StatusText: "Chủ động phương tiện" }
  ];
  //#region chạy khi mở chương trình
  currentUser: any = null;

  ngOnInit() {
    this.getCurrentUser();
  }

  ngAfterViewInit(): void {
    // Ensure ViewChild is initialized before drawing table
    this.cdRef.detectChanges();
    // Initialize table first with empty data to show the table structure
    this.initTable();
    // Then load data from API
    this.getVehicleBookingManagement();
  }
  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
      console.log('CurrentUser', this.currentUser);
    });
  }
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }

  onCategoryChange(categoryId: number) {
    this.categoryId = categoryId
  }

  onStatusChange(statusId: number) {
    this.statusId = statusId
  }

  onKeywordChange(value: string): void {
    this.keyWord = value;
  }

  updateChecked() {
    console.log(this.checked);
    this.getVehicleBookingManagement();
  }
  onSearch() {
    this.getVehicleBookingManagement();
  }
  setDefautSearch() {
    this.dateStart = DateTime.local()
      .set({ hour: 0, minute: 0, second: 0 })
      .toISO();
    this.dateEnd = DateTime.local()
      .set({ hour: 23, minute: 59, second: 59 })
      .toISO();
    this.categoryId = 0;
    this.statusId = 0;
    this.checked = false;
    this.keyWord = '';
    this.getVehicleBookingManagement();
  }

  onVehicleBookingFileImages() {
    if (this.vehicleBookingListId.length === 0) {
      this.notification.warning('Lỗi', 'Vui lòng chọn ít nhất một dòng!');
      return
    }
    const modalRef = this.modalService.open(VehicleBookingFileImagesFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = this.vehicleBookingListId;
    modalRef.result.then(
      (result) => {

        setTimeout(() => this.getVehicleBookingManagement(), 100);
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onVehicleSchedule() {
    if (!this.validatechecked()) {
      return;
    }
    const modalRef = this.modalService.open(VehicleScheduleFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = this.vehicleBookingListId;
    modalRef.result.then(
      (result) => {
        this.notification.success("Thông báo", "Tạo sản phẩm thành công");
        setTimeout(() => this.getVehicleBookingManagement(), 100);
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onExportVehicleSchedule() {
    const modalRef = this.modalService.open(ExportVehicleScheduleFormComponent, {
      backdrop: 'static',
      keyboard: false,
      scrollable: true,
      modalDialogClass: 'modal-fullscreen modal-dialog-scrollable'
    });
    modalRef.result.then(
      (result) => {
        this.notification.success("Thông báo", "Tạo sản phẩm thành công");
        setTimeout(() => this.getVehicleBookingManagement(), 100);
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onWatingArrange() {
    if (this.vehicleBookingListId.length <= 0) {
      this.notification.error("Thông báo", "Chọn ít nhất một thông tin xe");
      setTimeout(() => this.getVehicleBookingManagement(), 100);
      return;
    }
    console.log("vehicleBookingListId.length ", this.vehicleBookingListId.length);
    var checkUpdatesuccess = true;
    this.vehicleBookingListId.forEach(item => {
      const request = {
        ID: item.ID,
        Status: 1,
        IsCancel: false
      };
      this.vehicleBookingManagementService.postVehicleBookingManagement(request).subscribe({
        next: () => {

        },
        error: () => {
          checkUpdatesuccess = false;
        }
      });
    });
    if (checkUpdatesuccess) {
      this.notification.success("Thông báo", "Xếp xe thành công");
      setTimeout(() => this.getVehicleBookingManagement(), 100);
    }
    else {
      this.notification.create(
        'error',
        'Thông báo',
        'Lỗi lưu!'
      );
      setTimeout(() => this.getVehicleBookingManagement(), 100);
    }
  }
  Cancel_Click() {
    if (this.vehicleBookingListId.length <= 0) {
      this.notification.error("Thông báo", "Chọn ít nhất một thông tin xe");
      setTimeout(() => this.getVehicleBookingManagement(), 100);
      return;
    }
    console.log("vehicleBookingListId.length ", this.vehicleBookingListId.length);
    var checkUpdatesuccess = true;
    this.vehicleBookingListId.forEach(item => {
      const request = {
        ID: item.ID,
        Status: 3,
        IsCancel: true
      };
      this.vehicleBookingManagementService.postVehicleBookingManagement(request).subscribe({
        next: () => {

        },
        error: () => {
          checkUpdatesuccess = false;
        }
      });
    });
    if (checkUpdatesuccess) {
      this.notification.success("Thông báo", "Hủy lịch đặt thành công");
      setTimeout(() => this.getVehicleBookingManagement(), 100);
    }
    else {
      this.notification.create(
        'error',
        'Thông báo',
        'Lỗi lưu!'
      );
      setTimeout(() => this.getVehicleBookingManagement(), 100);
    }
  }

  Approve(status: boolean) {
    const isApprovedText = status ? "duyệt" : "huỷ duyệt";

    // Kiểm tra có chọn dòng không
    if (this.vehicleBookingListId.length <= 0) {
      this.notification.warning("Thông báo", `Vui lòng chọn đăng ký xe muốn ${isApprovedText}!`);
      return;
    }

    // Hiển thị dialog xác nhận
    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn ${isApprovedText} danh sách đặt xe phát sinh đã chọn không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Lấy thông tin user hiện tại
        if (!this.currentUser) {
          this.notification.warning("Thông báo", "Không thể lấy thông tin user hiện tại!");
          return;
        }

        const currentDepartmentID = this.currentUser.DepartmentID || 0;
        const currentEmployeeID = this.currentUser.EmployeeID || 0;
        const isAdmin = this.currentUser.IsAdmin || false;

        // Xử lý logic: Global.DepartmentID = Global.EmployeeID == 54 ? 2 : Global.DepartmentID
        let departmentID = currentDepartmentID;
        if (currentEmployeeID === 54) {
          departmentID = 2;
        }

        // Lọc các item hợp lệ để xử lý và thu thập lý do lỗi
        const validItems: any[] = [];
        const errors: string[] = [];
        let noProblemCount = 0;

        this.vehicleBookingListId.forEach(item => {
          // Kiểm tra ID > 0
          if (!item.ID || item.ID <= 0) {
            return;
          }

          // Chỉ xử lý nếu có phát sinh (IsProblemArises == true)
          if (!item.IsProblemArises) {
            noProblemCount++;
            return;
          }

          // Kiểm tra department permission: Global.DepartmentID != departmentId && !Global.IsAdmin
          const itemDepartmentID = item.DepartmentID || 0;
          if (departmentID !== itemDepartmentID && !isAdmin) {
            errors.push(`Bạn không phải TBP của phòng ${item.DepartmentName}, không thể duyệt đơn của ${item.FullName}.`);
            return;
          }

          validItems.push(item);
        });

        if (noProblemCount > 0) {
          errors.unshift(`Có ${noProblemCount} đơn không có vấn đề phát sinh, không cần duyệt.`);
        }

        if (errors.length > 0) {
          // Hiển thị lỗi chi tiết (tối đa 3 lỗi đầu tiên để tránh spam)
          const errorMsg = errors.slice(0, 3).join('<br>') + (errors.length > 3 ? `<br>...và ${errors.length - 3} lỗi khác.` : '');
          this.notification.warning("Không thể duyệt một số đơn", errorMsg, { nzDuration: 5000 });
        }

        if (validItems.length === 0) {
          return;
        }

        // Tạo requests để xử lý đồng thời
        const requests = validItems.map(item => {
          const request = {
            ...item,
            IsApprovedTBP: status
          };
          return this.vehicleBookingManagementService.approveBooking(request).pipe(
            catchError((error) => {
              console.error(`Lỗi khi ${isApprovedText} đơn ${item.ID}:`, error);
              return of({ success: false, error, item });
            })
          );
        });

        // Xử lý tất cả requests đồng thời
        forkJoin(requests).subscribe({
          next: (responses: any[]) => {
            const successCount = responses.filter(r => r.success !== false).length;
            const failCount = responses.filter(r => r.success === false).length;

            if (successCount > 0) {
              this.notification.success(
                'Thông báo',
                `${isApprovedText.charAt(0).toUpperCase() + isApprovedText.slice(1)} thành công cho ${successCount} đơn đăng ký.`
              );
            }

            if (failCount > 0) {
              this.notification.error(
                'Thông báo',
                `Có ${failCount} đơn đăng ký ${isApprovedText} thất bại.`
              );
            }

            // Reload data sau khi xử lý
            setTimeout(() => this.getVehicleBookingManagement(), 100);
          },
          error: (error) => {
            console.error(`Lỗi khi ${isApprovedText}:`, error);
            this.notification.error('Thông báo', `Lỗi khi ${isApprovedText}!`);
            setTimeout(() => this.getVehicleBookingManagement(), 100);
          }
        });
      }
    });
  }
  test() { }
  async exportToExcel() {
    let table = this.vehicleBookingManagementTable;
    if (!table) return;
    let data = table.getData();
    if (!data || data.length === 0) {
      this.notification.error('', 'Không có dữ liệu để xuất!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lĩnh vực dự án');
    const columns = table.getColumns();

    // Bỏ cột đầu tiên bằng cách slice từ index 1
    const filteredColumns = columns.slice(1);
    // Lọc bỏ cột có title là 'ID'
    const filteredColumnsID = filteredColumns.filter((col: any) => col.getDefinition().title !== 'ID');
    // Thêm dòng header
    const headers = filteredColumnsID.map((col: any) => col.getDefinition().title);

    // Thêm dòng header và lưu lại dòng đó để thao tác
    const headerRow = worksheet.addRow(headers);

    // Gán style màu xám cho từng ô trong dòng header
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D9D9D9' }, // Màu xám nhạt
      };
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    data.forEach((row: any) => {
      const rowData = filteredColumnsID.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });

      worksheet.addRow(rowData);
    });

    const startRow = 2;
    const column = 'A';

    const rowCount = worksheet.rowCount;

    for (let i = startRow; i <= rowCount - 2; i += 3) {
      const cell1 = worksheet.getCell(`${column}${i}`);
      const cell2 = worksheet.getCell(`${column}${i + 1}`);
      const cell3 = worksheet.getCell(`${column}${i + 2}`);

      if (cell1.value === cell2.value && cell1.value === cell3.value) {
        worksheet.mergeCells(`${column}${i}:${column}${i + 2}`);
        // Căn giữa nếu cần
        cell1.alignment = { vertical: 'middle' };
      }
    }

    // Format cột có giá trị là Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: columns.length,
      },
    };

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.alignment = {
          ...cell.alignment,
          wrapText: true,
          vertical: 'middle', // tùy chọn: căn giữa theo chiều dọc
        };
      });
    });

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
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `LichTrinhXe.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }


  getVehicleBookingManagement() {
    const request = {
      StartDate: this.dateStart,
      EndDate: this.dateEnd,
      Category: this.categoryId || 0,
      Status: this.statusId || 0,
      Keyword: this.keyWord || "",
      IsCancel: this.checked
    };
    console.log("request:", request);
    this.vehicleBookingManagementService.getVehicleBookingManagement(request).subscribe((response: any) => {
      this.vehicleBookingManagementList = response.data || [];
      console.log(this.vehicleBookingManagementList);
      this.drawTable();
    });
  }


  //#region Drawtable
  private initTable(): void {
    if (!this.tableElementRef) {
      return;
    }

    if (!this.vehicleBookingManagementTable) {
      this.vehicleBookingManagementTable = new Tabulator(this.tableElementRef.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        layout: "fitColumns",
        paginationMode: 'local',
        groupBy: (row: any) => row.VehicleInformation || null,
        groupHeader: (value: string, count: number) => {
          if (!value) return `Thông tin xe: Chưa có thông tin (${count} dòng)`;
          return `Thông tin xe: ${value} (${count} dòng)`;
        },
        initialSort: [
          {
            column: "VehicleInformation",
            dir: "asc",
          },
        ],
        // 👇 Thêm formatter cho hàng - tô màu theo Status
        rowFormatter: (row: any) => {
          const data = row.getData();
          const status = data.Status;
          const isApprovedTBP = data.IsApprovedTBP;
          const isProblemArises = data.IsProblemArises;
          const element = row.getElement();

          // Status == 3 (Hủy xếp) - background đỏ, chữ trắng
          if (status === 3) {
            element.style.backgroundColor = "#dc3545"; // Màu đỏ
            element.style.color = "#ffffff"; // Chữ trắng
          }
          // Status == 1 hoặc 4 (Chưa xếp) - background vàng
          else if (status === 1 || status === 4) {
            // Nếu !isApprovedTBP && isProblemArises - background xám nhạt
            if (!isApprovedTBP && isProblemArises) {
              element.style.backgroundColor = "#d3d3d3"; // Màu xám nhạt
              element.style.color = ""; // Màu chữ mặc định
            } else {
              element.style.backgroundColor = "#ffc107"; // Màu vàng
              element.style.color = ""; // Màu chữ mặc định
            }
          }
          // Giữ logic cũ cho IsCancel nếu cần
          else if (data.IsCancel === true) {
            element.style.backgroundColor = "#ffcccc"; // đỏ nhạt
          }
          else {
            // Reset về mặc định cho các trường hợp khác
            element.style.backgroundColor = "";
            element.style.color = "";
          }
        },
        columns: [

          {//create column group
            cssClass: "group-booking-info",
            title: "Thông tin đặt xe",
            columns: [
              { title: "TBP duyệt", field: "ApprovedTBPText", width: 100 },
              { title: "Tên TBP duyệt", field: "FullNameTBP", width: 120 },
              { title: "Lý do phát sinh", field: "ProblemArises", width: 120 },
              { title: "Hình thức đặt", field: "CategoryText", width: 120 },
              { title: "Họ tên", field: "FullName", width: 150, bottomCalc: 'count' },
              { title: "Phòng ban", field: "DepartmentName", width: 120 },
              { title: "Điểm xuất phát", field: "DepartureAddress", width: 150 },
              {
                title: "Thời gian xuất phát",
                field: "DepartureDate",
                hozAlign: "center",
                width: 150,
                formatter: (cell) => {
                  const value = cell.getValue();
                  if (!value) return "";
                  const date = new Date(value);

                  const dd = String(date.getDate()).padStart(2, "0");
                  const MM = String(date.getMonth() + 1).padStart(2, "0");
                  const yyyy = date.getFullYear();
                  const hh = String(date.getHours()).padStart(2, "0");
                  const mm = String(date.getMinutes()).padStart(2, "0");
                  const ss = String(date.getSeconds()).padStart(2, "0");

                  return `${dd}/${MM}/${yyyy} ${hh}:${mm}:${ss}`;
                }
              }
              ,
              {
                title: "Thời gian xuất phát thực tế", field: "DepartureDateActual", hozAlign: "center", width: 200,
                formatter: (cell) => {
                  const value = cell.getValue();
                  if (!value) return "";
                  const date = new Date(value);

                  const dd = String(date.getDate()).padStart(2, "0");
                  const MM = String(date.getMonth() + 1).padStart(2, "0");
                  const yyyy = date.getFullYear();
                  const hh = String(date.getHours()).padStart(2, "0");
                  const mm = String(date.getMinutes()).padStart(2, "0");
                  const ss = String(date.getSeconds()).padStart(2, "0");

                  return `${dd}/${MM}/${yyyy} ${hh}:${mm}:${ss}`;
                }
              },
              { title: "Ghi chú", field: "Note", width: 300, formatter: 'textarea' },
              { title: "Loại phương tiện", field: "VehicleTypeText", width: 140 },
            ],
          },
          {//create column group
            cssClass: "group-destination",
            title: "Thông tin điểm đến",
            columns: [
              { title: "Tên công ty", field: "CompanyNameArrives", width: 100 },
              { title: "Tỉnh", field: "ProvinceName", width: 120 },
              { title: "Địa chỉ cụ thể", field: "SpecificDestinationAddress", width: 160 },
              {
                title: "Thời gian cần đến", field: "TimeNeedPresent", width: 160,
                formatter: (cell) => {
                  const value = cell.getValue();
                  if (!value) return "";
                  const date = new Date(value);

                  const dd = String(date.getDate()).padStart(2, "0");
                  const MM = String(date.getMonth() + 1).padStart(2, "0");
                  const yyyy = date.getFullYear();
                  const hh = String(date.getHours()).padStart(2, "0");
                  const mm = String(date.getMinutes()).padStart(2, "0");
                  const ss = String(date.getSeconds()).padStart(2, "0");

                  return `${dd}/${MM}/${yyyy} ${hh}:${mm}:${ss}`;
                }
              },
              {
                title: "Thời gian về", field: "TimeReturn", width: 150,
                formatter: (cell) => {
                  const value = cell.getValue();
                  if (!value) return "";
                  const date = new Date(value);

                  const dd = String(date.getDate()).padStart(2, "0");
                  const MM = String(date.getMonth() + 1).padStart(2, "0");
                  const yyyy = date.getFullYear();
                  const hh = String(date.getHours()).padStart(2, "0");
                  const mm = String(date.getMinutes()).padStart(2, "0");
                  const ss = String(date.getSeconds()).padStart(2, "0");

                  return `${dd}/${MM}/${yyyy} ${hh}:${mm}:${ss}`;
                }
              }
            ],
          },
          {//create column group
            cssClass: "group-passenger",
            title: "Thông tin người đi",
            columns: [
              { title: "Tên người đi", field: "PassengerName", hozAlign: "center", width: 150 },
              { title: "SDT Người đi", field: "PassengerPhoneNumber", hozAlign: "center", width: 120 }
            ],
          },
          {//create column group
            cssClass: "group-delivery",
            title: "Thông tin hàng giao",
            columns: [
              { title: "Tên người giao", field: "DeliverName", width: 150 },
              { title: "SDT người giao", field: "DeliverPhoneNumber", width: 120 },
              { title: "Tên người nhận", field: "ReceiverName", width: 120 },
              { title: "SDT người nhận", field: "ReceiverPhoneNumber", width: 120 },
              { title: "Tên kiện hàng", field: "PackageName", width: 80 },
              { title: "Kích thước(cm)", field: "PackageSize", width: 120 },
              { title: "Cân nặng(kg)", field: "PackageWeight", width: 120 },
              { title: "Số lượng kiện hàng", field: "PackageQuantity", width: 160 },
              { title: "Tiền xe", field: "VehicleMoney", width: 200 },
              { title: "Dự án", field: "ProjectFullName", width: 300 }
            ],
          },
        ]
      });

      this.vehicleBookingManagementTable.on('rowDblClick', (e: any, row: any) => {
        this.selected = row.getData();

      });

      this.vehicleBookingManagementTable.on("rowSelectionChanged", (data: any[]) => {
        this.vehicleBookingListId = data;  // Cập nhật danh sách ID được chọn
        console.log("vehicleBookingListId", this.vehicleBookingListId);
      });
    }
  }

  private drawTable(): void {
    if (!this.vehicleBookingManagementTable) {
      // If table is not initialized, initialize it first
      this.initTable();
    }

    if (this.vehicleBookingManagementTable) {
      this.vehicleBookingManagementTable.setData(this.vehicleBookingManagementList);
    }
  }

  //#endregion

  validatechecked(): boolean {
    if (this.vehicleBookingListId.length === 0) {
      this.notification.warning('Lỗi', 'Vui lòng chọn ít nhất một dòng để xếp xe!');
      return false;
    }

    return true;
  }
}
