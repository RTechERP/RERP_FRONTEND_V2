import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
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
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductsaleServiceService } from '../product-sale-service/product-sale-service.service';
import { FirmDetailComponent } from '../firm-detail/firm-detail.component';
import { LocationDetailComponent } from '../location-detail/location-detail.component';
import { UnitCountDetailComponent } from '../unit-count-detail/unit-count-detail.component';

interface ProductSale {
  Id?: number;
  ProductCode: string;
  ProductName: string;
  Maker: string;
  AddressBox:string;
  Unit: string;
  NumberInStoreDauky: number;
  NumberInStoreCuoiKy: number;
  ProductGroupID: number;
  LocationID: number;
  FirmID: number;
  Note: string;
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
    NzInputNumberModule
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
    AddressBox:'',
    NumberInStoreDauky: 0,
    NumberInStoreCuoiKy: 0,
    ProductGroupID: 0,
    LocationID: 0,
    FirmID: 0,
    Note: ''
  };
   //list lấy dữ liệu đơn vị productsale
   listUnitCount: any[] = [];

   //list lấy dữ liệu nhóm kho 
   listProductGroupcbb: any[] = [];
   listLocation:any[]=[];
   listFirm: any[] = [];

  @Input() isCheckmode: boolean = false;
  @Input() selectedList: any[] = [];
  @Input() id: number = 0;

  formGroup: FormGroup;
  

  constructor(
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private productsaleService: ProductsaleServiceService,
  ) { 
    this.formGroup = this.fb.group({
      ProductGroupID: [null, [Validators.required]],
      Unit: ['', [Validators.required]],
      ProductCode: ['',[Validators.required, noVietnameseValidator]],
      ProductName: ['', [Validators.required]],
      NumberInStoreDauky: [{value: 0, disabled: true}],
      NumberInStoreCuoiKy: [{value: 0, disabled: true}],
      LocationID: [null, [Validators.required]],
      Maker: ['', [Validators.required]],
      Note: ['']
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
      Note: this.newProductSale.Note || ''
    });
  }
  ngAfterViewInit(): void {
  
  }
  getDataUnitCount() {
    this.productsaleService.getdataUnitCount().subscribe({
      next: (res) => {
        if (res?.data) {
          this.listUnitCount = Array.isArray(res.data) ? res.data : [];
          console.log('don vi tinh', this.listUnitCount);
        }
      }, error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      }
    });
  }
  getDataProductGroupcbb() {
    this.productsaleService.getDataProductGroupcbb().subscribe({
      next: (res) => {
        if (res?.data) {
          this.listProductGroupcbb = Array.isArray(res.data) ? res.data : [];

        }
      }, error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      }
    });
  }
  getDataFirm(){
    //lấy dữ liệu hãng
    this.productsaleService.getDataFirm().subscribe({
      next:(res)=>{
        if (res?.data) {
          this.listFirm = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      } });
  }
  getDataLocation(id:number){
    this.productsaleService.getDataLocation(id).subscribe({
      next:(res)=>{
        if (res?.data) {
          this.listLocation = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      } });
  }
  changeProductGroup(){
    const id = this.formGroup.get('ProductGroupID')?.value;
    this.productsaleService.getDataLocation(id).subscribe({
      next:(res)=>{
        if (res?.data) {
          this.listLocation= Array.isArray(res.data) ? res.data : [];
        }
      },  error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      } });
  }

  saveDataProductSale(){
    this.trimAllStringControls();
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    const formValue = this.formGroup.getRawValue(); // Sử dụng getRawValue() để lấy cả disabled controls
    
    // Tìm FirmID dựa trên Maker được chọn
    const selectedFirm = this.listFirm.find((f: any) => f.FirmName === formValue.Maker);
    const firmId = selectedFirm ? selectedFirm.ID : 0;
    
    const location = this.listLocation.find((p: any) => p.ID === formValue.LocationID);
    const addressbox = location ? location.LocationName : '';

    if (this.isCheckmode == true) {
      // Update existing product sale
    
      const payload = [{
        ProductSale: {
          //ID: this.selectedList[0].ID,
          ID: this.id,
          ProductCode: formValue.ProductCode,
          ProductName: formValue.ProductName,
          Unit: formValue.Unit,
          NumberInStoreDauky: formValue.NumberInStoreDauky,
          NumberInStoreCuoiKy: formValue.NumberInStoreCuoiKy,
          ProductGroupID: formValue.ProductGroupID,
          FirmID: firmId,
          Maker: formValue.Maker,
          AddressBox: addressbox,
          LocationID: formValue.LocationID,
          Note: formValue.Note,
          UpdatedBy: 'admin',
          UpdatedDate: new Date()
        },
        Inventory: {
          Note: formValue.Note,
        }
      }];

      this.productsaleService.saveDataProductSale(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Cập nhật thành công!');
            this.activeModal.dismiss(true);
       
          } else {
            this.notification.warning('Thông báo', res.message || 'Không thể cập nhật sản phẩm!');
          }
        },
        error: (err) => {
          this.notification.error('Thông báo', 'Có lỗi xảy ra khi cập nhật!');
          console.error(err);
        }
      });
    } else {
      // Add new product sale
      const payload = [{
        ProductSale: {
          ProductCode: formValue.ProductCode,
          ProductName: formValue.ProductName,
          Unit: formValue.Unit,
          NumberInStoreDauky: formValue.NumberInStoreDauky,
          NumberInStoreCuoiKy: formValue.NumberInStoreCuoiKy,
          ProductGroupID: formValue.ProductGroupID,
          FirmID: firmId,
          LocationID: formValue.LocationID,
          Maker: formValue.Maker,
          AddressBox: addressbox,
          Note: formValue.Note,
          CreatedBy: 'admin',
          CreatedDate: new Date(),
          UpdatedBy: 'admin',
          UpdatedDate: new Date()
        },
        Inventory: {
          Note: formValue.Note,
        }
      }];
    console.log("payload",payload);
      this.productsaleService.saveDataProductSale(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo',  'Thêm mới thành công!');
            this.activeModal.dismiss(true);
          } else {
            this.notification.warning('Thông báo', res.message || 'Không thể thêm sản phẩm!');
          }
        },
        error: (err) => {
          this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm mới!');
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
  openModalFirmDetail(){
    const modalRef = this.modalService.open(FirmDetailComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.catch(
      (result) => {
        if (result == true) {
        this.getDataFirm()
        }
      },
    );
  }
  // hàm gọi modal location
  openModalLocationDetail(){
    const modalRef = this.modalService.open(LocationDetailComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.listProductGroupcbb= this.listProductGroupcbb;
    modalRef.result.catch(
      (result) => {
        if (result == true) {
        this.getDataLocation(0);
        }
      },
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
   openModalUnitCountDetail(){
    const modalRef = this.modalService.open(UnitCountDetailComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.result.catch(
      (result) => {
        if (result == true) {
        this.productsaleService.getdataUnitCount();
        }
      },
    );
  }
}
