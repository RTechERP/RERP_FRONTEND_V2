import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { InventoryStockService } from '../inventory-stock.service';
import * as XLSX from 'xlsx';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

@Component({
  selector: 'app-inventory-stock-import-excel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzProgressModule,
    NzIconModule
  ],
  templateUrl: './inventory-stock-import-excel.component.html',
  styleUrl: './inventory-stock-import-excel.component.css'
})
export class InventoryStockImportExcelComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() warehouseId: number = 0;

  @ViewChild('PreviewTable') tableRef!: ElementRef;
  table: Tabulator | null = null;
  private isTableBuilt = false;

  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  previewData: any[] = [];
  parsedWorkbook: XLSX.WorkBook | null = null;

  displayProgress: number = 0;
  displayText: string = '0/0';
  isReadingFile: boolean = false;
  isSavingData: boolean = false;

  get isBusy(): boolean {
    return this.isReadingFile || this.isSavingData;
  }

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private inventoryStockService: InventoryStockService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['warehouseId']) {
      // Re-draw or handle change if necessary
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.drawTable();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.table) {
      this.table.destroy();
      this.table = null;
    }
  }

  private drawTable(): void {
    if (!this.tableRef || !this.tableRef.nativeElement) return;
    if (this.table) {
      this.table.destroy();
    }

    this.table = new Tabulator(this.tableRef.nativeElement, {
      data: this.previewData,
      ...DEFAULT_TABLE_CONFIG,
      pagination: true,
      paginationSize: 50,
      paginationSizeSelector: false as any,
      paginationMode: 'local',
      layout: 'fitColumns',
      height: '450px',
      columns: [
        {
          title: '',
          field: 'delete',
          width: 40,
          hozAlign: 'center',
          headerSort: false,
          resizable: false,
          titleFormatter: () => {
            return `<span class="text-success cursor-pointer" style="font-size: 1.1rem;"><i class="fa-solid fa-plus"></i></span>`;
          },
          formatter: () => {
            return `<span class="text-danger cursor-pointer" style="font-size: 1.1rem;"><i class="fa-solid fa-trash"></i></span>`;
          },
          cellClick: (e: any, cell: any) => {
            cell.getRow().delete();
            this.updateSTT();
          },
          headerClick: (e: any, column: any) => {
            this.addRow();
          }
        },
        {
          title: 'STT', field: 'stt', width: 60, hozAlign: 'center', headerHozAlign: 'center', resizable: false
        },
        {
          title: 'Mã sản phẩm', field: 'ProductSaleCode', hozAlign: 'left', headerHozAlign: 'center',
          editor: 'input', formatter: 'textarea'
        },
        {
          title: 'Tên sản phẩm', field: 'ProductSaleName', hozAlign: 'left', headerHozAlign: 'center',
          editor: 'input', formatter: 'textarea'
        },
        {
          title: 'Số lượng', field: 'Quantity', hozAlign: 'right', headerHozAlign: 'center',
          editor: 'input',
          formatter: (cell: any) => {
            const val = cell.getValue();
            return val !== null && val !== undefined ? Number(val).toLocaleString('en-US') : '';
          }
        },
        {
          title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center',
          editor: 'input', formatter: 'textarea'
        }
      ],
    });

    this.table.on('tableBuilt', () => {
      this.isTableBuilt = true;
    });

    this.table.on('dataChanged', (data: any[]) => {
      this.previewData = data;
    });

    this.table.on('cellEdited', (cell: any) => {
      const row = cell.getRow();
      row.getElement().classList.remove('row-error');
      row.getCells().forEach((c: any) => {
        c.getElement().classList.remove('row-error');
      });
    });
  }

  updateSTT(): void {
    if (!this.table) return;
    const rows = this.table.getRows();
    rows.forEach((row, index) => {
      row.update({ stt: index + 1 });
    });
    this.previewData = this.table.getData();
  }

  formatProgressText = (percent: number): string => {
    return this.displayText;
  };

  closeExcelModal(): void {
    this.handleCancel();
  }

  handleCancel(): void {
    if (this.isBusy) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Đang trong quá trình xử lý, vui lòng đợi...');
      return;
    }
    this.activeModal.dismiss();
  }

  reset(): void {
    this.filePath = '';
    this.excelSheets = [];
    this.selectedSheet = '';
    this.previewData = [];
    this.parsedWorkbook = null;
    this.displayProgress = 0;
    this.displayText = '0/0';
    this.isReadingFile = false;
    this.isSavingData = false;
    if (this.table) {
      this.table.clearData();
    }
  }

  openFileExplorer(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    fileInput?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn tệp Excel (.xlsx hoặc .xls)!');
        input.value = '';
        this.reset();
        return;
      }

      this.reset();
      this.filePath = file.name;
      this.excelSheets = [];
      this.selectedSheet = '';
      this.previewData = [];
      this.displayProgress = 0;
      this.displayText = 'Đang đọc file...';
      this.isReadingFile = true;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          this.parsedWorkbook = workbook;
          this.excelSheets = workbook.SheetNames;

          if (this.excelSheets.length > 0) {
            this.selectedSheet = this.excelSheets[0];
            this.onSheetChange();
          }
          this.isReadingFile = false;
          const total = this.previewData.length;
          this.displayText = total === 0 ? 'Không có dữ liệu hợp lệ trong sheet.' : `0/${total} bản ghi`;
        } catch (err) {
          this.isReadingFile = false;
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi đọc file Excel!');
        }
      };
      reader.onerror = () => {
        this.isReadingFile = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi tải file!');
      };
      reader.readAsArrayBuffer(file);
    }
  }

  onSheetChange(): void {
    if (!this.parsedWorkbook || !this.selectedSheet) return;
    const worksheet = this.parsedWorkbook.Sheets[this.selectedSheet];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    this.previewData = rawData.slice(1)
      .map((row) => ({
        ProductSaleCode: row[0] ? String(row[0]).trim() : '',
        ProductSaleName: row[1] ? String(row[1]).trim() : '',
        Quantity: row[2],
        Note: row[3] ? String(row[3]).trim() : ''
      }))
      .filter(item => item.ProductSaleCode || item.ProductSaleName)
      .map((item, index) => ({
        index: index + 1,
        stt: index + 1,
        ...item
      }));

    if (this.table && this.isTableBuilt) {
      this.table.replaceData(this.previewData);
    }
    this.displayText = `0/${this.previewData.length} bản ghi`;
  }

  highlightErrors(errorCodes: string[]): void {
    if (!this.table) return;
    const rows = this.table.getRows();
    rows.forEach(row => {
      const data = row.getData();
      const element = row.getElement();
      if (errorCodes.includes(data['ProductSaleCode'])) {
        element.classList.add('row-error');
        row.getCells().forEach((cell: any) => {
          cell.getElement().classList.add('row-error');
        });
      } else {
        element.classList.remove('row-error');
        row.getCells().forEach((cell: any) => {
          cell.getElement().classList.remove('row-error');
        });
      }
    });
  }

  handleImport(): void {
    if (this.previewData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để nhập!');
      return;
    }

    // 1. Validate Client-side
    let hasError = false;
    for (let i = 0; i < this.previewData.length; i++) {
      const item = this.previewData[i];
      if (!item.ProductSaleCode) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Dòng số ${i + 1} thiếu Mã sản phẩm!`);
        hasError = true;
        break;
      }
      if (item.Quantity === undefined || item.Quantity === null || item.Quantity === '' || isNaN(Number(item.Quantity)) || Number(item.Quantity) <= 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Dòng số ${i + 1} có Số lượng không hợp lệ (phải lớn hơn 0)!`);
        hasError = true;
        break;
      }
    }
    if (hasError) return;

    this.isSavingData = true;
    this.displayProgress = 20;
    this.displayText = 'Đang kiểm tra dữ liệu...';

    const dataToSend = this.previewData.map(item => ({
      ProductSaleCode: item.ProductSaleCode,
      ProductSaleName: item.ProductSaleName,
      Quantity: Number(item.Quantity),
      Note: item.Note,
      WarehouseID: Number(this.warehouseId),
      WareHouseID: Number(this.warehouseId),
      warehouseId: Number(this.warehouseId)
    }));

    // 2. Validate Server-side
    this.inventoryStockService.validateImportExcel(dataToSend).subscribe({
      next: (res) => {
        const invalidCodesStr = res?.data || '';
        const errorCodes = invalidCodesStr.split(';')
          .map((c: string) => c.trim())
          .filter((c: string) => c);

        if (errorCodes.length > 0) {
          // Có lỗi -> Bôi đỏ dòng lỗi và thông báo
          this.highlightErrors(errorCodes);
          this.notification.error(NOTIFICATION_TITLE.error, `Sản phẩm không có trong kho dự án: ${errorCodes.join(', ')}`);
          this.isSavingData = false;
          this.displayProgress = 0;
          this.displayText = 'Phát hiện lỗi validate';
        } else {
          // Không có lỗi -> Tiếp tục Lưu dữ liệu
          this.displayProgress = 60;
          this.displayText = 'Đang lưu dữ liệu...';

          this.inventoryStockService.saveImportExcel(dataToSend).subscribe({
            next: (saveRes) => {
              this.isSavingData = false;
              this.displayProgress = 100;
              this.displayText = 'Hoàn thành';
              this.notification.success(NOTIFICATION_TITLE.success, 'Nhập dữ liệu thành công!');
              this.activeModal.close(true);
            },
            error: (err) => {
              this.isSavingData = false;
              this.displayProgress = 0;
              this.displayText = 'Lỗi khi lưu dữ liệu';
              this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu!');
            }
          });
        }
      },
      error: (err) => {
        this.isSavingData = false;
        this.displayProgress = 0;
        this.displayText = 'Lỗi validate';
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra khi kiểm tra dữ liệu!');
      }
    });
  }

  downloadTemplate(): void {
    const link = document.createElement('a');
    link.href = '/assets/templateForm/MauNhapTonKho.xlsx';
    link.download = 'MauNhapTonKho.xlsx';
    link.click();
  }

  addRow(): void {
    if (!this.table) return;
    const newRow = {
      ProductSaleCode: '',
      ProductSaleName: '',
      Quantity: null,
      Note: ''
    };
    this.table.addRow(newRow);
    this.updateSTT();
  }
}
