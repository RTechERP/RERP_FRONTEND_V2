import { NzNotificationService } from 'ng-zorro-antd/notification'
import { Component, OnInit, Input, Output, EventEmitter, inject, AfterViewInit } from '@angular/core';
import { BillImportChoseProductFormComponent } from '../bill-import-chose-product-form/bill-import-chose-product-form.component';
import { DateTime } from 'luxon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TsAssetManagementPersonalService } from '../../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { Editor } from 'tabulator-tables';
import { BillImportTechnicalService } from '../bill-import-technical-service/bill-import-technical.service';
import { NzFormModule } from 'ng-zorro-antd/form'; //
import { BillImportChoseSerialComponent } from '../bill-import-chose-serial/bill-import-chose-serial.component';
import { FormGroup, FormBuilder, Validators } from '@angular/forms'; 

@Component({
  standalone: true,
  imports: [
    NzCheckboxModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
  ],
  selector: 'app-bill-import-technical-form',
  templateUrl: './bill-import-technical-form.component.html',
  styleUrls: ['./bill-import-technical-form.component.css']
})
export class BillImportTechnicalFormComponent implements OnInit, AfterViewInit {
  // danh sách loại phiếu nhập kĩ thuật
  billType: any = [
    { ID: 1, Name: "Mượn NCC" },
    { ID: 2, Name: "Mua NCC" },
    { ID: 3, Name: "Trả" },
    { ID: 4, Name: "Nhập nội bộ" },
    { ID: 5, Name: "Y/c nhập kho" },
    { ID: 6, Name: "Nhập hàng bảo hành" },
    { ID: 7, Name: "NCC tặng/cho" },
  ];
  @Input() masterId!: number;
  @Input() dataEdit: any;
  @Input() dataInput: any;
  formDeviceInfo!: FormGroup;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  employeeSelectOptions: { label: string, value: number }[] = [];
  // danh sách chứng từ
  documentBillImport: any[] = [];
  // Thiết bị được chọn
  selectedDevices: any[] = [];
  // bảng tạm danh sách thiết bị
  deviceTempTable: Tabulator | null = null;
  // Danh sách khách hàng
  customerList: any[] = [];
  // Danh sách nhà cung cấp
  nccList: any[] = [];
  // Danh sách điều khoản thanh toán
  rulePayList: any[] = [];
  // Danh sách nhân viên
  emPloyeeLists: any[] = [];
  private ngbModal = inject(NgbModal);
  public activeModal = inject(NgbActiveModal);
  constructor(private TsAssetManagementPersonalService: TsAssetManagementPersonalService,
    private billImportTechnicalService: BillImportTechnicalService,
    private notification: NzNotificationService,
  ) { }
  // Khởi tạo form
  initForm() {
    this.formDeviceInfo = new FormBuilder().group({
      ID: [null],
      BillCode: ['', Validators.required],
      CreatDate: [null, Validators.required],
      Deliver: ['', Validators.required],
      BillType: [null],
      WarehouseType: ['', Validators.required],
      DeliverID: [null, Validators.required],
      ReceiverID: [null, Validators.required],
      WarehouseID: [1, Validators.required],
      SupplierSaleID: [null, Validators.required],
      RulePayID: [null, Validators.required],
      CustomerID: [null, Validators.required],
      ApproverID: [null, Validators.required],
      Receiver: [''],
      Status: [false],
      Suplier: [''],
      SuplierID: [null],
      GroupTypeID: [null],
      CreatedBy: [''],
      CreatedDate: [null],
      UpdatedBy: [''],
      UpdatedDate: [null],
      Image: [''],
      BillTypeNew: [null],
      IsBorrowSupplier: [false],
      BillDocumentImportType: [null],
      DateRequestImport: [null],
      IsNormalize: [false],
    });
  }
  getCustomer() {
    this.billImportTechnicalService.getCustomer().subscribe((res: any) => {
      this.customerList = res.data;
  
    });
  }
  getNCC() {
    this.billImportTechnicalService.getNCC().subscribe((res: any) => {
      this.nccList = res.data;
    });
  }
  getRulepay() {
    this.billImportTechnicalService.getRulepay().subscribe((res: any) => {
      this.rulePayList = res.data; 
    });
  }
  getListEmployee() {
    this.TsAssetManagementPersonalService.getListEmployee().subscribe((respon: any) => {
      this.emPloyeeLists = respon.employees;
      this.employeeSelectOptions = this.emPloyeeLists.map((e: any) => ({
        label: e.FullName,
        value: e.ID
      }));
  

      if (this.deviceTempTable) {
        this.deviceTempTable.setColumns(this.deviceTempTable.getColumnDefinitions()); // force update
      }
    });
  }

  ngAfterViewInit(): void {
    this.drawTableSelectedDevices();
  }
  ngOnInit() {
    this.initForm();
    if (this.dataEdit) {
      this.formDeviceInfo.patchValue({
        ...this.dataEdit,
        CreatDate: this.dataEdit?.CreatDate ? DateTime.fromISO(this.dataEdit.CreatDate).toJSDate() : null,
        DateRequestImport: this.dataEdit?.DateRequestImport ? DateTime.fromISO(this.dataEdit.DateRequestImport).toJSDate() : null
      });
    }
    if (this.masterId) {
      this.billImportTechnicalService.getBillImportDetail(this.masterId).subscribe(res => {
        this.selectedDevices = res.billDetail || [];
        this.drawTableSelectedDevices();
      });
    }
    this.getNewCode();
    this.getRulepay();
    this.getNCC();
    this.getCustomer();
    this.getDocumentImport();
    this.getListEmployee();
  }
  changeStatus() {
    this.getNewCode();
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  getDocumentImport() {
    this.billImportTechnicalService.getDocumentBillImport(1, 1).subscribe((respon: any) => {
      this.documentBillImport = respon.document;
   
    });
  }
  getNewCode() {
    const billType = this.formDeviceInfo.get('BillTypeNew')?.value ?? 0;
    this.billImportTechnicalService.getBillCode(billType).subscribe({
      next: (res: any) => {
    
        this.formDeviceInfo.patchValue({ BillCode: res.data });
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy mã phiếu');
      }
    });
  }
  openModalChoseProduct() {
    const modalRef = this.ngbModal.open(BillImportChoseProductFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.formSubmitted.subscribe((selectedProducts: any[]) => {
      this.selectedDevices = [...this.selectedDevices, ...selectedProducts];

      if (this.deviceTempTable) {
        this.deviceTempTable.setData(this.selectedDevices);
      }
    });
  }
  // Vẽ bảng tạm chọn thiết bị
  drawTableSelectedDevices() {
    this.deviceTempTable = new Tabulator('#deviceTempTable', {
      layout: 'fitColumns',
      data: this.selectedDevices,
      selectableRows: true,
      height:'47vh',
      pagination: true,
      paginationSize: 10,
      paginationSizeSelector: [5, 10, 20, 50],
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        resizable: true
      },
      columns: [
        {
          title: "",
          field: "addRow",
          hozAlign: "center",
          width: 40,
          headerSort: false,
          titleFormatter: () => `
  <div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
          headerClick: () => { this.addRow(); },
          formatter: () => `<i class="fas fa-times text-danger cursor-pointer" title="Xóa dòng"></i>`,
          cellClick: (e, cell) => { cell.getRow().delete(); },
        },
        { title: "STT", formatter: "rownum", hozAlign: "center", width: 60 },
        { title: "Mã sản phẩm", field: "ProductCode" },
        { title: "Tên sản phẩm", field: "ProductName" },
        { title: "ProductID", field: "ProductID", visible: false },
        { title: "Code RTC", field: "ProductCodeRTC", visible: false },
        { title: "Đơn vị tính", field: "UnitCountName" },
        {
          title: "Người mượn",
          field: "EmployeeIDBorrow",
          editor: "select" as Editor,
          editorParams: {
            values: this.employeeSelectOptions
          },
          formatter: (cell) => {
            const val = cell.getValue();
            const emp = this.employeeSelectOptions.find(e => e.value === val);
            return emp ? emp.label : '';
          }
        },
        {
          title: "DeadlineReturnNCC",
          field: "DeadlineReturnNCC",
          editor: "input",
          editorParams: {
            elementAttributes: {
              type: "date"
            }
          },
          mutator: (value) => {
            return value ? new Date(value).toISOString() : null;
          },
          formatter: (cell) => {
            const val = cell.getValue();
            return val ? new Date(val).toLocaleDateString() : "";
          }
        },
        { title: "Số lượng", field: "Quantity", editor: "input" },
        { title: "Ghi chú", field: "Note", editor: "input" },
        { title: "Serial IDs", field: "SerialIDs" },
        // Chọn serial
        {
          title: "",
          field: "addRow",
          hozAlign: "center",
          width: 40,
          headerSort: false,
          titleFormatter: () => `
    <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
      <i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i>
    </div>`,
          formatter: () => `
  <i class="fas fa-plus text-success cursor-pointer" title="Thêm serial"></i>
  `,
          cellClick: (e, cell) => {
            const row = cell.getRow();
            const rowData = row.getData();
            const quantity = rowData['Quantity'];
            const productCode = rowData['ProductCode'];
            const serialIDsRaw = rowData['SerialIDs'];
            if (quantity <= 0) {
              this.notification.warning('Cảnh báo', 'Vui lòng nhập số lượng lớn hơn 0 trước khi chọn Serial!');
              return;
            }
            if (serialIDsRaw) {
              const serialIDs = serialIDsRaw
                .split(',')
                .map((id: string) => parseInt(id))
                .filter((id: number) => !isNaN(id) && id > 0);

              const existingSerials: { ID: number; Serial: string }[] = [];
              let loadedCount = 0;
              serialIDs.forEach((id: number) => {
                this.billImportTechnicalService.getSerialByID(id).subscribe({
                  next: (res) => {
                    if (res?.status === 1 && res.data) {
                      existingSerials.push({
                        ID: res.data.ID,
                        Serial: res.data.SerialNumber || res.data.Serial || ''
                      });
                    }
                  },
                  error: (err) => {
                    console.error(`Lỗi khi load serial ID ${id}:`, err);
                  },
                  complete: () => {
                    loadedCount++;
                    if (loadedCount === serialIDs.length) {

                      this.openSerialModal(rowData, row, quantity, productCode, existingSerials);
                    }
                  }
                });
              });
            } else {
              this.openSerialModal(rowData, row, quantity, productCode, []);
            }
          }
        },
      ],
      placeholder: 'Chưa có thiết bị nào được chọn'
    });
  }
  // Mở modal chọn serial
  openSerialModal(
    rowData: any,
    row: RowComponent,
    quantity: number,
    productCode: string,
    existingSerials: { ID: number; Serial: string }[]
  ) {
    const modalRef = this.ngbModal.open(BillImportChoseSerialComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.quantity = quantity;
    modalRef.componentInstance.productCode = productCode;
    modalRef.componentInstance.existingSerials = existingSerials;

    modalRef.result.then((serials: { ID: number; Serial: string }[]) => {
      const newSerial = serials.map(s => s.Serial).join(', ');
      const serialIDs = serials.map(s => s.ID).join(', ');
      rowData['Serial'] = newSerial;
      rowData['SerialIDs'] = serialIDs;
      row.update(rowData);
    }).catch(() => { });
  }
  // Thêm dòng mới vào bảng tạm 
  addRow() {
    if (this.deviceTempTable) {
      const newRow = {
        UID: Date.now() + Math.random(),
        ProductCode: '',
        ProductName: '',
        NumberInStore: 1,
        Serial: '',
        Note: ''
      };
      this.selectedDevices.push(newRow);
      this.deviceTempTable.setData(this.selectedDevices);
    }
  }
  // Lưu dữ liệu
  async saveData() {
    if (this.formDeviceInfo.invalid) {
      Object.values(this.formDeviceInfo.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    const formValue = this.formDeviceInfo.value;
    const payload = {
      billImportTechnical: {
        ID: formValue.ID || 0,
        BillCode: formValue.BillCode,
        CreatDate: formValue.CreatDate,
        Deliver: formValue.Deliver,
        Receiver: formValue.Receiver || '',
        Status: formValue.Status || false,
        Suplier: formValue.Suplier || '',
        BillType: false,
        WarehouseType: formValue.WarehouseType,
        DeliverID: formValue.DeliverID,
        ReceiverID: formValue.ReceiverID,
        SuplierID: 0,
        GroupTypeID: 0,
        Image: formValue.Image || '',
        WarehouseID: formValue.WarehouseID || 1,
        SupplierSaleID: formValue.SupplierSaleID || 0,
        BillTypeNew: formValue.BillTypeNew || 0,
        IsBorrowSupplier: formValue.IsBorrowSupplier || 0,
        CustomerID: formValue.CustomerID || 0,
        BillDocumentImportType: formValue.BillDocumentImportType || 0,
        DateRequestImport: formValue.CreatDate,
        RulePayID: formValue.RulePayID,
        IsNormalize: formValue.IsNormalize || false,
        ApproverID: formValue.ApproverID || 0
      },
      billImportDetailTechnicals: this.selectedDevices.map((device, index) => ({
        ID: device.ID || 0,
        STT: index + 1,
        ProductID: device.ProductID || null,
        ProductCode: device.ProductCode || '',
        ProductName: device.ProductName || '',
        ProductCodeRTC: device.ProductCodeRTC || '',
        Serial: device.Serial || '',
        SerialNumber: device.SerialNumber || '',
        PartNumber: device.PartNumber || '',
        UnitCountName: device.UnitCountName || '',
        NumberInStore: device.NumberInStore || 1,
        Note: device.Note || '',
        DeadlineReturnNCC: device.DeadlineReturnNCC ? DateTime.fromJSDate(new Date(device.DeadlineReturnNCC)).toISO() : null,
        LocationName: device.LocationName || '',
        Quantity: device.Quantity || 1,
        TotalQuantity: device.Quantity || 1,
        Price: device.Price || 0,
        TotalPrice: device.TotalPrice || 0,
        UnitID: device.UnitCountID || 0,
        UnitName: device.UnitCountName || '',
        ProjectID: device.ProjectID || 0,
        ProjectCode: device.ProjectCode || '',
        ProjectName: device.ProjectName || '',
        SomeBill: device.SomeBill || '',
        ProductRTCQRCodeID: 0
      })),
      billImportTechDetailSerials: this.selectedDevices.flatMap(device => {
        const detailID = device.ID || 0;
        const serialIDs = (device.SerialIDs || '')
          .split(',')
          .map((id: string) => parseInt(id.trim()))
          .filter((id: number) => !isNaN(id) && id > 0);

        return serialIDs.map((serialID: number) => ({
          BillImportDetailID: detailID,
          ID: serialID
        }));
      })
    };

    this.billImportTechnicalService.saveData(payload).subscribe({
      next: (response: any) => {
   
        this.notification.success('Thành công', 'Lưu phiếu thành công');
        this.formSubmitted.emit();
        this.activeModal.close();
      },
      error: (error: any) => {
        console.error('Lỗi khi lưu dữ liệu:', error);
        this.notification.error('Lỗi', 'Không thể lưu phiếu, vui lòng thử lại sau');
      }
    });

  }
}
