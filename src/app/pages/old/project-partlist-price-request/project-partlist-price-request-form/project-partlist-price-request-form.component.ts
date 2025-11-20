import { AppUserService } from './../../../../services/app-user.service';
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
  ViewContainerRef,
  TemplateRef,
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
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
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
    NzButtonModule,
    NzIconModule,
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
  private appUserService = inject(AppUserService);
  private modal = inject(NzModalService);
  injector = inject(EnvironmentInjector);
  appRef = inject(ApplicationRef);
  public activeModal = inject(NgbActiveModal);

  @Input() dataInput: any; // Nhận dữ liệu từ component cha
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  @ViewChild('vcHost', { read: ViewContainerRef, static: true })
  vcr!: ViewContainerRef;
  @Input() ListIDProductSale: number[] = [];
  @Input() noteJobRequirement: string = '';
  @Input() qty: number = 0;
  @Input() isVPP: boolean = false;
  @ViewChild('selectTemplate', { static: true })
  selectTemplate!: TemplateRef<any>;
  close() {
    this.activeModal.dismiss();
  }
  requester: Number = 0;
  requestDate: string = '';
  lstRequestType: any[] = [];
  @Input() requestTypeID: number = 0;
  @Input() jobRequirementID: number = 0;
  users: any[] = [];
  dtProductSale: any[] = [];
  lstSave: any[] = [];
  title: string = 'Thêm yêu cầu';
  requesterLoading: boolean = false;
  notFoundContent: string = 'Không tìm thấy dữ liệu';
  // Tabulator
  @ViewChild('table', { static: false }) tableDiv!: ElementRef;
  table!: Tabulator;
  tableData: any[] = [];

  constructor() {}

ngOnInit(): void {
    if (this.jobRequirementID && this.jobRequirementID > 0) {
      this.title = 'Yêu cầu báo giá';
    }

    this.getRequestType();
    this.lstSave = [];
    this.getAllUser();
    this.getProductSale();

    if (!this.dataInput || this.dataInput.length <= 0) {
      this.priceRequestService.getAll().subscribe({
        next: (response) => {
          this.tableData = response.data || [];
          this.tableData.forEach(e => {
            e.UnitCount = e.UnitCount.toString().toUpperCase();
          });

          if (this.jobRequirementID > 0 && (!this.tableData || this.tableData.length <= 0)) {
            this.addNewRowForJobRequirement();
          }
        },
      });
    } else {
      this.requester = Number(this.dataInput[0]['EmployeeID']);
      console.log('abd', this.requester);
      this.requestDate = DateTime.fromJSDate(
        new Date(this.dataInput[0]['DateRequest'])
      ).toFormat('yyyy-MM-dd');
      this.tableData = this.dataInput;

      this.tableData.forEach(e => {
        e.UnitCount = e.UnitCount.toString().toUpperCase();
      });
    }

    this.addDataFromProductSale();
  }

  private addDataFromProductSale(): void {
    if (!this.ListIDProductSale || this.ListIDProductSale.length <= 0) {
      return;
    }

    this.ListIDProductSale.forEach(id => {
      const productSale = this.findProductSaleByID(id);
      if (!productSale) return;

      const newRow = {
        STT: this.tableData.length + 1,
        ProductNewCode: productSale.ProductNewCode,
        ProductCode: productSale.ProductCode,
        ProductName: productSale.ProductName,
        Maker: productSale.Maker,
        UnitCount: productSale.Unit.toUpperCase(),
        Quantity: 0,
        Note: ''
      };

      this.tableData.push(newRow);
    });
  }


  private findProductSaleByID(id: number): any {
    return this.dtProductSale?.find(item => item.ID === id);
  }


  private addNewRowForJobRequirement(): void {
    const newRow = {
      STT: this.tableData.length + 1,
      Quantity: this.qty || 0,
      Note: this.noteJobRequirement || '',
      ProductNewCode: '',
      ProductCode: '',
      ProductName: '',
      Maker: '',
      UnitCount: ''
    };

    this.tableData.push(newRow);
  }

  getAllUser() {
    this.requesterLoading = true;
    this.priceRequestService.getEmployee().subscribe({
      next: (response) => {
        this.users = response.data.dtEmployee;
        this.requesterLoading = false;
        console.log(this.users);
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách người dùng:', err);
        this.requesterLoading = false;
      },
    });
  }
  getRequestType() {
    this.priceRequestService.getPriceRequestType().subscribe({
      next: (response) => {
        this.lstRequestType = response.data;
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách loại yêu cầu:', err.error.message);
      },
    });
  }


  getProductSale() {
    this.priceRequestService.getProductSale().subscribe({
      next: (response) => {
        this.dtProductSale = (response.data || []).map((p: any) => ({
          ...p,
          productLabel: `${p.ProductNewCode || ''}-${p.ProductName || ''}`,
        }));

        this.table.redraw(true);
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách product sale:', err);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err.error.message || 'Không lấy được danh sách sản phẩm!'
        );
      },
    });
  }
  ngAfterViewInit(): void {
    this.drawTable();
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
          this.users = response.data.dtEmployee.filter(
            (user: any) => user.ID === Number(searchText)
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
          width: '120',
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
          editor: (cell: any, onRendered: any, success: any, cancel: any) => {
            const container = document.createElement('div');
            const rowData = cell.getRow().getData();
            const view = this.vcr.createEmbeddedView(this.selectTemplate, {
              row: rowData,
              dt: this.dtProductSale,
              success,
            });
            view.rootNodes.forEach((node) => container.appendChild(node));
            onRendered(() => {
              const el = container.querySelector('input, nz-select');
              if (el) (el as HTMLElement).focus();
            });
            return container;
          },
          formatter: (cell: any) => {
            const val = cell.getValue();
            const product = (this.dtProductSale || []).find(
              (p: any) => p.ProductNewCode === val
            );
            const label = product ? `${product.ProductName}` : 'Chọn sản phẩm';
            return `<div class="d-flex justify-content-between align-items-center">
                    <p class="w-100 m-0">${label}</p>
                    <i class="fas fa-angle-down"></i>
                  </div>`;
          },
          cellEdited: (cell) => {
            const code = cell.getValue();
            const product = (this.dtProductSale || []).find(
              (p: any) => p.ProductNewCode === code
            );
            if (product) {
              cell.getRow().update({
                ProductCode: product.ProductCode,
                ProductName: product.ProductName,
                Unit: product.Unit,
                Maker: product.Maker,
                StatusRequest: product.StatusRequest,
              });
            }
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
          width: '80',
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
        },
        {
          title: 'Ghi chú chung',
          headerSort: false,
          field: 'RequestNote',
          editor: this.jobRequirementID > 0 ? undefined : 'input',
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
    if (!employeeID && employeeID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn Người yêu cầu!');
      return false;
    }
    if (!this.requestTypeID && this.requestTypeID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn Loại yêu cầu!');
      return false;
    }
    const rows = this.table.getRows();
    if (rows.length <= 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng tạo ít nhất một yêu cầu!'
      );
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
  // saveAndClose() {
  //   if (!this.validate()) return;

  //   // Lấy dữ liệu bảng, loại bỏ trường ProductNewCode nếu backend không cần
  //   const updatedData = this.table.getRows().map((row) => {
  //     const data = row.getData(); // lấy toàn bộ data, kể cả cột ẩn
  //     return {
  //       ID: data['ID'] ?? 0, // nếu undefined/null => gán 0
  //       Quantity: Number(data['Quantity']) || 0,
  //       Deadline: DateTime.fromJSDate(new Date(data['Deadline'])).toJSDate(), // Sử dụng Luxon DateTime
  //       ProductCode: (data['ProductCode'] || '').toString(),
  //       ProductName: (data['ProductName'] || '').toString(),
  //       Note: (data['Note'] || '').toString(),
  //       Unit: (data['Unit'] || '').toString(),
  //       IsCommercialProduct: Boolean(data['IsCommercialProduct']),
  //       Maker: (data['Maker'] || '').toString(),
  //       DateRequest: DateTime.fromISO(this.requestDate).toJSDate(), // Sử dụng Luxon DateTime
  //       ProjectPartlistPriceRequestTpeID: this.requestTypeID,
  //       EmployeeID: Number(this.requester),
  //       IsDeleted: false,
  //     };
  //   });

  //   // Clear lstSave and add updated data
  //   this.lstSave = [...updatedData];

  //   console.log('Data being sent to server:', this.lstSave); // Debug log

  //   this.priceRequestService.saveData(this.lstSave).subscribe({
  //     next: (response) => {
  //       console.log('Server response:', response); // Debug log
  //       this.notification.success('Thông báo', 'Lưu dữ liệu thành công!');
  //       this.formSubmitted.emit();
  //       this.activeModal.close('saved'); // Đóng modal với kết quả
  //     },
  //     error: (e) => {
  //       console.error('Full error object:', e);
  //       console.error('Error details:', e.error);

  //       let errorMessage = 'Lưu dữ liệu thất bại!';
  //       if (e.error && e.error.message) {
  //         errorMessage += ` Chi tiết: ${e.error.message}`;
  //       }

  //       this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
  //     },
  //   });
  // }
 saveAndClose() {
  // Kiểm tra validate và dữ liệu
  if (!this.validate()) return;

  const tableData = this.table.getData();
  if (!tableData || tableData.length <= 0) {
    this.notification.info('Thông báo', 'Vui lòng chọn vào sản phẩm muốn yêu cầu báo giá!');
    return;
  }

  // Lấy danh sách ID để xử lý soft delete
  const lstID: number[] = [];
  const updatedData: any[] = [];
  const notesData: any[] = []; // Mảng để lưu tất cả notes

  // Xử lý từng dòng dữ liệu
  for (let i = 0; i < tableData.length; i++) {
    const row = tableData[i];

    const quantityRequest = Number(row['Quantity']) || 0;
    const id = Number(row['ID']) || 0;
    const status = Number(row['StatusRequest']) || 0;
    const isCheck = Boolean(row['IsCheckPrice']);
    const empID = Number(row['EmployeeID']) || 0;

    // Bỏ qua các dòng không thể edit (tương tự logic C#)
    if (status === 2 || status === 3 || isCheck) continue;

    // Kiểm tra quyền edit (tương tự logic C#)
    if (!(this.jobRequirementID > 0)) {
      if (id > 0 && this.appUserService.employeeID !== empID && !this.appUserService.isAdmin) continue;
      if (!lstID.includes(id)) lstID.push(id);
    }

    // Tạo object dữ liệu để save
    const model = {
      ID: id,
      DateRequest: DateTime.fromISO(this.requestDate).toJSDate(),
      EmployeeID: Number(this.requester),
      Deadline: DateTime.fromJSDate(new Date(row['Deadline'])).toJSDate(),
      ProductCode: (row['ProductCode'] || '').toString(),
      ProductName: (row['ProductName'] || '').toString(),
      Maker: (row['Maker'] || '').toString(),
      Note: (row['Note'] || '').toString(),
      Unit: (row['Unit'] || '').toString(),
      Quantity: quantityRequest,
      StatusRequest: 1, // yêu cầu báo giá
      NoteHR: (row['NoteHR'] || '').toString(),
      JobRequirementID: this.jobRequirementID,
      ProjectPartlistPriceRequestTypeID: this.requestTypeID,

      // Xử lý logic IsCommercialProduct và IsJobRequirement
      IsCommercialProduct: false,
      IsJobRequirement: false
    };

    // Xử lý logic IsCommercialProduct và IsJobRequirement (tương tự C#)
    if (model.ID <= 0) {
      if (model.ProjectPartlistPriceRequestTypeID !== 4) {
        if (this.jobRequirementID > 0 || this.isVPP) {
          model.IsJobRequirement = true; // Yêu cầu công việc
        } else {
          model.IsCommercialProduct = true; // hàng thương mại
        }
      }
    }

    updatedData.push(model);

    // Thêm note vào mảng notesData thay vì gọi API riêng
    const requestNote = (row['RequestNote'] || '').toString();
    if (requestNote) {
      notesData.push({
        ProjectPartlistPriceRequestID: model.ID > 0 ? model.ID : 0, // Nếu ID = 0, backend sẽ xử lý sau khi tạo mới
        Note: requestNote
      });
    }
  }

  if (updatedData.length === 0) {
    this.notification.info('Thông báo', 'Không có dữ liệu nào để lưu!');
    return;
  }

  // Gọi API save data chính
  this.priceRequestService.saveData(updatedData).subscribe({
    next: (response) => {

      // Xử lý notes sau khi save data chính thành công
      if (notesData.length > 0) {
        this.saveAllRequestNotes(notesData);
      }

      // Xử lý soft delete cho các record không được chọn (tương tự logic C#)
      if (lstID.length > 0 && !(this.jobRequirementID > 0)) {
        this.softDeleteRecords(lstID);
      } else {
        this.afterSaveSuccess();
      }
    },
    error: (e) => {
      console.error('Full error object:', e);
      console.error('Error details:', e.error.message);

      let errorMessage = 'Lưu dữ liệu thất bại!';
      if (e.error && e.error.message) {
        errorMessage += ` Chi tiết: ${e.error.message}`;
      }

      this.notification.error('Lỗi', errorMessage);
    },
  });
}

/**
 * Lưu tất cả notes trong một API call
 */
private saveAllRequestNotes(notes: any[]): void {
  if (!notes || notes.length === 0) return;

  this.priceRequestService.saveRequestNote(notes).subscribe({
    next: (response) => {
      console.log('Lưu dữ liệu thành công:', response);
    },
    error: (e) => {
      console.error('lỗi:', e.error.message || e);
    }
  });
}

private softDeleteRecords(lstID: number[]): void {
  if (!lstID || lstID.length === 0) {
    this.afterSaveSuccess();
    return;
  }

  const deleteDataArray = lstID.map(id => ({
    ID: id,
    IsDeleted: true,
    UpdatedBy: this.appUserService.loginName,
    UpdatedDate: new Date()
  }));

  this.priceRequestService.saveData(deleteDataArray).subscribe({
    next: (response) => {
      console.log('Xóa thành công các id:', lstID);
      this.afterSaveSuccess();
    },
    error: (e) => {
      console.error('lỗi:', e.error.message || e);
      this.afterSaveSuccess();
    }
  });
}

private afterSaveSuccess(): void {
  this.notification.success('Thông báo', 'Lưu dữ liệu thành công!');

  if (this.jobRequirementID > 0 || this.requestTypeID === 3) {
  }

  this.formSubmitted.emit();
  this.activeModal.close('saved');
}

}
