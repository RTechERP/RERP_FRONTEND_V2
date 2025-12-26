import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
  Optional,
  Inject,
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
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
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

import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';

import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { BillDocumentImportTypeService } from './bill-document-import-type-service/bill-document-import-type.service';
@Component({
  selector: 'app-bill-document-import-type',
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
    NzFormModule,
    NzTreeSelectModule,
    CommonModule,
    HasPermissionDirective,
  ],
  templateUrl: './bill-document-import-type.component.html',
  styleUrl: './bill-document-import-type.component.css'
})
export class BillDocumentImportTypeComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_Master', { static: false }) tb_MasterElement!: ElementRef;
  tb_Master!: Tabulator;
  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  filters: any = {
    billDocumentImportType: 0,
    keyword: '',
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
  }

  statuses: any[] = [
    { value: 0, label: '--Tất cả--' },
    { value: 1, label: 'Đã hoàn thành' },
    { value: 2, label: 'Chưa hoàn thành' }
  ]

  // Data cho các trạng thái
  statusData: any[] = [
    { id: 1, name: 'Đã nhận' },
    { id: 2, name: 'Đã hủy nhận' },
    { id: 3, name: 'Không có' }
  ]

  // Helper function để lấy tên trạng thái theo ID
  getStatusName(id: number): string {
    const status = this.statusData.find(s => s.id === id);
    return status ? status.name : '';
  }


  constructor(
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private billDocumentImportTypeService: BillDocumentImportTypeService,
    @Optional() @Inject('tabData') private tabData: any
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initMasterTable();
  }

  loadData() {
    this.tb_Master.setData(null, true);
  }

  search() {
    this.tb_Master.setData(null, true);
  }

  getAjaxParams(): any {
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const params = {
      page: 1,
      size: 50,
      dateStart: formatLocalDate(this.filters.startDate),
      dateEnd: formatLocalDate(this.filters.endDate),
      billDocumentImportType: this.filters.billDocumentImportType,
      keyword: this.filters.keyword,
    };
    console.log('Ajax Params:', params); // Debug log
    return params;
  }

  initMasterTable() {
    const token = localStorage.getItem('token');
    this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      height: '100%',
      selectableRows: 1,
      rowHeader: false,
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 50,
      paginationSizeSelector: [10, 30, 50, 100, 300, 500, 99999999],
      ajaxURL: this.billDocumentImportTypeService.getBillDocumentImportTypeAjax(),
      ajaxParams: () => this.getAjaxParams(),
      ajaxConfig: {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
      ajaxResponse: (url, params, res) => {
        console.log('API Response:', res); // Debug log
        const flatData = res.data || [];
        const totalPage = flatData.length > 0 && flatData[0].TotalPage ? flatData[0].TotalPage : 1;

        return {
          data: flatData,
          last_page: totalPage,
        };
      },
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
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
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
          columns: [
            {
              title: 'Trạng thái chứng từ',
              field: 'BillDocumentImportTypeText',
              sorter: 'string',
              width: 200,
              formatter: (cell) => {
                const value = cell.getValue();
                
                // Tô màu cho "Chưa hoàn thành"
                if (value === 'Chưa hoàn thành') {
                  cell.getElement().style.backgroundColor = '#FFFF00'; // Yellow
                }
                
                return value;
              },
            },
            {
              title: 'Nhận chứng từ',
              field: 'Status',
              sorter: 'boolean',
              hozAlign: 'center',
              formatter: (cell) => {
                const checked = cell.getValue() ? 'checked' : '';
                return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
              },
            },
            {
              title: 'Ngày nhận',
              field: 'DateStatus',
              sorter: 'date',
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
              },
            },
            {
              title: 'Loại phiếu',
              field: 'BillTypeText',
              sorter: 'string',
              width: 200,

            },
            {
              title: 'Số phiếu',
              field: 'BillImportCode',
              sorter: 'string',
              width: 200,

            },
          ]
        },
        {
          title: 'BBBG',
          columns: [
            {
              title: 'Trạng thái',
              field: 'BBBGtext',
              sorter: 'string',
              width: 150,
              formatter: (cell) => {
                const id = cell.getValue();
                const statusName = this.getStatusName(id);
                
                // Tô màu cho giá trị = 2 hoặc 0
                if (id == 2 || id == 0) {
                  cell.getElement().style.backgroundColor = '#FFFF00'; // Yellow
                }
                
                return statusName;
              },
            },
            {
              title: 'Lý do / Ghi chú',
              field: 'BBBG_Note',
              sorter: 'string',
              width: 200,
              formatter: 'textarea'
            },

          ]
        },
        {
          title: 'PO',
          columns: [
            {
              title: 'Trạng thái',
              field: 'POtext',
              sorter: 'string',
              width: 150,
              formatter: (cell) => {
                const id = cell.getValue();
                const statusName = this.getStatusName(id);
                
                // Tô màu cho giá trị = 2 hoặc 0
                if (id == 2 || id == 0) {
                  cell.getElement().style.backgroundColor = '#FFFF00'; // Yellow
                }
                
                return statusName;
              },
            },
            {
              title: 'Lý do / Ghi chú',
              field: 'PO_Note',
              sorter: 'string',
              width: 200,
              formatter: 'textarea'
            },

          ]
        },
        {
          title: 'PXK',
          columns: [
            {
              title: 'Trạng thái',
              field: 'PXKtext',
              sorter: 'string',
              width: 150,
              formatter: (cell) => {
                const id = cell.getValue();
                const statusName = this.getStatusName(id);
                
                // Tô màu cho giá trị = 2 hoặc 0
                if (id == 2 || id == 0) {
                  cell.getElement().style.backgroundColor = '#FFFF00'; // Yellow
                }
                
                return statusName;
              },
            },
            {
              title: 'Lý do / Ghi chú',
              field: 'PXK_Note',
              sorter: 'string',
              width: 200,
              formatter: 'textarea'
            },

          ]
        },
        {
          title: '',
          columns: [
            {
              title: 'Nhà cung cấp / Bộ phận',
              field: 'Suplier',
              sorter: 'string',
              formatter: 'textarea',
              width: 200,

            },
            {
              title: 'Người giao / Người trả',
              field: 'Deliver',
              sorter: 'string',
              width: 150,

            },
            {
              title: 'Người nhận',
              field: 'Reciver',
              sorter: 'string',
              width: 150,

            },
            {
              title: 'Ngày tạo',
              field: 'CreatDate',
              sorter: 'date',
              width: 150,
              formatter: (cell: any) => {
                const value = cell.getValue();
                if (!value) return '';
                const date = new Date(value);
                if (isNaN(date.getTime())) return value;
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
              },
            },
            {
              title: 'Loại vật tư',
              field: 'KhoType',
              sorter: 'string',
              width: 150,

            },
            {
              title: 'Kho',
              field: 'WarehouseName',
              sorter: 'string',
              width: 150,

            },

          ]
        },

      ],
    });
  }

  exportTableToExcel() {
    this.tb_Master.download('xlsx', 'BillDocumentImportType');
  }

}
