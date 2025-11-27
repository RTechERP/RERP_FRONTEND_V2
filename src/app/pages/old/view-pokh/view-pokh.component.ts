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
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
  CellComponent as TabulatorCell,
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

import { HandoverMinutesComponent } from '../handover-minutes/handover-minutes.component';
import { ViewPokhService } from '../view-pokh/view-pokh/view-pokh.service';
import { HandoverMinutesDetailService } from '../handover-minutes-detail/handover-minutes-detail/handover-minutes-detail.service';
import { RequestInvoiceDetailComponent } from '../request-invoice-detail/request-invoice-detail.component';
import { HandoverMinutesDetailComponent } from '../handover-minutes-detail/handover-minutes-detail.component';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

interface GroupedData {
  CustomerName: string;
  EFullName: string;
  Items: any[];
}

@Component({
  selector: 'app-view-pokh',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzSplitterModule,
    NzFormModule,
    NzDatePickerModule,
    NzInputModule,
    NzInputNumberModule,
  ],
  templateUrl: './view-pokh.component.html',
  styleUrl: './view-pokh.component.css',
})
export class ViewPokhComponent implements OnInit, AfterViewInit {
  @Input() warehouseId: number = 0;
  @ViewChild('ViewPOKH', { static: false }) viewPOKHTableElement!: ElementRef;
  sizeSearch: string = '0';
  private isRecallCellValueChanged: boolean = false;
  private modifiedRows: Set<number> = new Set();
  private modifiedInvoiceRows: Set<number> = new Set();

  private nestedExportTables: Map<any, Tabulator> = new Map();
  private skipChildUpdate: boolean = false;

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }

  private viewPOKH!: Tabulator;

  public groups: any[] = [];
  public customers: any[] = [];
  public users: any[] = [];
  public statuses: any[] = [];
  public colors: any[] = [];
  public EmployeeTeamSale: any[] = [];
  data: any[] = [];
  dataExport: any[] = [];
  dataInvoice: any[] = [];
  dataAfterGroupNested: any[] = [];
  selectedRows: any[] = [];
  filters: any = {
    groupId: 0,
    customerId: 0,
    poType: 0,
    userId: 0,
    status: 0,
    color: null,
    employeeTeamSaleId: 0,
    startDate: new Date(),
    endDate: new Date(),
    keyword: '',
  };

  constructor(
    public activeModal: NgbActiveModal,
    private viewPokhService: ViewPokhService,
    private HandoverMinutesDetailService: HandoverMinutesDetailService,
    private modalService: NgbModal,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 1);
    this.filters.startDate = startDate;
    this.filters.endDate = endDate;
    this.loadCustomer();
    this.loadEmployeeTeamSale();
    this.loadGroupSale();
    this.loadMainIndex();
    this.loadUser();
  }

  ngAfterViewInit(): void {
    this.initViewPOKHTable();
    this.loadData();

    setTimeout(() => {
      const table = this.viewPOKHTableElement.nativeElement;
      table.addEventListener('click', (e: any) => {
        const target = e.target as HTMLInputElement;
        if (target.classList.contains('group-checkbox')) {
          const groupValue = target.getAttribute('data-group');
          const rows = this.viewPOKH
            .getRows()
            .filter((row) => row.getData()['PONumber'] === groupValue);

          if (target.checked) {
            rows.forEach((row) => {
              row.select();
              const rowData = row.getData();
              if (!this.selectedRows.some((r) => r['ID'] === rowData['ID'])) {
                this.selectedRows.push(rowData);
              }
            });
          } else {
            rows.forEach((row) => {
              row.deselect();
              const rowData = row.getData();
              this.selectedRows = this.selectedRows.filter(
                (r) => r['ID'] !== rowData['ID']
              );
            });
          }
          console.log('Selected Rows:', this.selectedRows);
        }
      });
    });

    // Xử lý sự kiện chỉnh sửa cell
    this.viewPOKH.on('cellEdited', (cell: TabulatorCell) => {
      if (this.isRecallCellValueChanged) return;

      try {
        this.isRecallCellValueChanged = true;

        const column = cell.getColumn().getField();
        const row = cell.getRow();
        const rowData = row.getData();

        this.modifiedRows.add(rowData['ID']);

        if (
          column === 'BillNumber' ||
          column === 'BillDate' ||
          column === 'DeliveryRequestedDate'
        ) {
          const newValue = cell.getValue();
          if (newValue === null) return;

          const selectedRows = this.viewPOKH.getSelectedRows();
          if (selectedRows.length > 0) {
            selectedRows.forEach((selectedRow) => {
              if (selectedRow !== row) {
                selectedRow.update({ [column]: newValue });
                const selectedRowData = selectedRow.getData();
                this.modifiedRows.add(selectedRowData['ID']);
              }
            });
          }
        }
      } finally {
        this.isRecallCellValueChanged = false;
      }
    });

    // Thêm event listener cho việc chọn toàn bộ (header checkbox)
    this.viewPOKH.on('rowSelectionChanged', (data, rows) => {
      // Cập nhật selectedRows khi có thay đổi selection từ header checkbox
      this.selectedRows = data;
      console.log('Selection changed - Selected Rows:', this.selectedRows);
    });
  }
  //#region Hàm xử lý modal
  openHandoverMinutesModal() {
    if (this.selectedRows.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 dòng để xem biên bản giao hàng'
      );
      return;
    }

    // Lọc các dòng có QuantityPending > 0
    const validRows = this.selectedRows.filter(
      (row) => row.QuantityPending > 0
    );
    if (validRows.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không có dòng nào có số lượng chờ giao!'
      );
      return;
    }

    // Nhóm dữ liệu theo CustomerID và EID
    const groupedData = validRows.reduce<Record<string, GroupedData>>(
      (acc, row) => {
        const key = `${row.CustomerID}_${row.EID}`;
        if (!acc[key]) {
          acc[key] = {
            CustomerName: row.CustomerName,
            EFullName: row.EFullName,
            Items: [],
          };
        }
        acc[key].Items.push({
          POKHDetailID: row.ID,
          STT: acc[key].Items.length + 1,
          Maker: row.Maker,
          CustomerID: row.CustomerID,
          Quantity: row.QuantityPending,
          ProductName: row.ProductName,
          ProductCode: row.ProductCode,
          CustomerName: row.CustomerName,
          POCode: row.POCode,
          FullName: row.EFullName,
          Unit: row.Unit,
          ProductStatus: row.ProductStatus,
          Guarantee: row.Guarantee,
          DeliveryStatus: row.DeliveryStatus,
          EID: row.EID,
          QuantityPending: row.QuantityPending,
        });
        return acc;
      },
      {}
    );

    // Chuyển đổi object thành array để dễ xử lý
    const groupedArray = Object.entries(groupedData).map(
      ([key, group]: [string, GroupedData]) => ({
        key,
        customerName: group.CustomerName,
        employeeName: group.EFullName,
        items: group.Items,
      })
    );

    // Mở 1 modal duy nhất với tất cả các tab
    const modalRef = this.modalService.open(HandoverMinutesDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    // Truyền dữ liệu vào modal
    modalRef.componentInstance.groupedData = groupedArray;
    modalRef.componentInstance.isMultipleGroups = groupedArray.length > 1;

    // Xử lý kết quả khi modal đóng
    modalRef.result
      .then((result) => {
        if (result && result.reloadTable) {
          // Load lại dữ liệu
          this.loadData();
        }
      })
      .catch((reason) => {
        console.log('Modal dismissed:', reason);
      });
  }
  openRequestInvoiceDetailModal() {
    if (this.selectedRows.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 dòng mở yêu cầu xuất hóa đơn'
      );
      return;
    }

    // Nhóm dữ liệu theo CustomerID
    const groupedData = this.selectedRows.reduce<Record<string, any[]>>(
      (acc, row) => {

        // if (!row.selectedExports || row.selectedExports.length === 0) {
        //   return acc;  // Không có export được chọn → bỏ dòng cha
        // }

        const customerID = row.CustomerID;
        const key = `${customerID}`;

        if (!acc[key]) acc[key] = [];

        const hasExports =
          row.selectedExports && Array.isArray(row.selectedExports) && row.selectedExports.length > 0;

        // Nếu KHÔNG có dòng con → tạo 1 export rỗng mặc định
        const exportsToProcess = hasExports
          ? row.selectedExports
          : [
            {
              Qty: 0,
              Code: '',
              TotalQty: 0
            }
          ];

        exportsToProcess.forEach((ex: any) => {
          acc[key].push({
            // from parent
            POKHID: row.POKHID,
            POKHDetailID: row.ID,
            ProductName: row.ProductName,
            ProductSaleID: row.ProductID,
            ProjectCode: row.ProjectCode,
            ProjectName: row.ProjectName,
            ProductNewCode: row.ProductNewCode,
            POCode: row.POCode,
            Unit: row.Unit,
            CustomerName: this.customers.find(x => x.ID == customerID)?.CustomerName,
            RequestDate: row.RequestDate,
            DateRequestImport: row.DateRequestImport,
            ExpectedDate: row.ExpectedDate,
            SupplierName: row.SupplierName,
            SomeBill: row.SomeBill,
            BillImportCode: row.BillImportCode,
            ProjectID: row.ProjectID,
            PONumber: row.PONumber,
            GuestCode: row.GuestCode,

            // from nested export
            Quantity: ex.Qty || row.Qty,
            Code: ex.Code || '',
            TotalQty: ex.TotalQty || 0,
            BillExportCode: ex.Code || '',

            // CustomerID: row.CustomerID,
            // ProductCode: row.ProductCode,
            // ProjectID: row.ProjectID,
            // Address: row.Address,

            STT: acc[key].length + 1,
            InvoiceDate: null,
            InvoiceNumber: null,
          });
        });

        return acc;
      }, {}
    );


    if (Object.keys(groupedData).length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không có dữ liệu hợp lệ để tạo yêu cầu xuất hóa đơn'
      );
      return;
    }

    // Hiển thị thông báo nếu có nhiều khách hàng
    if (Object.keys(groupedData).length > 1) {
      this.notification.info(
        'Thông báo',
        `Bạn chọn sản phẩm từ ${Object.keys(groupedData).length
        } khách hàng. Phần mềm sẽ tự động tạo ${Object.keys(groupedData).length
        } hóa đơn xuất.`
      );
    }

    // Chuyển đổi object thành array để dễ xử lý
    const groupedArray = Object.entries(groupedData).map(([key, data]) => ({
      key,
      customerID: parseInt(key),
      customerName: data[0]?.CustomerName || 'Khách hàng',
      data: data,
    }));

    // Mở modal tuần tự
    this.openModalSequentially(groupedArray, 0);
  }

  private openModalSequentially(groupedArray: any[], index: number): void {
    if (index >= groupedArray.length) {
      return; // Đã mở hết tất cả modal
    }

    const currentGroup = groupedArray[index];

    const modalRef = this.modalService.open(RequestInvoiceDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    // Truyền dữ liệu vào modal
    modalRef.componentInstance.selectedRowsData = currentGroup.data;
    modalRef.componentInstance.customerID = currentGroup.customerID;
    modalRef.componentInstance.customerName = currentGroup.customerName;
    modalRef.componentInstance.isFromPOKH = true;

    // Xử lý kết quả khi modal đóng
    modalRef.result
      .then((result) => {
        if (result && result.reloadTable) {
          // Load lại dữ liệu
          this.loadData();
        }
        // Mở modal tiếp theo
        this.openModalSequentially(groupedArray, index + 1);
      })
      .catch((reason) => {
        console.log('Modal dismissed:', reason);
        // Mở modal tiếp theo ngay cả khi modal hiện tại bị đóng
        this.openModalSequentially(groupedArray, index + 1);
      });
  }
  closeModal(): void {
    this.activeModal.close();
  }
  //#endregion
  //#region Hàm tải dữ liệu
  loadData(): void {
    const startDate = new Date(this.filters.startDate);
    const endDate = new Date(this.filters.endDate);

    const params = {
      employeeTeamSaleId: this.filters.employeeTeamSaleId || 0,
      userId: this.filters.userId || 0,
      poType: this.filters.poType || 0,
      status: this.filters.status || 0,
      customerId: this.filters.customerId || 0,
      keyword: this.filters.keyword || '',
      warehouseId: this.warehouseId || 0,
    };
    console.log("params loadviewpokh", params);

    this.viewPokhService
      .loadViewPOKH(
        startDate,
        endDate,
        params.employeeTeamSaleId,
        params.userId,
        params.poType,
        params.status,
        params.customerId,
        params.keyword,
        params.warehouseId
      )
      .subscribe((response) => {
        this.data = response.data.data;
        this.dataExport = response.data.dataExport;
        this.dataInvoice = response.data.dataInvoice;
        this.dataAfterGroupNested = this.groupNested(this.data, this.dataExport, this.dataInvoice, 'ID', 'POKHDetailID');
        if (this.viewPOKH) {
          this.viewPOKH.setData(this.dataAfterGroupNested);
        }
      });
  }
  loadEmployeeTeamSale(): void {
    this.viewPokhService.loadEmployeeTeamSale().subscribe(
      (response) => {
        if (response.status === 1) {
          this.EmployeeTeamSale = response.data;
        } else {
          this.notification.error(
            'Lỗi khi tải EmployeeTeamSale:',
            response.message
          );
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải EmployeeTeamSale:', error);
      }
    );
  }
  loadMainIndex(): void {
    this.viewPokhService.loadMainIndex().subscribe(
      (response) => {
        if (response.status === 1) {
          this.statuses = response.data;
        } else {
          this.notification.error('Lỗi khi tải Status:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải Status:', error);
      }
    );
  }
  loadGroupSale(): void {
    this.viewPokhService.loadGroupSale().subscribe(
      (response) => {
        if (response.status === 1) {
          this.groups = response.data;
        } else {
          this.notification.error('Lỗi khi tải GroupSale:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải GroupSale:', error);
      }
    );
  }
  loadCustomer(): void {
    this.viewPokhService.loadCustomer().subscribe(
      (response) => {
        if (response.status === 1) {
          this.customers = response.data;
        } else {
          this.notification.error('Lỗi khi tải Customer:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải Customer:', error);
      }
    );
  }
  loadUser(): void {
    this.viewPokhService.loadUser().subscribe(
      (response) => {
        if (response.status === 1) {
          this.users = response.data;
        } else {
          this.notification.error('Lỗi khi tải users:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải users:', error);
      }
    );
  }
  //#endregion
  //#region Hàm xử lý SavePOKHDetail
  savePOKHDetail(): void {
    const hasMainChanges = this.modifiedRows.size > 0;
    const hasInvoiceChanges = this.modifiedInvoiceRows.size > 0;

    if (!hasMainChanges && !hasInvoiceChanges) {
      this.notification.info('Thông báo', 'Không có dữ liệu cần lưu thay đổi.');
      return;
    }
    const allData = this.viewPOKH.getData();

    //Xử lí bảng nested invoice
    let invoiceUpdates: any[] = [];
    if (hasInvoiceChanges) {
      allData.forEach(parent => {
        if (parent.invoiceDetails) {
          parent.invoiceDetails.forEach((inv: any) => {
            if (this.modifiedInvoiceRows.has(inv.RequestInvoiceDetailID)) {
              invoiceUpdates.push({
                ID: inv.RequestInvoiceDetailID,
                InvoiceNumber: inv.InvoiceNumber,
                InvoiceDate: inv.InvoiceDate
              });
            }
          });
        }
      });
    }
    ////

    const pokhUpdates: any[] = [];

    if (hasMainChanges) {
      allData.forEach(row => {
        if (this.modifiedRows.has(row.ID)) {
          pokhUpdates.push({
            ...row,
            UpdatedDate: new Date()
          });
        }
      });
    }

    const dto = {
      pokhDetails: pokhUpdates,
      requestInvoiceDetails: invoiceUpdates
    };

    this.viewPokhService.saveData(dto).subscribe(
      (response) => {
        this.notification.success('Lưu thành công:', 'Lưu thành công!');
        this.modifiedRows.clear();
        this.modifiedInvoiceRows.clear();
        this.loadData();
      },
      (error) => {
        this.notification.error('Lỗi khi lưu:', error);
      }
    );
  }

  //hàm groupdata để tạo nested table
  groupNested(
    parents: any[],
    exportList: any[],
    invoiceList: any[],
    parentKey: string,     // "ID"
    childKey: string       // "POKHDetailID"
  ): any[] {

    // Nhóm EXPORT theo ParentID 
    const exportMap: Record<string, any[]> = {};
    exportList.forEach(item => {
      const key = String(item[childKey]);
      if (!exportMap[key]) exportMap[key] = [];
      exportMap[key].push(item);
    });

    // Nhóm INVOICE theo ParentID
    const invoiceMap: Record<string, any[]> = {};
    invoiceList.forEach(item => {
      const key = String(item[childKey]);
      if (!invoiceMap[key]) invoiceMap[key] = [];
      invoiceMap[key].push(item);
    });

    // Gắn vào parent
    return parents.map(parent => {
      const key = String(parent[parentKey]);
      return {
        ...parent,
        exportDetails: exportMap[key] || [],
        invoiceDetails: invoiceMap[key] || [],
      };
    });
  }



  //#endregion
  //#region Hàm vẽ bảng
  initViewPOKHTable(): void {
    this.viewPOKH = new Tabulator(this.viewPOKHTableElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.dataAfterGroupNested,
      layout: 'fitDataFill',
      movableColumns: true,
      pagination: true,
      paginationSize: 50,
      paginationSizeSelector: [10, 20, 50, 100],
      height: '87vh',
      resizableRows: true,
      reactiveData: true,
      groupBy: 'PONumber',
      selectableRows: true,
      selectableRange: true,
      // langs: {
      //   vi: {
      //     pagination: {
      //       first: '<<',
      //       last: '>>',
      //       prev: '<',
      //       next: '>',
      //     },
      //   },
      // },
      // locale: 'vi',
      // columnDefaults: {
      //   headerWordWrap: true,
      //   headerVertical: false,
      //   headerHozAlign: 'center',
      //   minWidth: 60,
      //   hozAlign: 'left',
      //   vertAlign: 'middle',
      //   resizable: true,
      // },
      rowHeader: false,
      groupHeader: (value, count, data, group) => {
        return `<div class="group-header">
          <input type="checkbox" class="group-checkbox" data-group="${value}">
          <span>${value} (${count} items)</span>
        </div>`;
      },

      columns: [
        {
          title: "",
          width: 40,
          hozAlign: "center",
          formatter: (cell) => {
            const data = cell.getRow().getData();
            const hasNested =
              (data['exportDetails'] && data['exportDetails'].length > 0) ||
              (data['invoiceDetails'] && data['invoiceDetails'].length > 0);

            if (!hasNested) {
              return `<span class="toggle-nested disabled">▸</span>`;
            }

            return `<span class="toggle-nested">▸</span>`;
          },

          cellClick: (e, cell) => {
            e.stopPropagation();
            e.preventDefault();

            const row = cell.getRow();
            const data = row.getData();


            const hasNested =
              (data['exportDetails'] && data['exportDetails'].length > 0) ||
              (data['invoiceDetails'] && data['invoiceDetails'].length > 0);

            if (!hasNested) return;

            const el = cell.getElement();
            const icon = el.querySelector(".toggle-nested") as HTMLElement | null;
            if (!icon) return;

            const nestedWrapper = row.getElement().querySelector(".nested-wrapper") as HTMLElement | null;
            if (!nestedWrapper) return;

            const isOpen = nestedWrapper.style.display === "block";

            if (isOpen) {
              nestedWrapper.style.display = "none";
              icon.textContent = "▸";
            } else {
              nestedWrapper.style.display = "block";
              icon.textContent = "▾";
            }
          }

        },
        {
          title: '',
          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          hozAlign: 'center',
          headerSort: false,
          frozen: true,
          width: 40,

          cellClick: (e, cell) => {
            // Logic xử lý click nếu cần
          }
        },

        {
          title: 'ID',
          field: 'ID',
          sorter: 'number',
          width: 100,
          frozen: true,
          visible: false,
        },
        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          sorter: 'string',
          width: 120,
          frozen: true,
        },
        {
          title: 'Số POKH',
          field: 'PONumber',
          sorter: 'string',
          width: 150,
          frozen: true,
        },
        {
          title: 'Trạng thái',
          field: 'StatusText',
          sorter: 'string',
          width: 200,
          formatter: (cell) => {
            const value = cell.getValue();
            let bgColor = '';

            switch (value) {
              case 'Chưa giao , chưa thanh toán':
                bgColor = '#F2F5A9'; // Vàng nhạt
                break;
              case 'Chưa giao, đã thanh toán':
                bgColor = '#F5D0A9'; // Cam nhạt
                break;
              case 'Đã giao, nhưng chưa thanh toán':
                bgColor = '#A9F5F2'; // Xanh dương nhạt
                break;
              case 'Đã thanh toán, GH chưa xuất hóa đơn':
                bgColor = '#CEF6CE'; // Xanh lá nhạt
                break;
              default:
                bgColor = '#FFFFFF'; // Trắng
            }

            cell.getElement().style.backgroundColor = bgColor;
            return value || '';
          },
        },
        {
          title: 'Ngày PO',
          field: 'ReceivedDatePO',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100,
        },
        {
          title: 'Sale phụ trách',
          field: 'FullName',
          sorter: 'string',
          width: 150,
        },
        { title: 'Hãng', field: 'Maker', sorter: 'string', width: 100 },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          sorter: 'string',
          width: 120,
        },
        {
          title: 'Mã theo khách',
          field: 'GuestCode',
          sorter: 'string',
          width: 120,
        },
        { title: 'SL PO', field: 'Qty', sorter: 'number', width: 80 },
        {
          title: 'SL đã giao',
          field: 'QuantityDelived',
          sorter: 'number',
          width: 120,
        },
        {
          title: 'SL Pending',
          field: 'QuantityPending',
          sorter: 'number',
          width: 120,
        },
        { title: 'ĐVT', field: 'Unit', sorter: 'string', width: 80 },
        {
          title: 'Đơn giá NET',
          field: 'NetUnitPrice',
          sorter: 'number',
          width: 120,
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
          title: 'Đơn giá (chưa VAT)',
          field: 'UnitPrice',
          sorter: 'number',
          width: 120,
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
          title: 'Tổng giá (chưa VAT)',
          field: 'IntoMoney',
          sorter: 'number',
          width: 120,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        { title: 'VAT(%)', field: 'VAT', sorter: 'number', width: 80 },
        {
          title: 'Tổng tiền (gồm VAT)',
          field: 'TotalPriceIncludeVAT',
          sorter: 'number',
          width: 150,
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
          title: 'Ngày dự kiến giao hàng',
          field: 'DeliveryRequestedDate',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100,
          editor: 'date',
        },
        {
          title: 'Ngày giao hàng thực tế',
          field: 'DateMinutes',
          sorter: 'string',
          width: 120,
        },
        {
          title: 'Ngày thanh toán dự kiến',
          field: 'PayDate',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100,
        },
        {
          title: 'Ngày tiền về',
          field: 'MoneyDate',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100,
        },
        {
          title: 'Công ty',
          field: 'CompanyName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Số hóa đơn ( từ yc xuất)',
          field: 'InvoiceNumberShow',
          sorter: 'string',
          width: 120,
          editor: 'input',
        },
        {
          title: 'Ngày hóa đơn ( từ yêu cầu)',
          field: 'InvoiceDateShow',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100,
          editor: 'date',
        },
        {
          title: 'Số hóa đơn đầu ra',
          field: 'BillNumber',
          sorter: 'string',
          width: 120,
          editor: 'input',
        },
        {
          title: 'Ngày hóa đơn đầu ra',
          field: 'BillDate',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100,
          editor: 'date',
        },
        {
          title: 'Ngày đặt hàng',
          field: 'RequestDate',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100,
        },
        {
          title: 'Ngày hàng về',
          field: 'DateRequestImport',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100,
        },
        {
          title: 'Nhà cung cấp',
          field: 'SupplierName',
          sorter: 'string',
          formatter: 'textarea',
          width: 150,
        },
        {
          title: 'Đầu vào (số hóa đơn/số tờ khai)',
          field: 'SomeBill',
          sorter: 'string',
          width: 120,
        },
        {
          title: 'Ngày dự kiến hàng về',
          field: 'ExpectedDate',
          sorter: 'date',
          formatter: (cell) => {
            const date = cell.getValue();
            return date ? new Date(date).toLocaleDateString('vi-VN') : '';
          },
          width: 100,
        },
        { title: 'PNK', field: 'BillImportCode', sorter: 'string', width: 120 },
        // { title: 'POKHID', field: 'POKHID', sorter: 'number', width: 100 },
        // { title: 'ID', field: 'ID', sorter: 'number', width: 100 },
        // { title: 'ProductID', field: 'ProductID', sorter: 'number', width: 100 },
        // { title: 'CustomerID', field: 'CustomerID', sorter: 'number', width: 100 },
        // { title: 'ProjectID', field: 'ProjectID', sorter: 'number', width: 100 },
        // { title: 'ProductCode', field: 'ProductCode', sorter: 'string', width: 120 },
        // { title: 'ProductName', field: 'ProductName', sorter: 'string', width: 200 },
        // { title: 'Trạng thái', field: 'StatusText', sorter: 'string', width: 150 },
      ],
      rowFormatter: (row) => {
        const data = row.getData();
        const rowEl = row.getElement();

        const wrapper = document.createElement("div");
        wrapper.className = "nested-wrapper";
        wrapper.style.display = "none";
        wrapper.style.margin = "10px 0";
        wrapper.style.padding = "10px";
        wrapper.style.borderTop = "1px solid #ddd";

        const tabs = document.createElement("div");
        tabs.className = "nested-tabs";

        // TAB HEADER
        const tabHeader = document.createElement("div");
        tabHeader.className = "nested-tab-header";

        // TAB CONTENT
        const tabContent = document.createElement("div");
        tabContent.className = "nested-tab-content";

        // CREATE DIVS
        const exportDiv = document.createElement("div");
        exportDiv.id = "export";

        const invoiceDiv = document.createElement("div");
        invoiceDiv.id = "invoice";

        let tabCount = 0;

        // TAB: EXPORT
        if (data['exportDetails']?.length > 0) {
          const btnExport = document.createElement("button");
          btnExport.className = "nested-tab-btn active";
          btnExport.innerHTML = `
            <span style="display: flex; align-items: center; gap: 6px;">
              Xuất kho
            </span>`;
          btnExport.setAttribute("data-tab", "export");
          tabHeader.appendChild(btnExport);
          tabCount++;

          exportDiv.style.display = "block"; // mặc định mở
          const exportTable = new Tabulator(exportDiv, {
            data: data['exportDetails'],
            layout: "fitColumns",
            height: "auto",
            index: "ID",
            columns: [
              {
                title: '',
                formatter: 'rowSelection',
                titleFormatter: 'rowSelection',
                hozAlign: 'center',
                headerSort: false,
                frozen: true,
                width: 40,
                cellClick: (e, cell) => {
                  console.log('Selected Rows:', this.selectedRows);
                },
              },
              { title: 'DetailID', field: 'ID', width: 80, visible: false },
              { title: 'Mã phiếu xuất', field: 'Code', width: 200 },
              { title: 'Tổng số lượng PO', field: 'TotalQty', width: 200 },
              { title: 'Số lượng xuất', field: 'Qty', width: 200 },
            ]
          });
          this.nestedExportTables.set(data['ID'], exportTable);

          // Đồng bộ trạng thái chọn ban đầu
          const selectedExports = data['selectedExports'];
          if (selectedExports && selectedExports.length > 0) {
            const ids = selectedExports.map((x: any) => x.ID);
            exportTable.selectRow(ids);
          } else if (row.isSelected()) {
            exportTable.selectRow();
          }

          exportTable.on("rowSelectionChanged", (selected) => {
            const parent = row.getData();
            parent['selectedExports'] = selected;

            // Logic chọn dòng cha dựa trên dòng con
            if (selected.length > 0) {
              if (!row.isSelected()) {
                this.skipChildUpdate = true;
                row.select();
                this.skipChildUpdate = false;

                // Ensure parent is in selectedRows
                const rowData = row.getData();
                if (!this.selectedRows.some(r => r.ID === rowData['ID'])) {
                  this.selectedRows.push(rowData);
                }
              }
            } else {
              // Nếu bỏ chọn hết dòng con -> bỏ chọn dòng cha
              if (row.isSelected()) {
                this.skipChildUpdate = true;
                row.deselect();
                this.skipChildUpdate = false;

                // Ensure parent is removed from selectedRows
                const rowData = row.getData();
                this.selectedRows = this.selectedRows.filter(r => r.ID !== rowData['ID']);
              }
            }
          });
        }

        // TAB: INVOICE
        if (data['invoiceDetails']?.length > 0) {
          const btnInvoice = document.createElement("button");
          btnInvoice.className = tabCount === 0 ? "nested-tab-btn active" : "nested-tab-btn";
          btnInvoice.innerHTML = `
            <span style="display: flex; align-items: center; gap: 6px;">
              Hóa đơn
            </span>`;
          btnInvoice.setAttribute("data-tab", "invoice");

          if (tabCount > 0) invoiceDiv.style.display = "none";

          tabHeader.appendChild(btnInvoice);
          tabCount++;

          const invoiceTable = new Tabulator(invoiceDiv, {
            data: data['invoiceDetails'],
            layout: "fitColumns",
            height: "auto",
            columns: [
              { title: 'RequestInvoiceID', field: 'RequestInvoiceID', width: 80, visible: false },
              { title: 'POKHDetailID', field: 'POKHDetailID', width: 80, visible: false },
              { title: 'RequestInvoiceDetailID', field: 'RequestInvoiceDetailID', width: 100, visible: false },

              { title: 'Mã lệnh', field: 'RequestInvoiceCode', width: 170 },
              { title: 'Công ty', field: 'TaxCompanyName', width: 120 },
              { title: 'Số hóa đơn', field: 'InvoiceNumber', width: 170, editor: 'input' },
              {
                title: 'Ngày hóa đơn', field: 'InvoiceDate', width: 170, editor: 'date', formatter: (cell: any) => {
                  const value = cell.getValue();
                  if (!value) return '';
                  const date = new Date(value);
                  if (isNaN(date.getTime())) return value;
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const year = date.getFullYear();
                  return `${day}/${month}/${year}`;
                }
              },

            ]
          });

          invoiceTable.on("cellEdited", (cell) => {
            const rowData = cell.getRow().getData();
            this.modifiedInvoiceRows.add(rowData["RequestInvoiceDetailID"]);
          });
        }

        // ẨN TAB HEADER NẾU CHỈ CÓ 1 TAB
        if (tabCount <= 1) {
          tabHeader.style.display = "none";
        }

        // ADD CONTENT
        if (tabCount > 0) {
          tabContent.appendChild(exportDiv);
          tabContent.appendChild(invoiceDiv);
          tabs.appendChild(tabHeader);
          tabs.appendChild(tabContent);
          wrapper.appendChild(tabs);
          rowEl.appendChild(wrapper);
        }

        // TAB SWITCH LOGIC
        tabHeader.querySelectorAll(".nested-tab-btn").forEach(btn => {
          btn.addEventListener("click", (e: any) => {
            e.stopPropagation();
            e.preventDefault();

            tabHeader.querySelectorAll(".nested-tab-btn")
              .forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const tab = btn.getAttribute("data-tab");
            exportDiv.style.display = tab === "export" ? "block" : "none";
            invoiceDiv.style.display = tab === "invoice" ? "block" : "none";
          });
        });
      }


    });

    this.viewPOKH.on('rowSelected', (row) => {
      if (this.skipChildUpdate) return;

      const rowData = row.getData();

      const nestedTable = this.nestedExportTables.get(rowData['ID']);
      if (nestedTable) {
        nestedTable.selectRow();
      } else if (rowData['exportDetails']?.length > 0) {
        rowData['selectedExports'] = [...rowData['exportDetails']];
      }
    });

    this.viewPOKH.on('rowDeselected', (row) => {
      if (this.skipChildUpdate) return;

      const rowData = row.getData();

      const nestedTable = this.nestedExportTables.get(rowData['ID']);
      if (nestedTable) {
        nestedTable.deselectRow();
      }

      rowData['selectedExports'] = [];
    });
  }
  //#endregion
}
