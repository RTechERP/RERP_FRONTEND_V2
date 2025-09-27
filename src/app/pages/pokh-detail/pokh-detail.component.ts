import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';

import { PokhService } from '../pokh/pokh-service/pokh.service';
import { CustomerPartService } from '../customer-part/customer-part/customer-part.service';
import { CustomerPartComponent } from '../customer-part/customer-part.component';
import { ViewPokhComponent } from '../view-pokh/view-pokh.component';
import { WarehouseReleaseRequestComponent } from '../warehouse-release-request/warehouse-release-request.component';
import { FollowProductReturnComponent } from '../follow-product-return/follow-product-return.component';
import { PoRequestBuyComponent } from '../po-request-buy/po-request-buy.component';
import { ViewPokhService } from '../view-pokh/view-pokh/view-pokh.service';

@Component({
  selector: 'app-pokh',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
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
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    CommonModule,
  ],
  templateUrl: './pokh-detail.component.html',
  styleUrl: './pokh-detail.component.css',
})
export class PokhDetailComponent implements OnInit, AfterViewInit {
  @ViewChild('tbProductDetailTreeList', { static: false })
  tbProductDetailTreeListElement!: ElementRef;
  @ViewChild('tbDetailUser', { static: false })
  tbDetailUserElement!: ElementRef;
  @Input() isEditMode: boolean = false;
  @Input() selectedId: number = 0;
  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private POKHService: PokhService,
    private modal: NzModalService,
    private customerPartService: CustomerPartService,
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private viewPOKHService: ViewPokhService,
    public activeModal: NgbActiveModal
  ) {}

  //#region : Khai báo
  //Khai báo các bảng
  tb_POKH!: Tabulator;
  tb_POKHProduct!: Tabulator;
  tb_POKHFile!: Tabulator;
  tb_POKHDetailFile!: Tabulator;
  tb_ProductDetailTreeList!: Tabulator;
  tb_DetailUser!: Tabulator;
  private modalRef: any;

  //Lưu dữ liệu
  nextRowId: number = 0;
  dictDetailUser: { [key: number]: string } = {};
  deletedPOKHDetailIds: number[] = [];
  deletedDetailUserIds: number[] = [];
  deletedFileIds: number[] = [];
  selectedRow: any = null;
  dataPOKH: any[] = [];
  dataPOKHProduct: any[] = [];
  dataPOKHFiles: any[] = [];
  dataPOKHDetailFile: any[] = [];
  dataCurrency: any[] = [];
  dataCustomers: any[] = [];
  dataUsers: any[] = [];
  dataProjects: any[] = [];
  dataPOTypes: any[] = [];
  dataParts: any[] = [];
  dataProducts: any[] = [];
  dataCurrencies: any[] = [];
  dataPOKHDetailUser: any[] = [];
  selectedCustomer: any = null;
  poFormData: any = {
    status: 0,
    poCode: '',
    customerId: 0,
    endUser: '',
    customerName: '',
    userId: 0,
    poDate: new Date(),
    totalPO: 0,
    poNumber: '',
    projectId: 0,
    poType: 0,
    departmentId: 0,
    userType: 0,
    note: '',
    currencyId: 0,
    isBigAccount: false,
    isApproved: false,
    warehouseId: 1,
  };
  filters: any = {
    filterText: '',
    pageNumber: 1,
    pageSize: 50,
    customerId: 0,
    userId: 0,
    POType: 0,
    status: 0,
    group: 0,
    warehouseId: 1,
    employeeTeamSaleId: 0,
    startDate: new Date(),
    endDate: new Date(),
  };
  statusOptions = [
    { value: 0, label: 'Chưa giao, chưa thanh toán' },
    { value: 1, label: 'Đã giao, đã thanh toán' },
    { value: 2, label: 'Chưa giao, đã thanh toán' },
    { value: 3, label: 'Đã giao, nhưng chưa thanh toán' },
    { value: 4, label: 'Đã thanh toán, GH chưa xuất hóa đơn' },
    { value: 5, label: 'Giao một phần, đã thanh toán một phần' },
  ];

  //Mode
  isModalOpen: boolean = false;
  lockEvents: boolean = false;
  isResponsibleUsersEnabled: boolean = false;
  isCopy: boolean = false;

  //#endregion
  //#region : Hàm khởi tạo
  ngOnInit(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 3);
    this.filters.startDate = startDate;
    this.filters.endDate = endDate;
    this.loadCustomers(() => {
      if (this.isEditMode) {
        this.loadPOKHData(this.selectedId);
      }
    });
    this.loadEmployeeManagers();
    this.loadProjects();
    this.loadTypePO();
    this.loadCurrency();
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    if (this.isEditMode) {
      this.loadPOKHData(this.selectedId);
    } else {
      // Chế độ thêm mới
      this.resetForm(); // Reset form và dữ liệu
      this.dataPOKHProduct = [];
      this.dataPOKHDetailFile = [];
      this.dataPOKHDetailUser = [];
      this.isResponsibleUsersEnabled = false; // Mặc định tắt bảng người phụ trách

      this.initProductDetailTreeList(); // Khởi tạo với dữ liệu rỗng
      this.tb_ProductDetailTreeList?.setData([]);

      this.initFileUploadedTable(); // Khởi tạo với dữ liệu rỗng
      this.tb_POKHDetailFile?.setData([]);

      // Nếu bảng DetailUser đã tồn tại từ lần mở trước, hủy nó đi
      if (this.tb_DetailUser) {
        this.tb_DetailUser.destroy();
        this.isResponsibleUsersEnabled = false;
      }
    }
  }
  //#endregion

  loadCustomers(callback?: () => void): void {
    this.customerPartService.getCustomer().subscribe(
      (response) => {
        if (response.status === 1) {
          this.dataCustomers = response.data;
          if (callback) callback();
        } else {
          this.notification.error('Lỗi khi tải khách hàng:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải khách hàng:', error);
        return;
      }
    );
  }
  loadEmployeeManagers(): void {
    this.POKHService.loadEmployeeManagers().subscribe(
      (response) => {
        if (response.status === 1) {
          // this.users = response.data[0] || [];
          this.dataUsers = response.data[2] || [];
          this.createLabelsFromData();
        } else {
          this.notification.error(
            'Lỗi khi tải nhân viên quản lý:',
            response.message
          );
          return;
        }
      },
      (error) => {
        this.notification.error(
          'Lỗi kết nối khi tải nhân viên quản lý:',
          error
        );
        return;
      }
    );
  }
  loadProjects(): void {
    this.POKHService.loadProject().subscribe(
      (response) => {
        if (response.status === 1) {
          this.dataProjects = response.data;
        } else {
          this.notification.error('Lỗi khi tải dự án:', response.message);
          return;
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải dự án:', error);
        return;
      }
    );
  }
  loadTypePO(): void {
    this.POKHService.getTypePO().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.dataPOTypes = response.data;
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải loại PO: ' + response.message
          );
        }
      },
      error: (error) => {
        this.notification.error(
          'Thông báo',
          'Lỗi kết nối khi tải loại PO: ' + error
        );
      },
    });
  }
  loadPart(id: number): void {
    this.customerPartService.getPart(id).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataParts = response.data[0];
        } else {
          this.dataParts = []; // Xóa mảng parts khi có lỗi
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải phòng ban: ' + response.message
          );
        }
      },
      error: (error: any) => {
        this.notification.error(
          'Thông báo',
          'Lỗi kết nối khi tải phòng ban: ' + error
        );
      },
    });
  }
  loadCurrency(): void {
    this.POKHService.getCurrency().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.dataCurrencies = response.data;
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải loại tiền: ' + response.message
          );
        }
      },
      error: (error) => {
        this.notification.error(
          'Thông báo',
          'Lỗi kết nối khi tải loại tiền: ' + error
        );
      },
    });
  }
  loadPOKHProducts(id: number = 0, idDetail: number = 0): void {
    this.POKHService.getPOKHProduct(id, idDetail).subscribe({
      next: (response) => {
        if (response.status === 1) {
          const flatData = response.data;
          const treeData = this.convertToTreeData(flatData);
          this.dataPOKHProduct = treeData;
          this.tb_POKHProduct.setData(this.dataPOKHProduct);
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải chi tiết POKH: ' + response.message
          );
        }
      },
      error: (error) => {
        this.notification.error(
          'Thông báo',
          'Lỗi kết nối khi tải chi tiết POKH: ' + error
        );
      },
    });
  }
  loadPOKHFiles(id: number = 0): void {
    this.POKHService.getPOKHFile(id).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.dataPOKHFiles = response.data;
          this.tb_POKHFile.setData(this.dataPOKHFiles);
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải tệp POKH: ' + response.message
          );
        }
      },
      error: (error) => {
        this.notification.error(
          'Thông báo',
          'Lỗi kết nối khi tải tệp POKH: ' + error
        );
      },
    });
  }
  loadProducts(): void {
    this.POKHService.loadProducts().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataProducts = response.data;

          //Gọi bảng sau khi có dữ liệu để chọn
          this.initProductDetailTreeList();
          if (this.tb_ProductDetailTreeList) {
            this.tb_ProductDetailTreeList.setData(this.dataPOKHProduct);
          }
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải sản phẩm: ' + response.message
          );
        }
      },
      error: (error: any) => {
        this.notification.error(
          'Thông báo',
          'Lỗi kết nối khi tải sản phẩm: ' + error
        );
      },
    });
  }
  loadPOKHData(id: number): void {
    this.POKHService.getPOKHByID(id).subscribe(
      (response) => {
        if (response.status === 1) {
          const pokhData = response.data;
          const receivedDate = new Date(pokhData.ReceivedDatePO);

          // Format date to YYYY-MM-DD with local timezone
          const year = receivedDate.getFullYear();
          const month = String(receivedDate.getMonth() + 1).padStart(2, '0');
          const day = String(receivedDate.getDate()).padStart(2, '0');
          const formattedDate = `${year}-${month}-${day}`;

          this.poFormData = {
            status: pokhData.Status,
            poCode: pokhData.POCode,
            customerId: pokhData.CustomerID,
            endUser: pokhData.EndUser,
            customerName: pokhData.CustomerName,
            userId: pokhData.UserID,
            poDate: formattedDate,
            totalPO: pokhData.TotalMoneyPO,
            poNumber: pokhData.PONumber,
            projectId: pokhData.ProjectID,
            poType: pokhData.POType,
            departmentId: pokhData.PartID || 0,
            userType: pokhData.UserType,
            note: pokhData.Note,
            currencyId: pokhData.CurrencyID,
            isBigAccount: pokhData.NewAccount,
            isApproved: pokhData.IsApproved,
            warehouseId: pokhData.WarehouseID,
          };

          this.selectedCustomer = this.dataCustomers.find(
            (c) => c.ID === pokhData.CustomerID
          );
          this.isResponsibleUsersEnabled = pokhData.UserType === 1;

          // Nếu đang ở chế độ copy thì reset ID và data file
          if (this.isCopy) {
            this.selectedId = 0;
            let item = this.dataCustomers.find(
              (c) => c.ID === pokhData.CustomerID
            );
            this.generatePOCode(item.CustomerShortName);
            // Reset data file khi copy
            this.dataPOKHDetailFile = [];
            this.dataPOKHFiles = [];
          }

          // Lấy dữ liệu bộ phận bằng khách hàng
          if (this.selectedCustomer) {
            this.loadPart(this.selectedCustomer.ID);
          }

          const POKHProducts$ = this.POKHService.getPOKHProduct(id, 0).pipe(
            map((res) =>
              res.status === 1 ? this.convertToTreeData(res.data) : []
            ),
            catchError((err) => {
              this.notification.error(
                'Thông báo',
                'Lỗi tải POKHProduct: ' + err
              );
              return of([]);
            })
          );

          const POKHFiles$ = this.POKHService.getPOKHFile(id).pipe(
            map((res) => (res.status === 1 ? res.data : [])),
            catchError((err) => {
              this.notification.error('Thông báo', 'Lỗi tải POKHFile: ' + err);
              return of([]);
            })
          );

          let detailUser$ = of([]);
          if (this.isResponsibleUsersEnabled) {
            detailUser$ = this.POKHService.loadUserDetail(id, 0).pipe(
              map((res) => {
                if (res.status === 1) {
                  return res.data[1].map((detail: any) => {
                    const user = this.dataUsers.find(
                      (u) => u.ID === detail.UserID
                    );
                    return {
                      ...detail,
                      ID: detail.ID,
                      ResponsibleUser: user ? user.FullName : '',
                      UserID: user ? user.ID : detail.UserID,
                      PercentUser: detail.PercentUser
                        ? detail.PercentUser * 100
                        : 0,
                    };
                  });
                }
                return [];
              }),
              catchError((err) => {
                this.notification.error(
                  'Thông báo',
                  'Lỗi tải DetailUser: ' + err
                );
                return of([]);
              })
            );
          }

          // Sử dụng forkJoin để đợi tất cả các observables hoàn thành
          forkJoin([POKHProducts$, POKHFiles$, detailUser$]).subscribe(
            ([productsData, filesData, userDetailsData]) => {
              this.dataPOKHProduct = productsData;

              // Nếu không phải copy thì mới set data file
              if (!this.isCopy) {
                this.dataPOKHDetailFile = filesData.map(
                  (fileFromServer: any) => ({
                    ID: fileFromServer.ID,
                    fileName: fileFromServer.FileName,
                    fileType: this.getFileType(fileFromServer.FileName || ''),
                    CreatedDate: fileFromServer.CreatedDate
                      ? new Date(fileFromServer.CreatedDate).toLocaleDateString(
                          'vi-VN'
                        )
                      : new Date().toLocaleDateString('vi-VN'),
                  })
                );
              }
              this.dataPOKHDetailUser = userDetailsData;

              this.initProductDetailTreeList();
              this.tb_ProductDetailTreeList.setData(this.dataPOKHProduct);

              this.initFileUploadedTable();
              this.tb_POKHDetailFile.setData(this.dataPOKHDetailFile);

              if (this.isResponsibleUsersEnabled) {
                this.initDetailTable();
                this.tb_DetailUser?.setData(this.dataPOKHDetailUser);
              } else {
                if (this.tb_DetailUser) {
                  this.tb_DetailUser.destroy();
                  this.isResponsibleUsersEnabled = false;
                }
              }
            },
            (forkJoinError) => {
              this.notification.error(
                'Thông báo',
                'Lỗi khi forkJoin tải dữ liệu chi tiết POKH: ' + forkJoinError
              );
              this.tb_ProductDetailTreeList?.setData([]);
              this.tb_POKHDetailFile?.setData([]);
              if (this.tb_DetailUser) this.tb_DetailUser.setData([]);
            }
          );
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải dữ liệu POKH chính: ' + response.message
          );
        }
      },
      (error) => {
        this.notification.error(
          'Thông báo',
          'Lỗi kết nối khi tải dữ liệu POKH chính: ' + error
        );
      }
    );
  }
  //#endregion
  //#region : Hàm xử lý SavePOKH
  savePOKH() {
    if (this.isCopy) {
      this.copyPOKHToDTO();
      this.isCopy = false;
      return;
    }
    if (!this.validateForm()) return;
    const pokhData = this.getPOKHData();
    const details = this.tb_ProductDetailTreeList.getData();
    const detailUsers =
      this.isResponsibleUsersEnabled && this.tb_DetailUser
        ? this.tb_DetailUser.getData().map((user: any) => ({
            ...user,
            RowHandle:
              !user.RowHandle || Object.keys(user.RowHandle).length === 0
                ? 0
                : user.RowHandle,
            CreatedDate:
              !user.CreatedDate || Object.keys(user.CreatedDate).length === 0
                ? null
                : user.CreatedDate,
            STT: !user.STT || Object.keys(user.STT).length === 0 ? 0 : user.STT,
            ReceiveMoney:
              !user.ReceiveMoney || Object.keys(user.ReceiveMoney).length === 0
                ? 0
                : user.ReceiveMoney,
            UserID: user.UserID ? Number(user.UserID) : null,
          }))
        : [];

    // Add deleted IDs to the request
    const deletedDetailUsers = this.deletedDetailUserIds.map((id) => ({
      ID: id,
      IsDeleted: true,
    }));

    const deletedPOKHDetails = this.deletedPOKHDetailIds.map((id) => ({
      ID: id,
      IsDeleted: true,
    }));

    console.log('POKH Data:', pokhData);
    console.log('Details:', details);
    console.log('Detail Users:', detailUsers);
    console.log('Deleted Detail Users:', deletedDetailUsers);

    if (!details || details.length === 0) {
      alert('Vui lòng thêm chi tiết sản phẩm');
      return;
    }

    // check ckType
    pokhData.UserType = this.isResponsibleUsersEnabled ? 1 : 0;

    const requestBody = {
      POKH: pokhData,
      pOKHDetails: [...this.getTreeRows(details), ...deletedPOKHDetails],
      pOKHDetailsMoney: [...detailUsers, ...deletedDetailUsers],
    };

    //api call
    this.POKHService.handlePOKH(requestBody).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.handleSuccess(response);
          this.deletedDetailUserIds = [];
          this.deletedPOKHDetailIds = [];
          this.deletedFileIds = [];
        }
      },
      error: (error) => {
        this.handleError(error);
      },
    });
  }
  handleSuccess(response: any) {
    const pokhId = response.data.id;
    if (this.dataPOKHDetailFile.length > 0 || this.deletedFileIds.length > 0) {
      this.uploadFiles(pokhId);
    }
    this.notification.success('Thông báo', 'Lưu thành công');
    this.closeModal();

    // Cập nhật endDate lên 1 ngày hoặc 1 giờ so với hiện tại
    const now = new Date();
    now.setDate(now.getDate() + 1); // hoặc now.setHours(now.getHours() + 1);
    this.filters.endDate = now;

    this.filters.pageNumber = 1;
    this.tb_POKH.setPage(1);
    this.isCopy = false;
  }
  handleError(error: any) {
    this.notification.error('Thông báo', 'Có lỗi xảy ra: ' + error.message);
  }
  //#endregion
  //#region : Hàm xử lý upload files
  uploadFiles(pokhId: number) {
    const formData = new FormData();

    // Thêm từng file vào FormData
    this.dataPOKHDetailFile.forEach((fileObj: any) => {
      if (fileObj.file) {
        formData.append('files', fileObj.file);
      }
    });

    // Xử lý upload files mới
    if (this.dataPOKHDetailFile.length > 0) {
      this.POKHService.uploadFiles(formData, pokhId).subscribe({
        next: (response) => {
          console.log('Upload files thành công');
        },
        error: (error) => {
          this.notification.error('Thông báo', 'Lỗi upload files: ' + error);
        },
      });
    }

    // Xử lý xóa files
    if (this.deletedFileIds.length > 0) {
      this.POKHService.deleteFiles(this.deletedFileIds).subscribe({
        next: (response) => {
          this.deletedFileIds = [];
        },
        error: (error) => {
          this.notification.error('Lỗi xóa files:', error);
        },
      });
    }
  }
  //#endregion
  //#region : Hàm xử lý xuất excel PO
  async exportToExcel() {
    if (!this.tb_POKHProduct) {
      this.notification.warning(
        'Cảnh báo!',
        'Vui lòng chọn một PO để xuất Excel'
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('PO Details');

    // Get column definitions from the table
    const columns = this.tb_POKHProduct.getColumns();

    // Add headers
    const headerRow = worksheet.addRow(
      columns.map((col) => col.getDefinition().title)
    );
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Function to process rows recursively
    const processRows = (rows: any[], level: number = 0) => {
      rows.forEach((row) => {
        const rowData = columns.map((col) => {
          const field = col.getField();
          return row.getData()[field];
        });

        // Add indentation for child rows
        if (level > 0) {
          rowData[0] = '  '.repeat(level) + rowData[0]; // Indent the first column (STT)
        }

        const excelRow = worksheet.addRow(rowData);

        // Add indentation style for child rows
        if (level > 0) {
          excelRow.font = { italic: true };
        }

        // Process child rows if they exist
        const children = row.getTreeChildren();
        if (children && children.length > 0) {
          processRows(children, level + 1);
        }
      });
    };

    // Start processing from root rows
    const rootRows = this.tb_POKHProduct
      .getRows()
      .filter((row) => !row.getTreeParent());
    processRows(rootRows);

    // Function to calculate total for a column including all children
    const calculateTotal = (column: any) => {
      let total = 0;
      const processRow = (row: any) => {
        const value = row.getData()[column.getField()];
        if (typeof value === 'number') {
          total += value;
        }
        const children = row.getTreeChildren();
        if (children && children.length > 0) {
          children.forEach(processRow);
        }
      };
      rootRows.forEach(processRow);
      return total;
    };

    // Add bottom calculations
    const bottomCalcRow = worksheet.addRow(
      columns.map((col) => {
        const column = col.getDefinition();
        if (column.bottomCalc) {
          const total = calculateTotal(col);

          // Format the total based on the column's formatter
          if (column.bottomCalcFormatter === 'money') {
            return new Intl.NumberFormat('vi-VN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(total);
          }
          return total;
        }
        return '';
      })
    );

    // Style the bottom calc row
    bottomCalcRow.font = { bold: true };
    bottomCalcRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add a label for the total row
    const totalLabelCell = bottomCalcRow.getCell(1);
    totalLabelCell.value = 'Tổng cộng';
    totalLabelCell.font = { bold: true };

    // Auto-fit columns
    worksheet.columns.forEach((column: any) => {
      column.width = 15;
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PO_${this.selectedId}_${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  //#endregion
  //#region : Hàm xử lý xuất excel Phiếu
  async exportMainTableToExcel() {
    if (!this.tb_POKH) {
      this.notification.error('Lỗi', 'Không có dữ liệu để xuất Excel');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('POKH List');

    // Get column definitions from the table
    const columns = this.tb_POKH.getColumns();

    // Add headers
    const headerRow = worksheet.addRow(
      columns.map((col) => col.getDefinition().title)
    );
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Get current page data
    const currentPage = Number(this.tb_POKH.getPage());
    const pageSize = Number(this.tb_POKH.getPageSize());
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Get all data and slice for current page
    const allData = this.tb_POKH.getData();
    const currentPageData = allData.slice(startIndex, endIndex);

    // Process rows
    currentPageData.forEach((rowData) => {
      const row = columns.map((col) => {
        const field = col.getField();
        const value = rowData[field];

        // Format boolean values
        if (typeof value === 'boolean') {
          return value ? 'Có' : 'Không';
        }

        // Format date values
        if (field === 'ReceivedDatePO' && value) {
          return new Date(value).toLocaleDateString('vi-VN');
        }

        // Format money values
        if (
          typeof value === 'number' &&
          (field === 'TotalMoneyPO' ||
            field === 'TotalMoneyKoVAT' ||
            field === 'ReceiveMoney' ||
            field === 'Debt')
        ) {
          return new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
        }

        return value;
      });

      worksheet.addRow(row);
    });

    // Add bottom calculations for money columns
    const bottomCalcRow = worksheet.addRow(
      columns.map((col) => {
        const column = col.getDefinition();
        if (column.bottomCalc) {
          // Calculate total for current page only
          let total = 0;
          currentPageData.forEach((rowData) => {
            const value = rowData[column.field as string];
            if (typeof value === 'number') {
              total += value;
            }
          });

          // Format the total based on the column's formatter
          if (column.bottomCalcFormatter === 'money') {
            return new Intl.NumberFormat('vi-VN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(total);
          }
          return total;
        }
        return '';
      })
    );

    // Style the bottom calc row
    bottomCalcRow.font = { bold: true };
    bottomCalcRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add a label for the total row
    const totalLabelCell = bottomCalcRow.getCell(1);
    totalLabelCell.value = 'Tổng cộng';
    totalLabelCell.font = { bold: true };

    // Auto-fit columns
    worksheet.columns.forEach((column: any) => {
      column.width = 15;
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `POKH_List_Page_${currentPage}_${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  //#endregion
  //#region : Hàm xử lý dữ liệu
  getTreeRows(data: any[]): any[] {
    let dataTree: any[] = [];

    data.forEach((row) => {
      const processedRow = {
        ...row,
        KHID: !row.KHID || Object.keys(row.KHID).length === 0 ? 0 : row.KHID,
        IndexPO:
          !row.IndexPO || Object.keys(row.IndexPO).length === 0
            ? null
            : row.IndexPO,
        RecivedMoneyDate:
          !row.RecivedMoneyDate ||
          Object.keys(row.RecivedMoneyDate).length === 0
            ? null
            : row.RecivedMoneyDate,
        BillDate:
          !row.BillDate || Object.keys(row.BillDate).length === 0
            ? null
            : row.BillDate,
        ActualDeliveryDate:
          !row.ActualDeliveryDate ||
          Object.keys(row.ActualDeliveryDate).length === 0
            ? null
            : row.ActualDeliveryDate,
        DeliveryRequestedDate:
          !row.DeliveryRequestedDate ||
          Object.keys(row.DeliveryRequestedDate).length === 0
            ? null
            : row.DeliveryRequestedDate,
        PayDate:
          !row.PayDate || Object.keys(row.PayDate).length === 0
            ? null
            : row.PayDate,
        CreatedDate:
          !row.CreatedDate || Object.keys(row.CreatedDate).length === 0
            ? null
            : row.CreatedDate,
        UpdatedDate:
          !row.UpdatedDate || Object.keys(row.UpdatedDate).length === 0
            ? null
            : row.UpdatedDate,
        QuotationDetailID: 0,
        QtyTT:
          !row.QtyTT || Object.keys(row.QtyTT).length === 0 ? 0 : row.QtyTT,
        QtyCL:
          !row.QtyCL || Object.keys(row.QtyCL).length === 0 ? 0 : row.QtyCL,
        IsExport:
          !row.IsExport || Object.keys(row.IsExport).length === 0
            ? false
            : row.IsExport,
        QtyRequest:
          !row.QtyRequest || Object.keys(row.QtyRequest).length === 0
            ? 0
            : row.QtyRequest,
        Note: !row.Note || Object.keys(row.Note).length === 0 ? '' : row.Note,
        CurrencyID:
          !row.CurrencyID || Object.keys(row.CurrencyID).length === 0
            ? null
            : row.CurrencyID,
        TT: !row.TT || Object.keys(row.TT).length === 0 ? '' : row.TT,
        ProjectPartListID:
          !row.ProjectPartListID ||
          Object.keys(row.ProjectPartListID).length === 0
            ? 0
            : row.ProjectPartListID,
        Spec: !row.Spec || Object.keys(row.Spec).length === 0 ? '' : row.Spec,
        ReceiveMoney:
          !row.ReceiveMoney || Object.keys(row.ReceiveMoney).length === 0
            ? 0
            : row.ReceiveMoney,
      };
      dataTree.push(processedRow);

      if (row._children && Array.isArray(row._children)) {
        dataTree = dataTree.concat(this.getTreeRows(row._children));
      }
    });
    return dataTree;
  }
  getPOKHData() {
    const poDate = new Date(this.poFormData.poDate || new Date());
    return {
      ID: this.selectedId || 0,
      Status: this.poFormData.status || 0,
      UserID: this.poFormData.userId || 0,
      POCode: this.poFormData.poCode || '',
      ReceivedDatePO: poDate,
      TotalMoneyPO: this.poFormData.totalPO || 0,
      TotalMoneyKoVAT: this.calculateTotalMoneyKoVAT(),
      Note: this.poFormData.note || '',
      IsApproved: this.poFormData.isApproved || false,
      CustomerID: this.selectedCustomer.ID || 0,
      PartID: this.poFormData.departmentId || 0,
      ProjectID: this.poFormData.projectId || 0,
      CustomerName: this.poFormData.customerName || '',
      POType: this.poFormData.poType || 0,
      NewAccount: this.poFormData.isBigAccount || false,
      EndUser: this.poFormData.endUser || '',
      IsBill: this.poFormData.isBill || false,
      UserType: this.poFormData.userType || 0,
      QuotationID: this.poFormData.quotationId || 0,
      PONumber: this.poFormData.poNumber || '',
      WarehouseID: this.poFormData.warehouseId || 0,
      CurrencyID: this.poFormData.currencyId || 0,
      Year: poDate.getFullYear(),
      Month: poDate.getMonth() + 1,
      IsDeleted: false,
    };
  }
  calculateTotalMoneyKoVAT() {
    let total = 0;
    const processRows = (rows: any[]) => {
      rows.forEach((row) => {
        total += Number(row.IntoMoney) || 0;
        if (row._children && Array.isArray(row._children)) {
          processRows(row._children);
        }
      });
    };
    processRows(this.tb_ProductDetailTreeList.getData());
    return total;
  }
  formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  parseCurrency = (value: string): number => {
    return Number(value.replace(/[^0-9-]/g, ''));
  };
  resetForm() {
    this.poFormData = {
      status: 0,
      poCode: '',
      customerId: 0,
      endUser: '',
      customerName: '',
      userId: 0,
      poDate: new Date(),
      totalPO: 0,
      poNumber: '',
      projectId: 0,
      poType: 0,
      departmentId: 0,
      userType: 0,
      note: '',
      currencyId: 0,
      isBigAccount: false,
      isApproved: false,
      warehouseId: 1,
    };
    this.selectedCustomer = null;
    this.dataPOKHProduct = [];
    // this.detailUser = [];
    // this.uploadedFiles = [];
  }
  handleCellValueChange(cell: any): void {
    if (this.lockEvents) return;

    const row = cell.getRow();
    const columnField = cell.getColumn().getField();
    const rowData = row.getData();

    const quantity = row.getData().Qty || 0;
    const unitPrice = row.getData().UnitPrice || 0;
    const vat = row.getData().VAT || 0;
    const billDate = row.getData().BillDate;
    const debt = row.getData().Debt || 0;
    const intoMoney = quantity * unitPrice;
    const totalWithVAT = intoMoney + intoMoney * (vat / 100);

    try {
      // Tính thành tiền và tổng tiền bao gồm VAT
      if (unitPrice >= 0 && quantity > 0) {
        if (
          columnField === 'Qty' ||
          columnField === 'UnitPrice' ||
          columnField === 'VAT'
        ) {
          row.update({
            IntoMoney: intoMoney,
            TotalPriceIncludeVAT: totalWithVAT,
          });
          this.calculateTotalIterative();
        }
      }

      // Xử lý VAT
      if (columnField === 'VAT') {
        this.tb_ProductDetailTreeList
          .getRows()
          .forEach((item: RowComponent) => {
            const itemData = item.getData();
            const vatOld = itemData['VAT'] || 0;
            const vatOldText = String(itemData['VAT']);

            if (vatOld === 0 && vat !== 0 && vatOldText === '') {
              item.update({ VAT: vat });
            }
          });
      }

      // Tính ngày thanh toán dựa trên ngày hóa đơn và số ngày công nợ
      if (columnField === 'BillDate' || columnField === 'Debt') {
        if (billDate) {
          const payDate = new Date(billDate);
          payDate.setDate(payDate.getDate() + debt);
          row.update({ PayDate: payDate });
        }
      }

      // Tính lại thành tiền khi thay đổi số lượng hoặc đơn giá
      if (columnField === 'Qty' || columnField === 'UnitPrice') {
        row.update({ IntoMoney: quantity * unitPrice });
        this.calculateTotalIterative();
      }
    } catch (error) {
      this.notification.error('Lỗi', 'Lỗi:' + error);
    }
  }
  private convertToTreeData(flatData: any[]): any[] {
    const treeData: any[] = [];
    const map = new Map();

    // Đầu tiên, tạo map với key là ID của mỗi item
    flatData.forEach((item) => {
      map.set(item.ID, { ...item, _children: [] });
    });

    // Sau đó, xây dựng cấu trúc cây
    flatData.forEach((item) => {
      const node = map.get(item.ID);
      if (item.ParentID === 0 || item.ParentID === null) {
        // Nếu là node gốc (không có parent)
        treeData.push(node);
      } else {
        // Nếu là node con, thêm vào mảng _children của parent
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(node);
        }
      }
    });

    return treeData;
  }
  generatePOCode(CustomerName: string): void {
    const { isCopy = false, warehouseId = 1, pokhId = 0 } = this.poFormData;

    this.POKHService.generatePOCode(
      CustomerName,
      isCopy,
      warehouseId,
      pokhId
    ).subscribe({
      next: (response) => {
        if (response.status === 1) {
          console.log('Mã PO được tạo:', response.data);
          this.poFormData.poCode = response.data;
        } else {
          this.notification.error('Lỗi khi tạo mã PO:', response.message);
        }
      },
      error: (error) => {
        this.notification.error(
          'Thông báo',
          'Lỗi kết nối khi tạo mã PO: ' + error
        );
      },
    });
  }
  getTotalPOValue(): number {
    this.calculateTotalIterative();
    return this.poFormData.totalPO;
  }
  getFileType(fileName: string): string {
    return fileName.split('.').pop()?.toUpperCase() || '';
  }
  private getAllRowIds(row: any): number[] {
    const ids: number[] = [];
    const rowData = row.getData();

    if (rowData.ID) {
      ids.push(rowData.ID);
    }

    if (rowData._children && rowData._children.length > 0) {
      rowData._children.forEach((child: any) => {
        const childRow = {
          getData: () => child,
        };
        ids.push(...this.getAllRowIds(childRow));
      });
    }

    return ids;
  }
  calculateTotalIterative(): void {
    let totalSum = 0;
    const allRows = this.tb_ProductDetailTreeList.getRows();

    allRows.forEach((row: RowComponent) => {
      const rowData = row.getData();
      const stack = [rowData];

      while (stack.length > 0) {
        const currentNode = stack.pop();
        if (!currentNode) continue;

        if (
          currentNode['TotalPriceIncludeVAT'] !== undefined &&
          !isNaN(currentNode['TotalPriceIncludeVAT'])
        ) {
          totalSum += Number(currentNode['TotalPriceIncludeVAT']);
        }

        if (currentNode['_children'] && currentNode['_children'].length > 0) {
          currentNode['_children'].forEach((child: any) => {
            stack.push(child);
          });
        }
      }
    });

    this.poFormData.totalPO = totalSum;
    console.log('Tổng giá trị sau VAT:', this.poFormData.totalPO);

    // Cập nhật lại giá trị tiền trong bảng người phụ trách
    this.updateResponsibleUsersMoney();
  }
  updateResponsibleUsersMoney(): void {
    if (!this.tb_DetailUser) return;

    const totalPO = this.poFormData.totalPO;
    this.tb_DetailUser.getRows().forEach((row: RowComponent) => {
      const rowData = row.getData();
      if (rowData['ResponsibleUser']) {
        const percentValue = parseFloat(rowData['PercentUser']) || 0;
        const moneyValue = totalPO * (percentValue / 100);
        row.update({ MoneyUser: moneyValue });
      }
    });
  }
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  //#endregion
  //#region : Các hàm xử lý sự kiện

  validateForm(): boolean {
    if (this.poFormData.status < 0) {
      this.notification.error('Thông báo', 'Xin hãy chọn trạng thái.');
      return false;
    }
    if (!this.poFormData.poType) {
      this.notification.error('Thông báo', 'Xin hãy chọn loại PO.');
      return false;
    }
    if (!this.poFormData.poCode) {
      this.notification.error('Thông báo', 'Xin hãy nhập mã PO.');
      return false;
    }
    return true;
  }
  toggleResponsibleUsers() {
    this.poFormData.userType = this.isResponsibleUsersEnabled ? 1 : 0;
    if (this.isResponsibleUsersEnabled) {
      if (this.selectedId > 0) {
        this.POKHService.loadUserDetail(this.selectedId, 0).subscribe((res) => {
          if (res.status === 1) {
            this.dataPOKHDetailUser = res.data[1].map((detail: any) => {
              const user = this.dataUsers.find((u) => u.ID === detail.UserID);
              return {
                ...detail,
                ID: detail.ID,
                ResponsibleUser: user ? user.FullName : '',
                UserID: user ? user.ID : detail.UserID,
                PercentUser: detail.PercentUser ? detail.PercentUser * 100 : 0,
              };
            });
            this.initDetailTable();
            this.tb_DetailUser?.setData(this.dataPOKHDetailUser);
          } else {
            this.dataPOKHDetailUser = [];
            this.initDetailTable();
            this.tb_DetailUser?.setData([]);
          }
        });
      } else {
        this.initDetailTable();
        this.tb_DetailUser?.setData(this.dataPOKHDetailUser);
      }
    } else {
      if (this.tb_DetailUser) {
        this.tb_DetailUser.destroy();
      }
      this.dataPOKHDetailUser = [];
    }
  }
  addNewRow(): void {
    this.nextRowId = this.nextRowId - 1;
    const newRow = {
      ID: this.nextRowId,
      ProductID: null,
      STT: this.dataPOKHProduct.length + 1,
      ProductNewCode: '',
      ProductCode: '',
      ProductName: '',
      GuestCode: '',
      Maker: '',
      Qty: 0,
      FilmSize: '',
      Unit: '',
      UnitPrice: 0,
      IntoMoney: 0,
      VAT: 0,
      NetUnitPrice: 0,
      TotalPriceIncludeVAT: 0,
      UserReceiver: '',
      DeliveryRequestedDate: null,
      EstimatedPay: 0,
      BillDate: null,
      BillNumber: '',
      Debt: 0,
      KHID: 0,
      PayDate: null,
      GroupPO: '',
      ActualDeliveryDate: null,
      RecivedMoneyDate: null,
      ParentId: 0,
      IsDeleted: false,
      _children: [],
    };

    this.dataPOKHProduct.push(newRow);

    if (this.tb_ProductDetailTreeList) {
      this.tb_ProductDetailTreeList.addRow(newRow);
    }
  }
  addChildRow(): void {
    if (!this.selectedRow) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một sản phẩm trước khi thêm sản phẩm con!'
      );
      return;
    }
    this.nextRowId = this.nextRowId - 1;
    const parentData = this.selectedRow.getData();
    const childRow = {
      ID: this.nextRowId,
      STT: this.selectedRow.getData()['_children']
        ? this.selectedRow.getData()['_children'].length + 1
        : 1,
      ProductNewCode: '',
      ProductCode: '',
      ProductName: '',
      GuestCode: '',
      Maker: '',
      Qty: 0,
      FilmSize: '',
      Unit: '',
      UnitPrice: 0,
      IntoMoney: 0,
      VAT: 0,
      NetUnitPrice: 0,
      TotalPriceIncludeVAT: 0,
      UserReceiver: '',
      DeliveryRequestedDate: null,
      EstimatedPay: 0,
      BillDate: null,
      BillNumber: '',
      Debt: 0,
      KHID: 0,
      PayDate: null,
      GroupPO: '',
      ActualDeliveryDate: null,
      RecivedMoneyDate: null,
      ParentId: parentData.ID,
      IsDeleted: false,
      _children: [],
    };
    this.selectedRow.addTreeChild(childRow);
    this.selectedRow.treeExpand();
  }
  onCustomerChange(event: any): void {
    this.selectedCustomer = event;
    this.poFormData.customerId = event.ID;
    this.poFormData.departmentId = 0;
    this.loadPart(this.selectedCustomer.ID);
    console.log('Selected CustomerID:', this.selectedCustomer);
    const customerShortName = this.selectedCustomer.CustomerShortName;
    this.generatePOCode(customerShortName);
    console.log('Customer Short Name:', customerShortName);
  }
  openPOCodeModal() {
    if (!this.selectedCustomer) {
      this.notification.warning('Thông báo', 'Vui lòng chọn khách hàng trước!');
      return;
    }

    const modalRef = this.modalService.open(CustomerPartComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.componentInstance.customerId = this.selectedCustomer.ID;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadPart(this.selectedCustomer.ID);
        }
      },
      (reason) => {
        console.log('Modal dismissed');
      }
    );
  }
  openFollowProductReturnModal() {
    const modalRef = this.modalService.open(FollowProductReturnComponent, {
      centered: true,
      windowClass: 'full-screen-modal',
      backdrop: 'static',
    });
  }
  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      Array.from(files).forEach((file) => {
        const fileObj = file as File;
        if (fileObj.size > MAX_FILE_SIZE) {
          this.notification.error(
            'Thông báo',
            `File ${fileObj.name} vượt quá giới hạn dung lượng cho phép (50MB)`
          );
          return;
        }
        this.addFileToTable(fileObj);
      });
      // this.fileInput.nativeElement.value = '';
    }
  }

  addRowDetailUser(): void {
    const newRow = {
      ResponsibleUser: '',
      PercentUser: 0,
      MoneyUser: 0,
    };
    this.dataPOKHDetailUser = [...this.dataPOKHDetailUser, newRow];
    if (this.tb_DetailUser) {
      this.tb_DetailUser.setData(this.dataPOKHDetailUser);
    }
  }

  addFileToTable(file: File): void {
    const newFile = {
      fileName: file.name,
      fileSize: this.formatFileSize(file.size),
      fileType: this.getFileType(file.name),
      uploadDate: new Date().toLocaleDateString('vi-VN'),
      file: file, // Lưu file gốc
    };
    this.dataPOKHDetailFile = [...this.dataPOKHDetailFile, newFile];
    if (this.tb_POKHDetailFile) {
      this.tb_POKHDetailFile.setData(this.dataPOKHDetailFile);
    }
  }

  //#endregion
  //#region : Các hàm xử lý modal

  closeModal() {
    if (this.activeModal) {
      this.activeModal.close();
    }
    this.isModalOpen = false;
    this.isEditMode = false;
    this.isCopy = false;
    this.selectedId = 0;
    this.resetForm();
    if (this.tb_ProductDetailTreeList) {
      this.tb_ProductDetailTreeList.destroy();
    }
    if (this.tb_DetailUser) {
      this.tb_DetailUser.destroy();
    }
    if (this.tb_POKHDetailFile) {
      this.tb_POKHDetailFile.destroy();
    }
  }
  //#endregion
  //#region : Các hàm vẽ bảng
  initFileUploadedTable(): void {
    this.tb_POKHDetailFile = new Tabulator(`#tb_POKHDetailFile`, {
      data: this.dataPOKHDetailFile,
      layout: 'fitDataFill',
      pagination: true,
      paginationSize: 10,
      height: '20vh',
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      columns: [
        {
          title: 'Hành động',
          field: 'actions',
          formatter: (cell) => {
            return `<i class="bi bi-trash3 text-danger delete-btn" style="font-size:15px; cursor: pointer;"></i>`;
          },
          width: '10%',
          hozAlign: 'center',
          cellClick: (e, cell) => {
            if ((e.target as HTMLElement).classList.contains('delete-btn')) {
              this.modal.confirm({
                nzTitle: 'Xác nhận xóa',
                nzContent: 'Bạn có chắc chắn muốn xóa file này?',
                nzOkText: 'Đồng ý',
                nzCancelText: 'Hủy',
                nzOnOk: () => {
                  const row = cell.getRow();
                  const rowData = row.getData();

                  // thêm id của file đã xóa vào mảng deletedFileIds
                  if (rowData['ID']) {
                    this.deletedFileIds.push(rowData['ID']);
                  }

                  row.delete();
                  this.dataPOKHFiles = this.tb_POKHFile.getData();
                },
              });
            }
          },
        },
        {
          title: 'Tên file',
          field: 'fileName',
          sorter: 'string',
          width: '60%',
        },
        {
          title: 'Loại file',
          field: 'fileType',
          sorter: 'string',
          width: '10%',
        },
        {
          title: 'Ngày tải lên',
          field: 'CreatedDate',
          sorter: 'date',
          width: '30%',
        },
      ],
    });

    // (window as any).deleteFile = (index: number) => {
    //   this.deleteFile(index);
    // };
  }
  initProductDetailTreeList(): void {
    this.tb_ProductDetailTreeList = new Tabulator(
      this.tbProductDetailTreeListElement.nativeElement,
      {
        data: this.dataPOKHProduct,
        dataTree: true,
        dataTreeStartExpanded: true,
        dataTreeChildField: '_children',
        dataTreeChildIndent: 15,
        dataTreeElementColumn: 'STT',
        height: '30vh',
        layout: 'fitDataFill',
        pagination: true,
        paginationSize: 10,
        movableColumns: true,
        resizableRows: true,
        columns: [
          {
            title: '',
            field: 'actions',
            frozen: true,
            formatter: (cell) => {
              return `<i class="bi bi-trash3 text-danger delete-btn" style="font-size:15px; cursor: pointer;"></i>`;
            },
            width: '5%',
            hozAlign: 'center',
            cellClick: (e, cell) => {
              if ((e.target as HTMLElement).classList.contains('delete-btn')) {
                this.modal.confirm({
                  nzTitle: 'Xác nhận xóa',
                  nzContent: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
                  nzOkText: 'Đồng ý',
                  nzCancelText: 'Hủy',
                  nzOnOk: () => {
                    const row = cell.getRow();
                    const rowData = row.getData();
                    const parentRow = row.getTreeParent();

                    // Get all IDs to be deleted (current row and all its children)
                    this.deletedPOKHDetailIds = this.getAllRowIds(row);
                    console.log(
                      'deletedPOKHDetailIds: ',
                      this.deletedPOKHDetailIds
                    );

                    if (parentRow) {
                      // Nếu có node cha, xóa node con khỏi mảng _children của node cha
                      const parentData = parentRow.getData();
                      if (parentData['_children']) {
                        parentData['_children'] = parentData[
                          '_children'
                        ].filter((child: any) => child['ID'] !== rowData['ID']);
                        parentRow.update(parentData);
                      }
                    } else {
                      // Nếu là node gốc, xóa khỏi mảng POKHProduct
                      this.dataPOKHProduct = this.dataPOKHProduct.filter(
                        (item) => item['ID'] !== rowData['ID']
                      );
                    }

                    // Cập nhật lại bảng
                    this.tb_ProductDetailTreeList.setData(this.dataPOKHProduct);
                    this.getTotalPOValue();
                  },
                });
              }
            },
          },
          {
            title: 'STT',
            field: 'STT',
            sorter: 'number',
            width: 70,
            frozen: true,
          },
          {
            title: 'Mã Nội Bộ',
            field: 'ProductNewCode',
            sorter: 'string',
            width: 120,
            editor: 'list',
            tooltip: true,
            frozen: true,
            editorParams: {
              values: this.dataProducts.map((product) => {
                const shortLabel =
                  `${product.ProductNewCode} ${product.ProductCode}`.length > 50
                    ? `${product.ProductNewCode} ${product.ProductCode}`.substring(
                        0,
                        50
                      ) + '...'
                    : `${product.ProductNewCode} ${product.ProductCode}`;

                return {
                  label: shortLabel,
                  value: product.ProductNewCode,
                  id: product.ID,
                };
              }),
              autocomplete: true,
            },
          },
          {
            title: 'Mã Sản Phẩm (Cũ)',
            field: 'ProductCode',
            sorter: 'string',
            width: 120,
            editor: 'input',
            frozen: true,
          },
          {
            title: 'Tên sản phẩm',
            field: 'ProductName',
            sorter: 'string',
            width: 150,
            editor: 'input',
            frozen: true,
          },
          {
            title: 'Mã theo khách',
            field: 'GuestCode',
            sorter: 'string',
            width: 150,
            editor: 'input',
          },
          {
            title: 'Hãng',
            field: 'Maker',
            sorter: 'string',
            width: 100,
            editor: 'input',
          },
          {
            title: 'Số lượng',
            field: 'Qty',
            sorter: 'number',
            width: 80,
            editor: 'number',
          },
          {
            title: 'Kích thước phim cắt/Model',
            field: 'FilmSize',
            sorter: 'string',
            width: 200,
            editor: 'input',
          },
          {
            title: 'Thông số kỹ thuật',
            field: 'Spec',
            sorter: 'string',
            width: 150,
            editor: 'input',
          },
          {
            title: 'ĐVT',
            field: 'Unit',
            sorter: 'string',
            width: 100,
            editor: 'input',
          },
          {
            title: 'Đơn giá NET',
            field: 'NetUnitPrice',
            sorter: 'number',
            width: 150,
            editor: 'number',
            formatter: 'money',
            formatterParams: {
              precision: 0,
              decimal: '.',
              thousand: ',',
              symbol: '',
              symbolAfter: true,
            },
          },
          {
            title: 'Đơn giá trước VAT',
            field: 'UnitPrice',
            sorter: 'number',
            width: 150,
            editor: 'number',
            formatter: 'money',
            formatterParams: {
              precision: 0,
              decimal: '.',
              thousand: ',',
              symbol: '',
              symbolAfter: true,
            },
          },
          {
            title: 'Tổng tiền trước VAT',
            field: 'IntoMoney',
            sorter: 'number',
            width: 150,
            editor: 'number',
            formatter: 'money',
            formatterParams: {
              precision: 0,
              decimal: '.',
              thousand: ',',
              symbol: '',
              symbolAfter: true,
            },
          },
          {
            title: 'VAT (%)',
            field: 'VAT',
            sorter: 'number',
            width: 100,
            editor: 'number',
            formatter: function (cell, formatterParams, onRendered) {
              const value = cell.getValue();
              if (
                value !== null &&
                value !== undefined &&
                !isNaN(Number(value))
              ) {
                return value + '%';
              }
              return '';
            },
          },
          {
            title: 'Tổng tiền sau VAT',
            field: 'TotalPriceIncludeVAT',
            sorter: 'number',
            width: 150,
            editor: 'number',
            formatter: 'money',
            formatterParams: {
              precision: 0,
              decimal: '.',
              thousand: ',',
              symbol: '',
              symbolAfter: true,
            },
          },
          {
            title: 'Người nhận',
            field: 'UserReceiver',
            sorter: 'string',
            width: 130,
            editor: 'input',
          },
          {
            title: 'Ngày yêu cầu giao hàng',
            field: 'DeliveryRequestedDate',
            sorter: 'string',
            width: 200,
            editor: 'date',
          },
          {
            title: 'Thanh toán dự kiến',
            field: 'EstimatedPay',
            sorter: 'number',
            width: 150,
            editor: 'number',
          },
          {
            title: 'Ngày hóa đơn',
            field: 'BillDate',
            sorter: 'string',
            width: 150,
            editor: 'date',
          },
          {
            title: 'Số hóa đơn',
            field: 'BillNumber',
            sorter: 'string',
            width: 150,
            editor: 'input',
          },
          {
            title: 'Công nợ',
            field: 'Debt',
            sorter: 'number',
            width: 150,
            editor: 'number',
          },
          {
            title: 'Ngày yêu cầu thanh toán',
            field: 'PayDate',
            sorter: 'string',
            width: 150,
            editor: 'date',
          },
          {
            title: 'Nhóm',
            field: 'ProductPO',
            sorter: 'string',
            width: 100,
            editor: 'input',
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            sorter: 'string',
            width: 100,
            editor: 'input',
          },
        ],
      }
    );

    this.tb_ProductDetailTreeList.on('cellEdited', (cell: CellComponent) => {
      if (cell.getColumn().getField() === 'ProductNewCode') {
        const selectedProduct = this.dataProducts.find(
          (p) => p.ProductNewCode === cell.getValue()
        );
        console.log('Dữ liệu của sản phẩm đã nhận: ', selectedProduct);
        if (selectedProduct) {
          const row = cell.getRow();
          row.update({
            productId: selectedProduct.ID,
            ProductCode: selectedProduct.ProductCode,
            ProductName: selectedProduct.ProductName,
            Unit: selectedProduct.Unit,
            Maker: selectedProduct.Maker,
            ProductGroupName: selectedProduct.ProductGroupName,
          });
          console.log('rowEdited: ', row);
        }
      }
      this.handleCellValueChange(cell);
    });

    this.tb_ProductDetailTreeList.on(
      'rowClick',
      (e: any, row: RowComponent) => {
        this.selectedRow = row;
        console.log('selectedRow', this.selectedRow);
        console.log('_children: ', this.selectedRow.getData()['_children']);
      }
    );
  }
  initDetailTable(): void {
    this.tb_DetailUser = new Tabulator(this.tbDetailUserElement.nativeElement, {
      data: this.dataPOKHDetailUser,
      layout: 'fitDataFill',
      pagination: true,
      paginationSize: 5,
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      columns: [
        {
          title: '',
          field: 'actions',
          formatter: (cell) => {
            return `<i class="bi bi-trash3 text-danger delete-btn" style="font-size:15px; cursor: pointer;"></i>`;
          },
          width: '5%',
          hozAlign: 'center',
          cellClick: (e, cell) => {
            if ((e.target as HTMLElement).classList.contains('delete-btn')) {
              this.modal.confirm({
                nzTitle: 'Xác nhận xóa',
                nzContent: 'Bạn có chắc chắn muốn xóa người phụ trách này?',
                nzOkText: 'Đồng ý',
                nzCancelText: 'Hủy',
                nzOnOk: () => {
                  const row = cell.getRow();
                  const rowData = row.getData();

                  // thêm id của người phụ trách đã xóa vào mảng deletedDetailUserIds
                  if (rowData['ID']) {
                    this.deletedDetailUserIds.push(rowData['ID']);
                  }

                  row.delete();
                  this.dataPOKHDetailUser = this.tb_DetailUser.getData();
                },
              });
            }
          },
        },
        {
          title: 'ID',
          field: 'ID',
          sorter: 'number',
          visible: false,
        },
        {
          title: 'UserID',
          field: 'UserID',
          sorter: 'number',
          visible: false,
        },
        {
          title: 'Người phụ trách',
          field: 'ResponsibleUser',
          sorter: 'string',
          width: '25%',
          editor: 'list',
          editorParams: {
            values: this.dataUsers.map((user) => ({
              label: `${user.FullName}`,
              value: user.FullName,
            })),
            listOnEmpty: true,
            autocomplete: true,
          },
          cellEdited: (cell) => {
            const selectedUser = this.dataUsers.find(
              (user) => user.FullName === cell.getValue()
            );
            if (selectedUser) {
              const currentRow = cell.getRow();
              currentRow.update({ UserID: selectedUser.ID });
            }
          },
          // editor: this.createdControl(
          //   POKHControllerComponent,
          //   this.injector,
          //   this.appRef,
          //   this.dataUsers
          // ),
          // formatter: (cell) => {
          //   const val = cell.getValue();
          //   console.log(this.dictDetailUser);
          //   return val
          //     ? `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${this.dictDetailUser[val]}</p> <i class="fas fa-angle-down"></i> <div>`
          //     : '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">Chọn người phụ trách</p> <i class="fas fa-angle-down"></i> <div>';
          // },
        },
        {
          title: 'Phần trăm',
          field: 'PercentUser',
          sorter: 'number',
          editor: 'input',
          width: '30%',
          cellEdited: (cell) => {
            const totalPO = this.getTotalPOValue();
            const percentValue = parseFloat(cell.getValue()) || 0;

            // Tính tổng phần trăm hiện tại
            let totalPercent = 0;
            this.tb_DetailUser.getRows().forEach((row: RowComponent) => {
              const rowData = row.getData();
              if (rowData['ResponsibleUser']) {
                // Chỉ tính cho các dòng có người phụ trách
                totalPercent += parseFloat(rowData['PercentUser']) || 0;
              }
            });

            // Kiểm tra nếu tổng phần trăm vượt quá 100%
            if (totalPercent > 100) {
              alert('Tổng phần trăm không được vượt quá 100%');
              cell.setValue(0);
              cell.getRow().update({ MoneyUser: 0 });
              return;
            }

            const moneyValue = totalPO * (percentValue / 100);
            cell.getRow().update({ MoneyUser: moneyValue });
          },
          formatter: function (cell, formatterParams, onRendered) {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') {
              return '';
            }
            return Number(value) + '%';
          },
        },
        {
          title: 'Tiền theo phần trăm',
          field: 'MoneyUser',
          sorter: 'number',
          editor: 'input',
          width: '40%',
          formatter: function (cell, formatterParams, onRendered) {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') {
              return '';
            }
            return new Intl.NumberFormat('vi-VN').format(value);
          },
        },
      ],
    });
  }
  //#endregion

  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    data: any
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      // Các tham số truyền vào tùy theo custom select
      componentRef.instance.leaderId = cell.getValue();
      componentRef.instance.leaders = data;

      // Các tham số trả ra tùy chỉnh
      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {
        if (container.firstElementChild) {
          (container.firstElementChild as HTMLElement).focus();
        }
      });

      return container;
    };
  }
  createLabelsFromData() {
    this.dictDetailUser = {};

    this.dataUsers.forEach((item) => {
      // Nếu chưa có key, thêm vào labels
      if (!this.dictDetailUser[item.ID]) {
        this.dictDetailUser[item.ID] = item.FullName;
      }
    });
  }

  // Hàm flatten dữ liệu chi tiết sản phẩm (tree -> flat array)
  flattenDetails(details: any[], flatList: any[] = [], parentId: number = 0) {
    details.forEach((item) => {
      // Nếu đã có ID âm thì giữ nguyên, nếu không thì tạo mới
      let tempId = item.ID;
      if (!tempId || tempId > 0) {
        tempId = Math.floor(Math.random() * -1000000); // ID âm tạm thời
      }
      flatList.push({
        ...item,
        ID: tempId,
        ParentID: parentId ?? 0,
      });
      if (item._children && item._children.length > 0) {
        this.flattenDetails(item._children, flatList, tempId);
      }
    });
    return flatList;
  }

  // Hàm chuẩn bị dữ liệu và gọi API copy-dto
  copyPOKHToDTO() {
    const poDate = new Date(this.poFormData.poDate || new Date());

    // Reset ID của phiếu chính
    const pokhCopy = {
      ...this.poFormData,
      ID: 0,
      Year: poDate.getFullYear(),
      Month: poDate.getMonth() + 1,
      ReceivedDatePO: poDate,
      PartID: this.poFormData.departmentId,
      NewAccount: this.poFormData.isBigAccount,
      TotalMoneyPO: this.poFormData.totalPO,
      TotalMoneyKoVAT: this.calculateTotalMoneyKoVAT(),
    };
    // Flatten chi tiết sản phẩm
    const detailsFlat = this.flattenDetails(this.dataPOKHProduct);
    // Reset ID của chi tiết người phụ trách
    const detailUserCopy = this.dataPOKHDetailUser.map((u) => ({
      ...u,
      ID: 0,
    }));
    // Tạo DTO
    const dto = {
      POKH: pokhCopy,
      POKHDetails: detailsFlat,
      POKHDetailsMoney: detailUserCopy,
    };
    // Gọi API copy-dto
    this.POKHService.copyFromDTO(dto).subscribe((res) => {
      if (res.status === 1) {
        this.notification.success('Thông báo', 'Copy thành công!');
        // Có thể load lại danh sách hoặc chuyển sang bản ghi mới
      } else {
        this.notification.error('Thông báo', 'Copy thất bại: ' + res.message);
      }
    });
  }
}
