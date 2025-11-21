import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, Form } from '@angular/forms';
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
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { EmployeeService } from '../../../../old/employee/employee-service/employee.service';
import { EmployeeBussinessService } from '../employee-bussiness-service/employee-bussiness.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { OnChangeType } from 'ng-zorro-antd/core/types';
import { VehiceDetailComponent } from '../vehice-detail/vehice-detail.component';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppUserService } from '../../../../../services/app-user.service';
@Component({
  selector: 'app-employee-bussiness-detail',
  templateUrl: './employee-bussiness-detail.component.html',
  styleUrls: ['./employee-bussiness-detail.component.css'],
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
    NgIf,
    NzSpinModule,
  ]
})
export class EmployeeBussinessDetailComponent implements OnInit, AfterViewInit, OnChanges {

  @Output() employeeBussinessData = new EventEmitter<void>();
  @Input() detailData: any[] = [];
  private tabulator!: Tabulator;
  isLoading = false;
  employeeList: any[] = [];
  approverList: any[] = [];
  searchForm!: FormGroup;
  employeeBussinessDetail: any[] = [];
  employeeTypeBussinessList: any[] = [];
  listId: number[] = []; // Danh sách ID cần xóa
  hasDataChanges = false; // Flag để kiểm tra có thay đổi không

  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private employeeService: EmployeeService,
    private employeeBussinessService: EmployeeBussinessService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private appUserService: AppUserService,
  ) { }

  overNightTypeList = [
    { value: 1, label: 'Từ sau 20h' },
    { value: 2, label: 'Theo loại CT' },
  ];

  ngOnInit() {
    this.initSearchForm();
    this.loadApprover();
    this.loadEmployee();
    this.loadDetailData();
    this.loadEmployeeBussinessType();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeTabulator();
      this.loadDetailData();
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    
    this.initSearchForm();
    this.loadApprover();
    this.loadEmployee();
    this.loadDetailData();
    this.loadEmployeeBussinessType();
    this.initializeTabulator();
  }

  loadDetailData() {
    this.listId = []; // Reset list ID cần xóa
    this.hasDataChanges = false; // Reset flag thay đổi
    
    // Set form values from the first item in detail data
    const firstItem = this.detailData[0];
    if (firstItem != null) {
      this.searchForm.patchValue({
        employeeId: firstItem['EmployeeID'] ?? 0,
        approverId: firstItem['ApprovedID'] ?? 0,
        dateRegister: new Date(firstItem['DayBussiness'])
      });
      
      // Disable employee và approver khi có dữ liệu
      this.searchForm.get('employeeId')?.disable();
      this.searchForm.get('approverId')?.disable();
    } else {
      // Enable khi không có dữ liệu
      this.searchForm.get('employeeId')?.enable();
      this.searchForm.get('approverId')?.enable();
      this.searchForm.patchValue({
        employeeId: null,
        approverId: null,
        dateRegister: new Date()
      });
    }
    
    // Gán lại STT cho từng dòng dữ liệu
    if (this.detailData && this.detailData.length > 0) {
      this.detailData.forEach((item, idx) => {
        item.STT = idx + 1;
        // Tính toán TotalCost cho mỗi dòng
        this.calculateTotalCostForRow(item);
      });
    }

    // Load data into tabulator
    if (this.tabulator && this.detailData.length > 0) {
      this.tabulator.setData(this.detailData);
    } else {
      // Nếu chưa có Tabulator → lưu dữ liệu tạm
      this.employeeBussinessDetail = this.detailData;
    }
  }

  private initSearchForm() {
    this.searchForm = this.fb.group({
      approverId: null,
      employeeId: null,
      dateRegister: new Date()
    });
  }

  loadEmployee() {
    this.employeeService.getAllEmployee().subscribe({
      next: (data) => {
        this.employeeList = data.data;
      },
      error: (error) => {
        this.notification.warning("Lỗi", "Lỗi khi lấy danh sách nhân viên");
      }
    })
  }

  loadApprover() {
    this.employeeService.getEmployeeApprove().subscribe({
      next: (data) => {
        this.approverList = data.data;
      },
      error: (error) => {
        this.notification.warning("Lỗi", "Lỗi khi lấy danh sách người duyệt");
      }
    })
  }

  loadEmployeeBussinessType() {
    this.employeeBussinessService.getEmployeeTypeBussiness().subscribe({
      next: (data) => {
        if (data.data && Array.isArray(data.data)) {
          this.employeeTypeBussinessList = data.data.map((type: any) => ({
            value: type.ID,
            label: `${type.TypeCode} - ${type.TypeName} - ${type.Cost}`,
            typeData: type
          }));
          console.log('employeeTypeBussinessList', this.employeeTypeBussinessList);
          if (this.tabulator) {
            this.destroyTabulator();
            this.initializeTabulator();
          }
        } else {
          this.employeeTypeBussinessList = [];
        }
      },
      error: (error) => {
        this.notification.warning("Lỗi", "Lỗi khi lấy danh sách loại công tác")
      }
    })
  }

  private destroyTabulator() {
    if (this.tabulator) {
      this.tabulator.destroy();
      this.tabulator = null as any;
    }
  }

  resetSTT() {
    const rows = this.tabulator.getRows();
    rows.forEach((row, index) => {
      row.update({ STT: index + 1 });
    });
  }


  private initializeTabulator(): void {
    this.tabulator = new Tabulator('#tb_employee_bussiness_detail', {
      data: this.employeeBussinessDetail, // Initialize with empty array
      layout: 'fitDataStretch',
      height: '70vh',
      columns: [
        {
          title: '',
          field: 'addRow',
          headerSort: false,
          width: 40,
          hozAlign: 'center',
          headerHozAlign: 'center',
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
          headerClick: (e: any, column: any) => {
            this.addRow();
          },
          formatter: (cell: any) => {
            const data = cell.getRow().getData();
            let id = data['ID'];
            return id <= 0 || id == null
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },

          cellClick: (e: any, cell: any) => {
            const rowData = cell.getRow().getData();
            const id = rowData.ID || 0;
            if (id > 0) {
              // Thêm vào listId để xóa sau
              if (!this.listId.includes(id)) {
                this.listId.push(id);
              }
            }
            cell.getRow().delete();
            this.resetSTT();
            this.hasDataChanges = true;
          }
        } as any,
        { title: 'STT', field: 'STT', editor: 'input', hozAlign: 'center', headerHozAlign: 'center', width: 80 },
        {
          title: 'Địa điểm',
          field: 'Location',
          editor: 'input',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 200, headerSort: false,

        },
        {
          title: 'Loại',
          field: 'TypeBusiness',
          editor: 'list',
          headerSort: false,
          editorParams: {
            values: this.employeeTypeBussinessList
          },
          formatter: (cell: any) => {
            
            const value = parseInt(cell.getValue());
            const type = this.employeeTypeBussinessList.find((emp: any) => emp.value === value);
            return type ? type.label : '--Chọn loại--';
          },
          cellEdited: (cell: any) => {
            const row = cell.getRow();
            this.setTotalCost(row);
          },
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 350
        },
        {
          title: 'Xuất phát trước 7h15',
          field: 'WorkEarly',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = checked;

            // Add event listener to update cell value when checkbox changes
            input.addEventListener('change', () => {
              cell.setValue(input.checked);
              const row = cell.getRow();
              this.setTotalCost(row);
            });

            return input;
          },
          // Ensure the cell's value is always a boolean
          mutator: function (value) {
            return value === true || value === 'true' || value === 1 || value === '1';
          }
        },
        {
          title: 'Phụ cấp ăn tối',
          field: 'OvernightType',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 300,
          editor: 'list',
          editorParams: {
            values: this.overNightTypeList
          },
          headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            const type = this.overNightTypeList.find((ov: any) => ov.value === value);
            return type ? type.label : value;
          },
          cellEdited: (cell: any) => {
            const row = cell.getRow();
            this.setTotalCost(row);
          }
        },
        {
          title: 'Không chấm công tại VP',
          field: 'NotChekIn',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 180,
          headerSort: false,
          formatter: function (cell) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = checked;

            input.addEventListener('change', () => {
              cell.setValue(input.checked);
            });

            return input;
          },
          headerWordWrap: true,
          // Ensure the cell's value is always a boolean
          mutator: function (value) {
            return value === true || value === 'true' || value === 1 || value === '1';
          }
        },

        { 
          title: 'Phương tiện', 
          field: 'VehicleName', 
          hozAlign: 'left', 
          headerHozAlign: 'center', 
          width: 500, 
          headerSort: false,
          editor: false
        },
        {
          title: 'Tổng chi phí phương tiện',
          field: 'TotalCostVehicle',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
          editor: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return '0 ₫';
          }
        },
        {
          title: 'Tổng chi phí',
          field: 'TotalCost',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 200,
          headerSort: false,
          editor: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return '0 ₫';
          }
        },
        {
          title: 'Thêm phương tiện',
          field: 'openModal',
          hozAlign: 'center',
          headerHozAlign: 'center',
          headerWordWrap: true,
          headerSort: false,
          width: 60,
          formatter: (cell: any) => {
            return `<div style="display: flex; justify-content: center; align-items: center; height: 100%;">
            <i class="fas fa-plus text-success cursor-pointer" title="Thêm phương tiện"></i></div>`;
          },

          cellClick: (e: any, cell: any) => {
            const rowData = cell.getRow().getData();
            this.editVehiceDetail(rowData);
          }
        },
        { title: 'Lý do sửa', field: 'ReasonHREdit', editor: 'input', hozAlign: 'left', headerHozAlign: 'center', width: 500, headerSort: false, },
        { title: 'Ghi chú', field: 'Note', editor: 'input', hozAlign: 'left', headerHozAlign: 'center', width: 500, headerSort: false, },

      ]
    });
    if (this.tabulator) {
      this.tabulator.on('cellEdited', (cell: any) => {
        const field = cell.getField();
        this.hasDataChanges = true;
        this.employeeBussinessDetail = this.tabulator!.getData();
      });
      
      this.tabulator.on('dataChanged', () => {
        this.hasDataChanges = true;
        this.employeeBussinessDetail = this.tabulator!.getData();
      });
      
      this.tabulator.on('rowDeleted', () => {
        this.hasDataChanges = true;
        this.resetSTT();
      });
    }
  }

  editVehiceDetail(rowData: any) {
    const id = rowData?.ID || 0;
    if (id <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.error, 
        'Do chưa có cách để thêm Chi phí phương tiện khi tạo công tác.\n' +
        'Vui lòng Lưu lại khai báo công tác trước sau đó cập nhập Chi phí phương tiện.');
      return;
    }

    const modalRef = this.modalService.open(VehiceDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.employeeBussinessId = id;
    modalRef.componentInstance.bussinessInfo = {
      ID: id,
      FullName: this.employeeList.find(e => e.ID === this.searchForm.getRawValue().employeeId)?.FullName || '',
      TypeBussiness: this.employeeTypeBussinessList.find(t => t.value === rowData.TypeBusiness)?.label || '',
      Location: rowData.Location || '',
      DayBussiness: this.searchForm.getRawValue().dateRegister
    };

    modalRef.result.then(
      (result) => {
        if (result && result.success) {
          // Cập nhật VehicleName và TotalCostVehicle từ kết quả
          const vehicleInfo = result.vehicleInfo;
          if (vehicleInfo) {
            const row = this.tabulator.getRows().find(r => r.getData()['ID'] === id);
            if (row) {
              const vehicleName = vehicleInfo.VehicleName || '';
              const totalCost = vehicleInfo.TotalCost || 0;
              row.update({
                VehicleName: vehicleName,
                TotalCostVehicle: totalCost
              });
              this.setTotalCost(row);
              this.hasDataChanges = true;
            }
          }
        }
      },
      (reason) => {
        // Modal dismissed
      }
    );
  }

  addRow() {
    if (this.tabulator) {
      const data = this.tabulator.getData();
      // Tìm STT lớn nhất hiện tại, nếu chưa có thì là 0
      const maxSTT = data.length > 0 ? Math.max(...data.map((row: any) => Number(row.STT) || 0)) : 0;
      this.tabulator.addRow({
        STT: maxSTT + 1,
        TypeBusiness: -1,
      });
    }
  }

  closeModal() {
    const modal = document.getElementById('employeeBussinessModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
  }

  checkValidate(): boolean {
    const formValue = this.searchForm.getRawValue(); // getRawValue để lấy cả disabled fields
    
    if (!formValue.employeeId || formValue.employeeId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng chọn nhân viên');
      return false;
    }

    if (!formValue.approverId || formValue.approverId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng chọn người duyệt');
      return false;
    }

    if (!formValue.dateRegister) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng chọn ngày đăng ký');
      return false;
    }

    // Validate từng dòng trong bảng
    const rows = this.tabulator.getRows();
    for (let i = 0; i < rows.length; i++) {
      const rowData = rows[i].getData();
      const stt = rowData['STT'] || (i + 1);
      
      // Validate Location
      if (!rowData['Location'] || rowData['Location'].trim() === '') {
        this.notification.warning(NOTIFICATION_TITLE.error, `Vui lòng nhập Địa điểm [STT: ${stt}]!`);
        return false;
      }
      
      // Validate TypeBusiness
      if (!rowData['TypeBusiness'] || rowData['TypeBusiness'] <= 0) {
        this.notification.warning(NOTIFICATION_TITLE.error, `Vui lòng chọn Loại [STT: ${stt}]!`);
        return false;
      }
      
      // Validate VehicleName nếu ID > 0
      if (rowData['ID'] > 0) {
        if (!rowData['VehicleName'] || rowData['VehicleName'].trim() === '') {
          this.notification.warning(NOTIFICATION_TITLE.error, `Vui lòng nhập Phương tiện [STT: ${stt}]!`);
          return false;
        }
        
        // Validate ReasonHREdit nếu không phải admin
        const isAdmin = this.appUserService.isAdmin;
        if (!isAdmin && (!rowData['ReasonHREdit'] || rowData['ReasonHREdit'].trim() === '')) {
          this.notification.warning(NOTIFICATION_TITLE.error, `Vui lòng nhập Lý do sửa [STT: ${stt}]!`);
          return false;
        }
      }
    }

    return true;
  }

  onSubmit() {
    if (!this.checkValidate()) {
      return;
    }

    const employeeBussiness = this.tabulator.getData() || [];
    const formValue = this.searchForm.getRawValue(); // getRawValue để lấy cả disabled fields

    // Tính toán các chi phí cho từng dòng
    const formData = {
      EmployeeBussinesses: employeeBussiness.map(item => {
        // Lấy thông tin loại công tác
        const typeBussiness = this.employeeTypeBussinessList.find(t => t.value === item.TypeBusiness);
        const costBussiness = typeBussiness?.typeData?.Cost || 0;
        
        // Tính các chi phí
        const costWorkEarly = (item.WorkEarly === true || item.WorkEarly === 1 || item.WorkEarly === 'true') ? 50000 : 0;
        const costOvernight = (item.OvernightType > 0) ? 35000 : 0;
        const costVehicle = item.TotalCostVehicle || 0;
        const totalMoney = costBussiness + costOvernight + costWorkEarly + costVehicle;
        
        return {
          ID: item.ID || 0,
          EmployeeID: formValue.employeeId ?? 0,
          ApprovedID: formValue.approverId ?? 0,
          DayBussiness: DateTime.fromJSDate(formValue.dateRegister).toFormat("yyyy-MM-dd'T'00:00:00") ?? DateTime.fromJSDate(new Date()).toFormat("yyyy-MM-dd'T'00:00:00"),
          TypeBusiness: item.TypeBusiness ?? 0,
          Location: item.Location ?? '',
          WorkEarly: item.WorkEarly ?? false,
          OvernightType: item.OvernightType ?? 0,
          NotChekIn: item.NotChekIn ?? false,
          ReasonHREdit: item.ReasonHREdit ?? '',
          Note: item.Note ?? '',
          CostBussiness: costBussiness,
          CostOvernight: costOvernight,
          CostWorkEarly: costWorkEarly,
          TotalMoney: totalMoney,
          Overnight: item.OvernightType > 0,
          DecilineApprove: item.ID > 0 ? undefined : 1, // Chỉ set khi insert mới
          IsApproved: item.ID > 0 ? false : undefined, // Reset khi update
          IsApprovedHR: item.ID > 0 ? false : undefined // Reset khi update
        };
      })
    };

    // Lưu dữ liệu
    this.employeeBussinessService.saveEmployeeBussiness(formData.EmployeeBussinesses).subscribe({
      next: (response) => {
        // Xóa các dòng đã đánh dấu xóa
        if (this.listId.length > 0) {
          this.employeeBussinessService.deletedEmployeeBussiness(this.listId).subscribe({
            next: () => {
              this.listId = [];
              this.hasDataChanges = false;
              this.activeModal.close({ success: true });
              this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật đăng ký công tác thành công');
            },
            error: (error) => {
              this.notification.error(NOTIFICATION_TITLE.error, 'Xóa công tác thất bại');
            }
          });
        } else {
          this.hasDataChanges = false;
          this.activeModal.close({ success: true });
          this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật đăng ký công tác thành công');
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Cập nhật đăng ký công tác thất bại');
      }
    });
  }

  // Tính tổng chi phí cho một dòng
  setTotalCost(row: any) {
    const rowData = row.getData();
    const typeBussinessID = rowData.TypeBusiness || 0;
    const typeBussiness = this.employeeTypeBussinessList.find((t: any) => t.value === typeBussinessID);
    const costType = typeBussiness?.typeData?.Cost || 0;
    
    const costWorkEarly = (rowData.WorkEarly === true || rowData.WorkEarly === 1 || rowData.WorkEarly === 'true') ? 50000 : 0;
    const costOvernight = (rowData.OvernightType > 0) ? 35000 : 0;
    const costVehicle = rowData.TotalCostVehicle || 0;
    
    const totalCost = costType + costWorkEarly + costOvernight + costVehicle;
    row.update({ TotalCost: totalCost });
  }

  // Tính tổng chi phí cho một object (dùng khi load data)
  calculateTotalCostForRow(item: any) {
    const typeBussinessID = item.TypeBusiness || 0;
    const typeBussiness = this.employeeTypeBussinessList.find((t: any) => t.value === typeBussinessID);
    const costType = typeBussiness?.typeData?.Cost || 0;
    
    const costWorkEarly = (item.WorkEarly === true || item.WorkEarly === 1 || item.WorkEarly === 'true') ? 50000 : 0;
    const costOvernight = (item.OvernightType > 0) ? 35000 : 0;
    const costVehicle = item.TotalCostVehicle || 0;
    
    item.TotalCost = costType + costWorkEarly + costOvernight + costVehicle;
  }
}
