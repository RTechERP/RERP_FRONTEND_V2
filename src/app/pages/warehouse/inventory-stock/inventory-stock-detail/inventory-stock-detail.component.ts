import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  Input,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  FormGroup,
  FormBuilder,
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
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
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { InventoryStockService } from '../inventory-stock.service';
import { ProjectService } from '../../../project/project-service/project.service';
import { AppUserService } from '../../../../services/app-user.service';

@Component({
  selector: 'app-inventory-stock-detail',
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
    NzTreeSelectModule,
    NzDropDownModule,
    NzTableModule,
  ],
  templateUrl: './inventory-stock-detail.component.html',
  styleUrl: './inventory-stock-detail.component.css',
})
export class InventoryStockDetailComponent implements OnInit, AfterViewInit {
  //#region Khai báo biến
  formGroup!: FormGroup;

  //#endregion
  @Input() inventoryStock: any;
  @Input() warehouseID: number = 0;
  warehouses: any[] = [];
  projectTypes: any[] = [];
  employeeList: any[] = [];
  productSaleList: any[] = [];
  isProductDropdownVisible: boolean = false;
  selectedProductName: string = '';
  productSearchText: string = '';
  filteredProductSaleList: any[] = [];
  productPageIndex: number = 1;

  isDisabled: boolean = false;
  isDisabledSave: boolean = false;
  isSaving: boolean = false;
  //#region Hàm khởi tạo
  constructor(
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private inventoryStockService: InventoryStockService,
    private projectService: ProjectService,
    private appUserService: AppUserService
  ) { }

  moneyFormatter = (value: number | string): string => {
    if (value === null || value === undefined) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  moneyParser = (value: string): number => {
    return value ? Number(value.replace(/,/g, '')) : 0;
  };
  //#endregion

  //#region Hàm lifecycle
  ngOnInit(): void {
    this.isDisabled = !this.appUserService.isAdmin;
    let inventoryStockID = this.inventoryStock?.ID || 0;
    let employeeIDRequest = this.inventoryStock?.EmployeeIDRequest || 0;
    if (
      inventoryStockID > 0 &&
      employeeIDRequest != this.appUserService.employeeID &&
      !this.appUserService.isAdmin
    ) {
      this.isDisabledSave = true;
    }
    this.loadLookupData();
    this.initForm();
  }
  ngAfterViewInit(): void { }
  //#endregion

  //#region Hàm xử lý
  initForm(): void {
    this.formGroup = this.fb.group({
      WarehouseID: [1],
      MinQuantity: [
        this.inventoryStock.Quantity || 1,
        [Validators.required, Validators.min(1)],
      ],
      ProjectTypeID: [0],
      EmployeeIDRequest: [this.appUserService.employeeID],
      ProductSaleID: [
        this.inventoryStock.ProductSaleID || null,
        [Validators.required],
      ],
      Note: [this.inventoryStock.Note || ''],
    });
  }

  loadLookupData(): void {
    this.inventoryStockService.getWarehouse().subscribe({
      next: (response: any) => {
        this.warehouses = response.data;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          });
      },
    });

    this.inventoryStockService.getProductSale(this.warehouseID).subscribe({
      next: (response: any) => {
        this.productSaleList = response.data.filter((x: any) => x.ProductGroupID === 13);
        this.filteredProductSaleList = [...this.productSaleList];
        
        // Gán tên sản phẩm ban đầu nếu đã được chọn sẵn từ input
        const selectedId = this.formGroup?.get('ProductSaleID')?.value;
        if (selectedId) {
          const product = this.productSaleList.find(p => p.ProductSaleID === selectedId);
          if (product) {
            this.selectedProductName = product.ProductName;
          }
        }
        console.log(this.productSaleList);
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          });
      },
    });

    this.inventoryStockService.getProductType().subscribe({
      next: (response: any) => {
        this.projectTypes = this.projectService.createdDataTree(
          response.data,
          'ParentID',
          'ID',
          'ProjectTypeName'
        );
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải loại dự án: ' + error.message
        );
      },
    });

    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeList = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          });
      },
    });
  }

  onProductSearch(event: any): void {
    const value = typeof event === 'string' ? event : (event?.target?.value || '');
    this.productSearchText = value;
    const term = value.trim().toLowerCase();
    this.isProductDropdownVisible = true;
    if (!term) {
      this.filteredProductSaleList = [...this.productSaleList];
    } else {
      this.filteredProductSaleList = this.productSaleList.filter(
        (p) =>
          (p.ProductNewCode && p.ProductNewCode.toLowerCase().includes(term)) ||
          (p.ProductCode && p.ProductCode.toLowerCase().includes(term)) ||
          (p.ProductName && p.ProductName.toLowerCase().includes(term)) ||
          (p.UnitName && p.UnitName.toLowerCase().includes(term))
      );
    }
  }

  selectProduct(product: any): void {
    this.formGroup.patchValue({
      ProductSaleID: product.ProductSaleID,
    });
    this.selectedProductName = product.ProductName;
    this.isProductDropdownVisible = false;
  }

  clearProduct(): void {
    this.formGroup.patchValue({
      ProductSaleID: null,
    });
    this.selectedProductName = '';
    this.filteredProductSaleList = [...this.productSaleList];
  }

  onDropdownVisibleChange(visible: boolean): void {
    if (visible) {
      this.scrollToSelectedProduct();
    }
  }

  scrollToSelectedProduct(): void {
    const selectedId = this.formGroup?.get('ProductSaleID')?.value;
    if (selectedId && this.filteredProductSaleList && this.filteredProductSaleList.length > 0) {
      const index = this.filteredProductSaleList.findIndex(
        (p) => p.ProductSaleID === selectedId
      );
      if (index !== -1) {
        this.productPageIndex = Math.floor(index / 50) + 1;
      } else {
        this.productPageIndex = 1;
      }
    } else {
      this.productPageIndex = 1;
    }
  }
  //#endregion

  //#region Lưu dữ liệu
  onSave(isNew: boolean): void {
    debugger;
    if (this.isSaving) return;
    if (this.formGroup.invalid) {
      Object.values(this.formGroup.controls).forEach((c) => {
        c.markAsTouched();
        c.updateValueAndValidity({ onlySelf: true });
      });
      return;
    }

    this.isSaving = true;
    const formValue = this.formGroup.value;

    const productSale = this.productSaleList.find(
      (p) => p.ProductSaleID === formValue.ProductSaleID
    );
    const productSaleText = productSale
      ? `${productSale.ProductCode} - ${productSale.ProductName}`
      : '';

    const projectType = this.findProjectTypeById(
      this.projectTypes,
      formValue.ProjectTypeID
    );
    const projectTypeText = projectType ? projectType.title : '';

    const employee = this.findEmployeeById(formValue.EmployeeIDRequest);
    const employeeText = employee
      ? `${employee.Code} - ${employee.FullName}`
      : '';

    const inventoryStock = {
      ...this.formGroup.value,
      EmployeeIDRequest: this.appUserService.employeeID,
      ProjectTypeID: 0,
      Quantity: formValue.MinQuantity,
      IsDelete: false,
      ID: this.inventoryStock?.ID || 0,
    };

    this.inventoryStockService.validateInventory(inventoryStock).subscribe({
      next: (response: any) => {
        this.inventoryStockService.saveDataInventory(inventoryStock).subscribe({
          next: (response: any) => {
            this.isSaving = false;
            if (isNew) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Lưu dữ liệu thành công'
              );
              this.formGroup.reset();
              this.formGroup
                .get('EmployeeIDRequest')
                ?.setValue(this.appUserService.employeeID);
              this.formGroup.get('MinQuantity')?.setValue(1);
              this.formGroup
                .get('WarehouseID')
                ?.setValue(this.warehouseID || 1);
              this.inventoryStock = [];
              this.clearProduct();
            } else {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Cập nhật dữ liệu thành công'
              );
              this.activeModal.close();
            }
          },
          error: (error) => {
            this.isSaving = false;
            this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`,
              {
                nzStyle: { whiteSpace: 'pre-line' }
              });
          },
        });
      },
      error: (error) => {
        this.isSaving = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          `Thiết bị mã [${productSaleText}] đã được nhân viên [${employeeText}] yêu cầu cho loại [${projectTypeText}]!`
        );
      },
    });
  }

  // Helper: Tìm project type trong tree structure
  private findProjectTypeById(nodes: any[], id: number): any {
    for (const node of nodes) {
      if (node.key === id || node.ID === id) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = this.findProjectTypeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper: Tìm employee trong grouped list
  private findEmployeeById(employeeId: number): any {
    debugger;
    for (const group of this.employeeList) {
      if (group.options) {
        const employee = group.options.find(
          (opt: any) => Number(opt.item.EmployeeID) === Number(employeeId)
        );
        if (employee) return employee.item;
      }
    }
    return null;
  }

  //#endregion
}
