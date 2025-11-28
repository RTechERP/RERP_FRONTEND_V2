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
  OnChanges,
  SimpleChanges,
  createComponent,
  EnvironmentInjector,
  ApplicationRef,
  Type,
} from '@angular/core';
import {
  TabulatorFull as Tabulator,
  ColumnDefinition,
  CellComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { FormsModule } from '@angular/forms';
import { ProjectPartlistPriceRequestService } from '../project-partlist-price-request-service/project-partlist-price-request.service';
import { ReactiveFormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DateTime } from 'luxon';
import {
  type NzNotificationComponent,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
declare var bootstrap: any;
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NSelectComponent } from '../../n-select/n-select.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';


@Component({
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzFormModule,
    NzModalModule,
  ],
  selector: 'app-project-partlist-price-request-form',
  templateUrl: './project-partlist-price-request-form.component.html',
  styleUrls: ['./project-partlist-price-request-form.component.css'],
})
export class ProjectPartlistPriceRequestFormComponent
  implements OnInit, AfterViewInit
{
  // lấy service
  private priceRequestService = inject(ProjectPartlistPriceRequestService);
  private notification = inject(NzNotificationService);
  private modal = inject(NzModalService);
  injector = inject(EnvironmentInjector);
  appRef = inject(ApplicationRef);
  public activeModal = inject(NgbActiveModal);

  @Input() dataInput: any; // Nhận dữ liệu từ component cha
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();

  close() {
    this.activeModal.dismiss();
  }
  // form model
  requester: Number = 0;
  requestDate: string = '';

  users:any[] = [];
  dtProductSale: any[] = [];
  lstSave: any[] = [];
  // Add these new properties for nz-select
  requesterLoading: boolean = false;
  notFoundContent: string = 'Không tìm thấy dữ liệu';
  // Tabulator
  @ViewChild('table', { static: false }) tableDiv!: ElementRef;
  table!: Tabulator;
  tableData: any[] = []; // ban đầu rỗng

  constructor() {}

  ngOnInit(): void {
    this.lstSave = [];
    this.getAllUser();
    this.getProductSale();
    console.log('datainput', this.dataInput);

    // Sửa điều kiện kiểm tra
    if (!this.dataInput || this.dataInput.length === 0) {
      this.tableData = [];
      return;
    }

    // Khi có dữ liệu, bind vào form và table
    this.requester = Number(this.dataInput[0]['EmployeeID']);
    console.log('abd', this.requester);
    this.requestDate = DateTime.fromJSDate(
      new Date(this.dataInput[0]['DateRequest'])
    ).toFormat('yyyy-MM-dd');
    this.tableData = this.dataInput;
  }
  getAllUser() {
    this.requesterLoading = true;
    this.priceRequestService.getEmployee().subscribe({
      next: (response) => {
        this.users = response.data.dtEmployee;
        this.createLabels("lbusers",this.users, 'ID', 'FullName');
        this.requesterLoading = false;
        console.log(this.users);
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách người dùng:', err);
        this.requesterLoading = false; // Set loading to false on error
      },
    });
  }
  // labeln: { [key: number]: string } = {};
  // labelu: { [key: number]: string } = {};
  // createLableu(data: any[], keyField: string = 'ID', valueField: string = 'FullName') {
  //   this.labelu = {};

  //   data.forEach((item) => {
  //     // Nếu chưa có key, thêm vào labels
  //     if (!this.labelu[item[keyField]]) {
  //       this.labelu[item[keyField]] = item[valueField];
  //     }
  //   });
  //   console.log('labels:', this.labeln);

  // }
  // createLables(data: any[], keyField: string = 'ID', valueField: string = 'ProductNewCode') {
  //   this.labeln = {};

  //   data.forEach((item) => {
  //     // Nếu chưa có key, thêm vào labels
  //     if (!this.labeln[item[keyField]]) {
  //       this.labeln[item[keyField]] = item[valueField];
  //     }
  //   });
  //   console.log('labels:', this.labeln);

  // }
  // Thay thế các object label riêng lẻ bằng một Map chung
  private labelMaps: Map<string, { [key: number]: string }> = new Map();

  // Hàm tạo label chung
  createLabels(
    labelName: string,
    data: any[],
    keyField: string = 'ID',
    valueField: string = 'Name'
  ): { [key: number]: string } {
    // Tạo object labels mới
    const labels: { [key: number]: string } = {};

    data.forEach((item) => {
      // Nếu chưa có key, thêm vào labels
      if (!labels[item[keyField]]) {
        labels[item[keyField]] = item[valueField];
      }
    });

    // Lưu vào Map với tên label
    this.labelMaps.set(labelName, labels);

    console.log(`Labels ${labelName}:`, labels);

    return labels;
  }

  // Hàm lấy label theo tên
  getLabels(labelName: string): { [key: number]: string } {
    return this.labelMaps.get(labelName) || {};
  }

  // Hàm lấy giá trị label theo key
  getLabelValue(labelName: string, key: number): string {
    const labels = this.labelMaps.get(labelName);
    return labels ? labels[key] || '' : '';
  }
  getProductSale() {
    this.priceRequestService.getProductSale().subscribe({
      next: (response) => {
        this.dtProductSale = response.data;
        // Sử dụng hàm chung
        this.createLabels('productSale', this.dtProductSale, 'ID', 'ProductNewCode');
        console.log('dtproductsale: ', this.dtProductSale);
        this.drawTable();
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách product sale:', err);
      }
    });
  }
  ngAfterViewInit(): void {
  }
  createdControl1(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    data: any,
    displayField: string,
    labelField: string = 'Code',
    valueField: string = 'ID'
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      // Lấy giá trị từ cell
      const cellValue = cell.getValue();

      // Các tham số truyền vào component
      componentRef.instance.dataSource = data;
      componentRef.instance.value = cellValue;

      // Nếu component là NSelectComponent, truyền thêm các trường tùy chỉnh
      if (component === NSelectComponent) {
        componentRef.instance.displayField = displayField;
        componentRef.instance.labelField = labelField;
        componentRef.instance.valueField = valueField;
      } else {
        // Tương thích ngược với SelectEditorComponent
        componentRef.instance.label = displayField;
      }

      // Các tham số trả ra
      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {
        if (container.firstElementChild) {
          (container.firstElementChild as HTMLElement).focus();
        }
      });

      return container;
    };
  }
  // Alternative approach - handle both Event and string types
  requesterSearchChange(searchValue: string | Event): void {
    let searchText: string;

    if (typeof searchValue === 'string') {
      searchText = searchValue;
    } else {
      // If it's an Event object, extract the value from the target
      searchText = (searchValue.target as HTMLInputElement)?.value || '';
    }

    if (searchText) {
      this.requesterLoading = true;
      this.priceRequestService.getEmployee().subscribe({
        next: (response) => {
          this.users = response.data.dtEmployee.filter((user: any) =>
          user.ID === Number(searchText)
          );
          this.requesterLoading = false;
        },
        error: (err) => {
          console.error('Lỗi khi tìm kiếm người dùng:', err);
          this.requesterLoading = false;
        },
      });
    } else {
      // If search is empty, reload all users
      this.getAllUser();
    }
  }
   private drawTable(): void {
    this.table = new Tabulator(this.tableDiv.nativeElement, {
          data: this.tableData,
          layout: 'fitDataStretch',
          columns: [
            {
              title: '',
              headerSort: false,
              formatter: () =>
                `<i class="fa-solid fa-xmark" style="cursor:pointer;color:red;"></i>`,
              width: 50,
              hozAlign: 'center',
              headerHozAlign: 'center',
              cellClick: (_e, cell) => {
                const row = cell.getRow();
                const rowData = row.getData();

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
          title: 'ID',
          field: 'ID',
          visible: false,
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
          hozAlign: 'left',
          width: '150',
          headerHozAlign: 'center',
          // editor: this.createdControl1(
          //   NSelectComponent,
          //   this.injector,
          //   this.appRef,
          //   this.dtProductSale,
          //   'productLabel',
          //   'productLabel',
          //   'ProductNewCode'
          // ),
          // formatter: (cell: any) => {
          //   const val = cell.getValue();
          //   const product = (this.dtProductSale || []).find((p: any) => p.ProductNewCode === val);
          //   const label = product ? `${product.ProductNewCode}, ${product.ProductName}` : 'Chọn sản phẩm';
          //   return (
          //     `<div class="d-flex justify-content-between align-items-center">
          //       <p class="w-100 m-0">${label}</p>
          //       <i class="fas fa-angle-down"></i>
          //     </div>`
          //   );
          // },
          // editor: (cell: any, onRendered: any, success: any, cancel: any) => {
          //   const container = document.createElement('div');
          //   const rowData = cell.getRow().getData();
          //   const view = this.vcr.createEmbeddedView(this.selectTemplate, {
          //     row: rowData,
          //     dt: this.dtProductSale,
          //     success,
          //   });
          //   view.rootNodes.forEach((node) => container.appendChild(node));
          //   onRendered(() => {
          //     const el = container.querySelector('input, nz-select');
          //     if (el) (el as HTMLElement).focus();
          //   });
          //   return container;
          // },
          // formatter: (cell: any) => {
          //   const val = cell.getValue();
          //   const product = (this.dtProductSale || []).find(
          //     (p: any) => p.ProductNewCode === val
          //   );
          //   const label = product ? `${product.ProductName}` : 'Chọn sản phẩm';
          //   return `<div class="d-flex justify-content-between align-items-center">
          //           <p class="w-100 m-0">${label}</p>
          //           <i class="fas fa-angle-down"></i>
          //         </div>`;
          // },
          // cellEdited: (cell) => {
          //   const code = cell.getValue();
          //   const product = (this.dtProductSale || []).find(
          //     (p: any) => p.ProductNewCode === code
          //   );
          //   if (product) {
          //     cell.getRow().update({
          //       ProductCode: product.ProductCode,
          //       ProductName: product.ProductName,
          //       Unit: product.Unit,
          //       Maker: product.Maker,
          //       StatusRequest: product.StatusRequest,
          //     });
          //   }
          // },
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
        },
        {
          title: 'Hãng (*)',
          headerSort: false,
          field: 'Maker',
          editor: 'input',
          headerHozAlign: 'center',
          width: '100',
          hozAlign: 'left',
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
        },
        {
          title: 'Ghi chú chung',
          headerSort: false,
          field: 'RequestNote',
          // editor: this.jobRequirementID > 0 ? undefined : 'input',
          headerHozAlign: 'center',
          hozAlign: 'left',
          width: 200,
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
  }

  addRow() {
    this.table.addRow({});
  }
  checkDeadline(deadline: Date): boolean {
    const now = new Date();
    const fifteenPM = new Date(now);
    fifteenPM.setHours(15, 0, 0, 0);

    let dateRequest = new Date(now);

    // Nếu sau 15h thì tính từ ngày hôm sau
    if (now >= fifteenPM) {
      dateRequest.setDate(dateRequest.getDate() + 1);
    }

    // Nếu là T7 hoặc CN thì đẩy sang thứ 2
    if (dateRequest.getDay() === 6) {
      // Saturday
      dateRequest.setDate(dateRequest.getDate() + 2);
    } else if (dateRequest.getDay() === 0) {
      // Sunday
      dateRequest.setDate(dateRequest.getDate() + 1);
    }

    // Tính số ngày làm việc giữa dateRequest và deadline (không tính T7, CN)
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

    if (workDays.length < 2) {
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

    // Lấy dữ liệu bảng, loại bỏ trường ProductNewCode nếu backend không cần
    const updatedData = this.table.getRows().map((row) => {
      const data = row.getData(); // lấy toàn bộ data, kể cả cột ẩn
      return {
        ID: data['ID'] ?? 0, // nếu undefined/null => gán 0
        Quantity: Number(data['Quantity']) || 0,
        Deadline: DateTime.fromJSDate(new Date(data['Deadline'])).toJSDate(), // Sử dụng Luxon DateTime
        ProductCode: (data['ProductCode'] || '').toString(),
        ProductName: (data['ProductName'] || '').toString(),
        Note: (data['Note'] || '').toString(),
        Unit: (data['Unit'] || '').toString(),
        IsCommercialProduct: Boolean(data['IsCommercialProduct']),
        StatusRequest: (data['StatusRequest'] || '').toString(),
        Maker: (data['Maker'] || '').toString(),
        DateRequest: DateTime.fromISO(this.requestDate).toJSDate(), // Sử dụng Luxon DateTime
        EmployeeID: Number(this.requester),
        IsDeleted: false // Explicitly set for new records
      };
    });

    // Clear lstSave and add updated data
    this.lstSave = [...updatedData];

    console.log('Data being sent to server:', this.lstSave); // Debug log

    this.priceRequestService.saveData(this.lstSave).subscribe({
      next: (response) => {
        console.log('Server response:', response); // Debug log
        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu dữ liệu thành công!');
        this.formSubmitted.emit();
        this.activeModal.close('saved'); // Đóng modal với kết quả
      },
      error: (e) => {
        console.error('Full error object:', e);
        console.error('Error details:', e.error);

        let errorMessage = 'Lưu dữ liệu thất bại!';
        if (e.error && e.error.message) {
          errorMessage += ` Chi tiết: ${e.error.message}`;
        }

        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      },
    });
  }
}
