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
import { EmployeeService } from '../../employee/employee-service/employee.service';
import { EmployeeBussinessService } from '../employee-bussiness-service/employee-bussiness.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { OnChangeType } from 'ng-zorro-antd/core/types';
import { VehiceDetailComponent } from '../vehice-detail/vehice-detail.component';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
    EmployeeBussinessDetailComponent
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

  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private employeeService: EmployeeService,
    private employeeBussinessService: EmployeeBussinessService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
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
    debugger
    this.initSearchForm();
    this.loadApprover();
    this.loadEmployee();
    this.loadDetailData();
    this.loadEmployeeBussinessType();
    this.initializeTabulator();
  }

  loadDetailData() {
    debugger
    // Set form values from the first item in detail data
    const firstItem = this.detailData[0];
    if (firstItem != null) {
      this.searchForm.patchValue({
        employeeId: firstItem['EmployeeID'] ?? 0,
        approverId: firstItem['ApprovedID'] ?? 0,
        dateRegister: new Date(firstItem['DayBussiness'])
      });
    }
    // Gán lại STT cho từng dòng dữ liệu
    if (this.detailData && this.detailData.length > 0) {
      this.detailData.forEach((item, idx) => {
        item.STT = idx + 1;
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
            cell.getRow().delete();
            this.resetSTT();
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
            debugger
            const value = parseInt(cell.getValue());
            const type = this.employeeTypeBussinessList.find((emp: any) => emp.value === value);
            return type ? type.label : '--Chọn loại--';
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
          formatter: function (cell) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = checked;

            // Add event listener to update cell value when checkbox changes
            input.addEventListener('change', () => {
              cell.setValue(input.checked); // Update the cell's value to true/false
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

        { title: 'Phương tiện', field: 'VehicleName', hozAlign: 'left', headerHozAlign: 'center', width: 500, headerSort: false, },
        {
          title: 'Thêm phương tiện',
          field: 'openModal',
          hozAlign: 'left',
          headerHozAlign: 'center',
          headerWordWrap: true,
          headerSort: false,
          width: 60,
          formatter: (cell: any) => {
            return `<div style="display: flex; justify-content: center; align-items: center; height: 100%;">
            <i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`;
          },

          cellClick: (e: any, cell: any) => {
            this.editVehiceDetail();
          }
        },
        { title: 'Lý do sửa', field: 'ReasonHREdit', editor: 'input', hozAlign: 'left', headerHozAlign: 'center', width: 500, headerSort: false, },
        { title: 'Ghi chú', field: 'Note', editor: 'input', hozAlign: 'left', headerHozAlign: 'center', width: 500, headerSort: false, },

      ]
    });
    if (this.tabulator) {
      this.tabulator.on('cellEdited', (cell: any) => {
        const value = cell.getValue();
        const field = cell.getField();

        // Validation cho thời gian
        if ((field === 'TimeStart' || field === 'EndTime') && value) {
          try {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng nhập thời gian đúng định dạng');
              cell.setValue('');
              return;
            }
          } catch (error) {
            this.notification.warning(NOTIFICATION_TITLE.error, 'Định dạng thời gian không hợp lệ');
            cell.setValue('');
            return;
          }
        }

        // Validation cho thời gian kết thúc phải sau thời gian bắt đầu
        if (field === 'EndTime' || field === 'TimeStart') {
          const rowData = cell.getRow().getData();
          if (rowData.TimeStart && rowData.EndTime) {
            const startTime = new Date(rowData.TimeStart);
            const endTime = new Date(rowData.EndTime);
            if (startTime >= endTime) {
              this.notification.warning(NOTIFICATION_TITLE.error, 'Thời gian kết thúc phải sau thời gian bắt đầu');
              cell.setValue('');
              return;
            }
          }
        }

        this.employeeBussinessDetail = this.tabulator!.getData();
      });
      this.tabulator.on('dataChanged', () => {
        this.employeeBussinessDetail = this.tabulator!.getData();
      });
    }
  }

  editVehiceDetail() {
    // const data = this.tabulator.getSelectedRows();
    // const modalRef = this.modalService.open(VehiceDetailComponent, {
    //   centered: true,
    //   size: 'xl',
    //   backdrop: 'static',
    //   keyboard: false,
    // });

    // const rowData = data[0].getData();
    // if (rowData['ID'] == null || rowData['ID'] <= 0) {
    //   this.notification.warning(NOTIFICATION_TITLE.error, 'Do chưa có cách để thêm Chi phí phương tiện khi tạo công tác.\n' +
    //     'Vui lòng Lưu lại khai báo công tác trước sau đó cập nhập Chi phí phương tiện.');
    //   return false;
    // }
    // modalRef.componentInstance.employeeBussinessId = rowData['ID'];
    // modalRef.result.then(
    //   (result) => {
    //     if (result.success) {
    //     } else {
    //     }
    //   },
    //   (reason) => {
    //   }
    // );
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
    if (this.searchForm.value.employeeId <= 0 || this.searchForm.value.employeeId == null) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng chọn nhân viên');
      return false;
    }

    if (this.searchForm.value.approverId <= 0 || this.searchForm.value.approverId == null) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng chọn người duyệt');
      return false;
    }

    if (this.searchForm.value.dateRegister == null) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng chọn ngày đăng ký');
      return false;
    }

    return true;
  }

  onSubmit() {
    if (!this.checkValidate()) {
      return;
    }

    const employeeBussiness = this.tabulator.getData() || [];
    const data = this.searchForm.value;

    const formData = {
      EmployeeBussinesses: employeeBussiness.map(item => ({
        ID: item.ID || 0,
        EmployeeID: data.employeeId ?? 0,
        ApprovedID: data.approverId ?? 0,
        DayBussiness: DateTime.fromJSDate(data.dateRegister).toFormat("yyyy-MM-dd'T'00:00:00") ?? DateTime.fromJSDate(new Date()).toFormat("yyyy-MM-dd'T'00:00:00"),
        TypeBusiness: item.TypeBusiness ?? 0,
        Location: item.Location ?? '',
        WorkEarly: item.WorkEarly ?? false,
        OvernightType: item.OvernightType ?? 0,
        NotChekIn: item.NotChekIn ?? false,
        ReasonHREdit: item.ReasonHREdit ?? '',
        Note: item.Note ?? '',
      }))
    }

    this.employeeBussinessService.saveEmployeeBussiness(formData.EmployeeBussinesses).subscribe({
      next: (response) => {
        this.activeModal.dismiss();
        this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật đăng ký công tác thành công');
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Cập nhật đăng ký công tác thất bại');
      }
    })
  }
}