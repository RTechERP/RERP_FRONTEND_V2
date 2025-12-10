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

import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { PokhService } from '../../../pokh/pokh-service/pokh.service';
import { EmployeeSaleManagerService } from '../employee-sale-manager-service/employee-sale-manager.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';

@Component({
  selector: 'app-employee-team-sale-detail',
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
  templateUrl: './employee-team-sale-detail.component.html',
  styleUrl: './employee-team-sale-detail.component.css'
})
export class EmployeeTeamSaleDetailComponent implements OnInit, AfterViewInit {

  @Input() selectedGroupSaleId: number = 0;
  @ViewChild('tb_Master', { static: false }) tb_MasterElement!: ElementRef;

  tb_Master!: Tabulator;

  dataTable: any[] = [];
  
  selectedRowsIds: number[] = [];

  constructor(
    private POKHService: PokhService,
    private notification: NzNotificationService,
    private employeeSaleManagerService: EmployeeSaleManagerService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private activeModal: NgbActiveModal,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initEmployeeSaleTable();
  }
  
  closeModal(): void {
    this.activeModal.close();
  }

  saveAndClose() {

    if (this.selectedRowsIds.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một nhân viên');
      return;
    }

    const payload = {
      EmployeeIds: this.selectedRowsIds,
      EmployeeTeamSaleId: this.selectedGroupSaleId
    };

    this.employeeSaleManagerService.saveEmployeeDetail(payload).subscribe((res: any) => {
      if (res.status === 1) {
        this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Lưu thành công');
        this.activeModal.close({ success: true, reloadData: true });
      } else {
        this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Lưu thất bại');
      }
    }, (error: any) => {
      this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu');
    });
  }

  loadData(): void {
    this.employeeSaleManagerService.getEmployeeDetail().subscribe((res: any) => {
      if (res.status === 1) {
        this.dataTable = res.data;
        this.tb_Master.replaceData(this.dataTable);
      } else {
        this.notification.error(NOTIFICATION_TITLE.error, res.message);
        return;
      }
    });
  }

  initEmployeeSaleTable(): void {
    if (!this.tb_MasterElement) {
      console.error('tb_Detail element not found');
      return;
    }
    this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.dataTable,
      layout: 'fitColumns',
      height: '75vh',
      selectableRows: true,
      pagination: false,
      groupBy: 'DepartmentName',
      columns: [
        {
          title: 'Mã nhân viên',
          field: 'Code',
          sorter: 'string',
        },
        {
          title: 'Tên nhân viên',
          field: 'FullName',
          sorter: 'string',
        },
        {
          title: 'Phòng ban',
          field: 'DepartmentName',
          sorter: 'string',
          visible: false,
        },
      ],
    });
    
    // Khi row được select, thêm ID vào selectedRowsIds
    this.tb_Master.on('rowSelected', (row: RowComponent) => {
      const rowData = row.getData();
      if (rowData["ID"] && !this.selectedRowsIds.includes(rowData["ID"])) {
        this.selectedRowsIds.push(rowData["ID"]);
      }
    });
    
    // Khi row bị deselect, xóa ID khỏi selectedRowsIds
    this.tb_Master.on('rowDeselected', (row: RowComponent) => {
      const rowData = row.getData();
      if (rowData["ID"]) {
        const index = this.selectedRowsIds.indexOf(rowData["ID"]);
        if (index > -1) {
          this.selectedRowsIds.splice(index, 1);
        }
      }
    });
  }
}
