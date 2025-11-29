import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import * as ExcelJS from 'exceljs';
import { ProjectPartlistPurchaseRequestService } from '../project-partlist-purchase-request.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { NzSpinComponent } from "ng-zorro-antd/spin";
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { ProjectService } from '../../../project/project-service/project.service';

@Component({
  selector: 'app-history-price',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSpinComponent
  ],
  templateUrl: './history-price.component.html',
  styleUrl: './history-price.component.css'
})
export class HistoryPriceComponent implements OnInit, AfterViewInit {
  @ViewChild('productTable', { static: false }) productTableRef!: ElementRef;

  @Input() searchKeyword = '';
  productTable: Tabulator | null = null;
  productData: any[] = [];
  isLoading = false;

  constructor(
    public activeModal: NgbActiveModal,
    private service: ProjectPartlistPurchaseRequestService,
    private notification: NzNotificationService,
    private projectPartlistPurchaseRequestService: ProjectPartlistPurchaseRequestService,
    private projectService: ProjectService,
  ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initializeTable();
    this.getHistoryPrice();
  }

  initializeTable(): void {
    if (this.productTableRef) {
      this.productTable = new Tabulator(this.productTableRef.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        data: this.productData,
        layout: 'fitDataStretch',
        height: '60vh',
        placeholder: 'Không có dữ liệu',
        paginationMode: 'local',
        rowHeader: false,
        groupBy: 'TableType',
        groupHeader: (value: any, count: any, data: any, group: any) => {
          return `${value || 'Không xác định'} <span style="color:#666; margin-left:10px;">(${count} mục)</span>`;
        },
        columns: [
          {
            title: 'Mã sản phẩm',
            field: 'ProductCode',
            width: 150,
            headerSort: false,
            formatter: 'textarea',
            bottomCalc: 'count'
          },
          {
            title: 'Tên sản phẩm',
            field: 'ProductName',
            minWidth: 200,
            headerSort: false,
            formatter: 'textarea'
          },
          {
            title: 'Đơn giá',
            field: 'UnitPrice',
            width: 150,
            headerSort: false,
            formatter: (cell: any) => {
              const value = cell.getValue();
              if (value === null || value === undefined) return '';
              return new Intl.NumberFormat('vi-VN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              }).format(value);
            },
            hozAlign: 'right',
            bottomCalc: 'sum',
            bottomCalcFormatter: (cell: any) => {
              const value = cell.getValue();
              if (value === null || value === undefined) return '';
              return new Intl.NumberFormat('vi-VN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              }).format(value);
            }
          },
          {
            title: 'Loại tiền',
            field: 'CurrencyCode',
            width: 100,
            headerSort: false,
            hozAlign: 'center',
            formatter: 'textarea'
          },
          {
            title: 'Nhà cung cấp',
            field: 'NameNCC',
            width: 200,
            headerSort: false,
            formatter: 'textarea'
          },
          {
            title: 'Lead Time',
            field: 'LeadTime',
            width: 50,
            headerSort: false,
            hozAlign: 'center',
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value ? `${value}` : '';
            }
          }
        ],
      });
    }
  }

  getHistoryPrice(): void {
    this.isLoading = true;
    this.projectPartlistPurchaseRequestService.getHistoryPrice(this.searchKeyword).subscribe({
      next: (response: any) => {
        this.productData = response.data || [];
        if (this.productTable) {
          this.productTable.setData(this.productData);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi tải dữ liệu');
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.getHistoryPrice();
  }

  exportToExcel(): void {
    let data = this.productData;
    this.projectService.exportExcelGroup(this.productTable, data,
      'LichSuHoiGia', `LichSuHoiGia${this.searchKeyword ? `_${this.searchKeyword}` : ''}`, 'TableType');
  }

  selectProduct(product: any): void {
    this.activeModal.close(product);
  }

  onClose(): void {
    this.activeModal.dismiss();
  }
}
