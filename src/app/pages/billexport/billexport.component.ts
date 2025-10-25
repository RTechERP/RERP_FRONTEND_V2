import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ProjectService } from '../project/project-service/project.service';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { DateTime } from 'luxon';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { CellComponent } from 'tabulator-tables';
import { BillexportBuildComponent } from '../billexport-build/billexport-build.component';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzMessageService } from 'ng-zorro-antd/message';
@Component({
  selector: 'app-billexport',
  templateUrl: './billexport.component.html',
  styleUrls: ['./billexport.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzSelectModule,
    NzInputModule,
    NzSplitterModule,
    NzFormModule,
    NzModalModule,
    NgbModule,
  ],
})
export class BillexportComponent implements OnInit {
    billExportData: any[] = [];
    billExportDetailData: any[] = [];
    billExportTable: Tabulator | null = null;
    billExportDetailTable: Tabulator | null = null;

    keyword: string = '';
    sizeSearch: string = '0%';
    dateStart: string | null = null;
    dateEnd: string | null = null;
    statusFilter: number | string = ''; 
    mainTableSize: number | string = '100%';
    detailTableSize: number | string = '40%';
    showDetailTable: boolean = false;
    status: string = "-1"; 
    filterText: string = '';
    warehouseId: number = 2;
    pageNumber: number = 1;
    pageSize: number = 30;
    statusOptions = [
      { value: "-1", label: "Tất cả" },    
      { value: "1", label: "Đã duyệt" },
      { value: "0", label: "Chưa duyệt" },
    ];
  constructor(
    private notification: NzNotificationService,
    private projectService: ProjectService,
    private nzModal: NzModalService,
    private modalService: NgbModal,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }
  ngOnDestroy(): void {
  this.modalService.dismissAll();
  }
  toggleSearchPanel(): void {
    this.sizeSearch = this.sizeSearch === '0%' ? '22%' : '0%';
  }
  setDefautSearch(): void {
    this.dateStart = DateTime.local().startOf('day').toISO();
    this.dateEnd = DateTime.local().endOf('day').toISO();
    this.keyword = '';
    this.statusFilter = '';
  }
  searchProjects(): void {
    const params = this.getProjectAjaxParams();
    this.projectService.getBillExport(params).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.billExportData = Array.isArray(res.billExportTechnical)
            ? res.billExportTechnical
            : [];
        } else {
          this.billExportData = [];
          this.notification.error('Lỗi', res?.message || 'Không thể tải dữ liệu');
        }
        this.updateTableData();
      },
      error: (err) => {
        console.error('Lỗi khi tìm kiếm:', err);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu phiếu xuất');
      },
    });
  }

  loadData(): void {
  const params = this.getProjectAjaxParams();
  this.projectService.getBillExport(params).subscribe({
    next: (res: any) => {
      if (res?.status === 1) {
        this.billExportData = Array.isArray(res.billExportTechnical)
          ? res.billExportTechnical
          : [];
      } else {
        this.billExportData = [];
        this.notification.error('Lỗi', res?.message || 'Không thể tải dữ liệu');
      }
      this.updateTableData();
    },
    error: (err) => {
      console.error('Lỗi khi tải dữ liệu:', err);
      this.notification.error('Lỗi', 'Không thể tải danh sách phiếu xuất');
      this.billExportData = [];
      this.updateTableData();
    }
  });
}

private updateTableData(): void {
  if (this.billExportTable) {
    this.billExportTable.setData(this.billExportData);
  } else {
    this.drawBillExportTable();
  }
  
  // Reset bảng chi tiết
  if (this.billExportDetailTable) {
    this.billExportDetailTable.clearData();
  }
  this.showDetailTable = false;
  this.mainTableSize = '100%';
}

  drawBillExportTable(): void {
    const tableElement = document.getElementById('billExportTable');
    if (!tableElement) return;

    this.billExportTable = new Tabulator(tableElement, {
      height: '100%',
      layout: 'fitDataStretch',
      locale: 'vi',
      selectableRows: true,
      selectableRowsPersistence: false,
      pagination: 'local',
      paginationSize: 30,
      paginationSizeSelector: [5, 10, 20, 50, 100],
      placeholder: 'Không có dữ liệu',
      columns: [
        { title: '', formatter: 'rowSelection', titleFormatter: 'rowSelection', hozAlign: 'center', headerSort: false, width: 50,cellClick: (e: any, cell: any) => {e.stopPropagation();} },
        { title: 'ID', field: 'ID', headerHozAlign: 'center' },
        { title: 'Nhận chứng từ', field: 'Status', headerHozAlign: 'center',formatter: (cell:CellComponent) => {
      const status = cell.getValue();
      return status === 1 ? 'Đã duyệt' : 'Chưa duyệt';
    } },
        { title: 'Ngày nhận', field: 'DateStatus', headerHozAlign: 'center',formatter: (cell: CellComponent) => {
          const date = new Date(cell.getValue());
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`; 
        }},
        { title: 'Loại phiếu', field: 'BillTypeText', headerHozAlign: 'center' },
        { title: 'Mã phiếu', field: 'Code', headerHozAlign: 'center' },
        { title: 'Tên dự án', field: 'ProjectName', headerHozAlign: 'center' },
        { title: 'Nhà cung cấp', field: 'NameNCC', headerHozAlign: 'center' },
        { title: 'Tên khách hàng', field: 'CustomerName', headerHozAlign: 'center' },
        { title: 'Người giao', field: 'Deliver', headerHozAlign: 'center' },
        { title: 'Người nhận', field: 'Receiver', headerHozAlign: 'center' },
        { title: 'Mã nhân viên', field: 'EmployeeCode', headerHozAlign: 'center' },
        { title: 'Phòng ban', field: 'DepartmentName', headerHozAlign: 'center' },
        { title: 'Ngày tạo', field: 'CreatedDate', headerHozAlign: 'center',formatter: (cell: CellComponent) => {
          const date = new Date(cell.getValue());
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }},
        { title: 'Ngày cập nhật', field: 'UpdatedDate', headerHozAlign: 'center',formatter: (cell: CellComponent) => {
          const date = new Date(cell.getValue());
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }},
        
        { title: 'Địa chỉ', field: 'Addres', headerHozAlign: 'center' }
      ],
      data: this.billExportData
    } as any);

    const selectedBillExportIDs = new Set<number>();

    // Listen for row selection
    this.billExportTable.on('rowSelected', (row: any) => {
      this.billExportDetailTable?.clearData();
      const id = row.getData().ID;
      selectedBillExportIDs.add(id);
        this.loadBillExportDetail(id);

      console.log('Selected bill export IDs:', selectedBillExportIDs);
    });

    // Listen for row deselection
    this.billExportTable.on('rowDeselected', (row: any) => {
      const id = row.getData().ID;
      selectedBillExportIDs.delete(id);
      console.log('Selected bill export IDs:', selectedBillExportIDs);
    });

    // Handle row click (non-checkbox)
    this.billExportTable.on('rowClick', (e: any, row: any) => {
      const clickedField = e.target.closest('.tabulator-cell')?.getAttribute('tabulator-field');
      
      // If not clicking on checkbox column
      if (clickedField !== 'select') {
        // Deselect all and select current row
        this.billExportTable?.deselectRow();
        row.select();
        
        // Load detail for the selected row
        const billId = row.getData()['ID'];
      }
    });
  }
  drawBillExportDetailTable(): void {
    const tableElement = document.getElementById('billExportDetailTable');
    if (!tableElement) return;

    this.billExportDetailTable = new Tabulator(tableElement, {
      height: '100%',
      layout: 'fitDataStretch',
      locale: 'vi',
      selectableRows: true,
      columns: [
        { title: 'Mã QRCode', field: 'ProductRTCQRCodeID', headerHozAlign: 'center' },
        { title: 'Mã sản phẩm', field: 'ProductCode', headerHozAlign: 'center' },
        { title: 'Mã nội bộ', field: 'ProductCodeRTC', headerHozAlign: 'center' },
        { title: 'Tên sản phẩm', field: 'ProductName', headerHozAlign: 'center' },
        { title: 'Số lượng', field: 'Quantity', headerHozAlign: 'center' },
        { title: 'DVT', field: 'UnitName', headerHozAlign: 'center' },
        { title: 'Tình trạng hàng', field: 'WarehouseType', headerHozAlign: 'center' },
        { title: 'Hãng', field: 'Maker', headerHozAlign: 'center' },
        { title: 'Ghi chú', field: 'Note', headerHozAlign: 'center' }
      ],
      data: this.billExportDetailData
    });
    console.log('billExportDetailData:', this.billExportDetailData);
  }

  loadBillExportDetail(billId: number): void {
  this.projectService.getBillById(billId.toString()).subscribe((res: any) => {
     console.log('API response:', res);
    //this.billExportDetailData = Array.isArray(res) ? res : [];
    this.billExportDetailData = res.billDetail ? res.billDetail : [];
    this.showDetailTable = true;
    this.mainTableSize = '60%';
    this.detailTableSize = '40%';

    if (this.billExportDetailTable) {
      this.billExportDetailTable.setData(this.billExportDetailData);
    } else {
      this.drawBillExportDetailTable();
    }
  });
}


  hideDetailTable(): void {
    this.showDetailTable = false;
    this.mainTableSize = '100%';  
  }

  getSelectedRows(): void {
    if (this.billExportTable) {
      const selectedData = this.billExportTable.getSelectedData();
      console.log('Dữ liệu các dòng đã chọn:', selectedData);
    }
  }

  // Sửa phương thức onAdd()
onAdd(): void {
  const modalRef = this.modalService.open(BillexportBuildComponent, {
    centered: true,
    size: 'xl',
    backdrop: 'static',
    keyboard: false,
  });

  const instance = modalRef.componentInstance;

  // Sửa phần xử lý sự kiện saved
  instance.saved.subscribe((event: { mode: 'add' | 'edit', data: any }) => {
    this.notification.success('Thành công', event.mode === 'add' ? 'Thêm mới thành công' : 'Cập nhật thành công');
    
    // Load lại dữ liệu từ server thay vì thủ công
    this.loadData();
    
    // Đóng modal
    modalRef.close();
  });

  // Xử lý khi modal bị đóng
  modalRef.result.then(() => {
    console.log('Modal closed');
  }).catch(() => {
    console.log('Modal dismissed');
  });
}

// Sửa phương thức onEdit()
onEdit(): void {
  const selected = this.billExportTable?.getSelectedData();

  if (!selected || selected.length === 0) {
    this.notification.warning('Thông báo', 'Vui lòng chọn một phiếu để sửa!');
    return;
  }

  if (selected.length > 1) {
    this.notification.warning('Thông báo', 'Chỉ được chọn một phiếu để sửa!');
    return;
  }

  const selectedBill = selected[0];

  // Mở modal trước, load dữ liệu sau
  const modalRef = this.modalService.open(BillexportBuildComponent, {
    size: 'xl',
    backdrop: 'static',
    keyboard: false,
    centered: true,
  });

  const instance = modalRef.componentInstance;
  instance.mode = 'edit';
  instance.billData = { ...selectedBill };

  // Load dữ liệu chi tiết
  this.projectService.getBillById(selectedBill.ID.toString()).subscribe({
    next: (res: any) => {
      instance.billData = {
        ...selectedBill,
        products: res.billDetail || []
      };
    },
    error: (err) => {
      console.error('Lỗi khi load chi tiết:', err);
      instance.billData.products = [];
    }
  });

  // Xử lý sự kiện saved
  instance.saved.subscribe((event: { mode: 'add' | 'edit', data: any }) => {
    this.notification.success('Thành công', 'Cập nhật phiếu thành công');
    
    // Load lại dữ liệu từ server
    this.loadData();
    
    // Đóng modal
    modalRef.close();
  });

  modalRef.result.then(() => {
    console.log('Modal closed');
  }).catch(() => {
    console.log('Modal dismissed');
  });
}

  getProjectAjaxParams(): any {
  return {
    page: this.pageNumber || 1,
    size: this.pageSize || 30,
    dateStart: this.dateStart ?? "2000-01-01",
    dateEnd: this.dateEnd ?? "2100-01-01",
    status: this.status !== undefined ? String(this.status) : "-1", 
    filterText: this.filterText || "",
    warehouseID: this.warehouseId ?? 2
  };
}
  onDelete(): void {
  const selected = this.billExportTable?.getSelectedData();

  if (!selected || selected.length === 0) {
    this.notification.warning('Thông báo', 'Vui lòng chọn một phiếu để xóa!');
    return;
  }

  if (selected.length > 1) {
    this.notification.warning('Thông báo', 'Chỉ được chọn một phiếu để xóa!');
    return;
  }

  const bill = selected[0];
  const payload = {
    billExportTechnical: {
      ID: bill.ID,
      IsDeleted: true
    }
  };

  this.projectService.saveOrUpdateBillExpost(payload).subscribe({
    next: (res) => {
      this.notification.success('Thành công', 'Xóa phiếu thành công');
      this.loadData(); 
    },
    error: (err) => {
      console.error('Lỗi khi xóa mềm:', err);
      this.notification.error('Lỗi', 'Không thể xóa phiếu xuất');
    }
  });
}


}