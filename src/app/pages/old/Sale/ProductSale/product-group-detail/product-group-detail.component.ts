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

interface ProductGroup {
  ID?: number;
  ProductGroupID: string;
  ProductGroupName: string;
  IsVisible: boolean;
  EmployeeID: number;
  WareHouseID: number;
}

@Component({
  selector: 'app-product-group-detail',
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
  templateUrl: './product-group-detail.component.html',
  styleUrl: './product-group-detail.component.css'
})
export class ProductGroupDetailComponent implements OnInit, AfterViewInit {

  @Input() isFromParent: boolean = false; // true nếu mở từ cha và muốn khóa kho
  @Input() newProductGroup: ProductGroup = {
    ProductGroupID: '',
    ProductGroupName: '',
    EmployeeID: 0,
    IsVisible: false,
    WareHouseID: 0
  };
  @Input() isCheckmode: any;
  @Input() listWH: any[] = [];
  @Input() listEmployee: any[] = [];
  @Input() id: number = 0;

  constructor(
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private productsaleService: ProductsaleServiceService
  ) { }

  ngOnInit(): void {
    this.getdataWH();
    this.getdataEmployee();
    //truowngf hopj update
    if(this.isCheckmode==true){
      this.productsaleService.getdataProductGroupbyID(this.id).subscribe({
        next: (res) => {
          if (res?.data) {
            const data = Array.isArray(res.data) ? res.data[0] : res.data;
    
            // Chỉ cập nhật các trường không ảnh hưởng đến dữ liệu từ cha
            this.newProductGroup.ProductGroupID = data.ProductGroupID;
            this.newProductGroup.ProductGroupName = data.ProductGroupName;
            this.newProductGroup.IsVisible = data.IsVisible;
    
            // Nếu không truyền từ cha thì mới gán EmployeeID và WarehouseID
            if (!this.isFromParent) {
              this.newProductGroup.EmployeeID = data.EmployeeID;
              this.newProductGroup.WareHouseID = data.WarehouseID;
            }
          } else {
            this.notification.warning('Thông báo', res.message || 'Không thể lấy thông tin nhóm!');
          }
        },
        error: (err) => {
          this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy thông tin!');
          console.error(err);
        }
      });
    }
    
    else{
      this.newProductGroup = {
        ProductGroupID: '',
        ProductGroupName: '',
        EmployeeID: 0,
        IsVisible: false,
        WareHouseID: 0
      };
    }
  }

  ngAfterViewInit(): void {
    
  }
  
  saveDataProductGroup() {
    if (!this.newProductGroup.ProductGroupID || !this.newProductGroup.ProductGroupName || !this.newProductGroup.EmployeeID || !this.newProductGroup.WareHouseID) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }
    if (this.isCheckmode == true) {
      // Update existing product group
      const payload = {
        Productgroup: {
          ID: this.id,
          ProductGroupID: this.newProductGroup.ProductGroupID,
          ProductGroupName: this.newProductGroup.ProductGroupName,
          EmployeeID: this.newProductGroup.EmployeeID,

        },
        ProductgroupWarehouse: {
          WarehouseID: this.newProductGroup.WareHouseID,
          EmployeeID: this.newProductGroup.EmployeeID,
          UpdatedBy: 'admin',
          UpdatedDate: new Date()
        }
      };
      this.productsaleService.savedataProductGroup(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Cập nhật thành công!');
          this.closeModal();
            this.id = payload.Productgroup.ID;
          } else {
            this.notification.warning('Thông báo', res.message || 'Không thể cập nhật nhóm!');
          }
        },
        error: (err) => {
          this.notification.error('Thông báo', 'Có lỗi xảy ra khi cập nhật!');
          console.error(err);
        }
      });
    } else {
      // Add new product group
      const payload = {
        Productgroup: {
          ProductGroupID: this.newProductGroup.ProductGroupID,
          ProductGroupName: this.newProductGroup.ProductGroupName,
          EmployeeID: this.newProductGroup.EmployeeID,
          IsVisible: true
        },
        ProductgroupWarehouse: {
          WarehouseID: this.newProductGroup.WareHouseID,
          EmployeeID: this.newProductGroup.EmployeeID,
          CreatedBy: 'admin',
          CreatedDate: new Date(),
          UpdatedBy: 'admin',
          UpdatedDate: new Date()
        }
      };
      this.productsaleService.savedataProductGroup(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Thêm mới thành công!');
            this.closeModal();
          } else {
            this.notification.warning('Thông báo', res.message || 'Không thể thêm nhóm!');
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
  getdataWH() {
    this.productsaleService.getdataWareHouse().subscribe({
      next: (res) => {
        if (res?.data) {
          this.listWH = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      }
    });
  }
  getdataEmployee() {
    this.productsaleService.getdataEmployee().subscribe({
      next: (res) => {
        if (res?.data) {
          this.listEmployee = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu toàn bộ sản phẩm:', err);
      }
    });
  }
}
