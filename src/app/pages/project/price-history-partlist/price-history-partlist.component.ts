import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ProjectService } from '../project-service/project.service';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

@Component({
  selector: 'app-price-history-partlist',
  imports: [
    NzCardModule,
    FormsModule,
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
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    CommonModule,
  ],
  templateUrl: './price-history-partlist.component.html',
  styleUrl: './price-history-partlist.component.css'
})
export class PriceHistoryPartlistComponent implements OnInit, AfterViewInit{
//#region Khai báo biến 
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router
  ) { }

  @ViewChild('tb_priceHistory', { static: false })
  tb_priceHistoryContainer!: ElementRef;
  tb_priceHistory: any;

  isLoadTable: any = false;
  sizeSearch: string = '0';

  employeeRequests: any[] = [];
  projects: any[] = [];
  suppliers: any[] = [];


  employeeRequestId: any;
  projectId: any;
  supplierId: any;
  keyword: any;
  //#endregion

  //#region Load dữ liệu
  ngOnInit(): void {
    this.getProject();
    this.getEmployeeRequest();
    this.getSupplierSales();
  }
  ngAfterViewInit(): void {
    this.drawTbPriceHistory(
      this.tb_priceHistoryContainer.nativeElement
    );
    this.getPriceHistoryPartlist();
  }
  //#endregion

  //#region Sự kiện khác
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  onSearchChange(value: string) {
    this.getPriceHistoryPartlist();
  }

  resetSearch() {
    this.employeeRequestId = 0;
    this.projectId = 0;
    this.supplierId = 0;
    this.keyword = '';
  }

  async getPriceHistoryPartlist() {
    this.isLoadTable = true;
    let data = {
      projectId: this.projectId ? this.projectId : 0,
      supplierSaleId: this.supplierId ? this.supplierId : 0,
      employeeRequestId: this.employeeRequestId ? this.employeeRequestId : 0,
      keyword: this.keyword?.trim() ?? '',
    };

    this.projectService.getPriceHistoryPartlist(data).subscribe({
      next: (response: any) => {
        this.tb_priceHistory.setData(response.data);
        this.isLoadTable = false;
      },
      error: (error) => {
        this.notification.error('Lỗi', error.error.message);
        console.error('Lỗi:', error);
        this.isLoadTable = false;
      },
    });
  }

  getProject() {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getEmployeeRequest() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeRequests = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getSupplierSales() {
    this.projectService.getSupplierSales().subscribe({
      next: (response: any) => {
        this.suppliers = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  exportExcel() {
    let table = this.tb_priceHistory;
    if (!table) return;

    let datatable = this.tb_priceHistory.getData();
    if (!datatable || datatable.length === 0) {
      this.notification.error('Thông báo', 'Không có dữ liệu để xuất excel!');
      return;
    }

    this.projectService.exportExcelGroup(
      table,
      datatable,
      'Lịch sử giá',
      'LichSuGia',
      'TableType'
    );
  }

  drawTbPriceHistory(container: HTMLElement) {
    this.tb_priceHistory = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      pagination: true,
      paginationMode:'local',
      groupBy: "TableType",
      groupHeader: function(value, count, data) {
        return value + " (" + count + " sản phẩm)";
      },
      groupToggleElement: "header",
      rowHeader:false,
      columns: [
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          width: 200,
          frozen:true,
          headerHozAlign: 'center',
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          width: 200,
          headerHozAlign: 'center',
          frozen:true,
          formatter: 'textarea',
        },
        {
          title: 'Thông số kỹ thuật',
          field: 'Model',
          width: 200,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Hãng',
          field: 'Maker',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Đơn vị',
          field: 'Unit',
          width: 150,
          headerHozAlign: 'center',
          hozAlign: 'right',
        },
        {
          title: 'Ngày cập nhật',
          field: 'CreatedDate',
          width: 150,
          headerHozAlign: 'center',
          hozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
        },
        {
          title: 'Đơn giá',
          field: 'UnitPrice',
          width: 150,
          headerHozAlign: 'center',
          hozAlign: 'right',
          formatter: 'money',
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
        },
        {
          title: 'Loại tiền',
          field: 'CurrencyCode',
          width: 150,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Tỉ giá',
          field: 'CurrencyRate',
          width: 150,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Mã nhà cung cấp',
          field: 'CodeNCC',
          width: 200,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Tên nhà cung cấp',
          field: 'NameNCC',
          width: 200,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          width: 200,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Tên dự án',
          field: 'ProjectName',
          width: 200,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'LeadTime',
          field: 'LeadTime',
          width: 200,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
      ],
    });
    this.tb_priceHistory.on("pageLoaded", () => {
      this.tb_priceHistory.redraw();
    });
    
  }

  //#endregion
}