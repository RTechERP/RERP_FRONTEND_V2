import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
} from '@angular/core';
import { NgForm } from '@angular/forms';
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
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

import { PoRequestPriceRtcService } from './po-request-price-rtc-service/po-request-price-rtc.service';
import { TradePriceService } from '../Sale/TinhGia/trade-price/trade-price/trade-price.service';
@Component({
  selector: 'app-po-request-price-rtc',
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
    NzTreeSelectModule,
    NzCollapseModule,
    NzFormModule,
  ],
  templateUrl: './po-request-price-rtc.component.html',
  styleUrl: './po-request-price-rtc.component.css'
})
export class PoRequestPriceRtcComponent implements OnInit, AfterViewInit{
  @ViewChild('tb_Table', { static: false }) tableElementRef!: ElementRef;
  tb_Table!: Tabulator;

  @Input() id: number = 0;

  formData: any = {
    requestDate: new Date(),
    userId: 0, 
  };

  formUserData: any[] = [];
  data: any[]= [];
  constructor(
    private poRequestPriceRtcService: PoRequestPriceRtcService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private tradePriceService : TradePriceService
  ) {}

  ngOnInit(): void {
    this.loadData(this.id);
    this.loadUserData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initTable();
    }, 0);
  }
  
  loadUserData() {
    this.tradePriceService.getEmployees(0).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.formUserData = response.data;

        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải dữ liệu: ' + response.message
          );
        }
      },
      error: (error) => {
        this.notification.error(
          'Thông báo',
          'Lỗi kết nối khi tải dữ liệu: ' + error
        );
      },
    });
  }

  loadData(id: number): void {
    this.poRequestPriceRtcService.loadData(id).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.data = response.data;
          // Cập nhật dữ liệu vào bảng nếu đã khởi tạo
          if (this.tb_Table) {
            this.tb_Table.setData(this.data);
          }
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi tải dữ liệu PO: ' + response.message
          );
        }
      },
      error: (error) => {
        this.notification.error(
          'Thông báo',
          'Lỗi kết nối khi tải dữ liệu PO: ' + error
        );
      },
    });
  }

  saveAndClose() {
    // Đóng editor nếu đang mở
    if (this.tb_Table) {
      this.tb_Table.clearCellEdited();
    }

    // Lấy các dòng được chọn
    const selectedRows = this.tb_Table?.getSelectedRows() || [];
    
    if (selectedRows.length <= 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn vào sản phẩm muốn yêu cầu báo giá!'
      );
      return;
    }

    // Validate dữ liệu
    if (!this.checkValidate(selectedRows)) {
      return;
    }

    // Chuẩn bị dữ liệu để gửi lên server
    const requests: any[] = [];

    selectedRows.forEach((row) => {
      const rowData = row.getData();
      
      // Lấy số lượng yêu cầu
      const quantityRequest = Number(rowData['QuantityRequestRemain']) || 0;
      
      // Bỏ qua nếu số lượng <= 0
      if (quantityRequest <= 0) {
        return;
      }

      // Tạo request mới
      const request: any = {
        DateRequest: this.formData.requestDate 
          ? DateTime.fromJSDate(new Date(this.formData.requestDate)).toFormat('yyyy-MM-dd')
          : DateTime.now().toFormat('yyyy-MM-dd'),
        EmployeeID: this.formData.userId || 0,
        Deadline: rowData['Deadline'] 
          ? DateTime.fromISO(rowData['Deadline']).toFormat('yyyy-MM-dd')
          : null,
        ProductCode: rowData['ProductCode'] || '',
        ProductName: rowData['ProductName'] || '',
        Quantity: quantityRequest,
        StatusRequest: 1, // yêu cầu báo giá
        IsCommercialProduct: true, // hàng thương mại
        POKHDetailID: rowData['ID'] || 0,
        Note: rowData['Note'] || '',
      };

      requests.push(request);
    });

    if (requests.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không có sản phẩm nào hợp lệ để yêu cầu báo giá!'
      );
      return;
    }

    // Gọi API để lưu
    this.poRequestPriceRtcService.save(requests).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.notification.success(
            'Thông báo',
            'Lưu dữ liệu thành công!'
          );
          this.activeModal.close({ success: true, reloadData: true });
        } else {
          this.notification.error(
            'Thông báo',
            'Lỗi khi lưu dữ liệu: ' + (response.message || 'Lỗi không xác định')
          );
        }
      },
      error: (error) => {
        this.notification.error(
          'Thông báo',
          'Lỗi khi lưu dữ liệu: ' + (error?.error?.message || error)
        );
      },
    });
  }

  private checkValidate(selectedRows: any[]): boolean {
    // Kiểm tra ngày yêu cầu
    if (!this.formData.requestDate) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ngày yêu cầu!'
      );
      return false;
    }

    // Kiểm tra người yêu cầu
    if (!this.formData.userId || this.formData.userId === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn người yêu cầu!'
      );
      return false;
    }

    // Kiểm tra số lượng yêu cầu cho từng dòng
    let hasValidQuantity = false;
    for (const row of selectedRows) {
      const rowData = row.getData();
      const quantityRequest = Number(rowData['QuantityRequestRemain']) || 0;
      
      if (quantityRequest > 0) {
        hasValidQuantity = true;
        break;
      }
    }

    if (!hasValidQuantity) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng nhập số lượng yêu cầu lớn hơn 0 cho ít nhất một sản phẩm!'
      );
      return false;
    }

    return true;
  }

  deleteRequest() {
    const selectedRows = this.tb_Table?.getSelectedRows() || [];
    
    if (selectedRows.length <= 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng tick vào sản phẩm muốn xóa!'
      );
      return;
    }

    const listRequestIds: number[] = [];

    selectedRows.forEach((row) => {
      const rowData = row.getData();
      
      const requestId = rowData['ProjectPartlistPriceRequestID']

      if (requestId && requestId !== 0) {
        listRequestIds.push(requestId);
      }
    });

    if (listRequestIds.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không tìm thấy ID hợp lệ để xóa!'
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Các yêu cầu đã báo giá, đã hoàn thành hoặc đang check giá sẽ không thể xóa và bỏ qua. Bạn có chắc muốn xóa?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.poRequestPriceRtcService.delete(listRequestIds).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              const result = response.data || {};
              const deleted = result.Deleted || [];
              const skipped = result.Skipped || [];

              let message = `Đã xóa thành công ${deleted.length} yêu cầu.`;
              if (skipped.length > 0) {
                message += `\nBỏ qua ${skipped.length} yêu cầu không thể xóa.`;
              }

              this.notification.success(
                'Thông báo',
                message
              );

              this.loadData(this.id);
            } else {
              this.notification.error(
                'Thông báo',
                'Lỗi khi xóa yêu cầu: ' + (response.message || 'Lỗi không xác định')
              );
            }
          },
          error: (error) => {
            this.notification.error(
              'Thông báo',
              'Lỗi kết nối khi xóa yêu cầu: ' + (error?.message || error)
            );
          },
        });
      },
    });
  }


  closeModal() {
    this.activeModal.close({ success: false, reloadData: false });
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

  initTable(): void {
    if (!this.tableElementRef?.nativeElement) {
      return;
    }
    this.tb_Table = new Tabulator(this.tableElementRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.data,
      dataTree: true,
      layout: 'fitColumns',
      dataTreeStartExpanded: true,
      pagination: true,
      paginationSize: 10,
      height: '55vh',
      movableColumns: true,
      resizableRows: true,
      validationMode:"highlight",
      selectableRows: true,
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        hozAlign: 'left',
        vertAlign: 'middle',
        resizable: true,
      },
      columns: [ 
        {
          title: '',
          field: '',
          sorter: 'number',
          width: 70,
          columns: [
            {
              title: 'ID',
              field: 'ProjectPartlistPriceRequestID',
              sorter: 'string',
              width: 100,
              visible: false,
            },
            {
              title: 'Mã Nội Bộ',
              field: 'ProductNewCode',
              sorter: 'string',
              width: 100,
              
            },
            {
              title: 'Mã Sản Phẩm',
              field: 'ProductCode',
              sorter: 'string',
              width: 100,
            },
            {
              title: 'Tên sản phẩm',
              field: 'ProductName',
              sorter: 'string',
              width: 200,
            },
            { title: 'Hãng', field: 'Maker', sorter: 'string', width: 100 },
            {
              title: 'Mã khách hàng',
              field: 'CustomerCode',
              sorter: 'string',
              width: 200,
            },
            {
              title: 'Deadline',
              field: 'Deadline',
              sorter: 'date',
              width: 200,
              editor: 'date',
              validator: "required",
              formatter: (cell: any) => {
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
            {
              title: 'Số lượng PO',
              field: 'Qty',
              sorter: 'number',
              width: 100,
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
              title: 'SL đã yêu cầu',
              field: 'QuantityRequestPrice',
              sorter: 'number',
              width: 100,
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
              title: 'SL yêu cầu',
              field: 'QuantityRequestRemain',
              sorter: 'number',
              width: 100,
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
              title: 'ĐVT',
              field: 'Unit',
              sorter: 'string',
              width: 100,
            },
            {
              title: 'Trạng thái yêu cầu',
              field: 'IsPriceRequestStatus',
              sorter: 'boolean',
              width: 100,
              formatter: (cell) => {
                const checked = cell.getValue() ? 'checked' : '';
                return `<div style="text-align: center;">
                <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
              </div>`;
              }
            },
            {
              title: 'Ghi chú',
              field: 'Note',
              sorter: 'string',
              width: 200,
              editor: 'textarea'
            },
          ]
        },
        {
          title: 'BÁO GIÁ',
          sorter: 'number',
          width: 70,
          columns: [
            {
              title: 'Check giá',
              field: 'IsCheckPrice',
              sorter: 'boolean',
              width: 100,
              formatter: (cell) => {
                const checked = cell.getValue() ? 'checked' : '';
                return `<div style="text-align: center;">
                <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
              </div>`;
              },
            },
            {
              title: 'Ngày báo giá',
              field: 'DatePriceQuote',
              sorter: 'string',
              width: 200,
              formatter: (cell: any) => {
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

            {
              title: 'Đơn giá',
              field: 'UnitPriceRequest',
              sorter: 'string',
              width: 200,
            },

            {
              title: 'Loại tiền',
              field: 'CurrencyCode',
              sorter: 'string',
              width: 200,
            },
            {
              title: 'Tỷ giá',
              field: 'CurrencyRatePrice',
              sorter: 'string',
              width: 200,
            },
            {
              
              title: 'Thành tiền chưa VAT',
              field: 'TotalPrice',
              sorter: 'number',
              width: 200,
              formatter: 'money',
              formatterParams: {
                precision: 0,
                decimal: '.',
                thousand: ',',
                symbol: '',
                symbolAfter: true,
              },
              bottomCalc: function (values, data, calcParams) {
                let total = 0;
                const processRow = (row: any) => {
                  if (row.IntoMoney) {
                    total += Number(row.IntoMoney);
                  }
                  if (row._children) {
                    row._children.forEach(processRow);
                  }
                };
                data.forEach(processRow);
                return total;
              },
              bottomCalcFormatter: 'money',
              bottomCalcFormatterParams: {
                precision: 0,
                decimal: '.',
                thousand: ',',
                symbol: '',
                symbolAfter: true,
              },
            },
            {
              
              title: 'Thành tiền quy đổi VND',
              field: 'TotalPriceExchange',
              sorter: 'number',
              width: 200,
              formatter: 'money',
              formatterParams: {
                precision: 0,
                decimal: '.',
                thousand: ',',
                symbol: '',
                symbolAfter: true,
              },
              bottomCalc: function (values, data, calcParams) {
                let total = 0;
                const processRow = (row: any) => {
                  if (row.IntoMoney) {
                    total += Number(row.IntoMoney);
                  }
                  if (row._children) {
                    row._children.forEach(processRow);
                  }
                };
                data.forEach(processRow);
                return total;
              },
              bottomCalcFormatter: 'money',
              bottomCalcFormatterParams: {
                precision: 0,
                decimal: '.',
                thousand: ',',
                symbol: '',
                symbolAfter: true,
              },
            },
            {
              title: 'Nhà cung cấp',
              field: 'NameNCC',
              sorter: 'number',
              width: 150,
            },
            {
              title: 'Leadtime',
              field: 'TotalDayLeadTime',
              sorter: 'number',
              width: 150,
            },
          ]
        }
        
      ],
    });
  }
}
