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
import { AccountingContractTypeMasterService } from './accounting-contract-type-master-service/accounting-contract-type-master.service';
import { AppUserService } from '../../../../services/app-user.service';
import { AccountingContractTypeMasterDetailComponent } from './accounting-contract-type-master-detail/accounting-contract-type-master-detail.component';

@Component({
  selector: 'app-accounting-contract-type-master',
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
    HasPermissionDirective
  ],
  templateUrl: './accounting-contract-type-master.component.html',
  styleUrl: './accounting-contract-type-master.component.css'
})
export class AccountingContractTypeMasterComponent implements OnInit, AfterViewInit{
  @ViewChild('tb_Master', { static: false }) tb_MasterElement!: ElementRef;
  tb_Master!: Tabulator;
  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  keyword: string = '';
  selectedRow: any;
  constructor(
    private accountingContractTypeMasterService: AccountingContractTypeMasterService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private injector: EnvironmentInjector,
    private appUserService: AppUserService,
  ){}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initTable();
  }

  loadData(): void {
    this.keyword = this.keyword.trim();

    this.accountingContractTypeMasterService.loadData(this.keyword).subscribe((response: any) => {
      if (response.status === 1 && response.data) {
        this.tb_Master.replaceData(response.data);
      } else {
        this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi khi tải dữ liệu');
      }
    });
  }
  search(): void {
    this.loadData();
  }

  onAdd(): void {
    // Lấy dữ liệu từ bảng
    const tableData = this.tb_Master?.getData() || [];
    
    // Tìm STT lớn nhất
    let maxSTT = 0;
    if (tableData.length > 0) {
      maxSTT = Math.max(...tableData.map((row: any) => row.STT || 0));
    }
    
    // STT mới = STT lớn nhất + 1
    const newSTT = maxSTT + 1;

    const modalRef = this.modalService.open(AccountingContractTypeMasterDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });
    
    modalRef.componentInstance.editData = {
      ID: 0,
      TypeCode: '',
      TypeName: '',
      STT: newSTT,
      IsContractValue: false
    };
    modalRef.componentInstance.isEditMode = false;
    
    modalRef.result.then(
      (result) => {
        if (result && result.reloadData) {
          this.loadData();
        }
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  onEdit(): void {
    const selected = this.tb_Master?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một loại hợp đồng để sửa!');
      return;
    }
    const modalRef = this.modalService.open(AccountingContractTypeMasterDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.isEditMode = true;
    modalRef.componentInstance.editData = this.selectedRow;
    modalRef.result.then(
      (result) => {
        if (result && result.reloadData) {
          this.loadData();
        }
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  initTable(): void {
    if (!this.tb_MasterElement) {
      console.error('tb_Master element not found');
      return;
    }
    this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      rowHeader: false,
      selectableRows: 1,
      layout: 'fitColumns',
      columns: [
        {
          title: 'STT',
          field: 'STT',
          sorter: 'string',
          widthGrow: 9,
        },
        {
          title: 'Mã loại',
          field: 'TypeCode',
          sorter: 'string',
          widthGrow: 9,
        },
        {
          title: 'Tên loại hợp đồng',
          field: 'TypeName',
          sorter: 'string',
          widthGrow: 9,
        },
        {
          title: 'Giá trị HĐ',
          field: 'IsContractValue',
          sorter: 'boolean',
          widthGrow: 9,
          hozAlign: 'center',
          formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
          },
        },
      ]
    });
    this.tb_Master.on('rowClick', (e: any, row: RowComponent) => {
      const data = row.getData();
      this.selectedRow = data;
    });
  }
  
}
