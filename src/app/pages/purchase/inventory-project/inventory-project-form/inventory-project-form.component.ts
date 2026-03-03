import { Component, OnInit, Input, Output, EventEmitter, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { InventoryProjectService } from '../inventory-project-service/inventory-project.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { AuthService } from '../../../../auth/auth.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-inventory-project-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzInputNumberModule,
    NzFormModule,
  ],
  templateUrl: './inventory-project-form.component.html',
  styleUrl: './inventory-project-form.component.css'
})
export class InventoryProjectFormComponent implements OnInit, AfterViewInit {
  @Input() dataInput: any;
  @Input() isViewMode: boolean = false;
  @Input() isRejectMode: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();

  public activeModal = inject(NgbActiveModal);
  private inventoryProjectService = inject(InventoryProjectService);
  private notification = inject(NzNotificationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  formGroup: FormGroup;
  pokhList: any[] = [];
  currentUser: any = null;
  
  // POKH Popup state
  showPOKHPopup: boolean = false;
  pokhPopupPosition: { top: string; left: string } = { top: '0px', left: '0px' };
  pokhTable: Tabulator | null = null;
  pokhSearchText: string = '';
  private searchSubject = new Subject<string>();
  
  @ViewChild('pokhButton', { static: false }) pokhButton!: ElementRef;

  constructor() {
    this.formGroup = this.fb.group({
      projectInfo: [{ value: '', disabled: true }],
      customerName: [{ value: '', disabled: true }],
      pokhInfo: [{ value: '', disabled: true }],
      productCode: [{ value: '', disabled: true }],
      productNewCode: [{ value: '', disabled: true }],
      productName: [{ value: '', disabled: true }],
      unit: [{ value: '', disabled: true }],
      totalQuantityLast: [{ value: 0, disabled: true }],
      quantityOrigin: [{ value: 0, disabled: true }],
      warehouseCode: [{ value: '', disabled: true }],
      note: [{ value: '', disabled: true }],
      pokhDetailIDFrom: [{ value: null, disabled: true }],
      pokhDetailIDTo: [null, [Validators.required]],
      quantity: [null, [Validators.required, Validators.min(0.01)]],
    });
  }

  ngOnInit(): void {
    this.getCurrentUser();
    this.loadPOKH();

    if (this.dataInput) {
      this.formGroup.patchValue({
        projectInfo: `${this.dataInput.ProjectCode || ''} - ${this.dataInput.ProjectName || ''}`.trim().replace(/^ - | - $/g, ''),
        customerName: this.dataInput.CustomerName || '',
        pokhInfo: `${this.dataInput.PONumber || ''} - ${this.dataInput.POCode || ''}`.trim().replace(/^ - | - $/g, ''),
        productCode: this.dataInput.ProductCode || '',
        productNewCode: this.dataInput.ProductNewCode || '',
        productName: this.dataInput.ProductName || '',
        unit: this.dataInput.Unit || '',
        totalQuantityLast: this.dataInput.TotalQuantityLast || 0,
        quantityOrigin: this.dataInput.Quantity || 0,
        warehouseCode: this.dataInput.WarehouseCode || '',
        note: this.dataInput.Note || '',
        pokhDetailIDFrom: this.dataInput.POKHDetailID || null,
      });
    }

    // Nếu là view mode, disable tất cả
    if (this.isViewMode) {
      this.formGroup.disable();
    }

    // Subscribe để validate quantity
    this.formGroup.get('quantity')?.valueChanges.subscribe(value => {
      this.validateQuantity(value);
    });

    // Setup debounce search
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchText => {
      this.filterPOKHTable(searchText);
    });
  }

  ngAfterViewInit(): void {
    // Component lifecycle hook
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
    });
  }

  loadPOKH() {
    const productSaleID = this.dataInput?.ProductSaleID ?? 0;

    this.inventoryProjectService.getPOKH(productSaleID).subscribe({
      next: (response: any) => {
        this.pokhList = response.data || [];
        console.log('POKH List:', this.pokhList);
      },
      error: (error: any) => {
        console.error('Lỗi khi tải danh sách POKH:', error);
      }
    });
  }

  togglePOKHPopup() {
    if (!this.isRejectMode) return;
    
    this.showPOKHPopup = !this.showPOKHPopup;

    if (this.showPOKHPopup) {
      // Calculate position based on button
      const buttonElement = this.pokhButton?.nativeElement;
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        // Position popup below or above button depending on available space
        if (spaceBelow < 350 && spaceAbove > spaceBelow) {
          // Show above
          this.pokhPopupPosition = {
            top: (rect.top - 350) + 'px',
            left: rect.left + 'px'
          };
        } else {
          // Show below
          this.pokhPopupPosition = {
            top: rect.bottom + 'px',
            left: rect.left + 'px'
          };
        }
      }

      // Draw table after popup is shown
      setTimeout(() => {
        this.drawPOKHTable();
      }, 50);
    } else {
      // Destroy table when closing
      if (this.pokhTable) {
        this.pokhTable.destroy();
        this.pokhTable = null;
      }
    }
  }

  onPOKHSearchChange(searchText: string) {
    this.searchSubject.next(searchText);
  }

  closePOKHPopup() {
    this.showPOKHPopup = false;
    if (this.pokhTable) {
      this.pokhTable.destroy();
      this.pokhTable = null;
    }
  }

  drawPOKHTable() {
    const tableElement = document.getElementById('pokhTableContainer');
    if (!tableElement || this.pokhTable) return;

    this.pokhTable = new Tabulator(tableElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.pokhList,
      layout: 'fitDataStretch',
      height: '300px',
      pagination: false,
      headerSort: true,
      columns: [
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          width: 120,
          headerSort: true,
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          width: 120,
          headerSort: true,
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          minWidth: 250,
          headerSort: true,
        },
        {
          title: 'Số lượng',
          field: 'Qty',
          minWidth: 250,
          headerSort: true,
        },
        {
          title: 'Số PO',
          field: 'PONumber',
          minWidth: 250,
          headerSort: true,
        },
        {
          title: 'Mã PO',
          field: 'POCode',
          minWidth: 250,
          headerSort: true,
        },

      ],
    });

    // Handle row click
    this.pokhTable.on('rowClick', (e: any, row: any) => {
      const data = row.getData();
      this.selectPOKH(data);
    });

    // Handle row double click
    this.pokhTable.on('rowDblClick', (e: any, row: any) => {
      const data = row.getData();
      this.selectPOKH(data);
    });
  }

  filterPOKHTable(searchText: string) {
    if (!this.pokhTable) return;

    const trimmedSearch = searchText.trim().toLowerCase();
    
    if (!trimmedSearch) {
      // Clear all filters
      this.pokhTable.clearFilter(true);
      return;
    }

    // Filter by multiple fields
    this.pokhTable.setFilter([
      [
        { field: 'POCode', type: 'like', value: trimmedSearch },
        { field: 'PONumber', type: 'like', value: trimmedSearch },
        { field: 'DisplayText', type: 'like', value: trimmedSearch },
      ]
    ]);
  }

  selectPOKH(pokh: any) {
    this.formGroup.patchValue({
      pokhDetailIDTo: pokh.ID
    });
    this.pokhSearchText = pokh.DisplayText || '';
    this.closePOKHPopup();
  }

  getSelectedPOKHText(): string {
    const selectedId = this.formGroup.get('pokhDetailIDTo')?.value;
    if (!selectedId) return '';
    
    const selectedPOKH = this.pokhList.find((p: any) => p.ID === selectedId);
    return selectedPOKH ? selectedPOKH.DisplayText : '';
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
    if (this.pokhTable) {
      this.pokhTable.destroy();
    }
  }

  validateQuantity(value: number) {
    const quantityOrigin = this.formGroup.get('quantityOrigin')?.value || 0;
    const quantityControl = this.formGroup.get('quantity');

    if (value > quantityOrigin) {
      quantityControl?.setErrors({ 
        max: true,
        message: `Số lượng nhả giữ không được lớn hơn số lượng giữ (${quantityOrigin})`
      });
    }
  }

  getQuantityError(): string | undefined {
    const control = this.formGroup.get('quantity');
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        return 'Vui lòng nhập số lượng nhả giữ!';
      }
      if (control.errors?.['min']) {
        return 'Số lượng phải lớn hơn 0!';
      }
      if (control.errors?.['max']) {
        return control.errors?.['message'] || 'Số lượng nhả giữ không hợp lệ!';
      }
    }
    return "Vui lòng chọn POKH đích";
  }

  getPOKHToError(): string | undefined {
    const control = this.formGroup.get('pokhDetailIDTo');
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        return 'Vui lòng chọn POKH đích!';
      }
    }
    return undefined;
  }

  saveStatus() {
    // Mark all fields as touched
    Object.keys(this.formGroup.controls).forEach(key => {
      const control = this.formGroup.get(key);
      if (control && !control.disabled) {
        control.markAsTouched();
      }
    });

    if (this.formGroup.invalid) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin số lượng nhả giữ và POHK đích!');
      return;
    }

    const formValue = this.formGroup.value;
    const pokhDetailIDFrom = this.dataInput.POKHDetailID;
    const pokhDetailIDTo = formValue.pokhDetailIDTo;
    const quantity = formValue.quantity;
    const quantityOrigin = this.dataInput.Quantity;

    // Validate
    if (quantity <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Số lượng nhả giữ phải lớn hơn 0!');
      return;
    }

    if (quantity > quantityOrigin) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Bạn không thể nhả giữ lớn hơn số lượng giữ!\nSố lượng giữ: ${quantityOrigin}\nSố lượng nhả: ${quantity}`
      );
      return;
    }

    if (!pokhDetailIDFrom || pokhDetailIDFrom <= 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Sản phẩm đang giữ cho dự án. Bạn không thể nhả giữ sang hàng thương mại!'
      );
      return;
    }

    if (!pokhDetailIDTo || pokhDetailIDTo <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn POKH đích!');
      return;
    }

    // Bước 1: Update bản ghi cũ (giảm số lượng)
    const updatePayload = {
      ID: this.dataInput.ID,
      Quantity: quantityOrigin - quantity,
      UpdatedBy: this.currentUser?.LoginName || '',
      UpdatedDate: new Date().toISOString(),
    };

    this.inventoryProjectService.saveData(updatePayload).subscribe({
      next: (updateResponse: any) => {
        if (updateResponse.status === 1) {
          // Bước 2: Insert bản ghi mới (nếu có POKH đích)
          if (pokhDetailIDTo > 0) {
            const insertPayload = {
              ID: 0,
              ParentID: this.dataInput.ID,
              ProductSaleID: this.dataInput.ProductSaleID,
              WarehouseID: this.dataInput.WarehouseID || 1,
              Quantity: quantity,
              ProjectID:0,
              CustomerID:0,
              Note:"",
              QuantityOrigin: quantity,
              POKHDetailID: pokhDetailIDTo,
              EmployeeID: this.currentUser?.EmployeeID || 0,
              CreatedBy: this.currentUser?.LoginName || '',
              CreatedDate: new Date().toISOString(),
              IsDeleted: false,
            };

            this.inventoryProjectService.saveData(insertPayload).subscribe({
              next: (insertResponse: any) => {
                if (insertResponse.status === 1) {
                  this.notification.success(NOTIFICATION_TITLE.success, 'Nhả giữ thành công!');
                  this.formSubmitted.emit();
                  this.activeModal.close(true);
                } else {
                  this.notification.error(
                    NOTIFICATION_TITLE.error,
                    insertResponse.message || 'Lỗi khi tạo bản ghi mới!'
                  );
                }
              },
              error: (error: any) => {
                this.notification.error(
                  NOTIFICATION_TITLE.error,
                  error.error?.message || 'Lỗi khi tạo bản ghi mới!'
                );
              }
            });
          } else {
            this.notification.success(NOTIFICATION_TITLE.success, 'Nhả giữ thành công!');
            this.formSubmitted.emit();
            this.activeModal.close(true);
          }
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            updateResponse.message || 'Lỗi khi cập nhật số lượng!'
          );
        }
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error.error?.message || 'Lỗi khi cập nhật số lượng!'
        );
      }
    });
  }

  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}
