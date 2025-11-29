import { Component, OnInit, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DEFAULT_TABLE_CONFIG } from '../../../../../../../../tabulator-default.config';
import { ProjectPartListService } from '../../../project-partlist-service/project-part-list-service.service';

@Component({
  selector: 'app-import-excel-save',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzModalModule],
  templateUrl: './import-excel-save.component.html',
  styleUrl: './import-excel-save.component.css'
})
export class ImportExcelSaveComponent implements OnInit, AfterViewInit {
  @Input() dataDiff: any[] = [];
  
  @ViewChild('partlistTableSave', { static: false }) partlistTableSaveContainer!: ElementRef;
  tableSave: any;
  isLoading: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private partlistService: ProjectPartListService,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.initSaveTable();
    }, 100);
  }

  // Hàm khởi tạo bảng save với style giống Excel
  initSaveTable() {
    // Xóa bảng cũ nếu có
    if (this.tableSave) {
      this.tableSave.destroy();
      this.tableSave = null;
    }

    const container = this.partlistTableSaveContainer?.nativeElement;
    if (!container) {
      console.error('Container partlistTableSave not found');
      return;
    }

    // Khởi tạo bảng Tabulator
    this.tableSave = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.dataDiff,
      layout: 'fitDataStretch',
      height: '50vh',
      selectableRows: true,
      movableColumns: false,
      columns: [
        {
          title: "Tích xanh",
          field: "IsFix",
          headerHozAlign: "center",
          hozAlign: "center",
          frozen: true,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
          }
        },
        {
          title: "Mã thiết bị",
          field: "ProductCode",
          headerHozAlign: "center",
          hozAlign: "center",
          frozen: true,
          editor: "input",
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const value = cell.getValue() || rowData.ProductCode || '';
            const cellElement = cell.getElement();
            cellElement.style.border = '1px solid #d0d7e5';
            cellElement.style.padding = '4px 6px';
            cellElement.style.fontSize = '12px';
            cellElement.style.fontFamily = 'Arial, sans-serif';
            cellElement.style.fontWeight = 'bold';
            
            // Kiểm tra IsSameProductCode, nếu = 0 thì bôi màu hồng
            const isSameProductCode = parseInt(rowData.IsSameProductCode) || 0;
            if (isSameProductCode === 0) {
              cellElement.style.backgroundColor = '#FFC0CB'; // Pink
            } else {
              cellElement.style.backgroundColor = '#fff3cd';
            }
            return value;
          }
        },
        {
          title: "Tên vật tư (Excel)",
          field: "GroupMaterial",
          headerHozAlign: "center",
          hozAlign: "left",
          editor: "input",
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const value = cell.getValue() || '';
            const cellElement = cell.getElement();
           
            // Kiểm tra IsSameProductName, nếu = 0 thì bôi màu hồng
            const isSameProductName = parseInt(rowData.IsSameProductName) || 0;
            if (isSameProductName === 0) {
              cellElement.style.backgroundColor = '#FFC0CB'; // Pink
            } else {
              cellElement.style.backgroundColor = '';
            }
            return value;
          }
        },
        {
          title: "Tên vật tư (Kho)",
          field: "GroupMaterialStock",
          headerHozAlign: "center",
          hozAlign: "left",
          editor: "input",
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const value = cell.getValue() || '';
            const cellElement = cell.getElement();
          
            // Kiểm tra IsSameProductName, nếu = 0 thì bôi màu hồng
            const isSameProductName = parseInt(rowData.IsSameProductName) || 0;
            if (isSameProductName === 0) {
              cellElement.style.backgroundColor = '#FFC0CB'; // Pink
            } else {
              cellElement.style.backgroundColor = '';
            }
            return value;
          }
        },
        {
          title: "Hãng (Excel)",
          field: "Manufacturer",
          headerHozAlign: "center",
          hozAlign: "left",
          editor: "input",
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const value = cell.getValue() || '';
            const cellElement = cell.getElement();
          
            // Kiểm tra IsSameMaker, nếu = 0 thì bôi màu hồng
            const isSameMaker = parseInt(rowData.IsSameMaker) || 0;
            if (isSameMaker === 0) {
              cellElement.style.backgroundColor = '#FFC0CB'; // Pink
            } else {
              cellElement.style.backgroundColor = '';
            }
            return value;
          }
        },
        {
          title: "Hãng (Kho)",
          field: "ManufacturerStock",
          headerHozAlign: "center",
          hozAlign: "left",
          editor: "input",
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const value = cell.getValue() || '';
            const cellElement = cell.getElement();
        
            // Kiểm tra IsSameMaker, nếu = 0 thì bôi màu hồng
            const isSameMaker = parseInt(rowData.IsSameMaker) || 0;
            if (isSameMaker === 0) {
              cellElement.style.backgroundColor = '#FFC0CB'; // Pink
            } else {
              cellElement.style.backgroundColor = '';
            }
            return value;
          }
        },
        {
          title: "Đơn vị (Excel)",
          field: "Unit",
          headerHozAlign: "center",
          hozAlign: "center",
          editor: "input",
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const value = cell.getValue() || '';
            const cellElement = cell.getElement();
          
            // Kiểm tra IsSameUnit, nếu = 0 thì bôi màu hồng
            const isSameUnit = parseInt(rowData.IsSameUnit) || 0;
            if (isSameUnit === 0) {
              cellElement.style.backgroundColor = '#FFC0CB'; // Pink
            } else {
              cellElement.style.backgroundColor = '';
            }
            return value;
          }
        },
        {
          title: "Đơn vị (Kho)",
          field: "UnitStock",
          headerHozAlign: "center",
          hozAlign: "center",
          editor: "input",
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const value = cell.getValue() || '';
            const cellElement = cell.getElement();
          
            // Kiểm tra IsSameUnit, nếu = 0 thì bôi màu hồng
            const isSameUnit = parseInt(rowData.IsSameUnit) || 0;
            if (isSameUnit === 0) {
              cellElement.style.backgroundColor = '#FFC0CB'; // Pink
            } else {
              cellElement.style.backgroundColor = '';
            }
            return value;
          }
        },
        {
          title: "IsSameProductCode",
          field: "IsSameProductCode",
          headerHozAlign: "center",
          hozAlign: "center",
          visible: false,
        },
        {
          title: "IsSameProductName",
          field: "IsSameProductName",
          visible: false,
          headerHozAlign: "center",
        },
        {
          title: "IsSameMaker",
          field: "IsSameMaker",
          headerHozAlign: "center",
          visible: false,
        },
        {
          title: "IsSameUnit",
          field: "IsSameUnit",
          headerHozAlign: "center",
          visible: false,
        },
      ] as any,
      // Style row - chỉ áp dụng cho các cột không có formatter riêng
      rowFormatter: (row: any) => {
        const cells = row.getCells();
        cells.forEach((cell: any) => {
          const cellElement = cell.getElement();
          const column = cell.getColumn();
          const field = column.getField();
          
          // Bỏ qua các cột đã có formatter riêng
          if (['ProductCode', 'GroupMaterial', 'GroupMaterialStock', 'Manufacturer', 'ManufacturerStock', 'UnitPartlist', 'UnitStock'].includes(field)) {
            return;
          }
          
          // Áp dụng style mặc định cho các cột còn lại
          if (!cellElement.style.backgroundColor) {
            cellElement.style.border = '1px solid #d0d7e5';
            cellElement.style.padding = '4px 6px';
            cellElement.style.fontSize = '12px';
            cellElement.style.fontFamily = 'Arial, sans-serif';
          }
        });
      }
    });

    // Style header giống Excel sau khi bảng được build
  }

  // Lấy các dòng được chọn từ bảng
  getSelectedRows(): any[] {
    if (!this.tableSave) {
      return [];
    }
    return this.tableSave.getSelectedRows().map((row: any) => row.getData());
  }

  // Tạo payload theo format DataDiffSaveDTO
  createPayload(selectedRows: any[]): any[] {
    return selectedRows.map((row: any) => ({
      ID: row.ID || row.id || 0,
      // Theo Partlist
      Maker: row.Manufacturer || '',
      Unit: row.Unit || '',
      ProductName: row.GroupMaterial || '',
      // Theo kho (Stock)
      MakerStock: row.ManufacturerStock || '',
      UnitStock: row.UnitStock || '',
      ProductNameStock: row.GroupMaterialStock || ''
    }));
  }

  // Cập nhật theo Partlist (status = 1)
  onSaveByPartlist() {
    const selectedRows = this.getSelectedRows();
    
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn ít nhất một dòng để cập nhật!');
      return;
    }

    // Hiển thị modal xác nhận
    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc chắn muốn cập nhật ${selectedRows.length} bản ghi theo Partlist không?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.executeSaveByPartlist(selectedRows);
      }
    });
  }

  // Thực hiện lưu theo Partlist
  executeSaveByPartlist(selectedRows: any[]) {
    const payload = this.createPayload(selectedRows);
    this.isLoading = true;

    this.partlistService.saveImport(payload, 1).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 1 || res.success) {
          this.notification.success('Thành công', res.message || `Đã cập nhật ${selectedRows.length} bản ghi theo Partlist thành công!`);
          // Reload lại bảng thay vì đóng modal
          this.reloadTable();
        } else {
          this.notification.error('Lỗi', res.message || 'Cập nhật thất bại!');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Lỗi khi cập nhật theo Partlist:', err);
        const msg = err.error?.message || err.message || 'Lỗi kết nối server khi cập nhật dữ liệu!';
        this.notification.error('Lỗi', msg);
      }
    });
  }

  // Cập nhật theo Kho (status = 2)
  onSaveByStock() {
    const selectedRows = this.getSelectedRows();
    
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn ít nhất một dòng để cập nhật!');
      return;
    }

    // Hiển thị modal xác nhận
    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc chắn muốn cập nhật ${selectedRows.length} bản ghi theo Kho không?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.executeSaveByStock(selectedRows);
      }
    });
  }

  // Thực hiện lưu theo Kho
  executeSaveByStock(selectedRows: any[]) {
    const payload = this.createPayload(selectedRows);
    this.isLoading = true;
    this.partlistService.saveImport(payload, 2).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 1 || res.success) {
          this.notification.success('Thành công', res.message || `Đã cập nhật ${selectedRows.length} bản ghi theo Kho thành công!`);
          // Reload lại bảng thay vì đóng modal
          this.reloadTable();
        } else {
          this.notification.error('Lỗi', res.message || 'Cập nhật thất bại!');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Lỗi khi cập nhật theo Kho:', err);
        const msg = err.error?.message || err.message || 'Lỗi kết nối server khi cập nhật dữ liệu!';
        this.notification.error('Lỗi', msg);
      }
    });
  }

  // Reload lại bảng sau khi cập nhật thành công
  reloadTable() {
    // Lấy các dòng đã được chọn (ID)
    const selectedRows = this.getSelectedRows();
    const selectedIds = selectedRows.map(row => row.ID || row.id).filter(id => id);

    // Xóa các dòng đã cập nhật khỏi dataDiff
    if (selectedIds.length > 0) {
      this.dataDiff = this.dataDiff.filter((row: any) => {
        const rowId = row.ID || row.id;
        return !selectedIds.includes(rowId);
      });
    }

    // Reload lại bảng với dữ liệu mới
    if (this.tableSave) {
      this.tableSave.setData(this.dataDiff);
    }

    // Nếu không còn dữ liệu diff nào, đóng modal và truyền kết quả để reload bảng partlist
    if (!this.dataDiff || this.dataDiff.length === 0) {
      setTimeout(() => {
        this.activeModal.close({ success: true, reloadPartlist: true, dataDiff: this.dataDiff });
      }, 500);
    }
  }

  onClose() {
    this.activeModal.dismiss();
  }
}
