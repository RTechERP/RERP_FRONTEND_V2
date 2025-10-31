import { NzNotificationService } from 'ng-zorro-antd/notification'
import { Component, OnInit, Input, Output, EventEmitter, inject, AfterViewInit } from '@angular/core';
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
import { TbProductRtcFormComponent } from '../../tb-product-rtc/tb-product-rtc-form/tb-product-rtc-form.component';
import { BillImportTechnicalService } from '../../bill-import-technical/bill-import-technical-service/bill-import-technical.service';
import { BillExportTechnicalService } from '../bill-export-technical-service/bill-export-technical.service';
import { NzFormModule } from 'ng-zorro-antd/form'; //
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BillExportChoseSerialComponent } from '../bill-export-chose-serial/bill-export-chose-serial.component';
import { BillImportChoseProductFormComponent } from '../../bill-import-technical/bill-import-chose-product-form/bill-import-chose-product-form.component';
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
  selector: 'app-bill-export-technical-form',
  templateUrl: './bill-export-technical-form.component.html',
  styleUrls: ['./bill-export-technical-form.component.css']
})
export class BillExportTechnicalFormComponent implements OnInit, AfterViewInit {
  @Input() masterId!: number;
  @Input() dataEdit: any;
  @Input() dataInput: any;
  formDeviceInfo!: FormGroup;
  @Output() formSubmitted = new EventEmitter<void>();
  notification = inject(NzNotificationService);
  @Output() closeModal = new EventEmitter<void>();
  public activeModal = inject(NgbActiveModal);
  deviceTempTable: Tabulator | null = null;
  selectedDevices: any[] = [];
  customerList: any[] = [];
  nccList: any[] = [];
  emPloyeeLists: any[] = [];
  employeeSelectOptions: { label: string, value: number }[] = [];
  billImportTechnicalService = inject(BillImportTechnicalService);
  private ngbModal = inject(NgbModal);
  constructor(private billExportTechnicalService: BillExportTechnicalService,
    private TsAssetManagementPersonalService: TsAssetManagementPersonalService) { }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  ngOnInit() {
    this.initForm();
    this.getNewCode();
    this.getCustomer();
    this.getListEmployee();
    this.getNCC();
    if (this.dataEdit) {
      this.formDeviceInfo.patchValue(this.dataEdit);
    } else if (this.dataInput) {
      this.formDeviceInfo.patchValue(this.dataInput);
    }
    const currentCode = this.formDeviceInfo.get('BillCode')?.value;
    if (!currentCode) {
      this.getNewCode();
    }
  }
  ngAfterViewInit(): void {
    this.drawTableSelectedDevices(); // vẽ bảng rỗng trước
    if (this.masterId) {
      this.billExportTechnicalService.getBillExportDetail(this.masterId).subscribe(res => {
        this.selectedDevices = res.billDetail || [];
        if (this.deviceTempTable) {
          this.deviceTempTable.setData(this.selectedDevices); // đổ lại dữ liệu
        }
      });
    }
  }
  // Hàm khởi tạo form
  initForm() {
    this.formDeviceInfo = new FormBuilder().group({
      ID: [null],
      Code: ['', Validators.required],
      BillType: [null, Validators.required],
      CustomerID: ['', Validators.required],
      Receiver: [null],
      Deliver: [{ value: 'ADMIN', disabled: false }, Validators.required],
      Addres: [null],
      Status: [null],
      WarehouseType: [{ value: 'Demo', disabled: false }, Validators.required],
      Note: [null],
      Image: [null],
      ReceiverID: [null, Validators.required],
      DeliverID: [null],
      SupplierID: [''],
      CustomerName: [false],
      SupplierName: [''],
      CheckAddHistoryProductRTC: [null],
      ExpectedDate: [null, Validators.required],
      ProjectName: ['', Validators.required],
      WarehouseID: [null],
      CreatedBy: [''],
      CreatedDate: [null, Validators.required],
      UpdatedBy: [''],
      UpdatedDate: [null],
      SupplierSaleID: [false, Validators.required],
      BillDocumentExportType: [null],
      ApproverID: [54, Validators.required],
      IsDeleted: [false],
    });
  }
  //Hàm sinh code của phiếu xuất 
  getNewCode() {
    const billType = this.formDeviceInfo.get('BillType')?.value ?? 0;
    this.billExportTechnicalService.getBillCode(billType).subscribe({
      next: (res: any) => {
     
        this.formDeviceInfo.patchValue({ Code: res.data });
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy mã phiếu');
      }
    });
  }
  //Lấy thông tin khách hàng
  getCustomer() {
    this.billImportTechnicalService.getCustomer().subscribe((res: any) => {
      this.customerList = res.data;
 
    });
  }
  //Lấy thông tin nhà cung cấp
  getNCC() {
    this.billImportTechnicalService.getNCC().subscribe((res: any) => {
      this.nccList = res.data;
 
    });
  }
  //Lấy danh sách nhân viên
  getListEmployee() {
     const request = { status: 0, departmentid: 0, keyword: '' };
    this.TsAssetManagementPersonalService.getEmployee(request).subscribe((respon: any) => {
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
  //Vẽ bảng tạm để chọn sản phẩm
  drawTableSelectedDevices() {
    this.deviceTempTable = new Tabulator('#deviceTempTable', {
      layout: 'fitColumns',
      data: this.selectedDevices,
      selectableRows: true,
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
        { title: "Mã nội bộ", field: "ProductCodeRTC", visible: false },
        { title: "Tên sản phẩm", field: "ProductName" },
        { title: "DVT", field: "UnitCountName" },
        { title: "Số lượng xuất", field: "Quantity" },
        { title: "Hãng", field: "Maker" },
        { title: "Ghi chú", field: "Note", editor: "input" },
        { title: "Serial IDs", field: "SerialIDs" },
        { title: "UnitCountID", field: "UnitCountID" },
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
                this.billExportTechnicalService.getSerialByID(id).subscribe({
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

    });
  }
  openSerialModal(
    rowData: any,
    row: RowComponent,
    quantity: number,
    productCode: string,
    existingSerials: { ID: number; Serial: string }[]
  ) {
    const modalRef = this.ngbModal.open(BillExportChoseSerialComponent, {
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
  // Mở modal chọn sản phẩm
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
  // Thêm dòng trống vào bảng
  addRow() {
    if (this.deviceTempTable) {
      const newRow = {

        ProductCode: '',
        ProductName: '',
        Quantity: 1,

        Note: ''
      };
      this.selectedDevices.push(newRow);
      this.deviceTempTable.setData(this.selectedDevices);
    }
  }
  // mở modal thêm sản phẩm
  openModalAddProduct() {
    const modalRef = this.ngbModal.open(TbProductRtcFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = null;
  }
  onReceiverChange(selectedId: number) {
    const selected = this.emPloyeeLists.find(e => e.ID === selectedId);
    if (selected) {
      this.formDeviceInfo.patchValue({
        ReceiverName: selected.FullName
      });
    }
  }
  getReceiverNameById(id: number): string {
    const emp = this.emPloyeeLists.find(e => e.ID === id);
    return emp ? emp.FullName : '';
  }
  // hàm lưu dữ liệu
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
      billExportTechnical: {
        ID: formValue.ID || 0,
        Code: formValue.Code || 0,
        ReceiverID: formValue.ReceiverID || 0,
        Deliver: formValue.Deliver || "",
        SupplierSaleID: formValue.SupplierSaleID || 0,
        ProjectName: formValue.ProjectName || "",
        CustomerID: formValue.CustomerID || 0,
        ApproverID: formValue.ApproverID || 0,
        WarehouseType: formValue.WarehouseType || "",
        CreatedDate: formValue.CreatedDate || "",
        ExpectedDate: formValue.ExpectedDate || "",
        BillType: formValue.BillType,
        Status: 0,
        Addres: "",
        Note: "",
        Image: "",
        Receiver: this.getReceiverNameById(formValue.ReceiverID),
        DeliverID: 0,
        SupplierID: 0,
        CustomerNam: "",
        SupplierName: "",
      },
      billExportDetailTechnicals: this.selectedDevices.map((device, index) => ({
        ID: device.ID || 0,
        STT: index + 1,
        UnitID: device.UnitCountID || 0,
        UnitName: device.UnitCountName || '',
        ProjectID: device.ProjectID || 0,
        ProductID: device.ProductID || 0,
        Quantity: device.Quantity || 1,
        Note: device.Note || '',
        WarehouseID: 1,
        TotalQuantity: device.Quantity || 0

      })),
      inentoryDemos: this.selectedDevices.map((device, index) => ({
        ID: 0,
        ProductRTCID: device.ProductID,
        WarehouseID: 1,
      })),
      billExportTechDetailSerials: this.selectedDevices.flatMap(device => {
        const detailID = device.ID || 0;
        const serialIDs = (device.SerialIDs || '')
          .split(',')
          .map((id: string) => parseInt(id.trim()))
          .filter((id: number) => !isNaN(id) && id > 0);

        return serialIDs.map((serialID: number) => ({
          BillExportDetailID: detailID,
          ID: serialID
        }));
      })
    };
    this.billExportTechnicalService.saveData(payload).subscribe({
      next: (response: any) => {
       
        this.notification.success('Thành công', 'Lưu phiếu thành công');
        this.formSubmitted.emit();
        this.activeModal.close();
      },
      error: (error: any) => {
     
        this.notification.error('Lỗi', 'Không thể lưu phiếu, vui lòng thử lại sau');
      }
    });
   
  }
}       
