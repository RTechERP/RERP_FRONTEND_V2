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
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-synthesis-of-generated-materials',
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
    HasPermissionDirective
  ],
  //encapsulation: ViewEncapsulation.None,
  templateUrl: './synthesis-of-generated-materials.component.html',
  styleUrl: './synthesis-of-generated-materials.component.css',
})
export class SynthesisOfGeneratedMaterialsComponent
  implements OnInit, AfterViewInit
{
  //#region khai báo biến
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router
  ) {}

  @ViewChild('tb_synthesisOfGeneratedMaterials', { static: false })
  tb_synthesisOfGeneratedMaterialsContainer!: ElementRef;
  tb_synthesisOfGeneratedMaterials: any;

  isLoadTable: any = false;
  sizeSearch: string = '0';

  dateStart: any = DateTime.local().startOf('month').toFormat('yyyy-MM-dd');
  dateEnd: any = DateTime.local().endOf('month').toFormat('yyyy-MM-dd');

  projects: any[] = [];

  keyword: any;
  projectId: any;
  //#endregion
  //#region Chạy khi mở chương trình
  ngOnInit(): void {
    this.getProject();
  }
  ngAfterViewInit(): void {
    this.drawTbSynthesisOfGeneratedMaterials(
      this.tb_synthesisOfGeneratedMaterialsContainer.nativeElement
    );

    this.getDataProjectSurvey();
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

  resetSearch() {
    this.projectId = 0;
    this.keyword = '';
    this.dateStart = DateTime.local().startOf('month').toFormat('yyyy-MM-dd');
    this.dateEnd = DateTime.local().endOf('month').toFormat('yyyy-MM-dd');
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  //#endregion
  //#region Xử lý bảng tổng hợp vật tư
  drawTbSynthesisOfGeneratedMaterials(container: HTMLElement) {
    this.tb_synthesisOfGeneratedMaterials = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      rowHeader: false,
      pagination: true,
      paginationMode: 'local',
      //   height: '100%',
      //   layout: 'fitColumns',
      //   pagination: true,
      //   paginationMode: 'local',
      //   paginationSize: 100,
      //   paginationSizeSelector: [100, 200, 400, 800, 1000],
      //   langs: {
      //     vi: {
      //       pagination: {
      //         first: '<<',
      //         last: '>>',
      //         prev: '<',
      //         next: '>',
      //       },
      //     },
      //   },
      //   locale: 'vi',
      columns: [
        {
          title: 'TT',
          field: 'TT',
          width: 80,
          headerHozAlign: 'center',
        },
        {
          title: 'Tên vật tư',
          field: 'GroupMaterial',
          width: 200,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Mã thiết bị',
          field: 'ProductCode',
          width: 150,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Số lượng/ 1 máy',
          field: 'QtyMin',
          width: 150,
          headerHozAlign: 'center',
          hozAlign: 'right',
        },
        {
          title: 'Số lượng tổng',
          field: 'QtyFull',
          width: 120,
          headerHozAlign: 'center',
          hozAlign: 'right',
        },
        {
          title: 'Đơn vị',
          field: 'Unit',
          width: 80,
          headerHozAlign: 'center',
        },
        {
          title: 'Đơn giá báo',
          field: 'UnitPriceQuote',
          width: 150,
          headerHozAlign: 'center',
          hozAlign: 'right',
          formatter: 'money',
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
        },
        {
          title: 'Thành tiền báo giá',
          field: 'TotalPriceQuote',
          width: 150,
          headerHozAlign: 'center',
          hozAlign: 'right',
          formatter: 'money',
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
        },
        {
          title: 'Đơn giá mua',
          field: 'UnitPricePurchase',
          width: 150,
          headerHozAlign: 'center',
          hozAlign: 'right',
          formatter: 'money',
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
        },
        {
          title: 'Thành tiền mua',
          field: 'TotalPricePurchase',
          width: 150,
          headerHozAlign: 'center',
          hozAlign: 'right',
          formatter: 'money',
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
        },
        {
          title: 'Ngày phát sinh',
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
          title: 'Lý do phát sinh',
          field: 'ReasonProblem',
          width: 150,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          width: 150,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Ghi chú',
          field: 'note',
          width: 200,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
      ],
    });
  }
  //#endregion

  //#region load dũ liệu bảng
  async getDataProjectSurvey() {
    this.isLoadTable = true;

    let pageSize = this.tb_synthesisOfGeneratedMaterials.getPageSize();
    let data = {
      pageNumber: 1,
      pageSize: pageSize ? pageSize : 100,
      dateStart: this.dateStart
        ? DateTime.fromJSDate(new Date(this.dateStart)).toISO()
        : null,
      dateEnd: this.dateEnd
        ? DateTime.fromJSDate(new Date(this.dateEnd)).toISO()
        : null,
      projectId: this.projectId ? this.projectId : 0,
      keyword: this.keyword ? this.keyword : '',
    };

    this.projectService.getSynthesisOfGeneratedMaterials(data).subscribe({
      next: (response: any) => {
        this.tb_synthesisOfGeneratedMaterials.setData(response.data);
        this.isLoadTable = false;
      },
      error: (error) => {
        console.error('Lỗi:', error);
        this.isLoadTable = false;
      },
    });
  }
  //#endregion

  //#region Xuất excel
  exportExcel() {
    let table = this.tb_synthesisOfGeneratedMaterials;
    if (!table) return;

    let datatable = this.tb_synthesisOfGeneratedMaterials.getData();
    if (!datatable || datatable.length === 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất excel!');
      return;
    }
    this.projectService.exportExcel(
      table,
      datatable,
      'Báo cáo vật tư phát sinh',
      'BaoCaoVatTuPhatSinh'
    );
  }
  //#endregion
}
