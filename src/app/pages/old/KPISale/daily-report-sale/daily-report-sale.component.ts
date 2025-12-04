import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
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
import { AppUserService } from '../../../../services/app-user.service';

import { DailyReportSaleService } from './daily-report-sale-service/daily-report-sale.service';
@Component({
  selector: 'app-daily-report-sale',
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
    HasPermissionDirective,
  ],
  templateUrl: './daily-report-sale.component.html',
  styleUrl: './daily-report-sale.component.css'
})
export class DailyReportSaleComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_Master', { static: false }) tb_MasterElement!: ElementRef;
  
  tb_Master!: Tabulator;


  projects: any[] = [];
  customers: any[] = [];
  employees: any[] = [];
  // groupTypes: any[] = [];
  groupTypes: any[] = [
    { value: 0, label: 'Telesales' },
    { value: 1, label: 'Visit' },
    { value: 2, label: 'Demo/Test SP' },
  ];
  teamSales: any[] = [];
  filterTextSearch: string = '';
  mainData: any[] = [];

  filters: any = {
    dateStart: new Date(),
    dateEnd: new Date(),
    projectId: 0,
    customerId: 0,
    groupTypeId: -1,
    teamId: 0,
    employeeId: 0,
  };
  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  constructor(
    private dailyReportSaleService: DailyReportSaleService,
    private notification: NzNotificationService,
    private appUserService: AppUserService,
  ) { }

  ngOnInit(): void {
    this.loadProjects();
    this.loadCustomers();
    this.loadEmployeeTeamSale();
    this.loadGroupSale();
  }

  ngAfterViewInit(): void {
  }

  searchPOKH(): void {}

  loadProjects(): void {
    this.dailyReportSaleService.getProjects().subscribe(
      (response) => {
        if (response.status === 1) {
          this.projects = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải danh sách dự án');
        }
      },
      (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách dự án');
        console.error('Error loading projects:', error);
      }
    );
  }

  loadCustomers(): void {
    this.dailyReportSaleService.getCustomers().subscribe(
      (response) => {
        if (response.status === 1) {
          this.customers = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải danh sách khách hàng');
        }
      },
      (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách khách hàng');
        console.error('Error loading customers:', error);
      }
    );
  }

  loadEmployeeTeamSale(): void {
    this.dailyReportSaleService.getEmployeeTeamSale().subscribe(
      (response) => {
        if (response.status === 1) {
          this.teamSales = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải danh sách team sale');
        }
      },
      (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách team sale');
        console.error('Error loading employee team sale:', error);
      }
    );
  }

  loadGroupSale(): void {
    const userId = this.appUserService.id || 0;
    this.dailyReportSaleService.getGroupSale(userId).subscribe(
      (response) => {
        if (response.status === 1) {
          this.groupTypes = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải danh sách group sale');
        }
      },
      (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách group sale');
        console.error('Error loading group sale:', error);
      }
    );
  }

  initMainTable(): void {
    if (!this.tb_MasterElement) {
      console.error('tb_Master element not found');
      return;
    }
    this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
      data: this.mainData,
      layout: 'fitColumns',
      pagination: true,
      selectableRows: 1,
      paginationSize: 50,
      height: '100%',
      movableColumns: true,
      resizableRows: true,
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
      reactiveData: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        resizable: true,
      },
      columns: [
        {
          title: 'Mã team',
          field: 'Code',
          sorter: 'string',
        },
        {
          title: 'Team/ Chức vụ',
          field: 'Name',
          sorter: 'string',
        },
      ],
    });
  }
}
