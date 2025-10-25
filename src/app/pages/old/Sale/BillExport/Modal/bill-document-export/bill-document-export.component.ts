import { Component, OnInit, AfterViewInit, ViewChild, Input, Type, ApplicationRef, EnvironmentInjector, createComponent } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { NgbModal, NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import { RowComponent } from 'tabulator-tables';

import { SelectControlComponent } from '../select-control/select-control.component';
import { ProductSaleDetailComponent } from '../../../ProductSale/product-sale-detail/product-sale-detail.component';
import { BillExportService } from '../../bill-export-service/bill-export.service';

@Component({
  selector: 'app-bill-document-export',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
    NgbModule,
    NzDividerModule,
    NzDatePickerModule,
    ProductSaleDetailComponent,
    SelectControlComponent,
  ],
  templateUrl: './bill-document-export.component.html',
  styleUrl: './bill-document-export.component.css'
})
export class BillDocumentExportComponent implements OnInit, AfterViewInit {
  @Input() id: number = 0;
  @Input() code: string = '';

  dataBillDocumentExport: any[] = [];
  table_billDocumentExport: any;

  dataBillDocumentExportLog: any[] = [];
  table_billDocumentExportLog: any;

  bdeID: number = 0;

  flag: boolean=true;
  
  cbbStatus: any = [
    { ID: 1, Name: "Đã nhận" },
    { ID: 2, Name: "Đã hủy nhận" },
    { ID: 3, Name: "Không có" },
  ];

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private billExportService: BillExportService,
    private notification: NzNotificationService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    public activeModal: NgbActiveModal,
    private modalServiceConfirm: NzModalService, // inject thêm
  ) { }

  ngOnInit(): void {
    this.getBillDocumentExport();
  }

  ngAfterViewInit(): void {
    this.drawTable();
  }

  getBillDocumentExport() {
    this.billExportService.getBillDocumentExport(this.id).subscribe({
      next: (res) => {
        if (res?.data && Array.isArray(res.data)) {
          this.dataBillDocumentExport = res.data;
          this.table_billDocumentExport?.replaceData(this.dataBillDocumentExport);
        }
      },
      error: (err) => console.error('Lỗi khi lấy chứng từ', err)
    });
  }

  getBillDocumentExportLog(bdeID: number) {
    this.billExportService.getBillDocumentExportLog(bdeID).subscribe({
      next: (res) => {
        if (res?.data && Array.isArray(res.data)) {
          this.dataBillDocumentExportLog = res.data;
          this.table_billDocumentExportLog?.replaceData(this.dataBillDocumentExportLog);
        }
      },
      error: (err) => console.error('Lỗi khi lấy lịch sử chứng từ ', err)
    });
  }

  closeModal() {
    if(this.flag===false){
      this.modalServiceConfirm.confirm({
        nzTitle: 'Xác nhận thoát',
        nzContent: 'Bạn có chắc chắn muốn thoát không? Mọi thay đổi chưa lưu sẽ bị mất.',
        nzOkText: 'Thoát',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.activeModal.dismiss(true);
        }
      });
    }else{
      this.activeModal.dismiss(true);
    }
    
  }

  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    getData: () => any[],
    config: { valueField: string; labelField: string; placeholder?: string; }
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, { environmentInjector: injector });

      componentRef.instance.id = cell.getValue();
      componentRef.instance.data = getData();
      componentRef.instance.valueField = config.valueField;
      componentRef.instance.labelField = config.labelField;
      if (config.placeholder) componentRef.instance.placeholder = config.placeholder;

      componentRef.instance.valueChange.subscribe((val: any) => success(val));

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => { });

      return container;
    };
  }

  saveData() {
    const updatedData = this.table_billDocumentExport.getData(); // Lấy dữ liệu mới nhất
    debugger
    for (const item of updatedData) {
      const code = item.Code || '[Không có mã]';
  
      // Kiểm tra nếu Status bị rỗng
      if (item.Status == null || item.Status === '' || item.Status==0) {
        this.notification.warning("Thông báo", `Vui lòng chọn trạng thái chứng từ ${code}.`);
  
        const row = this.table_billDocumentExport.getRow(item.ID);
        if (row) {
          const cell = row.getCell('Status');
          if (cell) cell.edit(); // focus vào cell Status
        }
  
        return;
      }
  
      // Nếu trạng thái là 2 mà Note trống
      if (item.Status === 2 && (!item.Note || item.Note.trim() === '')) {
        this.notification.warning("Thông báo", `Vui lòng nhập lý do hủy cho chứng từ ${code}.`);
  
        const row = this.table_billDocumentExport.getRow(item.ID);
        if (row) {
          const cell = row.getCell('Note');
          if (cell) cell.edit(); // focus vào cell Note
        }
  
        return;
      }
    }
  
    // Nếu không có lỗi, tiến hành gửi tất cả dữ liệu
    this.billExportService.saveDataBillDocumentExport(updatedData).subscribe({
      next: (res: any) => {
        this.notification.success("Thành công", "Lưu thay đổi thành công.");
        this.getBillDocumentExport(); // Load lại dữ liệu sau khi lưu
        this.getBillDocumentExportLog(updatedData[0].ID)
        this.flag = true;
      },
      error: (err: any) => {
        this.notification.error("Lỗi", "Không thể lưu dữ liệu.");
        console.error(err);
      }
    });
  }
  
  
  

  drawTable() {
    const formatDate = (cell: any) => {
      const value = cell.getValue();
      const date = new Date(value);
      if (!value || isNaN(date.getTime())) return "";
      return `${('0' + date.getDate()).slice(-2)}/${('0' + (date.getMonth() + 1)).slice(-2)}/${date.getFullYear()}`;
    };

    if (!this.table_billDocumentExport) {
      this.table_billDocumentExport = new Tabulator("#table_billDocumentExport", {
        index: "ID",
        data: this.dataBillDocumentExport,
        layout: "fitDataStretch",
        height: "30vh",
        reactiveData: true,
        resizableRows: true,
        selectableRows: 1,
        columns: [
          {
            title: "Trạng thái",
            field: "Status",
            hozAlign: "left",
            headerHozAlign: "center",
            width: 200,
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.cbbStatus,
              { valueField: 'ID', labelField: 'Name' }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p><i class="fas fa-angle-down"></i></div>';
              const st = this.cbbStatus.find((p: any) => p.ID === val);
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${st ? st.Name : val}</p><i class="fas fa-angle-down"></i></div>`;
            },
          },
          { title: "Mã chứng từ", field: "Code", hozAlign: "left", headerHozAlign: "center" },
          { title: "Tên chứng từ", field: "Name", hozAlign: "left", headerHozAlign: "center" },
          { title: "Lý do / Ghi chú", field: "Note", hozAlign: "left", headerHozAlign: "center", editor: 'input' },
          { title: "Ngày thay đổi", field: "UpdatedDate", hozAlign: "center", headerHozAlign: "center", formatter: formatDate },
        ],
      });

      this.table_billDocumentExport.on("rowSelected", (row: RowComponent) => {
        const rowData = row.getData();
        this.bdeID = rowData['ID'];
        this.getBillDocumentExportLog(this.bdeID);
      });

      this.table_billDocumentExport.on("rowDeselected", () => {
        if (this.table_billDocumentExport.getSelectedRows().length === 0) {
          this.bdeID = 0;
          this.table_billDocumentExportLog?.replaceData([]);
        }
      });
      this.table_billDocumentExport.on("cellEdited", (cell:any) => {
        this.flag = false; // Đánh dấu dữ liệu đã thay đổi
      });
      
    } else {
      this.table_billDocumentExport.replaceData(this.dataBillDocumentExport);
    }

    if (!this.table_billDocumentExportLog) {
      this.table_billDocumentExportLog = new Tabulator("#table_billDocumentExportLog", {
        index: "ID",
        data: this.dataBillDocumentExportLog,
        layout: "fitDataStretch",
        height: "30vh",
        reactiveData: true,
        resizableRows: true,
        selectableRows: 1,
        columns: [
          { title: "Trạng thái", field: "StatusText", hozAlign: "left", headerHozAlign: "center" },
          { title: "Mã chứng từ", field: "Code", hozAlign: "left", headerHozAlign: "center" },
          { title: "Tên chứng từ", field: "Name", hozAlign: "left", headerHozAlign: "center" },
          { title: "Lý do / Ghi chú", field: "Note", hozAlign: "left", headerHozAlign: "center" },
          { title: "Ngày thay đổi", field: "UpdatedDate", hozAlign: "center", headerHozAlign: "center"},
        ],
      });
    } else {
      this.table_billDocumentExportLog.replaceData(this.dataBillDocumentExportLog);
    }
  }
}
