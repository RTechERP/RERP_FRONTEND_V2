import { Component, OnInit, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DEFAULT_TABLE_CONFIG } from '../../../../../../../../tabulator-default.config';

@Component({
  selector: 'app-import-excel-diff',
  standalone: true,
  imports: [CommonModule, NzButtonModule],
  templateUrl: './import-excel-diff.component.html',
  styleUrl: './import-excel-diff.component.css'
})
export class ImportExcelDiffComponent implements OnInit, AfterViewInit {
  @Input() diffs: any[] = [];
  
  @ViewChild('partlistTableDiff', { static: false }) partlistTableDiffContainer!: ElementRef;
  tableDiff: any;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.initDiffTable();
    }, 100);
  }

  // Hàm khởi tạo bảng diff với style giống Excel
  initDiffTable() {
    // Xóa bảng cũ nếu có
    if (this.tableDiff) {
      this.tableDiff.destroy();
      this.tableDiff = null;
    }

    const container = this.partlistTableDiffContainer?.nativeElement;
    if (!container) {
      console.error('Container partlistTableDiff not found');
      return;
    }

    // Định nghĩa các cột cho bảng diff 

    // Khởi tạo bảng Tabulator
    this.tableDiff = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.diffs,
      layout: 'fitDataStretch',
      height: '50vh',
      selectableRows: false,
      movableColumns: false,
      pagination: true,
      paginationMode: 'local',
      rowHeader:false,
      columns: [
        {
          title: "Mã thiết bị",
          field: "ProductCode",
          headerHozAlign: "center",
          hozAlign: "center",
       width: 150,
          frozen: true,
          formatter: (cell: any) => {
            const value = cell.getValue() || cell.getRow().getData().ProductCode || '';
            const cellElement = cell.getElement();
            cellElement.style.border = '1px solid #d0d7e5';
            cellElement.style.padding = '4px 6px';
            cellElement.style.fontSize = '12px';
            cellElement.style.fontFamily = 'Arial, sans-serif';
            cellElement.style.backgroundColor = '#fff3cd';
            cellElement.style.fontWeight = 'bold';
            return value;
          }
        },
        {
          title: "Tên vật tư (Excel)",
          field: "GroupMaterialPartlist",
          headerHozAlign: "center",
          hozAlign: "left",
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const value = cell.getValue() || '';
            const cellElement = cell.getElement();
            cellElement.style.border = '1px solid #d0d7e5';
            cellElement.style.padding = '4px 6px';
            cellElement.style.fontSize = '12px';
            cellElement.style.fontFamily = 'Arial, sans-serif';
            
            // So sánh với GroupMaterialStock, nếu khác nhau thì bôi màu hồng
            const partlistName = String(value || '').trim();
            const stockName = String(rowData.GroupMaterialStock || '').trim();
            if (partlistName.toLowerCase() !== stockName.toLowerCase()) {
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
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const value = cell.getValue() || '';
            const cellElement = cell.getElement();
            cellElement.style.border = '1px solid #d0d7e5';
            cellElement.style.padding = '4px 6px';
            cellElement.style.fontSize = '12px';
            cellElement.style.fontFamily = 'Arial, sans-serif';
            
            // So sánh với GroupMaterialPartlist, nếu khác nhau thì bôi màu hồng
            const stockName = String(value || '').trim();
            const partlistName = String(rowData.GroupMaterialPartlist || '').trim();
            if (partlistName.toLowerCase() !== stockName.toLowerCase()) {
              cellElement.style.backgroundColor = '#FFC0CB'; // Pink
            } else {
              cellElement.style.backgroundColor = '';
            }
            return value;
          }
        },
        {
          title: "Hãng (Excel)",
          field: "ManufacturerPartlist",
          headerHozAlign: "center",
          hozAlign: "left",
          width: 150,
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const value = cell.getValue() || '';
            const cellElement = cell.getElement();
            cellElement.style.border = '1px solid #d0d7e5';
            cellElement.style.padding = '4px 6px';
            cellElement.style.fontSize = '12px';
            cellElement.style.fontFamily = 'Arial, sans-serif';
            
            // So sánh với ManufacturerStock, nếu khác nhau thì bôi màu hồng
            const partlistMaker = String(value || '').trim();
            const stockMaker = String(rowData.ManufacturerStock || '').trim();
            if (partlistMaker.toLowerCase() !== stockMaker.toLowerCase()) {
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
          width: 150,
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const value = cell.getValue() || '';
            const cellElement = cell.getElement();
            cellElement.style.border = '1px solid #d0d7e5';
            cellElement.style.padding = '4px 6px';
            cellElement.style.fontSize = '12px';
            cellElement.style.fontFamily = 'Arial, sans-serif';
            
            // So sánh với ManufacturerPartlist, nếu khác nhau thì bôi màu hồng
            const stockMaker = String(value || '').trim();
            const partlistMaker = String(rowData.ManufacturerPartlist || '').trim();
            if (partlistMaker.toLowerCase() !== stockMaker.toLowerCase()) {
              cellElement.style.backgroundColor = '#FFC0CB'; // Pink
            } else {
              cellElement.style.backgroundColor = '';
            }
            return value;
          }
        },
        {
          title: "Đơn vị (Excel)",
          field: "UnitPartlist",
          headerHozAlign: "center",
          hozAlign: "center",
          width: 150,
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const value = cell.getValue() || '';
            const cellElement = cell.getElement();
            cellElement.style.border = '1px solid #d0d7e5';
            cellElement.style.padding = '4px 6px';
            cellElement.style.fontSize = '12px';
            cellElement.style.fontFamily = 'Arial, sans-serif';
            
            // So sánh với UnitStock, nếu khác nhau thì bôi màu hồng
            const partlistUnit = String(value || '').trim();
            const stockUnit = String(rowData.UnitStock || '').trim();
            if (partlistUnit.toLowerCase() !== stockUnit.toLowerCase()) {
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
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const value = cell.getValue() || '';
            const cellElement = cell.getElement();
            cellElement.style.border = '1px solid #d0d7e5';
            cellElement.style.padding = '4px 6px';
            cellElement.style.fontSize = '12px';
            cellElement.style.fontFamily = 'Arial, sans-serif';
            
            // So sánh với UnitPartlist, nếu khác nhau thì bôi màu hồng
            const stockUnit = String(value || '').trim();
            const partlistUnit = String(rowData.UnitPartlist || '').trim();
            if (partlistUnit.toLowerCase() !== stockUnit.toLowerCase()) {
              cellElement.style.backgroundColor = '#FFC0CB'; // Pink
            } else {
              cellElement.style.backgroundColor = '';
            }
            return value;
          }
        }
      ] as any,
      // Style row - chỉ áp dụng cho các cột không có formatter riêng
      rowFormatter: (row: any) => {
        const cells = row.getCells();
        cells.forEach((cell: any) => {
          const cellElement = cell.getElement();
          const column = cell.getColumn();
          const field = column.getField();
          
          // Bỏ qua các cột đã có formatter riêng
          if (['ProductCode', 'GroupMaterialPartlist', 'GroupMaterialStock', 'ManufacturerPartlist', 'ManufacturerStock', 'UnitPartlist', 'UnitStock'].includes(field)) {
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
    this.tableDiff.on('tableBuilt', () => {
      const headerCells = container.querySelectorAll('.tabulator-col');
      headerCells.forEach((cell: any) => {
        cell.style.backgroundColor = '#4472C4';
        cell.style.color = '#ffffff';
        cell.style.fontWeight = 'bold';
        cell.style.border = '1px solid #2F5597';
        cell.style.padding = '6px 8px';
        cell.style.fontSize = '12px';
        cell.style.textAlign = 'center';
      });
    });
  }

  onSave() {
    // Xử lý khi click nút Lưu
    this.activeModal.close(true);
  }

  onClose() {
    this.activeModal.dismiss();
  }
}
