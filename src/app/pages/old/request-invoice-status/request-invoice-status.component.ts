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
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

import { RequestInvoiceStatusLinkService } from '../request-invoice-status-link/request-invoice-status-link-service/request-invoice-status-link.service'; 
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { RequestInvoiceStatusDetailComponent } from './request-invoice-status-detail/request-invoice-status-detail.component';

@Component({
  selector: 'app-request-invoice-status',
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
    HasPermissionDirective
  ],
  templateUrl: './request-invoice-status.component.html',
  styleUrl: './request-invoice-status.component.css'
})
export class RequestInvoiceStatusComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_Table', { static: false }) tb_TableElement!: ElementRef;

  private tb_Table!: Tabulator;

  selectedRow: any = null;
  selectedId: number = 0;
  form!: FormGroup;
  
  isModalVisible: boolean = false;
  isEdit: boolean = false;

  mainData: any[] = [];
  
  constructor(
    public activeModal: NgbActiveModal,
    private modal: NzModalService,
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private fb: FormBuilder,
    private requestInvoiceStatusLinkService: RequestInvoiceStatusLinkService
  ){}

  ngOnInit(): void {
    this.form = this.fb.group({
      ID: [0],
      StatusCode: [''],
      StatusName: ['']
    });
    this.loadStatus()
  }

  ngAfterViewInit(): void {
    this.initTable()
  }
  loadStatus() {
    this.requestInvoiceStatusLinkService.getStatus().subscribe(
      (response) => {
        if (response.status === 1) {
          this.mainData = response.data || [];
          if (this.mainData.length > 0 && this.tb_Table) {
            this.tb_Table.replaceData(this.mainData);
          }
        } else {
          console.error('Lỗi khi tải Customer:', response.message);
        }
      },
      (error) => {
        console.error('Lỗi kết nối khi tải Customer:', error);
      }
    );
  }
  
  closeModal() {
    this.activeModal.close({ success: true, reloadData: true });
  }

  openModal() {
    const modalRef = this.modalService.open(RequestInvoiceStatusDetailComponent, {
      centered: true,
      size: 'l',
      backdrop: 'static',
    });

    modalRef.result.then(
      (result) => {
        if (result.success && result.reloadData) {
          this.loadStatus();
        }
      },
      (reason) => {
        console.log('Modal closed');
      }
    );
  }

  onEdit() {
    const modalRef = this.modalService.open(RequestInvoiceStatusDetailComponent, {
      centered: true,
      size: 'l',
      backdrop: 'static',
    });

    modalRef.componentInstance.isEditMode = true;
    modalRef.componentInstance.dataEdit = this.selectedRow;

    modalRef.result.then(
      (result) => {
        if (result.success && result.reloadData) {
          this.loadStatus();
        }
      },
      (reason) => {
        console.log('Modal closed');
      }
    );
  }

  onDelete(){

    if (!this.selectedRow) {
      this.notification.error("Lỗi", "Vui lòng chọn dòng cần xóa!");
      return;
    }

    if (this.selectedRow.ID === 1) {
      this.notification.error("Không thể xóa", "Trạng thái mặc định không thể xóa!");
      return;
    }

    const payload = {
      ID: this.selectedId,
      IsDeleted: true
    };
  
    this.requestInvoiceStatusLinkService.saveStatus(payload).subscribe({
      next: (res) => {
        this.notification.success("Thành công", "Xóa trạng thái thành công!");
      },
      error: () => {
        this.notification.error("Lỗi", "Xóa dữ liệu thất bại!");
      }
    });
  }

  initTable(): void {
    if (!this.tb_TableElement) {
      console.error('tb_Table element not found');
      return;
    }
    this.tb_Table = new Tabulator(this.tb_TableElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      data: this.mainData,
      selectableRows: 1,
      height: '100%',
      rowFormatter: (row) => {
        const data = row.getData();
        if (data["ID"] === 1) {
          row.getElement().style.backgroundColor = "#ffe6f2"; // màu hồng nhạt
          row.getElement().style.fontWeight = "600";
        }
      },
      columns: [
        {
          title: 'ID',
          field: 'ID',
          sorter: 'string',
          visible: false,
        },
        {
          title: 'Mã trạng thái',
          field: 'StatusCode',
          sorter: 'string',
          width: "50%",
        },
        {
          title: 'Tên trạng thái',
          field: 'StatusName',
          sorter: 'string',
          width: "50%",
        },
      ],
    });
    this.tb_Table.on('rowClick', (e: any, row: RowComponent) => {
      const data = row.getData();
      this.selectedRow = data;
      this.selectedId = data["ID"];
    });
    
  }
}
