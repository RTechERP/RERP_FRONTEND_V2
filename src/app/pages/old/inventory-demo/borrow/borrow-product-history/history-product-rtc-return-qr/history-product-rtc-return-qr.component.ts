import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  input,
  Input,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import {
  AngularSlickgridModule,
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
  Editors,
  OnClickEventArgs,
  OnCellChangeEventArgs,
  OnSelectedRowsChangedEventArgs,
  Aggregators,
  GroupTotalFormatters,
  SortComparers,
} from 'angular-slickgrid';

// NG-ZORRO imports
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { AppUserService } from '../../../../../../services/app-user.service';
import { HasPermissionDirective } from '../../../../../../directives/has-permission.directive';
import { DateTime } from 'luxon';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../../../project/project-service/project.service';
import { ProjectPartlistPriceRequestService } from '../../../../project-partlist-price-request/project-partlist-price-request-service/project-partlist-price-request.service';
import { BorrowService } from '../../borrow-service/borrow.service';

@Component({
  selector: 'app-history-product-rtc-return-qr',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzButtonModule,
    NzCheckboxModule,
    NzTabsModule,
    NzGridModule,
    NzDropDownModule,
    NzIconModule,
    NzModalModule,
    AngularSlickgridModule,
  ],
  templateUrl: './history-product-rtc-return-qr.component.html',
  styleUrl: './history-product-rtc-return-qr.component.css',
})
export class HistoryProductRtcReturnQrComponent
  implements OnInit, AfterViewInit
{
  //#region Khai báo biến
  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private appUserService: AppUserService,
    private notification: NzNotificationService,
    private nzModalService: NzModalService,
    private cdr: ChangeDetectorRef,
    private borrowService: BorrowService,
    private projectService: ProjectService
  ) {}

  returnInfoForm!: FormGroup; // Thông tin mượn
  @ViewChild('qrCodeInput') qrCodeInput!: ElementRef<HTMLInputElement>;

  @Input() warehouseID: number = 1;
  @Input() _qrCodes: string[] = [];
  IDAdminDemo: number[] = [24, 1434, 88, 1534];
  isAdmin: boolean = false;
  listQrCode: string[] = [];

  angularGridMaster!: AngularGridInstance;
  columnDefinitionsMaster: Column[] = [];
  gridOptionsMaster: GridOption = {};

  allData: any[] = [];
  returnData: any[] = [];
  employeeList: any[] = [];
  //#endregion

  //#region Khởi tạo
  ngOnInit(): void {
    this.initForm();
    this.loadLookUp();
    this.initGridColumns();
    this.initGridOptions();

    setTimeout(() => {
      this.loadData();
    }, 100);
  }

  ngAfterViewInit(): void {}

  initForm(): void {
    const employeeID = this.appUserService.id;
    this.returnInfoForm = this.fb.group({
      QrCode: [''],
      ReturnDate: [new Date(), Validators.required],
      EmployeeID: [employeeID, Validators.required],
    });
  }
  //#endregion

  //#region Load dữ liệu
  focusQrCodeInput(): void {
    const input = this.qrCodeInput?.nativeElement;
    if (!input) return;

    input.focus();
    input.select(); // bôi đen toàn bộ
  }

  loadLookUp() {
    // let userId = this.appUserService.id ?? 0;
    // const isAdminDemo = this.IDAdminDemo.includes(userId);
    // if (this.isAdmin || isAdminDemo) userId = 0;

    // this.borrowService.getUserProductQR(userId).subscribe({
    //   next: (response: any) => {
    //     this.employeeList = this.projectService.createdDataGroup(
    //       response.data,
    //       'DepartmentName'
    //     );
    //   },
    //   error: (error: any) => {
    //     this.notification.error(
    //       NOTIFICATION_TITLE.error,
    //       'Lỗi khi tải danh sách nhân viên: ' + error.message
    //     );
    //   },
    // });

    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeList = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhân viên: ' + error.message
        );
      },
    });
  }

  loadData() {
    this.borrowService.getProductQR().subscribe({
      next: (response: any) => {
        if (response?.data && Array.isArray(response.data)) {
          this.returnData = response.data.map((item: any, index: number) => ({
            ...item,
            id: item.ID, // ID của row
            STT: index + 1, // Số thứ tự
          }));
        } else {
          this.returnData = [];
        }
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách mượn: ' +
            (error?.error?.message ?? error?.message)
        );
        this.returnData = [];
      },
    });
  }

  onGetQrCode() {
    const qrCode = this.returnInfoForm.get('QrCode')?.value || '';
    if (!qrCode) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'QRCode không được để trống!'
      );
      return;
    }

    const employeeID = this.returnInfoForm.get('EmployeeID')?.value;
    if (!employeeID) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn người trả trước!'
      );
      return;
    }

    this.borrowService
      .getProductByQRReturn(qrCode, employeeID, this.warehouseID)
      .subscribe({
        next: (response: any) => {
          console.log('Response:', response);

          if (!response?.data || response.data.length === 0) {
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              'Không tìm thấy thiết bị với QR code: ' + qrCode
            );
            //this.returnInfoForm.patchValue({ QrCode: '' });
            setTimeout(() => this.focusQrCodeInput());
            return;
          }

          const dt = response.data[0];

          // Kiểm tra đã tồn tại chưa
          if (this.listQrCode.includes(dt.ProductQRCode)) {
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              'QRCode đã được thêm vào danh sách!'
            );
            setTimeout(() => this.focusQrCodeInput());
            return;
          }

          // Thêm vào allData
          this.allData.push(dt);
          this.listQrCode.push(dt.ProductQRCode);

          // Xử lý hiển thị
          this.processReturnData();

          // Clear input và focus
          //this.returnInfoForm.patchValue({ QrCode: '' });
          setTimeout(() => this.focusQrCodeInput());
        },
        error: (error: any) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'QR code ' +
              qrCode +
              ': ' +
              (error?.error?.message ?? error?.message)
          );
          //this.returnInfoForm.patchValue({ QrCode: '' });
          setTimeout(() => this.focusQrCodeInput());
        },
      });
  }

  processReturnData() {
    this.returnData = [];
    let stt = 1;

    this.allData.forEach((item) => {
      const newRow = {
        ID: item.ID,
        ProductRTCID: item.ProductRTCID,
        ProductQRCode: item.ProductQRCode,
        ProductCode: item.ProductCode,
        ProductName: item.ProductName,
        ProductCodeRTC: item.ProductCodeRTC,
        AddressBox: item.AddressBox,
        HistoryProductRTCID: item.HistoryProductRTCID,
        Note: item.Note,
        Soluong: 1,
        STT: stt++,
        id: item.ID,
      };
      this.returnData.push(newRow);
    });

    this.returnData = [...this.returnData];
  }
  //#endregion

  //#region Xử lý bảng
  angularGridMasterReady(angularGrid: AngularGridInstance) {
    this.angularGridMaster = angularGrid;

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  initGridColumns() {
    this.columnDefinitionsMaster = [
      {
        id: 'action',
        name: '',
        field: 'action',
        width: 60,
        sortable: false,
        filterable: false,
        excludeFromHeaderMenu: true,
        formatter: (_row, _cell, _value, _column, _dataContext) => {
          return `<div style="text-align:center;"><i class="fas fa-trash" style="cursor:pointer; color:#ff4d4f;" title="Xóa"></i></div>`;
        },
        onCellClick: (_e: Event, args: any) => {
          const dataContext = this.angularGridMaster.dataView.getItem(args.row);
          this.onDeleteRow(dataContext);
        },
      },
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
                <span
                  title="${dataContext.StatusText ?? ''}"
                  style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center;"
                >
                  ${value}
                </span>
              `;
        },
      },
      {
        id: 'Soluong',
        name: 'Số lượng trả',
        field: 'Soluong',
        width: 765,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductQRCode',
        name: 'Mã QRCode',
        field: 'ProductQRCode',
        width: 765,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductCodeRTC',
        name: 'Mã nội bộ',
        field: 'ProductCodeRTC',
        width: 765,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        width: 765,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        width: 765,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'AddressBox',
        name: 'Vị trí',
        field: 'AddressBox',
        width: 765,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
    ];
  }

  initGridOptions() {
    this.gridOptionsMaster = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-return-detail',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true,
      forceFitColumns: true,
      enableColumnReorder: true,
    };
  }

  onDeleteRow(dataContext: any) {
    const productQRCode = dataContext.ProductQRCode?.trim() || '';

    this.nzModalService.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa thiết bị có mã QRCode ${productQRCode} không?`,
      nzOkText: 'Có',
      nzCancelText: 'Không',
      nzOnOk: () => {
        // Xóa khỏi listQrCode
        const index = this.listQrCode.indexOf(productQRCode);
        if (index > -1) {
          this.listQrCode.splice(index, 1);
        }

        // Xóa khỏi allData
        const allDataIndex = this.allData.findIndex(
          (item) => item.ProductQRCode === productQRCode
        );
        if (allDataIndex > -1) {
          this.allData.splice(allDataIndex, 1);
        }

        // Xóa khỏi borrowData
        const returnDataIndex = this.returnData.findIndex(
          (item) => item.ProductQRCode === productQRCode
        );
        if (returnDataIndex > -1) {
          this.returnData.splice(returnDataIndex, 1);
        }

        // Cập nhật lại STT
        this.returnData.forEach((item, idx) => {
          item.STT = idx + 1;
        });

        // Refresh grid
        this.returnData = [...this.returnData];

        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Đã xóa thiết bị khỏi danh sách'
        );
      },
    });
  }
  //#endregion

  //#region Lưu dữ liệu
  onSave() {
    if (!this.returnData || this.returnData.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng thêm ít nhất một thiết bị để trả!'
      );
      return;
    }

    this.nzModalService.confirm({
      nzTitle: 'Xác nhận trả',
      nzContent: `Bạn có chắc muốn trả các thiết bị đã chọn không?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const saveDataList = this.returnData.map((row) => ({
          ID: row.HistoryProductRTCID,
          Status: 4,
          WarehouseID: this.warehouseID,
        }));

        this.borrowService.saveProductQR(saveDataList).subscribe({
          next: (response: any) => {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              'Đăng ký trả thiết bị thành công!'
            );
            this.activeModal.close(true);
          },
          error: (error: any) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Lỗi khi lưu: ' + (error?.error?.message ?? error?.message)
            );
          },
        });
      },
    });
  }
  //#endregion
}
