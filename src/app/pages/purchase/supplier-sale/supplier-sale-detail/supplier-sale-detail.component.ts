import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, AfterViewChecked, IterableDiffers, TemplateRef, input, Input, inject } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, NonNullableFormBuilder } from '@angular/forms';
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
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { SupplierSaleService } from '../supplier-sale.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { ProjectService } from '../../../project/project-service/project.service';
import { CommonModule } from '@angular/common';
import { toArray } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { from } from 'rxjs';
import { concatMap } from 'rxjs/operators';
@Component({
  selector: 'app-supplier-sale-detail',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
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
    NzCheckboxModule,
    CommonModule,
  ],
  templateUrl: './supplier-sale-detail.component.html',
  styleUrl: './supplier-sale-detail.component.css'
})
export class SupplierSaleDetailComponent {

  //#region Khai báo biến
  @Input() supplierSaleID: number = -1;
  @ViewChild('tb_supplierSaleContact', { static: false })
  tb_supplierSaleContactContainer!: ElementRef;
  tb_supplierSaleContactBody: any;

  employees: any[] = [];
  rulepays: any[] = [];
  companies: any[] = [];

  private fb = inject(NonNullableFormBuilder);

  validateForm = this.fb.group({
    ID: this.fb.control(0),
    NgayUpdate: this.fb.control('', [Validators.required]),
    CodeNCC: this.fb.control('', [Validators.required]),
    NameNCC: this.fb.control('', [Validators.required]),
    NganHang: this.fb.control('', [Validators.required]),
    AddressNCC: this.fb.control('', [Validators.required]),
    Company: this.fb.control('', [Validators.required]),
    PhoneNCC: this.fb.control('', [
      Validators.required,
      Validators.pattern(/^(?:\+84|0)(3|5|7|8|9)[0-9]{8}$/)
    ]),
    OrdererNCC: this.fb.control(''),
    Debt: this.fb.control(''),
    LoaiHangHoa: this.fb.control(''),
    Brand: this.fb.control(''),
    MaNhom: this.fb.control(''),
    TenTiengAnh: this.fb.control(''),
    Website: this.fb.control(''),
    SoTK: this.fb.control(''),
    MaSoThue: this.fb.control(''),
    Note: this.fb.control(''),
    ShortNameSupplier: this.fb.control(''),
    EmployeeID: this.fb.control(0),
    IsDebt: this.fb.control(false),
    FedexAccount: this.fb.control(''),
    OriginItem: this.fb.control(''),
    BankCharge: this.fb.control(''),
    AddressDelivery: this.fb.control(''),
    RulePayID: this.fb.control(0),
    Description: this.fb.control(''),
    RuleIncoterm: this.fb.control('')
  });

  constructor(
    public activeModal: NgbActiveModal,
    private supplierSaleService: SupplierSaleService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private projectService: ProjectService
  ) { }
  //#endregion

  //#region Hàm chạy khi mở chương trình
  ngOnInit() {
    this.getEmpployee();
    this.getRulePay();
    this.fillData(this.supplierSaleID);
    this.getTaxCompany();
  }

  ngAfterViewInit() {
    this.drawTbSupplierSaleContact(this.tb_supplierSaleContactContainer.nativeElement);
    if (this.supplierSaleID > 0) {
      this.getSupplierSaleContact(this.supplierSaleID);
    }
  }
  //#endregion

  //#region Các hàm khác
  fillData(supplierSaleID: number) {
    if (supplierSaleID > 0) {
      this.supplierSaleService.getSupplierSaleByID(supplierSaleID).subscribe({
        next: (data) => {
          let supplier = data.data;

          if (data.status == 1 && supplier != null) {
            this.validateForm.patchValue({
              ID: supplier.ID,
              NgayUpdate: supplier.NgayUpdate,
              CodeNCC: supplier.CodeNCC,
              NameNCC: supplier.NameNCC,
              NganHang: supplier.NganHang,
              AddressNCC: supplier.AddressNCC,
              PhoneNCC: supplier.PhoneNCC,
              OrdererNCC: supplier.OrdererNCC,
              Debt: supplier.Debt,
              LoaiHangHoa: supplier.LoaiHangHoa,
              Brand: supplier.Brand,
              MaNhom: supplier.MaNhom,
              TenTiengAnh: supplier.TenTiengAnh,
              Website: supplier.Website,
              SoTK: supplier.SoTK,
              MaSoThue: supplier.MaSoThue,
              Note: supplier.Note,
              Company: supplier.Company,
              ShortNameSupplier: supplier.ShortNameSupplier,
              EmployeeID: supplier.EmployeeID,
              IsDebt: supplier.IsDebt,
              FedexAccount: supplier.FedexAccount,
              OriginItem: supplier.OriginItem,
              BankCharge: supplier.BankCharge,
              AddressDelivery: supplier.AddressDelivery,
              RulePayID: supplier.RulePayID,
              Description: supplier.Description,
              RuleIncoterm: supplier.RuleIncoterm
            });
            console.log(this.validateForm.getRawValue());
          } else {
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              'Không có dữ liệu liên hệ nào được tìm thấy.'
            );
          }
        },
        error: (error) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Không thể tải dữ liệu liên hệ. Vui lòng thử lại sau.'
          );
        }
      });
    }
  }

  getEmpployee() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
      },
    });
  }

  resetSTT() {
    const rows = this.tb_supplierSaleContactBody.getRows();
    rows.forEach((row: any, index: any) => {
      row.update({ STT: index + 1 });
    });
  }

  addRow() {
    if (this.tb_supplierSaleContactBody) {
      const data = this.tb_supplierSaleContactBody.getData();
      // Tìm STT lớn nhất hiện tại, nếu chưa có thì là 0
      const maxSTT = data.length > 0 ? Math.max(...data.map((row: any) => Number(row.STT) || 0)) : 0;
      this.tb_supplierSaleContactBody.addRow({
        ID: 0, // ID = 0 cho dòng mới
        STT: maxSTT + 1,
        SupplierID: this.supplierSaleID,
        SupplierName: "",
        SupplierPhone: "",
        SupplierEmail: "",
        Describe: ""
      }, false); // false = thêm vào cuối bảng
    }
  }

  drawTbSupplierSaleContact(container: HTMLElement) {
    this.tb_supplierSaleContactBody = new Tabulator(container, {
      height: '26vh',
      layout: 'fitDataStretch',
      columns: [
        {
          title: '',
          field: 'addRow',
          headerSort: false,
          width: 40,
          hozAlign: 'center',
          headerHozAlign: 'center',
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
          headerClick: (e: any, column: any) => {
            this.addRow();
          },
          formatter: (cell: any) => {
            const data = cell.getRow().getData();
            let id = data['ID'];
            return id <= 0 || id == null
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },

          cellClick: (e: any, cell: any) => {
            const data = cell.getRow().getData();
            let id = parseInt(data['ID']);
            if (id > 0) return;
            cell.getRow().delete();
            this.resetSTT();
          }
        } as any,
        { title: 'STT', field: 'STT', width: 60, headerSort: false, hozAlign: 'center' },
        { title: 'Tên liên hệ', field: 'SupplierName', editor: "input", width: 200, headerSort: false },
        { title: 'Số điện thoại', field: 'SupplierPhone', editor: "input", width: 150, headerSort: false },
        { title: 'Email', field: 'SupplierEmail', editor: "input", width: 200, headerSort: false },
        { title: 'Mô tả', field: 'Describe', editor: "input", width: 250, headerSort: false }
      ],

    });
  }

  getSupplierSaleContact(supplierID: number) {
    this.supplierSaleService.getSupplierSaleContact(supplierID).subscribe({
      next: (data) => {
        if (data.status == 1 && data.data && data.data.length > 0) {
          this.tb_supplierSaleContactBody.setData(data.data);
          this.resetSTT();
        } else {
          this.tb_supplierSaleContactBody.clearData();
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể tải dữ liệu liên hệ. Vui lòng thử lại sau.'
        );
        // Clear bảng khi có lỗi
        this.tb_supplierSaleContactBody.clearData();
      }
    });
  }

  getRulePay() {
    this.supplierSaleService.getRulePay().subscribe({
      next: (data) => {
        if (data.status == 1) {
          this.rulepays = data.data.map((item: any) => ({
            title: item.Code + " - " + item.Note,
            value: item.ID
          }));
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Không có dữ liệu liên hệ nào được tìm thấy.'
          );
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể tải dữ liệu liên hệ. Vui lòng thử lại sau.'
        );
      }
    });
  }

  getTaxCompany() {
    this.supplierSaleService.getTaxCompany().subscribe({
      next: (data) => {
        if (data.status == 1) {
          this.companies = data.data.map((item: any) => ({
            title: item.Name,
            value: item.ID
          }));
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Không có dữ liệu liên hệ nào được tìm thấy.'
          );
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể tải dữ liệu liên hệ. Vui lòng thử lại sau.'
        );
      }
    });
  }

  async saveData() {
    try {
      Object.keys(this.validateForm.controls).forEach(key => {
        const control = this.validateForm.get(key);
        if (control && typeof control.value === 'string') {
          control.setValue(control.value.trim());
        }
      });

      let supplierSaleId = 0;
      let data = this.validateForm.getRawValue();

      // 1) Chờ saveSupplierSale
      const saveMainRes = await lastValueFrom(
        this.supplierSaleService.saveSupplierSale(data)
      );

      if (saveMainRes.status !== 1) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Cập nhật dữ liệu thất bại.'
        );
        return;
      }
      supplierSaleId = saveMainRes.data;
      let dataContact = this.tb_supplierSaleContactBody.getData();
      dataContact = dataContact.map((c: any) => ({
        ...c,
        SupplierID: supplierSaleId
      }));
      await lastValueFrom(
        from(dataContact).pipe(
          concatMap(item =>
            this.supplierSaleService.saveSupplierSaleContact(item)
          ),
          toArray()
        )
      );

      this.notification.success(
        NOTIFICATION_TITLE.success,
        'Đã cập nhật dữ liệu thành công.'
      );

      this.modalService.dismissAll();

    } catch (error: any) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        error?.error?.message || 'Lưu dữ liệu thất bại.'
      );
    }
  }


  onSubmit(): void {
    if (this.validateForm.valid) {
      this.saveData(); // modal sẽ tự đóng khi save xong
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
  //#endregion
}
