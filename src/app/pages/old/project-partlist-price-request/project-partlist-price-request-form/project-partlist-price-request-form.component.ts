import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  Input,
  Output,
  EventEmitter,
  createComponent,
  EnvironmentInjector,
  ApplicationRef,
  Type,
} from '@angular/core';
import {
  TabulatorFull as Tabulator,
  ColumnDefinition,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { FormsModule } from '@angular/forms';
import { ProjectPartlistPriceRequestService } from '../project-partlist-price-request-service/project-partlist-price-request.service';
import { ReactiveFormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { DateTime } from 'luxon';
import {
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { AuthService } from '../../../../auth/auth.service';
import { FirmService } from '../../../general-category/firm/firm-service/firm.service';
import { SelectControlComponent } from '../../select-control/select-control.component';
import { TabulatorPopupComponent } from '../../../../shared/components/tabulator-popup/tabulator-popup.component';


@Component({
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzFormModule,
    NzModalModule,
    NzDatePickerModule,
    NzGridModule,
    NzButtonModule,
    NzIconModule,
    NgbModalModule,
    SelectControlComponent,
    TabulatorPopupComponent
  ],
  selector: 'app-project-partlist-price-request-form',
  templateUrl: './project-partlist-price-request-form.component.html',
  styleUrls: ['./project-partlist-price-request-form.component.css'],
})
export class ProjectPartlistPriceRequestFormComponent
  implements OnInit, AfterViewInit
{
    private priceRequestService = inject(ProjectPartlistPriceRequestService);
    private notification = inject(NzNotificationService);
    private authService = inject(AuthService);
    private firmService = inject(FirmService);
    injector = inject(EnvironmentInjector);
    appRef = inject(ApplicationRef);

  @Input() dataInput: any;
  @Input() jobRequirementID: number = 0;
    @Input() projectTypeID: number = 0;
    @Input() initialPriceRequestTypeID: number | null = null;

  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();

  close(result?: any) {
    this.activeModal.close(result);
  }
  requester: Number = 0;
  requestDate: Date | null = null;
  priceRequestTypeID: number | null = null;

    users:any[] = [];
    employeeGroups: Array<{ department: string; items: any[] }> = [];
    priceRequestTypes: any[] = [];
    dtProductSale: any[] = [];
    firms: any[] = [];
    lstSave: any[] = [];
  requesterLoading: boolean = false;
  priceRequestTypeLoading: boolean = false;
  notFoundContent: string = 'Không tìm thấy dữ liệu';
  @ViewChild('table', { static: false }) tableDiv!: ElementRef;
  table!: Tabulator;
    tableData: any[] = [];

  currentUserId: number = 0;
  currentUser: any = null;
  isAdmin: boolean = false;
  originalRowsMap: Map<number, any> = new Map();
  originalIds: number[] = [];
  
  // Map để lưu mapping HR Note: ProjectPartlistPriceRequestID -> { ID, Note }
  hrNotesMap: Map<number, { id: number; note: string }> = new Map();

  // Popup state management
  showProductPopup: boolean = false;
  currentEditingCell: any = null;
  productPopupPosition: { top: string; left: string } = { top: '0px', left: '0px' };
  productColumns: ColumnDefinition[] = [
    { title: 'Mã SP', field: 'ProductCode', width: 120, headerSort: false },
    { title: 'Tên sản phẩm', field: 'ProductName', width: 200, headerSort: false },
    { title: 'Mã nội bộ', field: 'ProductNewCode', width: 120, headerSort: false },
    { title: 'ĐVT', field: 'Unit', width: 80, headerSort: false },
  ];
  productSearchFields: string[] = ['ProductCode', 'ProductName', 'ProductNewCode'];

  constructor(public activeModal: NgbActiveModal) {}

    get isEditMode(): boolean {
      return !!(this.dataInput && this.dataInput.length > 0);
    }

  ngOnInit(): void {
      // Lấy thông tin user hiện tại từ AuthService
    this.authService.getCurrentUser().subscribe({
      next: (response: any) => {
        const data = response?.data;
     this.currentUser= Array.isArray(data) ? data[0] : data;
        
        if (this.currentUser) {
          this.currentUserId = Number(
            this.currentUser.EmployeeID ?? this.currentUser.employeeId ?? 0
          );
          
          this.isAdmin = Boolean(
            this.currentUser.IsAdmin ?? this.currentUser.isAdmin ?? this.currentUser.IsSystemAdmin ?? false
          );
        }
      },
      error: (err: any) => {
        console.error('Error getting current user:', err);
      }
    });

      this.lstSave = [];
      this.getAllUser();
      this.getPriceRequestType();
      this.getProductSale();
      this.getFirms();
    
    if (!this.dataInput || this.dataInput.length === 0) {
        // Khi thêm mới: set priceRequestTypeID từ initialPriceRequestTypeID
        if (this.initialPriceRequestTypeID !== null && this.initialPriceRequestTypeID > 0) {
          this.priceRequestTypeID = this.initialPriceRequestTypeID;
        }
      this.requestDate = new Date();
      this.tableData = [];
      return;
    }

      // Lưu lại bản gốc để dùng cho soft-delete
    this.dataInput.forEach((row: any) => {
      if (row.ID > 0) {
        this.originalRowsMap.set(row.ID, { ...row });
        this.originalIds.push(row.ID);
      }
    });

    this.requester = Number(this.dataInput[0]['EmployeeID']) || 0;
    this.requestDate = this.dataInput[0]['DateRequest'] 
      ? new Date(this.dataInput[0]['DateRequest']) 
      : new Date();
    
      // Lưu tạm giá trị, sẽ bind lại sau khi priceRequestTypes load xong
      const tempTypeID = Number(this.dataInput[0]['ProjectPartlistPriceRequestTypeID'] 
      || this.dataInput[0]['PriceRequestTypeID'] 
        || 0);
      
      // Chỉ set ngay nếu có giá trị, sẽ được bind lại chính xác trong getPriceRequestType
      if (tempTypeID > 0) {
        this.priceRequestTypeID = tempTypeID;
      }
      
      this.tableData = this.dataInput.map((row: any) => {
        return {
          ...row,
          NoteHR: row.NoteHR || row.HRNote || ''
        };
      });
      
      // Lưu mapping HR notes nếu có
      this.dataInput.forEach((row: any) => {
        if (row.ID > 0 && (row.NoteHR || row.HRNote)) {
          this.hrNotesMap.set(row.ID, {
            id: row.HRNoteID || 0,
            note: row.NoteHR || row.HRNote || ''
          });
        }
      });
  }
  getAllUser() {
    this.requesterLoading = true;
    this.priceRequestService.getEmployee().subscribe({
      next: (response) => {
        const list = response.data.dtEmployee || [];
        this.users = list;
        this.createLabels("lbusers", this.users, 'ID', 'FullName');
        
        const map = new Map<string, any[]>();
        for (const emp of list) {
          const dept = emp.DepartmentName || 'Khác';
          if (!map.has(dept)) map.set(dept, []);
          map.get(dept)!.push(emp);
        }

        this.employeeGroups = Array.from(map.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([department, items]) => ({
            department,
            items: items.sort((x, y) =>
              String(x.Code || '').localeCompare(String(y.Code || ''))
            ),
          }));

        this.requesterLoading = false;
      },
      error: (err) => {
        this.requesterLoading = false; 
      },
    });
  }

  getPriceRequestType() {
    this.priceRequestTypeLoading = true;
    this.priceRequestService.getPriceRequestType().subscribe({
      next: (response) => {
        this.priceRequestTypes = response.data || [];
        this.priceRequestTypeLoading = false;
        
          // Đảm bảo giá trị được set sau khi priceRequestTypes đã có dữ liệu
          setTimeout(() => {
        if (this.dataInput && this.dataInput.length > 0) {
              // Khi sửa: bind từ dataInput, đảm bảo giá trị tồn tại trong danh sách
              const typeId = Number(this.dataInput[0]['ProjectPartlistPriceRequestTypeID'] 
            || this.dataInput[0]['PriceRequestTypeID'] 
                || 0);
              
              if (typeId > 0) {
                // Kiểm tra xem typeId có tồn tại trong danh sách không
                const exists = this.priceRequestTypes.some((t: any) => t.ID === typeId);
                if (exists) {
            this.priceRequestTypeID = typeId;
                } else {
                  // Nếu không tồn tại, vẫn set để hiển thị (có thể là giá trị cũ)
            this.priceRequestTypeID = typeId;
          }
              } else {
                // Nếu không có giá trị từ dataInput, dùng giá trị mặc định từ initialPriceRequestTypeID
                if (this.initialPriceRequestTypeID !== null && this.initialPriceRequestTypeID > 0) {
                  const exists = this.priceRequestTypes.some((t: any) => t.ID === this.initialPriceRequestTypeID);
                  if (exists) {
                    this.priceRequestTypeID = this.initialPriceRequestTypeID;
                  }
                }
              }
            } else {
              // Khi thêm mới: set từ initialPriceRequestTypeID
              if (this.initialPriceRequestTypeID !== null && this.initialPriceRequestTypeID > 0) {
                const exists = this.priceRequestTypes.some((t: any) => t.ID === this.initialPriceRequestTypeID);
                if (exists) {
                  this.priceRequestTypeID = this.initialPriceRequestTypeID;
                }
              }
            }
            
            // Gọi onPriceRequestTypeChange để update column visibility sau khi table đã được vẽ
            setTimeout(() => {
              if (this.table) {
                this.onPriceRequestTypeChange(this.priceRequestTypeID);
              }
            }, 200);
          }, 0);
      },
      error: (err: any) => {
        this.priceRequestTypeLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Có lỗi xảy ra');
      },
    });
  }


  dismiss() {
    this.activeModal.dismiss();
  }
    
  private labelMaps: Map<string, { [key: number]: string }> = new Map();

  createLabels(
    labelName: string,
    data: any[],
    keyField: string = 'ID',
    valueField: string = 'Name'
  ): { [key: number]: string } {
    const labels: { [key: number]: string } = {};

    data.forEach((item) => {
      if (!labels[item[keyField]]) {
        labels[item[keyField]] = item[valueField];
      }
    });

    this.labelMaps.set(labelName, labels);
    return labels;
  }

  getLabels(labelName: string): { [key: number]: string } {
    return this.labelMaps.get(labelName) || {};
  }

  getLabelValue(labelName: string, key: number): string {
    const labels = this.labelMaps.get(labelName);
    return labels ? labels[key] || '' : '';
  }
  getProductSale() {
    this.priceRequestService.getProductSale().subscribe({
      next: (response) => {
        this.dtProductSale = response.data;
        this.createLabels('productSale', this.dtProductSale, 'ID', 'ProductNewCode');
        setTimeout(() => {
          this.drawTable();
        }, 0);
      },
      error: (err) => {
      }
    });
  }

  getFirms() {
    this.firmService.getFirms().subscribe({
      next: (response) => {
        this.firms = response.data || [];
      },
      error: (err) => {
        console.error('Error loading firms:', err);
      }
    });
  }
  ngAfterViewInit(): void {
  }
  createdControl1(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    getData: () => any[],
    labelField: string = 'label',
    valueField: string = 'value',
    placeholder: string = 'Chọn sản phẩm'
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.display = 'block';
      
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      const cellValue = cell.getValue();
      const data = getData();

      componentRef.instance.id = cellValue;
      componentRef.instance.data = data;
      componentRef.instance.valueField = valueField;
        componentRef.instance.labelField = labelField;
      componentRef.instance.placeholder = placeholder;

      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      const hostEl = (componentRef.hostView as any).rootNodes[0];
      if (hostEl && hostEl.style) {
        hostEl.style.width = '100%';
        hostEl.style.display = 'block';
      }
      container.appendChild(hostEl);
      appRef.attachView(componentRef.hostView);
      
      onRendered(() => {
        setTimeout(() => {
          const selectEl = container.querySelector('nz-select');
          if (selectEl) {
            (selectEl as HTMLElement).focus();
          }
        }, 100);
      });

      return container;
    };
  }

  createFirmEditor() {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.display = 'block';
      
      const componentRef = createComponent(SelectControlComponent, {
        environmentInjector: this.injector,
      });

      const cellValue = cell.getValue();
      const firmsData = this.firms.map((firm: any) => ({
        value: firm.Code || firm.FirmCode || firm.Name || '',
        label: firm.Code || firm.FirmCode || firm.Name || '',
        ...firm
      }));

      componentRef.instance.id = cellValue;
      componentRef.instance.data = firmsData;
      componentRef.instance.valueField = 'value';
      componentRef.instance.labelField = 'label';
      componentRef.instance.placeholder = 'Chọn hãng';

      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      const hostEl = (componentRef.hostView as any).rootNodes[0];
      if (hostEl && hostEl.style) {
        hostEl.style.width = '100%';
        hostEl.style.display = 'block';
      }
      container.appendChild(hostEl);
      this.appRef.attachView(componentRef.hostView);
      
      onRendered(() => {
        setTimeout(() => {
          const selectEl = container.querySelector('nz-select');
          if (selectEl) {
            (selectEl as HTMLElement).focus();
          }
        }, 100);
      });

      return container;
    };
  }

  requesterSearchChange(searchValue: string | Event): void {
    let searchText: string;

    if (typeof searchValue === 'string') {
      searchText = searchValue;
    } else {
      searchText = (searchValue.target as HTMLInputElement)?.value || '';
    }

    if (searchText) {
      this.requesterLoading = true;
      this.priceRequestService.getEmployee().subscribe({
        next: (response) => {
          const list = response.data.dtEmployee || [];
          const filtered = list.filter((user: any) =>
            user.ID === Number(searchText) ||
            user.FullName?.toLowerCase().includes(searchText.toLowerCase()) ||
            user.Code?.toLowerCase().includes(searchText.toLowerCase())
          );
          
          this.users = filtered;
          
          const map = new Map<string, any[]>();
          for (const emp of filtered) {
            const dept = emp.DepartmentName || 'Khác';
            if (!map.has(dept)) map.set(dept, []);
            map.get(dept)!.push(emp);
          }

          this.employeeGroups = Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([department, items]) => ({
              department,
              items: items.sort((x, y) =>
                String(x.Code || '').localeCompare(String(y.Code || ''))
              ),
            }));

          this.requesterLoading = false;
        },
        error: (err) => {
          this.requesterLoading = false;
        },
      });
    } else {
      this.getAllUser();
    }
  }
    
  private canEditCell(rowData: any): boolean {
    const status = Number(rowData['StatusRequest'] || 0);
    const isCheckPrice = !!rowData['IsCheckPrice'];

    if (status === 2 || status === 3 || isCheckPrice) return false;

    if (!this.isAdmin &&
        rowData['EmployeeID'] &&
        Number(rowData['EmployeeID']) !== this.currentUserId) {
      return false;
    }

    return true;
  }

   private drawTable(): void {
    this.table = new Tabulator(this.tableDiv.nativeElement, {
          data: this.tableData,
          layout: 'fitDataStretch',
          columns: [
            {
              title: '',
              headerSort: false,
                titleFormatter: () => {
                  if (this.isEditMode) {
                    return `<div class="d-flex justify-content-center align-items-center h-100"></div>`;
                  }
                  return `
                <div class="d-flex justify-content-center align-items-center h-100">
                  <i class="fas fa-plus text-white cursor-pointer" title="Thêm dòng"></i>
                </div>
              `;
                },
                    headerClick: () => {
                      if (this.isEditMode) {
                        return;
                      }
                      this.addRow();
                    },
              formatter: () =>
                `<i class="fa-solid fa-xmark" style="cursor:pointer;color:red;"></i>`,
              width: 50,
              hozAlign: 'center',
              headerHozAlign: 'center',
              cellClick: (_e, cell) => {
                const row = cell.getRow();
                const rowData = row.getData();
                const status = Number(rowData['StatusRequest'] || 0);
                const isCheckPrice = !!rowData['IsCheckPrice'];

                if (status === 2 || status === 3 || isCheckPrice) {
                  this.notification.warning(
                    'Thông báo',
                    'Không thể xóa dòng đã báo giá / đã hoàn thành / đã check giá!'
                  );
                  return;
                }

                if (!this.isAdmin &&
                    rowData['EmployeeID'] &&
                    Number(rowData['EmployeeID']) !== this.currentUserId) {
                  this.notification.warning(
                    'Thông báo',
                    'Bạn không có quyền xóa yêu cầu của người khác!'
                  );
                  return;
                }

                if (rowData['ID']) {
                  this.lstSave.push({
                    ID: rowData['ID'],
                    IsDeleted: true,
                  });
                }

                row.delete();
              },
            },

        {
          title: 'STT',
          headerSort: false,
          formatter: 'rownum',
          width: 50,
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã nội bộ',
          headerSort: false,
          field: 'ProductNewCode',
          width: 150,
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell: any) => {
            const val = cell.getValue();
            const product = (this.dtProductSale || []).find(
              (p: any) => p.ProductNewCode === val
            );
            const productCode = product ? product.ProductNewCode : '';
            return `
              <button class="btn-toggle-detail w-100 h-100" title="${
                productCode || 'Chọn sản phẩm'
              }">
                <span class="product-code-text">${
                  productCode || 'Chọn SP'
                }</span>
                <span class="arrow">&#9662;</span>
              </button>
            `;
          },
          cellClick: (e, cell) => {
            this.toggleProductTable(cell);
          },
        },
        {
          title: 'Mã sản phẩm (*)',
          headerSort: false,
          field: 'ProductCode',
          editor: 'input',
          headerHozAlign: 'center',
          validator: ['required'],
          width: '150',
          hozAlign: 'left',
          editable: (cell: any) => {
            const rowData = cell.getRow().getData();
            return this.canEditCell(rowData);
          },
        },
        {
          title: 'Tên sản phẩm (*)',
          headerSort: false,
          field: 'ProductName',
          editor: 'input',
          headerHozAlign: 'center',
          validator: ['required'],
          width: '200',
          hozAlign: 'left',
          editable: (cell: any) => {
            const rowData = cell.getRow().getData();
            return this.canEditCell(rowData);
          },
        },
          {
            title: 'Hãng (*)',
            headerSort: false,
            field: 'Maker',
            editor: this.createFirmEditor(),
            headerHozAlign: 'center',
            width: '150',
            hozAlign: 'left',
            formatter: (cell: any) => {
              const val = cell.getValue();
              if (!val) return '';
              const firm = this.firms.find((f: any) => 
                (f.Code || f.FirmCode || f.Name) === val
              );
              return firm ? (firm.Code || firm.FirmCode || firm.Name) : val;
            },
            editable: (cell: any) => {
              const rowData = cell.getRow().getData();
              return this.canEditCell(rowData);
            },
          },
        {
          title: 'Deadline (*)',
          headerSort: false,
          field: 'Deadline',
          editor: 'date',
          formatter: function (cell: any) {
            const value = cell.getValue();
            return value
              ? DateTime.fromJSDate(new Date(value)).toFormat('dd/MM/yyyy')
              : '';
          },
          headerHozAlign: 'center',
          validator: ['required'],
          width: '120',
          hozAlign: 'center',
          editable: (cell: any) => {
            const rowData = cell.getRow().getData();
            return this.canEditCell(rowData);
          },
        },
        {
          title: 'SL yêu cầu (*)',
          headerSort: false,
          field: 'Quantity',
          editor: 'input',
          headerHozAlign: 'center',
          validator: ['required'],
          width: '150',
          hozAlign: 'right',
          editable: (cell: any) => {
            const rowData = cell.getRow().getData();
            return this.canEditCell(rowData);
          },
        },
        {
          title: 'ĐVT (*)',
          headerSort: false,
          field: 'Unit',
          editor: 'input',
          headerHozAlign: 'center',
          validator: ['required'],
          hozAlign: 'left',
          width: '100',
          editable: (cell: any) => {
            const rowData = cell.getRow().getData();
            return this.canEditCell(rowData);
          },
        },
          {
            title: 'Ghi chú HR',
            headerSort: false,
            field: 'NoteHR',
            editor: 'input',
            headerHozAlign: 'center',
            hozAlign: 'left',
            width: 200,
            visible: this.priceRequestTypeID === 3,
            editable: (cell: any) => {
              const rowData = cell.getRow().getData();
              return this.priceRequestTypeID === 3 && this.canEditCell(rowData);
            },
          },
        {
          title: 'Ghi chú chung',
          headerSort: false,
          field: 'RequestNote',
          // editor: this.jobRequirementID > 0 ? undefined : 'input',
          headerHozAlign: 'center',
          hozAlign: 'left',
          width: 200,
          editable: (cell: any) => {
            const rowData = cell.getRow().getData();
            if (this.jobRequirementID > 0) return false;
            return this.canEditCell(rowData);
          },
        },
      ],
      height: '30vh',
      headerSort: false,
      reactiveData: true,
      rowHeader: {
        headerSort: false,
        resizable: false,
        frozen: true,
      },
    });
      
      // Sau khi table được vẽ, update column visibility dựa trên priceRequestTypeID hiện tại
      setTimeout(() => {
        if (this.priceRequestTypeID) {
          this.onPriceRequestTypeChange(this.priceRequestTypeID);
        }
      }, 100);
    }
    onPriceRequestTypeChange(value: number | null) {
      this.priceRequestTypeID = value ?? 0;
    
      if (!this.table) return;
    
      const colNoteHR = this.table.getColumn('NoteHR');
      if (colNoteHR) {
        if (this.priceRequestTypeID === 3) {
          colNoteHR.show();
        } else {
          colNoteHR.hide();
          const rows = this.table.getRows();
          rows.forEach(r => {
            const data = r.getData();
            if (data['NoteHR']) {
              r.update({ NoteHR: null });
            }
          });
        }
      }
  }

  addRow() {
    this.table.addRow({});
  }

  toggleProductTable(cell: any) {
    // Store the current cell being edited
    this.currentEditingCell = cell;
    
    // Calculate popup position based on cell location
    const cellElement = cell.getElement();
    const cellRect = cellElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - cellRect.bottom;
    const spaceAbove = cellRect.top;
    
    // Position popup below or above cell depending on available space
    if (spaceBelow < 300 && spaceAbove > spaceBelow) {
      this.productPopupPosition = {
        top: 'auto',
        left: cellRect.left + 'px'
      };
    } else {
      this.productPopupPosition = {
        top: cellRect.bottom + 'px',
        left: cellRect.left + 'px'
      };
    }
    
    // Show the popup
    this.showProductPopup = true;
  }

  onProductSelected(selectedProduct: any) {
    if (!this.currentEditingCell) return;
    
    const parentRow = this.currentEditingCell.getRow();
    const productNewCode = selectedProduct.ProductNewCode;
    const currentRowData = parentRow.getData();
    
    // Check for duplicates
    const exists = this.table.getData().some((r: any) => {
      if (r.ID === currentRowData.ID) return false;
      return r.ProductNewCode === productNewCode;
    });

    if (exists) {
      this.notification.warning(
        'Thông báo',
        `Sản phẩm có Mã nội bộ [${productNewCode}] đã tồn tại trong danh sách!`
      );
      return;
    }

    // Update row with selected product data
    parentRow.update({
      ProductNewCode: selectedProduct.ProductNewCode,
      ProductCode: selectedProduct.ProductCode,
      ProductName: selectedProduct.ProductName,
      Unit: selectedProduct.Unit,
      Maker: selectedProduct.Maker,
      StatusRequest: selectedProduct.StatusRequest,
    });
    
    // Close the popup
    this.showProductPopup = false;
    this.currentEditingCell = null;
  }

  onPopupClosed() {
    this.showProductPopup = false;
    this.currentEditingCell = null;
  }

  checkDeadline(deadline: Date): boolean {
    const now = new Date();
    const fifteenPM = new Date(now);
    fifteenPM.setHours(15, 0, 0, 0);

    let dateRequest = new Date(now);

    if (now >= fifteenPM) {
      dateRequest.setDate(dateRequest.getDate() + 1);
    }

    if (dateRequest.getDay() === 6) {
      dateRequest.setDate(dateRequest.getDate() + 2);
    } else if (dateRequest.getDay() === 0) {
      dateRequest.setDate(dateRequest.getDate() + 1);
    }

    let workDays: Date[] = [];
    const dateReq = new Date(dateRequest.toDateString());
    const dateDL = new Date(deadline.toDateString());
    const totalDays = Math.floor(
      (dateDL.getTime() - dateReq.getTime()) / (1000 * 3600 * 24)
    );

    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(dateReq);
      d.setDate(d.getDate() + i);
      const day = d.getDay();
      if (day !== 0 && day !== 6) {
        workDays.push(d);
      }
    }

    if (workDays.length < 2&&!this.currentUser?.IsAdmin) {
      this.notification.warning(
        'Thông báo',
        `Deadline phải ít nhất là 2 ngày làm việc tính từ [${dateRequest.toLocaleDateString(
          'vi-VN'
        )}] (không tính Thứ 7 & Chủ nhật).`
      );
      return false;
    }

    return true;
  }
  validate(): boolean {
    const employeeID = Number(this.requester);
    if (employeeID <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn Người yêu cầu!');
      return false;
    }
    if (!this.priceRequestTypeID || this.priceRequestTypeID <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn Loại yêu cầu!');
      return false;
    }
    const rows = this.table.getRows();
    if (rows.length <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng tạo ít nhất một yêu cầu!');
      return false;
    }
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const data = row.getData();
      const stt = i + 1;
      const code = (data['ProductCode'] || '').trim();
      const name = (data['ProductName'] || '').trim();
      const maker = (data['Maker'] || '').trim();
      const unit = (data['Unit'] || '').trim();
      const quantity = Number(data['Quantity']);
      const deadline = data['Deadline'] ? new Date(data['Deadline']) : null;

      if (!code) {
        this.notification.warning(
          'Thông báo',
          `Vui lòng nhập Mã sản phẩm tại dòng [${stt}]!`
        );
        return false;
      }

      if (!name) {
        this.notification.warning(
          'Thông báo',
          `Vui lòng nhập Tên sản phẩm tại dòng [${stt}]!`
        );
        return false;
      }

      if (!deadline || isNaN(deadline.getTime())) {
        this.notification.warning(
          'Thông báo',
          `Vui lòng nhập Deadline sản phẩm tại dòng [${stt}]!`
        );
        return false;
      } else if (!this.checkDeadline(deadline)) {
        return false;
      }

      if (isNaN(quantity) || quantity <= 0) {
        this.notification.warning(
          'Thông báo',
          `Vui lòng nhập SL yêu cầu tại dòng [${stt}]!`
        );
        return false;
      }

      if (!maker) {
        this.notification.warning(
          'Thông báo',
          `Vui lòng nhập Hãng tại dòng [${stt}]!`
        );
        return false;
      }

      if (!unit) {
        this.notification.warning(
          'Thông báo',
          `Vui lòng nhập ĐVT tại dòng [${stt}]!`
        );
        return false;
      }
    }

    return true;
  }
  saveAndClose() {
    if (!this.validate()) return;
    const rows = this.table.getRows();
    const recordsToSave: any[] = [];
    rows.forEach(row => {
      const data = row.getData();
      const isNew = !data['ID'] || data['ID'] === 0;
      const original = data['ID'] && data['ID'] > 0
        ? (this.originalRowsMap.get(data['ID']) || {})
        : {};
      const oldStatus = Number(
        original['StatusRequest'] ?? data['StatusRequest'] ?? 1
      );
      const isCheckPrice = !!(
        original['IsCheckPrice'] ?? data['IsCheckPrice']
      );
      if (!isNew && (oldStatus === 2 || oldStatus === 3 || isCheckPrice)) {
        return;
      }

      const note = (data['RequestNote'] || data['Note'] || '').toString();

      const record: any = {
          ...(original || {}),
        ID: data['ID'] ?? 0,
        ProductCode: (data['ProductCode'] || '').toString(),
        ProductName: (data['ProductName'] || '').toString(),
        Maker: (data['Maker'] || '').toString(),
        Unit: (data['Unit'] || '').toString(),
        Quantity: Number(data['Quantity']) || 0,
        Deadline: data['Deadline']
          ? DateTime.fromJSDate(new Date(data['Deadline'])).toJSDate()
          : null,
        Note: note,
        DateRequest: this.requestDate ? new Date(this.requestDate) : null,
        EmployeeID: Number(this.requester) || null,
        JobRequirementID:
          this.jobRequirementID > 0 ? this.jobRequirementID : null,
        ProjectPartlistPriceRequestTypeID: this.priceRequestTypeID || null,
        StatusRequest: isNew ? 1 : oldStatus,
          NoteHR: data['NoteHR'] || null,
        IsDeleted: false,
      };

      if (isNew && record['ProjectPartlistPriceRequestTypeID'] !== 4) {
        if (this.jobRequirementID > 0) {
          record['IsJobRequirement'] = true;
          record['IsCommercialProduct'] = false;
        } else {
          record['IsJobRequirement'] = false;
          record['IsCommercialProduct'] = true;
        }
      }

      recordsToSave.push(record);
    });

    const currentIds = rows
      .map(r => r.getData()['ID'])
      .filter((id: any) => id && id > 0) as number[];

    const removedIds = this.originalIds.filter(
      id => !currentIds.includes(id)
    );

    removedIds.forEach(id => {
      const original = this.originalRowsMap.get(id);
      if (!original) return;

      recordsToSave.push({
        ...original,
        IsDeleted: true,
      });
    });

    this.priceRequestService.saveData(recordsToSave).subscribe({
      next: (response) => {
          // Lưu ghi chú HR nếu là loại HR (typeID = 3)
          if (this.priceRequestTypeID === 3) {
            this.saveHRNotes(recordsToSave, response);
          } else {
        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu dữ liệu thành công!');
        this.formSubmitted.emit();
        this.activeModal.close('saved');
          }
      },
      error: (e: any) => {
        let errorMessage = 'Lưu dữ liệu thất bại!';
        if (e.error && e.error.message) {
          errorMessage += ` Chi tiết: ${e.error.message}`;
        }
        if (e.error && e.error.errors) {
          const errors = e.error.errors;
          const errorDetails = Object.keys(errors).map(key => `${key}: ${errors[key].join(', ')}`).join('; ');
          errorMessage += ` ${errorDetails}`;
        }

        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      },
    });
  }

    // Lưu ghi chú HR vào bảng ProjectPartlistPriceRequestNote
    private saveHRNotes(recordsToSave: any[], saveResponse: any): void {
      const rows = this.table.getRows();
      const notesToSave: any[] = [];
      
      const idMap = new Map<number, number>();
      const responseData = saveResponse?.data;
      
      if (responseData) {
        if (Array.isArray(responseData)) {
          responseData.forEach((saved: any, index: number) => {
            if (recordsToSave[index]) {
              const oldID = recordsToSave[index].ID || 0;
              const newID = saved.ID || oldID;
              if (oldID > 0) {
                idMap.set(oldID, newID);
              } else if (newID > 0) {
                idMap.set(index, newID);
              }
            }
          });
        } else if (Array.isArray(responseData.data)) {
          responseData.data.forEach((saved: any, index: number) => {
            if (recordsToSave[index]) {
              const oldID = recordsToSave[index].ID || 0;
              const newID = saved.ID || oldID;
              if (oldID > 0) {
                idMap.set(oldID, newID);
              } else if (newID > 0) {
                idMap.set(index, newID);
              }
            }
          });
        }
      }

      rows.forEach((row, index) => {
        const data = row.getData();
        const noteHR = (data['NoteHR'] || '').toString().trim();
        const requestID = data['ID'] || 0;
        
        let finalRequestID = requestID;
        if (requestID > 0) {
          finalRequestID = idMap.get(requestID) || requestID;
        } else {
          finalRequestID = idMap.get(index) || 0;
        }
        
        if (finalRequestID > 0) {
          const existingNote = this.hrNotesMap.get(requestID);
          
          const noteData: any = {
            ID: existingNote?.id || 0,
            ProjectPartlistPriceRequestID: finalRequestID,
            Note: noteHR || null,
          };
          
          if (noteHR || existingNote) {
            notesToSave.push(noteData);
          }
        }
      });

      if (notesToSave.length === 0) {
        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu dữ liệu thành công!');
        this.formSubmitted.emit();
        this.activeModal.close('saved');
        return;
      }

      this.priceRequestService.saveRequestNote(notesToSave).subscribe({
        next: () => {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu dữ liệu thành công!');
          this.formSubmitted.emit();
          this.activeModal.close('saved');
        },
        error: (e: any) => {
          let errorMessage = 'Lưu ghi chú HR thất bại!';
          if (e.error && e.error.message) {
            errorMessage += ` Chi tiết: ${e.error.message}`;
          }
          this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
        },
      });
    }
}
