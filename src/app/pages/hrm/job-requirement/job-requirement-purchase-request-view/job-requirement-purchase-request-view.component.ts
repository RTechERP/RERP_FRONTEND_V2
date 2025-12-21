import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { JobRequirementService } from '../job-requirement-service/job-requirement.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-job-requirement-purchase-request-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzFormModule,
    NzSpinModule,
  ],
  templateUrl: './job-requirement-purchase-request-view.component.html',
  styleUrl: './job-requirement-purchase-request-view.component.css'
})
export class JobRequirementPurchaseRequestViewComponent implements OnInit, AfterViewInit {
  @ViewChild('purchaseRequestTable', { static: false }) purchaseRequestTableElement!: ElementRef;
  @Input() jobRequirementID: number = 0;
  @Input() numberRequest: string = '';

  purchaseRequestTable: Tabulator | null = null;
  isLoading: boolean = false;

  // Filter params
  dateStart: Date | null = null;
  dateEnd: Date | null = null;
  keyWord: string = '';
  selectedJobRequirementID: number = 0;

  // Data
  purchaseRequestData: any[] = [];
  jobRequirementList: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private jobRequirementService: JobRequirementService,
    public activeModal: NgbActiveModal
  ) {
    // Set default dates: đầu tháng hiện tại đến cuối tháng hiện tại
    const now = new Date();
    this.dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
    this.dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.selectedJobRequirementID = this.jobRequirementID || 0;
  }

  ngOnInit() {
    this.loadJobRequirementList();
  }

  loadJobRequirementList() {
    this.jobRequirementService.getAllJobRequirement().subscribe({
      next: (response: any) => {
        // Kiểm tra status và lấy data
        if (response && response.status === 1 && response.data) {
          this.jobRequirementList = Array.isArray(response.data) ? response.data : [];
        } else {
          this.jobRequirementList = [];
        }
        // Tự động bind job requirement có ID được truyền vào
        if (this.jobRequirementID > 0) {
          this.selectedJobRequirementID = this.jobRequirementID;
        }
        // Load data sau khi có danh sách
        this.loadData();
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi tải danh sách yêu cầu công việc!';
        this.notification.error(
          NOTIFICATION_TITLE.error,
          errorMessage
        );
        // Vẫn load data nếu không lấy được danh sách
        this.loadData();
      }
    });
  }

  onJobRequirementChange() {
    // Khi chọn job requirement khác, cập nhật lại jobRequirementID và load lại data
    this.jobRequirementID = this.selectedJobRequirementID;
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.drawTable();
  }

  closeModal() {
    this.activeModal.dismiss();
  }

  loadData() {
    if (!this.dateStart || !this.dateEnd) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn khoảng thời gian!'
      );
      return;
    }

    this.isLoading = true;
    this.jobRequirementService.getProjectPartlistPurchaseRequest(
      this.dateStart!,
      this.dateEnd!,
      this.keyWord || '',
      this.selectedJobRequirementID || this.jobRequirementID || 0
    ).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        // Kiểm tra status và lấy data
        if (response && response.status === 1 && response.data) {
          this.purchaseRequestData = Array.isArray(response.data) ? response.data : [];
        } else {
          this.purchaseRequestData = [];
        }
        if (this.purchaseRequestTable) {
          this.purchaseRequestTable.setData(this.purchaseRequestData);
        } else {
          this.drawTable();
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi khi tải dữ liệu!';
        this.notification.error(
          NOTIFICATION_TITLE.error,
          errorMessage
        );
      }
    });
  }

  resetSearch() {
    const now = new Date();
    this.dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
    this.dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.keyWord = '';
    this.selectedJobRequirementID = this.jobRequirementID || 0;
    this.loadData();
  }

  exportToExcel() {
    if (!this.purchaseRequestTable || this.purchaseRequestData.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất Excel!'
      );
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Yêu cầu mua hàng');

      // Get columns from table
      const columns = this.purchaseRequestTable.getColumns();
      const headers: string[] = [];
      const columnFields: string[] = [];

      columns.forEach((col: any) => {
        const def = col.getDefinition();
        if (def.field && def.title) {
          headers.push(def.title);
          columnFields.push(def.field);
        }
      });

      // Add headers
      worksheet.addRow(headers);

      // Style header row - Font Times New Roman cỡ 10, màu #1677ff, wrap text
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell: ExcelJS.Cell) => {
        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1677FF' } // Màu #1677ff
        };
      });
      headerRow.height = 30;

      // Add data rows
      this.purchaseRequestData.forEach((row: any) => {
        const rowData = columnFields.map(field => {
          const value = row[field];
          if (value instanceof Date) {
            return DateTime.fromJSDate(value).toFormat('dd/MM/yyyy');
          }
          return value || '';
        });
        worksheet.addRow(rowData);
      });

      // Set font Times New Roman cỡ 10 và wrap text cho tất cả các cell dữ liệu
      worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber !== 1) {
          row.height = 30;
          row.eachCell((cell: ExcelJS.Cell) => {
            cell.font = { name: 'Times New Roman', size: 10 };
            cell.alignment = { 
              vertical: 'middle', 
              horizontal: cell.alignment?.horizontal || 'left',
              wrapText: true 
            };
          });
        }
      });

      // Auto fit columns
      worksheet.columns.forEach((column: any) => {
        if (column && column.eachCell) {
          let maxLength = 0;
          column.eachCell({ includeEmpty: false }, (cell: any) => {
            const cellValue = cell.value ? cell.value.toString() : '';
            if (cellValue.length > maxLength) {
              maxLength = cellValue.length;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 10), 50);
        }
      });

      // Generate file
      workbook.xlsx.writeBuffer().then((buffer: any) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const fileName = `Yeu_cau_mua_hang_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.xlsx`;
        saveAs(blob, fileName);
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Xuất Excel thành công!'
        );
      });
    } catch (error: any) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Lỗi khi xuất Excel: ' + (error?.message || 'Unknown error')
      );
    }
  }

  private drawTable(): void {
    if (this.purchaseRequestTable) {
      this.purchaseRequestTable.setData(this.purchaseRequestData || []);
    } else {
      // Helper function for checkbox formatter
      const checkboxFormatter = (cell: any) => {
        const value = cell.getValue();
        const checked = value === true || value === 'true' || value === 1 || value === '1';
        return `<div style='text-align:center'><input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" /></div>`;
      };

      // Helper function for date formatter
      const dateFormatter = (cell: any) => {
        const value = cell.getValue();
        return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
      };

      // Helper function for number formatter
      const numberFormatter = (cell: any) => {
        const value = cell.getValue();
        if (value === null || value === undefined || value === '') return '';
        return typeof value === 'number' ? value.toLocaleString('vi-VN') : value;
      };

      this.purchaseRequestTable = new Tabulator(this.purchaseRequestTableElement.nativeElement, {
        data: this.purchaseRequestData || [],
        ...DEFAULT_TABLE_CONFIG,
        paginationMode: 'local',
        height: '86vh',
        rowHeader:false,
        layout: 'fitDataStretch',
        columns: [
          {
            title: 'Đã huỷ',
            field: 'IsDeleted',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 100,
            frozen: true,
            formatter: checkboxFormatter,
            
          },
          {
            title: 'Mã yêu cầu công việc',
            field: 'NumberRequest',
            headerHozAlign: 'center',
            width: 180,
            formatter: 'textarea',
            frozen: true,
          },
          {
            title: 'Mã sản phẩm',
            field: 'ProductCode',
            headerHozAlign: 'center',
            width: 150,
            frozen: true,
            formatter: 'textarea',
          },
          {
            title: 'Tên sản phẩm',
            field: 'ProductName',
            headerHozAlign: 'center',
            width: 200,
            frozen: true,
            formatter: 'textarea',
          },
          {
            title: 'Đơn vị',
            field: 'UnitName',
            headerHozAlign: 'center',
            width: 100,
            frozen: true,
            formatter: 'textarea',
          },
          {
            title: 'Trạng thái',
            field: 'StatusRequestText',
            headerHozAlign: 'center',
            width: 150,
            frozen: true,
            formatter: 'textarea',
          },
          {
            title: 'Người yêu cầu',
            field: 'FullName',
            headerHozAlign: 'center',
            width: 150,
            frozen: true,
            formatter: 'textarea',
          },
          {
            title: 'NV mua',
            field: 'UpdatedName',
            headerHozAlign: 'center',
            width: 150,
            frozen: true,
            formatter: 'textarea',
          },
          {
            title: 'Ngày yêu cầu',
            field: 'DateRequest',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 120,
            formatter: dateFormatter,
          },
          {
            title: 'Deadline',
            field: 'DateReturnExpected',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 120,
            formatter: dateFormatter,
          },
          {
            title: 'Số lượng yêu cầu',
            field: 'Quantity',
            hozAlign: 'right',
            headerHozAlign: 'center',
            width: 130,
            formatter: numberFormatter,
          },
          {
            title: 'Số lượng đã về',
            field: 'QuantityActual',
            hozAlign: 'right',
            headerHozAlign: 'center',
            width: 130,
            formatter: numberFormatter,
          },
          {
            title: 'Loại tiền',
            field: 'CurrencyID',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 100,
          },
          {
            title: 'Tỷ giá',
            field: 'CurrencyRate',
            hozAlign: 'right',
            headerHozAlign: 'center',
            width: 120,
            formatter: numberFormatter,
          },
          {
            title: 'Đơn giá bán (Sale Admin up)',
            field: 'UnitPricePOKH',
            hozAlign: 'right',
            headerHozAlign: 'center',
            width: 180,
            headerWordWrap: true,
            formatter: numberFormatter,
          },
          {
            title: 'Đơn giá',
            field: 'UnitPrice',
            hozAlign: 'right',
            headerHozAlign: 'center',
            width: 120,
            formatter: numberFormatter,
          },
          {
            title: 'Giá lịch sử',
            field: 'HistoryPrice',
            hozAlign: 'right',
            headerHozAlign: 'center',
            width: 120,
            formatter: numberFormatter,
          },
          {
            title: 'Thành tiền chưa VAT',
            field: 'TotalPrice',
            hozAlign: 'right',
            headerHozAlign: 'center',
            width: 160,
            headerWordWrap: true,
            formatter: numberFormatter,
          },
          {
            title: 'Thành tiền quy đổi (VNĐ)',
            field: 'TotalPriceExchange',
            hozAlign: 'right',
            headerHozAlign: 'center',
            width: 180,
            headerWordWrap: true,
            formatter: numberFormatter,
          },
          {
            title: '% VAT',
            field: 'VAT',
            hozAlign: 'right',
            headerHozAlign: 'center',
            width: 100,
            formatter: numberFormatter,
          },
          {
            title: 'Thành tiền có VAT',
            field: 'TotaMoneyVAT',
            hozAlign: 'right',
            headerHozAlign: 'center',
            width: 150,
            headerWordWrap: true,
            formatter: numberFormatter,
          },
          {
            title: 'Nhà cung cấp',
            field: 'SupplierSaleID',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 120,
          },
          {
            title: 'Lead Time',
            field: 'TotalDayLeadTime',
            hozAlign: 'right',
            headerHozAlign: 'center',
            width: 100,
            formatter: numberFormatter,
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            headerHozAlign: 'center',
            widthGrow: 1,
            formatter: 'textarea',
          },
          {
            title: 'Lý do huỷ',
            field: 'ReasonCancel',
            headerHozAlign: 'center',
            width: 200,
            formatter: 'textarea',
          },
          {
            title: 'Ngày đặt hàng',
            field: 'RequestDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 120,
            formatter: dateFormatter,
          },
          {
            title: 'Ngày về dự kiến',
            field: 'DeadlineDelivery',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 140,
            headerWordWrap: true,
            formatter: dateFormatter,
          },
          {
            title: 'Ngày về thực tế',
            field: 'DateReturnActual',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 130,
            headerWordWrap: true,
            formatter: dateFormatter,
          },
          {
            title: 'Ngày nhận',
            field: 'DateReceive',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 120,
            formatter: dateFormatter,
          },
          {
            title: 'Hàng nhập khẩu',
            field: 'IsImport',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 130,
            headerWordWrap: true,
            formatter: checkboxFormatter,
          },
          {
            title: 'Đơn giá xuất xưởng',
            field: 'UnitFactoryExportPrice',
            hozAlign: 'right',
            headerHozAlign: 'center',
            width: 160,
            headerWordWrap: true,
            formatter: numberFormatter,
          },
          {
            title: 'Giá nhập khẩu',
            field: 'UnitImportPrice',
            hozAlign: 'right',
            headerHozAlign: 'center',
            width: 130,
            headerWordWrap: true,
            formatter: numberFormatter,
          },
          {
            title: 'Tổng tiền nhập khẩu',
            field: 'TotalImportPrice',
            hozAlign: 'right',
            headerHozAlign: 'center',
            width: 160,
            headerWordWrap: true,
            formatter: numberFormatter,
          },
          {
            title: 'Đơn mua hàng',
            field: 'BillCode',
            headerHozAlign: 'center',
            width: 150,
            formatter: 'textarea',
          },
          {
            title: 'Lead Time',
            field: 'LeadTime',
            hozAlign: 'right',
            headerHozAlign: 'center',
            width: 100,
            formatter: numberFormatter,
          },
        ],
      });

      // Set font-size
      setTimeout(() => {
        const tableElement = this.purchaseRequestTableElement.nativeElement;
        if (tableElement) {
          tableElement.style.fontSize = '12px';
        }
      }, 200);
    }
  }
}

