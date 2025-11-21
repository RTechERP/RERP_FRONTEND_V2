import { Component, ElementRef, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule, NgIf } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormControl } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { FoodOrderService } from './food-order-service/food-order.service';
import { EmployeeService } from '../employee/employee-service/employee.service';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { SummaryFoodOrderComponent } from "./summary-food-order/summary-food-order.component";
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { ProjectService } from '../../project/project-service/project.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-food-order',
  templateUrl: './food-order.component.html',
  styleUrls: ['./food-order.component.css'],
  imports: [
    CommonModule,
    NzModalModule,
    NzIconModule,
    NzButtonModule,
    NzTabsModule,
    NzTableModule,
    NzSelectModule,
    NzFormModule,
    NzInputModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NzIconModule,
    NzCheckboxModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzTabsModule,
    NzSplitterModule,
    NzRadioModule,
    SummaryFoodOrderComponent,
    NgIf,
    NzSpinModule, HasPermissionDirective
  ],
})
export class FoodOrderComponent implements OnInit, AfterViewInit {

  private foodOrderHNTabulator!: Tabulator;
  private foodOrderĐPTabulator!: Tabulator;
  foodOrderList: any[] = [];
  foodOrderHNList: any[] = [];
  foodOrderĐPList: any[] = [];
  employeeList: any[] = [];
  searchForm!: FormGroup;
  foodOrderForm!: FormGroup;
  sizeSearch: string = '0';

  selectedFoodOrderHN: any = null;
  selectedFoodOrderĐP: any = null;

  isLoading = false;

  @ViewChild('tb_foodOrder_HN', { static: false })
  tb_foodOrderHN!: ElementRef;

  @ViewChild('tb_foodOrder_ĐP', { static: false })
  tb_foodOrderĐP!: ElementRef;

  userPermissions = ['N2', 'N23', 'N34', 'N1', 'N80'];

  hasPermission(permissions: string[]): boolean {
    return permissions.some(p => this.userPermissions.includes(p));
  }
  currentUser: any;
  currenEmployee: any;
  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private foodOrderService: FoodOrderService,
    private employeeService: EmployeeService,
    private projectService: ProjectService,
    private authService: AuthService,
  ) {
    this.initSearchForm();
    this.initForm();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  ngOnInit() {
    this.loadFoodOrder();
    this.loadEmployees();
    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
    });
    this.currenEmployee = Array.isArray(this.currentUser)
      ? this.currentUser[0]
      : this.currentUser;
  }

  private initForm() {

    this.foodOrderForm = this.fb.group({
      ID: [0],
      EmployeeID: [this.currenEmployee?.EmployeeID, [Validators.required]],
      DateOrder: [{
        value: '',
        disabled: !this.hasPermission(['N2', 'N23', 'N34', 'N1', 'N80'])
      }, [Validators.required]],
      Quantity: [1, [Validators.required, Validators.min(1)]],
      IsApproved: [false],
      Location: ['1', [Validators.required]],
      Note: [''],
      FullName: [''],
      IsDeleted: [false]
    });
  }

  private initSearchForm() {
    const currentDate = new Date();
    const twoMonthsAgo = new Date(currentDate);
    twoMonthsAgo.setMonth(currentDate.getMonth() - 5);
    this.searchForm = this.fb.group({
      dateStart: new Date(new Date()),
      dateEnd: new Date(),
      employeeId: 0,
      pageNumber: 1,
      pageSize: 100000,
      keyWord: ''
    });
  }

  ngAfterViewInit(): void {
    this.foodOrderHNTable(this.tb_foodOrderHN.nativeElement);
    this.foodOrderĐPTable(this.tb_foodOrderĐP.nativeElement);
  }

  //#region Call API lấy dữ liệu
  loadFoodOrder() {
    this.isLoading = true;
    if (this.searchForm.value.employeeId == null) {
      this.searchForm.patchValue({
        employeeId: 0,
      });
    }

    this.foodOrderService.getEmployeeFoodOrder(
      this.searchForm.value
    ).subscribe({
      next: (data) => {
        this.foodOrderList = Array.isArray(data.data) ? data.data : [data.data];
        this.foodOrderHNList = this.foodOrderList.filter(fo => fo.Location === 1 || fo.Location === null);
        this.foodOrderĐPList = this.foodOrderList.filter(fo => fo.Location === 2)
        this.foodOrderHNTable(this.tb_foodOrderHN.nativeElement);
        this.foodOrderĐPTable(this.tb_foodOrderĐP.nativeElement);
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.message);
        this.isLoading = false;
      }
    });
  }

  loadEmployees() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeList = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
      },
    });
  }
  //#endregion

  //#region Khởi tạo bảng cơm ca VP Hà Nội
  private foodOrderHNTable(container: HTMLElement): void {
    this.foodOrderHNTabulator = new Tabulator(container, {
      data: this.foodOrderHNList,
      layout: 'fitDataStretch',
      selectableRows: true,
      height: '83vh',
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
      rowHeader: {
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        headerSort: false,
        width: 50,
        frozen: true,
        headerHozAlign: "center",
        hozAlign: "center"
      },
      columns: [
        {
          title: 'Duyệt',
          field: 'IsApproved',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 60,
          headerSort: false,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} />`;
          },
        },
        {
          title: 'Mã nhân viên',
          field: 'Code',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
          bottomCalc: 'count'
        },
        {
          title: 'Họ và tên',
          field: 'FullName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
        },
        {
          title: 'Số lượng',
          field: 'Quantity',
          hozAlign: 'right',
          headerHozAlign: 'center',
          bottomCalc: 'sum',
          headerSort: false,
          width: 200,
        },
        {
          title: 'Ngày',
          field: 'DateOrder',
          hozAlign: 'center',
          minWidth: 200,
          headerSort: false,
          headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        }


      ],
      pagination: true,
      paginationSize: 100,
      paginationSizeSelector: [10, 20, 50, 100]
    });
  }
  //#endregion

  //#region Khởi tạo bảng cơm ca Xưởng Đan Phượng
  private foodOrderĐPTable(container: HTMLElement): void {
    this.foodOrderĐPTabulator = new Tabulator(container, {
      data: this.foodOrderĐPList,
      layout: 'fitDataStretch',
      selectableRows: true,
      height: '83vh',
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
      rowHeader: {
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        headerSort: false,
        width: 100,
        frozen: true,
        headerHozAlign: "center",
        hozAlign: "center"
      },
      columns: [
        {
          title: 'Duyệt',
          field: 'IsApproved',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 60,
          headerSort: false,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} />`;
          },
        },
        {
          title: 'Mã nhân viên',
          field: 'Code',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
          bottomCalc: 'count'
        },
        {
          title: 'Họ và tên',
          field: 'FullName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
        },
        {
          title: 'Số lượng',
          field: 'Quantity',
          hozAlign: 'right',
          headerHozAlign: 'center',
          bottomCalc: 'sum',
          headerSort: false,
          width: 200,
        },
        {
          title: 'Ngày',
          field: 'DateOrder',
          hozAlign: 'center',
          minWidth: 200,
          headerSort: false,
          headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        }
      ],
      pagination: true,
      paginationSize: 100,
      paginationSizeSelector: [10, 20, 50, 100]
    });
  }
  //#endregion

  openAddModal() {
    this.foodOrderForm.reset({
      ID: 0,
      EmployeeID: this.currenEmployee?.EmployeeID,
      DateOrder: new Date(),
      Quantity: 1,
      IsApproved: false,
      Location: '1',
      Note: '',
      FullName: '',
      IsDeleted: false
    });
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addFoodOrderModal'));
    modal.show();
  }

  //#region Hàm sửa
  openEditModal() {
    const selectedRowsHN = this.foodOrderHNTabulator.getSelectedRows();
    const selectedRowsĐP = this.foodOrderĐPTabulator.getSelectedRows();
    if (selectedRowsHN.length === 0 && selectedRowsĐP.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đơn đặt cần sửa');
      return;
    }
    // Check if any selected row is approved
    if (
      (selectedRowsHN.length > 0 && selectedRowsHN[0].getData()['IsApproved'] === true) ||
      (selectedRowsĐP.length > 0 && selectedRowsĐP[0].getData()['IsApproved'] === true)
    ) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Đơn đặt cơm đã được duyệt. Vui lòng hủy duyệt trước khi sửa!');
      return;
    }
    if (selectedRowsHN.length > 0) {
      this.selectedFoodOrderHN = selectedRowsHN[0].getData();
      this.foodOrderForm.patchValue({
        ID: this.selectedFoodOrderHN.ID,
        EmployeeID: this.selectedFoodOrderHN.EmployeeID,
        FullName: this.selectedFoodOrderHN.FullName,
        DateOrder: this.selectedFoodOrderHN.DateOrder,
        Quantity: this.selectedFoodOrderHN.Quantity,
        IsApproved: this.selectedFoodOrderHN.IsApproved,
        Location: this.selectedFoodOrderHN.Location?.toString(),
        Note: this.selectedFoodOrderHN.Note,
        IsDeleted: this.selectedFoodOrderHN.IsDeleted
      })
    }
    if (selectedRowsĐP.length > 0) {
      this.selectedFoodOrderĐP = selectedRowsĐP[0].getData();
      this.foodOrderForm.patchValue({
        ID: this.selectedFoodOrderĐP.ID,
        EmployeeID: this.selectedFoodOrderĐP.EmployeeID,
        FullName: this.selectedFoodOrderĐP.FullName,
        DateOrder: this.selectedFoodOrderĐP.DateOrder,
        Quantity: this.selectedFoodOrderĐP.Quantity,
        IsApproved: this.selectedFoodOrderĐP.IsApproved,
        Location: this.selectedFoodOrderĐP.Location?.toString(),
        Note: this.selectedFoodOrderĐP.Note,
        IsDeleted: this.selectedFoodOrderĐP.IsDeleted
      })
    }
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addFoodOrderModal'));
    modal.show();
  }
  //#endregion

  //#region Hàm lưu dữ liệu
  onSubmit() {
    // const now = new Date();
    // const today10AM = new Date();
    // today10AM.setHours(10, 0, 0, 0);

    // if (now > today10AM) {
    //   this.notification.error(
    //     NOTIFICATION_TITLE.error,
    //     'Không thể đặt cơm sau 10h sáng!'
    //   );
    //   return;
    // }


    if (this.foodOrderForm.invalid) {
      Object.values(this.foodOrderForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const formData = this.foodOrderForm.value;

    const foodOrderData = {
      ID: formData.ID,
      EmployeeID: this.foodOrderForm.value.EmployeeID,
      DateOrder: formData.DateOrder,
      Quantity: formData.Quantity,
      IsApproved: formData.IsApproved,
      Location: parseInt(formData.Location),
      Note: formData.Note,
      IsDeleted: formData.IsDeleted
    };

    this.foodOrderService.saveEmployeeFoodOrder(foodOrderData).subscribe({
      next: (response) => {
        this.notification.success(NOTIFICATION_TITLE.success,
          formData.ID === 0 ? 'Thêm đơn đặt cơm thành công' : 'Cập nhật đơn đặt cơm thành công');

        this.closeModal();
        this.loadFoodOrder();

        // Reset form 
        this.foodOrderForm.reset({
          ID: 0,
          EmployeeID: null,
          DateOrder: new Date(),
          Quantity: 1,
          IsApproved: false,
          Location: '1',
          Note: '',
          FullName: '',
          IsDeleted: false
        });
      },
      error: (error) => {
        console.error('Error saving food order:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lưu đơn đặt cơm');
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lưu đơn đặt cơm');
      }
    });
  }
  //#endregion

  //#region Hàm xóa
  deleteFoodOrder() {
    const selectedRowsHN = this.foodOrderHNTabulator.getSelectedRows();
    const selectedRowsĐP = this.foodOrderĐPTabulator.getSelectedRows();


    if (selectedRowsHN.length === 0 && selectedRowsĐP.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đơn đặt cần xóa');
      return;
    }

    // Collect all selected food orders
    const foodOrdersToDelete: any[] = [];


    if (selectedRowsHN.length > 0) {
      selectedRowsHN.forEach(row => {
        foodOrdersToDelete.push(row.getData());
      });
    }


    if (selectedRowsĐP.length > 0) {
      selectedRowsĐP.forEach(row => {
        foodOrdersToDelete.push(row.getData());
      });
    }

    if (foodOrdersToDelete.length === 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy đơn đặt cần xóa');
      this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy đơn đặt cần xóa');
      return;
    }

    // Check if any selected food order is approved
    const approvedOrders = foodOrdersToDelete.filter(fo => fo.IsApproved === true);
    if (approvedOrders.length > 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, `Có đơn đặt cơm đã được duyệt. Vui lòng hủy duyệt trước khi xóa!`);
      return;
    }



    // Show confirmation dialog
    const employeeNames = foodOrdersToDelete.map(fo => fo.FullName).join(', ');
    let completed = 0;
    const total = foodOrdersToDelete.length;
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${foodOrdersToDelete.length} đơn đặt cơm của nhân viên: "${employeeNames}"?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        // Process each food order for soft delete
        const deletePromises = foodOrdersToDelete.map(foodOrder => {
          const deleteData = {
            ...foodOrder,
            IsDeleted: true
          };
          return this.foodOrderService.saveEmployeeFoodOrder(deleteData).subscribe({
            next: (response) => {
              completed++;
              if (completed === total) {
                this.notification.success(NOTIFICATION_TITLE.success, 'Xóa đơn đặt cơm thành công');
                this.loadFoodOrder();
              }
            },
            error: (error) => {
              this.notification.error(NOTIFICATION_TITLE.error, 'Xóa đơn đặt cơm thất bại: ' + error.message);
              this.notification.error(NOTIFICATION_TITLE.error, 'Xóa đơn đặt cơm thất bại: ' + error.message);
            }
          })
        });
      },
      nzCancelText: 'Hủy'
    });
  }
  //#endregion


  //#region Hàm duyệt
  approved(isApproved: boolean) {
    const approvedText = isApproved ? 'duyệt' : 'hủy duyệt';
    const listID: number[] = [];
    const selectedRowsHN = this.foodOrderHNTabulator.getSelectedRows();
    const selectedRowsĐP = this.foodOrderĐPTabulator.getSelectedRows();
    if (selectedRowsHN.length === 0 && selectedRowsĐP.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn đơn đặt cần ${approvedText}`);
      return;
    }

    // Gộp các dòng được chọn từ cả hai bảng
    const selectedRows = [
      ...selectedRowsHN.map(row => row.getData()),
      ...selectedRowsĐP.map(row => row.getData())
    ];

    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn ${approvedText} danh sách đặt cơm không?`,
      nzOnOk: () => {
        const updatePromises = [];

        for (const row of selectedRows) {
          const id = row['ID'];
          listID.push(id);


          // Cập nhật trạng thái và người duyệt
          row['IsApproved'] = isApproved;
          // row['Approver'] = isApproved ? 368 : 0;


          // Gọi API cập nhật từng dòng
          updatePromises.push(
            this.foodOrderService.saveEmployeeFoodOrder(row).toPromise()
          );
        }


        Promise.all(updatePromises)
          .then(() => {
            this.notification.success(NOTIFICATION_TITLE.success, `${approvedText.charAt(0).toUpperCase() + approvedText.slice(1)} đơn đặt cơm thành công!`);
            this.loadFoodOrder();
          })
          .catch((error) => {
            this.notification.error(NOTIFICATION_TITLE.error, `Cập nhật đơn đặt cơm thất bại: ${error.message}`);
            this.notification.error(NOTIFICATION_TITLE.error, `Cập nhật đơn đặt cơm thất bại: ${error.message}`);
          });
      }
    })
  }
  //#endregion

  //#region Hàm đóng modal
  closeModal() {
    const modal = document.getElementById('addFoodOrderModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
    this.foodOrderForm.reset({
      ID: 0,
      EmployeeID: null,
      DateOrder: new Date(),
      Quantity: 1,
      IsApproved: false,
      Location: '1',
      Note: '',
      FullName: '',
      IsDeleted: false
    });
  }
  //#endregion

  //#region Hàm xuất excel
  async exportToExcel() {
    const exportDataHN = this.foodOrderHNList.map((foodOrder, idx) => {
      const safe = (val: any) => (val && typeof val === 'object' && Object.keys(val).length === 0 ? '' : val);
      return {
        'Duyệt': foodOrder.IsApproved ? 'Đã duyệt' : 'Chưa duyệt',
        'Mã nhân viên': safe(foodOrder.Code),
        'Họ và tên': safe(foodOrder.FullName),
        'Ngày đặt': safe(DateTime.fromISO(foodOrder.DateOrder).toFormat('dd/MM/yyyy')),
        'Số lượng': safe(foodOrder.Quantity)
      };
    });

    const exportDataĐP = this.foodOrderĐPList.map((foodOrder, idx) => {
      const safe = (val: any) => (val && typeof val === 'object' && Object.keys(val).length === 0 ? '' : val);
      return {
        'Duyệt': foodOrder.IsApproved ? 'Đã duyệt' : 'Chưa duyệt',
        'Mã nhân viên': safe(foodOrder.Code),
        'Họ và tên': safe(foodOrder.FullName),
        'Ngày đặt': safe(DateTime.fromISO(foodOrder.DateOrder).toFormat('dd/MM/yyyy')),
        'Số lượng': safe(foodOrder.Quantity)
      };
    });


    const workbook = new ExcelJS.Workbook();
    const worksheetHN = workbook.addWorksheet('VP Hà Nội');
    const worksheetĐP = workbook.addWorksheet('Xưởng Đan Phượng');

    // Cấu hình cột cho sheet VP Hà Nội
    worksheetHN.columns = [
      { header: 'Duyệt', key: 'Duyệt', width: 20 },
      { header: 'Mã nhân viên', key: 'Mã nhân viên', width: 40 },
      { header: 'Họ và tên', key: 'Họ và tên', width: 70 },
      { header: 'Ngày đặt', key: 'Ngày đặt', width: 50 },
      { header: 'Số lượng', key: 'Số lượng', width: 20 }
    ];

    // Cấu hình cột cho sheet Xưởng Đan Phượng
    worksheetĐP.columns = [
      { header: 'Duyệt', key: 'Duyệt', width: 20 },
      { header: 'Mã nhân viên', key: 'Mã nhân viên', width: 40 },
      { header: 'Họ và tên', key: 'Họ và tên', width: 70 },
      { header: 'Ngày đặt', key: 'Ngày đặt', width: 50 },
      { header: 'Số lượng', key: 'Số lượng', width: 20 }
    ];

    // Thêm dữ liệu cho sheet VP Hà Nội
    exportDataHN.forEach(row => worksheetHN.addRow(row));

    // Thêm dữ liệu cho sheet Xưởng Đan Phượng
    exportDataĐP.forEach(row => worksheetĐP.addRow(row));

    // Định dạng header cho sheet VP Hà Nội
    worksheetHN.getRow(1).eachCell((cell: ExcelJS.Cell) => {
      cell.font = { name: 'Tahoma', size: 10, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
      };
    });
    worksheetHN.getRow(1).height = 30;

    // Định dạng header cho sheet Xưởng Đan Phượng
    worksheetĐP.getRow(1).eachCell((cell: ExcelJS.Cell) => {
      cell.font = { name: 'Tahoma', size: 10, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
      };
    });
    worksheetĐP.getRow(1).height = 30;

    // Định dạng các dòng dữ liệu cho sheet VP Hà Nội
    worksheetHN.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      row.height = 40;
      row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
        if (colNumber !== 1) {
          cell.font = { name: 'Tahoma', size: 10 };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        }
      });
    });

    // Định dạng các dòng dữ liệu cho sheet Xưởng Đan Phượng
    worksheetĐP.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      row.height = 40;
      row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
        if (colNumber !== 1) {
          cell.font = { name: 'Tahoma', size: 10 };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        }
      });
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `DanhSachDatCom_${new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '')}.xlsx`);
  }
  //#endregion

  resetSearch() {
    this.searchForm.patchValue({
      dateStart: new Date(new Date()),
      dateEnd: new Date(),
      employeeId: 0
    });
    this.loadFoodOrder();
  }

  @ViewChild(SummaryFoodOrderComponent) summaryFoodOrderComponent!: SummaryFoodOrderComponent;
  openSummaryFoodOrderModal() {
    const modal = new (window as any).bootstrap.Modal(document.getElementById('summaryFoodOrderModal'));
    modal.show();
    this.summaryFoodOrderComponent.ngOnInit();
  }
}
