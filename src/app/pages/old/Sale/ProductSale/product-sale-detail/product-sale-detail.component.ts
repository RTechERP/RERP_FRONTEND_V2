import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { ProductsaleServiceService } from '../product-sale-service/product-sale-service.service';
import { FirmDetailComponent } from '../firm-detail/firm-detail.component';
import { LocationDetailComponent } from '../location-detail/location-detail.component';
import { UnitCountDetailComponent } from '../unit-count-detail/unit-count-detail.component';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { FirmFormComponent } from '../../../../general-category/firm/firm-form/firm-form.component';
import { ProductLocationFormComponent } from '../../../../general-category/product-location/product-location-form/product-location-form.component';

interface ProductSale {
  Id?: number;
  ProductCode: string;
  ProductName: string;
  Maker: string;
  AddressBox: string;
  Unit: string;
  NumberInStoreDauky: number;
  NumberInStoreCuoiKy: number;
  ProductGroupID: number;
  LocationID: number;
  FirmID: number;
  Note: string;
  IsFix?: boolean;
}

// Custom validator để kiểm tra ký tự tiếng Việt
function noVietnameseValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null; // Không validate nếu giá trị rỗng
  }

  // Regex để kiểm tra ký tự tiếng Việt
  const vietnameseRegex = /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴđĐ]/i;

  if (vietnameseRegex.test(control.value)) {
    return { vietnameseChars: true };
  }

  return null;
}

// Validator: kiểm tra value có nằm trong list theo key
function inIdListValidator(getList: () => any[], idKey: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null; // required sẽ xử lý rỗng
    const list = getList() || [];
    const exists = list.some(item => item && item[idKey] === value);
    return exists ? null : { notInOptions: true };
  };
}
function inStringListValidator(getList: () => any[], key: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null; // required sẽ xử lý rỗng
    const list = getList() || [];
    const exists = list.some(item => item && item[key] === value);
    return exists ? null : { notInOptions: true };
  };
}
@Component({
  selector: 'app-product-sale-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NzModalModule,
    HasPermissionDirective
  ],
  templateUrl: './product-sale-detail.component.html',
  styleUrl: './product-sale-detail.component.css'
})
export class ProductSaleDetailComponent implements OnInit, AfterViewInit {
  @Input() newProductSale: ProductSale = {
    ProductCode: '',
    ProductName: '',
    Maker: '',
    Unit: '',
    AddressBox: '',
    NumberInStoreDauky: 0,
    NumberInStoreCuoiKy: 0,
    ProductGroupID: 0,
    LocationID: 0,
    FirmID: 0,
    Note: '',
    IsFix: false
  };
  isSaving: boolean = false;
  isLoadingProductInfo: boolean = false;
  //list lấy dữ liệu đơn vị productsale
  listUnitCount: any[] = [];

  //list lấy dữ liệu nhóm kho 
  listProductGroupcbb: any[] = [];
  listLocation: any[] = [];
  listFirm: any[] = [];

  @Input() isCheckmode: boolean = false;
  @Input() selectedList: any[] = [];
  @Input() id: number = 0;

  formGroup: FormGroup;


  constructor(
    private notification: NzNotificationService,
    private nzModal: NzModalService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private productsaleService: ProductsaleServiceService,
  ) {
    this.formGroup = this.fb.group({
      ProductGroupID: [null, [Validators.required]],
      Unit: ['', [Validators.required, inStringListValidator(() => this.listUnitCount, 'UnitName')]],
      ProductCode: ['', [Validators.required, noVietnameseValidator]],
      ProductName: ['', [Validators.required]],
      NumberInStoreDauky: [{ value: 0, disabled: true }],
      NumberInStoreCuoiKy: [{ value: 0, disabled: true }],
      LocationID: [null],
      Maker: ['', [Validators.required, inStringListValidator(() => this.listFirm, 'FirmName')]],
      Note: ['', [Validators.maxLength(500)]],
      IsFix: [false]
    });
  }

  ngOnInit(): void {
    this.getDataProductGroupcbb();
    this.getDataUnitCount();
    this.getDataLocation(0);
    this.getDataFirm();

    // Patch form values from input data
    this.formGroup.patchValue({
      ProductGroupID: this.newProductSale.ProductGroupID || null,
      Unit: this.newProductSale.Unit || '',
      ProductCode: this.newProductSale.ProductCode || '',
      ProductName: this.newProductSale.ProductName || '',
      NumberInStoreDauky: this.newProductSale.NumberInStoreDauky || 0,
      NumberInStoreCuoiKy: this.newProductSale.NumberInStoreCuoiKy || 0,
      LocationID: this.newProductSale.LocationID || null,
      Maker: this.newProductSale.Maker || '',
      Note: this.newProductSale.Note || '',
      IsFix: this.newProductSale.IsFix || false
    });
  }
  ngAfterViewInit(): void {

  }
  getDataUnitCount() {
    this.productsaleService.getdataUnitCount().subscribe({
      next: (res) => {
        if (res?.data) {
          this.listUnitCount = Array.isArray(res.data) ? res.data : [];
          this.formGroup.get('Unit')?.updateValueAndValidity({ onlySelf: true });
          console.log('don vi tinh', this.listUnitCount);
        }
      }, error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      }
    });
  }
  // getDataProductGroupcbb() {
  //   this.productsaleService.getDataProductGroupcbb().subscribe({
  //     next: (res) => {
  //       if (res?.data) {
  //         this.listProductGroupcbb = Array.isArray(res.data) ? res.data : [];

  //       }
  //     }, error: (err) => {
  //       console.error('Lỗi khi lấy dữ liệu', err);
  //     }
  //   });


  // }

  getDataProductGroupcbb() {
    this.productsaleService.getDataProductGroupcbb().subscribe({
      next: (res) => {

        const data = res.data || [];

        this.listProductGroupcbb = data.filter((x: any) => x.Isvisible != false).map((x: any) => {
          if (!x.ParentID || x.ParentID === 0) {
            return {
              ...x,
              displayName: x.ProductGroupID + ' - ' + x.ProductGroupName
            };
          }

          const parent = data.find((p: any) => p.ID === x.ParentID);

          return {
            ...x,
            displayName: parent
              ? `${parent.ProductGroupID} - ${x.ProductGroupName}`
              : x.ProductGroupID + ' - ' + x.ProductGroupName
          };
        });

        console.log('nhom', this.listProductGroupcbb);
      }, error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      }
    });


  }

  getDataFirm() {
    //lấy dữ liệu hãng
    this.productsaleService.getDataFirm().subscribe({
      next: (res) => {
        if (res?.data) {
          this.listFirm = Array.isArray(res.data) ? res.data : [];
          this.formGroup.get('Maker')?.updateValueAndValidity({ onlySelf: true });
          console.log('hãng', this.listFirm);
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      }
    });
  }
  getDataLocation(id: number) {
    this.productsaleService.getDataLocation(id).subscribe({
      next: (res) => {
        if (res?.data) {
          this.listLocation = Array.isArray(res.data) ? res.data : [];
          this.formGroup.get('LocationID')?.updateValueAndValidity({ onlySelf: true });
          console.log('kho', this.listLocation);
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      }
    });
  }
  changeProductGroup() {
    const id = this.formGroup.get('ProductGroupID')?.value;
    this.productsaleService.getDataLocation(id).subscribe({
      next: (res) => {
        if (res?.data) {
          this.listLocation = Array.isArray(res.data) ? res.data : [];
          this.formGroup.get('LocationID')?.updateValueAndValidity({ onlySelf: true });
        }
      }, error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      }
    });
  }

  loadProductInfo() {
    const productCode = (this.formGroup.get('ProductCode')?.value || '').trim() || (this.formGroup.get('ProductName')?.value || '').trim();
    if (!productCode) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập mã hoặc tên thiết bị!');
      return;
    }

    this.isLoadingProductInfo = true;
    this.productsaleService.getInforProduct(productCode.trim()).subscribe({
      next: (res) => {
        this.isLoadingProductInfo = false;
        const data = res?.data || (res?.status === 1 ? res?.data : res);

        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          // Kiểm tra thiếu thông tin: tên, đơn vị, hãng
          const nameVal = (data.ProductName ?? data.productName ?? '').toString().trim();
          const unitVal = (data.Unit ?? data.unit ?? '').toString().trim();
          const makerVal = (data.Maker ?? data.maker ?? '').toString().trim();

          const missingFields: string[] = [];
          if (!nameVal) missingFields.push('Tên sản phẩm');
          if (!unitVal) missingFields.push('Đơn vị');
          if (!makerVal) missingFields.push('Hãng');

          if (missingFields.length > 0) {
            const apiGroupId = data.ProductGroupID ?? data.productGroupID ?? this.formGroup.get('ProductGroupID')?.value;
            const matchedGroup = this.listProductGroupcbb.find((x: any) => x.ID === apiGroupId || x.ProductGroupID === apiGroupId);
            const groupName = matchedGroup ? (matchedGroup.displayName || matchedGroup.ProductGroupName || apiGroupId) : (apiGroupId || 'chưa xác định');
            const codeVal = (data.ProductCode ?? data.productCode ?? productCode).toString().trim();

            this.nzModal.warning({
              nzTitle: NOTIFICATION_TITLE.warning || 'Thông báo',
              nzContent: `Mã sản phẩm "${codeVal}" tại loại kho "${groupName}" đang thiếu các trường: <b>${missingFields.join(', ')}</b>. Cần cập nhật mã sản phẩm này trước khi thêm sản phẩm mới tương ứng.`
            });
          }

          const patchData: any = {};

          if (data.ProductName !== undefined) patchData.ProductName = data.ProductName;
          else if (data.productName !== undefined) patchData.ProductName = data.productName;

          if (data.Unit !== undefined) patchData.Unit = data.Unit;
          else if (data.unit !== undefined) patchData.Unit = data.unit;

          const makerName = data.Maker ?? data.maker;
          if (makerName !== undefined && makerName !== null) {
            const matchedFirm = this.listFirm.find((f: any) => f.FirmName?.trim().toLowerCase() === String(makerName).trim().toLowerCase());
            patchData.Maker = matchedFirm ? matchedFirm.FirmName : makerName;
          }

          // Loại kho (ProductGroupID): chỉ load từ API khi người dùng chưa chọn nhóm kho
          const currentGroupId = this.formGroup.get('ProductGroupID')?.value;
          if (!currentGroupId || currentGroupId <= 0) {
            const apiGroupId = data.ProductGroupID ?? data.productGroupID;
            if (apiGroupId !== undefined && apiGroupId !== null) {
              patchData.ProductGroupID = apiGroupId;
            }
          }

          const apiLocationId = data.LocationID ?? data.locationID;
          if (apiLocationId !== undefined && apiLocationId !== null) {
            patchData.LocationID = apiLocationId;
          }

          if (data.Note !== undefined) patchData.Note = data.Note;
          else if (data.note !== undefined) patchData.Note = data.note;

          // Tích xanh (IsFix): load giá trị tích xanh từ sản phẩm nếu có
          const apiFix = data.IsFix ?? data.isFix;
          if (apiFix !== undefined && apiFix !== null) {
            patchData.IsFix = apiFix === true || apiFix === 1 || apiFix === 'true' || apiFix === '1';
          }

          // if (data.NumberInStoreDauky !== undefined) patchData.NumberInStoreDauky = data.NumberInStoreDauky;
          // else if (data.numberInStoreDauky !== undefined) patchData.NumberInStoreDauky = data.numberInStoreDauky;

          // if (data.NumberInStoreCuoiKy !== undefined) patchData.NumberInStoreCuoiKy = data.NumberInStoreCuoiKy;
          // else if (data.numberInStoreCuoiKy !== undefined) patchData.NumberInStoreCuoiKy = data.numberInStoreCuoiKy;

          this.formGroup.patchValue(patchData);

          const targetGroupId = this.formGroup.get('ProductGroupID')?.value;
          if (targetGroupId) {
            this.getDataLocation(targetGroupId);
          }

          this.notification.success(NOTIFICATION_TITLE.success, 'Tải thông tin sản phẩm thành công!');
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy thông tin sản phẩm!');
        }
      },
      error: (err) => {
        this.isLoadingProductInfo = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra khi tải thông tin sản phẩm!');
        console.error(err);
      }
    });
  }

  saveDataProductSale() {
    this.trimAllStringControls();
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    const formValue = this.formGroup.getRawValue();
    const productCode = (formValue.ProductCode || '').toString().trim();

    if (!productCode) {
      this.executeSaveProductSale(formValue);
      return;
    }

    this.isSaving = true;
    this.productsaleService.getInforProduct(productCode).subscribe({
      next: (res) => {
        const data = res?.data || (res?.status === 1 ? res?.data : res);

        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          const apiName = (data.ProductName ?? data.productName ?? '').toString().trim();
          const apiFix = !!(data.IsFix ?? data.isFix);
          const apiApproved = !!(data.IsApproved ?? data.isApproved);
          const apiUnit = (data.Unit ?? data.unit ?? '').toString().trim();
          const apiMaker = (data.Maker ?? data.maker ?? '').toString().trim();

          const formName = (formValue.ProductName || '').toString().trim();
          const formUnit = (formValue.Unit || '').toString().trim();
          const formMaker = (formValue.Maker || '').toString().trim();

          const apiGroupId = data.ProductGroupID ?? data.productGroupID;
          const matchedGroup = this.listProductGroupcbb.find(
            (x: any) =>
              x.ID === apiGroupId ||
              x.ProductGroupID === apiGroupId ||
              String(x.ProductGroupID).toLowerCase() === String(apiGroupId).toLowerCase() ||
              String(x.ID) === String(apiGroupId)
          );
          const isSameGroup =
            apiGroupId !== undefined &&
            apiGroupId !== null &&
            (formValue.ProductGroupID === apiGroupId ||
              (matchedGroup && matchedGroup.ID === formValue.ProductGroupID));

          // 1. Trường hợp sản phẩm lấy lên có IsFix hoặc IsApproved là true -> Bắt buộc dùng nút mũi tên để map các trường (trừ mã nhóm)
          if (apiFix || apiApproved) {
            const isNameMismatch = apiName && formName.toLowerCase() !== apiName.toLowerCase();
            const isUnitMismatch = apiUnit && formUnit.toLowerCase() !== apiUnit.toLowerCase();
            const isMakerMismatch = apiMaker && formMaker.toLowerCase() !== apiMaker.toLowerCase();
            const isFixMismatch = apiFix && !formValue.IsFix;

            const isMismatch = isNameMismatch || isUnitMismatch || isMakerMismatch || isFixMismatch;

            if (isMismatch) {
              this.isSaving = false;
              this.nzModal.warning({
                nzTitle: NOTIFICATION_TITLE.warning || 'Thông báo',
                nzContent: 'Thông tin sản phẩm đang không đúng! Vui lòng chọn nút mũi tên <i class="fas fa-circle-up text-primary me-1"></i> bên cạnh Mã thiết bị để cập nhật thông tin sản phẩm tương ứng.'
              });
              return;
            }
          } else {
            // 2. Trường hợp cả IsFix và IsApproved đều false: nếu thêm mới ở loại kho khác thì hỏi xác nhận
            if (!isSameGroup) {
              this.nzModal.confirm({
                nzTitle: 'Xác nhận',
                nzContent: `Mã sản phẩm "<b>${productCode}</b>" đã tồn tại ở loại kho khác. Bạn có chắc chắn muốn lưu thông tin không?`,
                nzOkText: 'Đồng ý',
                nzCancelText: 'Hủy',
                nzOnOk: () => {
                  this.executeSaveProductSale(formValue);
                },
                nzOnCancel: () => {
                  this.isSaving = false;
                }
              });
              return;
            }
          }
        }

        this.executeSaveProductSale(formValue);
      },
      error: (err) => {
        console.error('Lỗi khi kiểm tra thông tin sản phẩm:', err);
        this.executeSaveProductSale(formValue);
      }
    });
  }

  private executeSaveProductSale(formValue: any) {
    // Tìm FirmID dựa trên Maker được chọn
    const selectedFirm = this.listFirm.find((f: any) => f.FirmName === formValue.Maker);
    const firmId = selectedFirm ? selectedFirm.ID : 0;

    const location = this.listLocation.find((p: any) => p.ID === formValue.LocationID);
    const addressbox = location ? location.LocationName : '';

    const unitName = formValue.Unit || '';
    const isFix = formValue.IsFix !== null && formValue.IsFix !== undefined ? formValue.IsFix : false;

    if (this.isCheckmode == true) {
      // Update existing product sale
      const payload = [{
        ProductSale: {
          ID: this.id,
          ProductCode: formValue.ProductCode,
          ProductName: formValue.ProductName,
          Unit: unitName,
          NumberInStoreDauky: formValue.NumberInStoreDauky,
          NumberInStoreCuoiKy: formValue.NumberInStoreCuoiKy,
          ProductGroupID: formValue.ProductGroupID,
          FirmID: firmId,
          Maker: formValue.Maker,
          AddressBox: addressbox,
          LocationID: formValue.LocationID,
          Note: formValue.Note,
          IsFix: isFix,
        },
        Inventory: {
          Note: formValue.Note,
        }
      }];

      this.isSaving = true;
      this.productsaleService.saveDataProductSale(payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật thành công!');
            this.activeModal.dismiss(true);
          } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không thể cập nhật sản phẩm!');
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err.message || err || 'Có lỗi xảy ra khi cập nhật!');
          console.error(err);
        }
      });
    } else {
      // Add new product sale
      const payload = [{
        ProductSale: {
          ProductCode: formValue.ProductCode,
          ProductName: formValue.ProductName,
          Unit: unitName,
          NumberInStoreDauky: formValue.NumberInStoreDauky,
          NumberInStoreCuoiKy: formValue.NumberInStoreCuoiKy,
          ProductGroupID: formValue.ProductGroupID,
          FirmID: firmId,
          LocationID: formValue.LocationID,
          Maker: formValue.Maker,
          AddressBox: addressbox,
          Note: formValue.Note,
          IsFix: isFix,
          CreatedBy: 'admin',
          CreatedDate: new Date(),
          UpdatedBy: 'admin',
          UpdatedDate: new Date()
        },
        Inventory: {
          Note: formValue.Note,
        }
      }];

      this.isSaving = true;
      this.productsaleService.saveDataProductSale(payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Thêm mới thành công!');
            this.activeModal.dismiss(true);
          } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không thể thêm sản phẩm!');
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err.message || err || 'Có lỗi xảy ra khi thêm mới!');
          console.error(err);
        }
      });
    }
  }
  closeModal() {
    this.activeModal.dismiss(false);
  }

  // Hàm để lấy error message cho ProductCode
  getProductCodeError(): string | undefined {
    const control = this.formGroup.get('ProductCode');
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        return 'Vui lòng nhập mã thiết bị!';
      }
      if (control.errors?.['vietnameseChars']) {
        return 'Mã thiết bị không được chứa ký tự tiếng Việt!';
      }
    }
    return undefined;
  }

  //hàm gọi modal firm
  openModalFirmDetail() {
    const modalRef = this.modalService.open(FirmFormComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.finally(() => {
      this.getDataFirm();
    });
  }
  // hàm gọi modal location
  openModalLocationDetail() {
    const modalRef = this.modalService.open(ProductLocationFormComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.listProductGroupcbb = this.listProductGroupcbb;
    modalRef.result.finally(
      () => {
        const groupId = this.formGroup.get('ProductGroupID')?.value ?? 0;
        this.getDataLocation(groupId);
      }
    );
  }
  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach(k => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }
  // hàm gọi modal unitcount
  openModalUnitCountDetail() {
    const modalRef = this.modalService.open(UnitCountDetailComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.result.finally(
      () => {
        this.getDataUnitCount();
      },
    );
  }

  private getFirstErrorMessage(): string | undefined {
    // Ưu tiên lỗi ghi chú vượt quá 500 ký tự
    const noteCtrl = this.formGroup.get('Note');
    if (noteCtrl?.invalid && noteCtrl.errors?.['maxlength']) {
      return 'Ghi chú không quá 500 kí tự!';
    }

    // Lỗi mã thiết bị (dùng logic có sẵn)
    const codeMsg = this.getProductCodeError();
    if (codeMsg) return codeMsg;

    // Kiểm tra các trường bắt buộc khác theo thứ tự hiển thị
    const checks: Array<{ key: string; requiredMsg: string }> = [
      { key: 'ProductGroupID', requiredMsg: 'Vui lòng chọn kho!' },
      { key: 'Unit', requiredMsg: 'Vui lòng chọn đơn vị!' },
      { key: 'ProductName', requiredMsg: 'Vui lòng nhập tên thiết bị!' },
      { key: 'LocationID', requiredMsg: 'Vui lòng chọn vị trí!' },
      { key: 'Maker', requiredMsg: 'Vui lòng chọn hãng!' },
    ];

    for (const { key, requiredMsg } of checks) {
      const ctrl = this.formGroup.get(key);
      if (ctrl?.invalid) {
        if (ctrl.errors?.['required']) return requiredMsg;
        if (ctrl.errors?.['notInOptions']) return 'Giá trị không hợp lệ!';
      }
    }

    return undefined;
  }
}
