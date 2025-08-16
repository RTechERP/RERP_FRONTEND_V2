import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
  

  constructor(
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private productsaleService: ProductsaleServiceService,
  ) { }

  ngOnInit(): void {
    this.getDataProductGroupcbb();
    this.getDataUnitCount();
    this.getDataLocation(0); 
    this.getDataFirm();
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
    const id = this.newProductSale.ProductGroupID;
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
    if (!this.newProductSale.ProductGroupID || !this.newProductSale.ProductName || !this.newProductSale.FirmID || !this.newProductSale.LocationID) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }
    const firm = this.listFirm.find((p: any) => p.ID === this.newProductSale.FirmID);
    const maker = firm ? firm.FirmName : '';  
    const location = this.listLocation.find((p: any) => p.ID === this.newProductSale.LocationID);
    const addressbox = location ? location.LocationName : '';

    if (this.isCheckmode == true) {
      // Update existing product sale
    
      const payload = [{
        ProductSale: {
          ID: this.selectedList[0].ID,
          ProductCode: this.newProductSale.ProductCode,
          ProductName: this.newProductSale.ProductName,
          Unit: this.newProductSale.Unit,
          NumberInStoreDauky: this.newProductSale.NumberInStoreDauky,
          NumberInStoreCuoiKy: this.newProductSale.NumberInStoreCuoiKy,
          ProductGroupID: this.newProductSale.ProductGroupID,
          FirmID: this.newProductSale.FirmID,
          Maker: maker,
          AddressBox:addressbox,
          LocationID: this.newProductSale.LocationID,
          Note: this.newProductSale.Note,
          UpdatedBy: 'admin',
          UpdatedDate: new Date()
        },
        Inventory: {
          Note: this.newProductSale.Note,
        }
      }];

      this.productsaleService.saveDataProductSale(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Cập nhật thành công!');
            this.closeModal();
       
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
          ProductCode: this.newProductSale.ProductCode,
          ProductName: this.newProductSale.ProductName,
          Unit: this.newProductSale.Unit,
          NumberInStoreDauky: this.newProductSale.NumberInStoreDauky,
          NumberInStoreCuoiKy: this.newProductSale.NumberInStoreCuoiKy,
          ProductGroupID: this.newProductSale.ProductGroupID,
          FirmID: this.newProductSale.FirmID,
          LocationID: this.newProductSale.LocationID,
          Maker: maker,
          AddressBox:addressbox,
          Note: this.newProductSale.Note,
          CreatedBy: 'admin',
          CreatedDate: new Date(),
          UpdatedBy: 'admin',
          UpdatedDate: new Date()
        },
        Inventory: {
          Note: this.newProductSale.Note,
        }
      }];
    console.log("payload",payload);
      this.productsaleService.saveDataProductSale(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Thêm mới thành công!');
            this.closeModal();
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
    this.activeModal.dismiss(true);
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
