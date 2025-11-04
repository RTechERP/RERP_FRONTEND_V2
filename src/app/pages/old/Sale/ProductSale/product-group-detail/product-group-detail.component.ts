import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,FormGroup, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
import { cbbDataGroupService } from '../../../../../services/cbbDataGroup.service';

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

  @Input() isFromParent: boolean = false; 
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

  formGroup: FormGroup;

  constructor(
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private productsaleService: ProductsaleServiceService,
    private cbbDataGroupService: cbbDataGroupService
  ) { 
    this.formGroup = this.fb.group({
      WareHouseID: [null, [Validators.required]],
      ProductGroupID: ['', [Validators.required, Validators.maxLength(20)]],
      ProductGroupName: ['', [Validators.required, Validators.maxLength(100)]],
      EmployeeID: [null, [Validators.required]]
    });
  }

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

            // Patch form values to reflect current data for reactive controls
            this.formGroup.patchValue({
              WareHouseID: this.newProductGroup.WareHouseID || null,
              ProductGroupID: this.newProductGroup.ProductGroupID || '',
              ProductGroupName: this.newProductGroup.ProductGroupName || '',
              EmployeeID: this.newProductGroup.EmployeeID || null
            });
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

      // Initialize form defaults
      this.formGroup.reset({
        WareHouseID: null,
        ProductGroupID: '',
        ProductGroupName: '',
        EmployeeID: null
      });
    }
  }

  ngAfterViewInit(): void {
    
  }
  
  saveDataProductGroup() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValue = this.formGroup.value as {
      WareHouseID: number | null;
      ProductGroupID: string;
      ProductGroupName: string;
      EmployeeID: number | null;
    };

    if (this.isCheckmode == true) {
      // Update existing product group
      const payload = {
        Productgroup: {
          ID: this.id,
          ProductGroupID: formValue.ProductGroupID,
          ProductGroupName: formValue.ProductGroupName,
          EmployeeID: formValue.EmployeeID ?? 0,

        },
        ProductgroupWarehouse: {
          WarehouseID: formValue.WareHouseID ?? 0,
          EmployeeID: formValue.EmployeeID ?? 0,
          UpdatedBy: 'admin',
          UpdatedDate: new Date()
        }
      };
      this.productsaleService.savedataProductGroup(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Cập nhật thành công!');
            this.activeModal.dismiss(true);
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
          ProductGroupID: formValue.ProductGroupID,
          ProductGroupName: formValue.ProductGroupName,
          EmployeeID: formValue.EmployeeID ?? 0,
          IsVisible: true
        },
        ProductgroupWarehouse: {
          WarehouseID: formValue.WareHouseID ?? 0,
          EmployeeID: formValue.EmployeeID ?? 0,
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
            this.activeModal.dismiss(true);
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
    this.activeModal.dismiss(false);
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
          this.listEmployee = this.cbbDataGroupService.createdDataGroup(
            res.data,
            'DepartmentName'
          )
          console.log('haha',this.listEmployee);
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu toàn bộ sản phẩm:', err);
      }
    });
  }
}
