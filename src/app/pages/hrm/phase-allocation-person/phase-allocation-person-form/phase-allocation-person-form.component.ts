import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Component, OnInit, AfterViewInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { PhaseAllocationPersonService } from '../phase-allocation-person-service/phase-allocation-person.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { EmployeeService } from '../../employee/employee-service/employee.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzGridModule,
    HasPermissionDirective
  ],
  selector: 'app-phase-allocation-person-form',
  templateUrl: './phase-allocation-person-form.component.html',
  styleUrl: './phase-allocation-person-form.component.css'
})
export class PhaseAllocationPersonFormComponent implements OnInit, AfterViewInit {
  @Input() dataInput: any;
  
  public activeModal = inject(NgbActiveModal);
  formMaster!: FormGroup;
  detailTable: Tabulator | null = null;
  detailData: any[] = [];
  employeeList: any[] = [];
  deletedRows: any[] = [];
  
  // Options cho năm và tháng
  yearOptions: number[] = [];
  monthOptions: { value: number; label: string }[] = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' }
  ];

  constructor(
    private notification: NzNotificationService,
    private phaseAllocationService: PhaseAllocationPersonService,
    private employeeService: EmployeeService,
    private fb: FormBuilder
  ) {
    // Tạo danh sách năm
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.yearOptions.push(i);
    }
  }

  ngOnInit() {
    this.initForm();
    this.loadEmployees();
    
    if (this.dataInput?.master?.ID && this.dataInput.master.ID > 0) {
      // Có dữ liệu master để sửa
      this.patchFormData(this.dataInput.master);
      this.detailData = (this.dataInput?.details || []).map((d: any) => ({
        ID: d.ID || 0,
        EmployeeCode: d.EmployeeCode || '',
        EmployeeName: d.EmployeeName || '',
        EmployeeID: d.EmployeeID || 0,
        PhasedAllocationPersonID: d.PhasedAllocationPersonID || 0,
        DateReceive: d.DateReceive || null,
        StatusReceive: d.StatusReceive || 0,
        IsDeleted: d.IsDeleted || false
      }));
    } else {
      // Thêm mới
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      this.formMaster.reset({
        ID: 0,
        Code: '',
        Name: '',
        Year: this.dataInput?.Year || currentYear,
        Month: this.dataInput?.Month || currentMonth,
        IsDeleted: false
      });
      this.detailData = [];
    }
  }

  ngAfterViewInit(): void {
    // Vẽ bảng sau khi đã có dữ liệu
    setTimeout(() => {
      this.drawTable();
    }, 100);
  }

  initForm() {
    this.formMaster = this.fb.group({
      ID: [0],
      Code: ['', Validators.required],
      Name: ['', Validators.required],
      Year: [new Date().getFullYear(), Validators.required],
      Month: [new Date().getMonth() + 1, Validators.required],
      IsDeleted: [false]
    });
  }

  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.employeeList = Array.isArray(response.data) ? response.data : [];
        } else {
          this.employeeList = [];
        }
      },
      error: (error: any) => {
        console.error('Lỗi khi tải danh sách nhân viên:', error);
        this.employeeList = [];
      }
    });
  }

  patchFormData(data: any) {
    if (!data) return;
    this.formMaster.patchValue({
      ID: data.ID || 0,
      Code: data.Code || '',
      Name: data.Name || '',
      Year: data.Year || new Date().getFullYear(),
      Month: data.Month || new Date().getMonth() + 1,
      IsDeleted: data.IsDeleted || false
    });
  }

  close() {
    this.activeModal.dismiss('cancel');
  }

  drawTable() {
    if (this.detailTable) {
      this.detailTable.setData(this.detailData);
      return;
    }
    
    this.detailTable = new Tabulator('#detailTable', {
      data: this.detailData,
      layout: 'fitColumns',
      height: '38vh',
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      selectableRows: 1,
      columns: [
        {
          title: '',
          field: 'addRow',
          hozAlign: 'center',
          width: 40,
          headerSort: false,
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
          headerClick: () => {
            this.addRow();
          },
          formatter: () => `<i class="fas fa-times text-danger cursor-pointer delete-btn" title="Xóa dòng"></i>`,
          cellClick: (e, cell) => {
            if ((e.target as HTMLElement).classList.contains('fas')) {
              const row = cell.getRow();
              const rowData = row.getData();

              // Nếu là dòng đã tồn tại trong DB thì push vào deletedRows
              if (rowData['ID'] && rowData['ID'] > 0) {
                this.deletedRows.push({
                  ...rowData,
                  IsDeleted: true
                });
              }

              // Xóa khỏi bảng
              row.delete();
            }
          },
        },
        {
          title: 'STT',
          formatter: 'rownum',
          hozAlign: 'center',
          width: 60,
          headerSort: false,
        },
        { 
          title: 'ID', 
          field: 'ID', 
          hozAlign: 'center', 
          width: 60, 
          headerSort: false, 
          visible: false 
        },
        { 
          title: 'Mã nhân viên', 
          field: 'EmployeeCode', 
          hozAlign: 'left', 
          headerHozAlign: 'center',
          editor: 'input',
          cellEdited: (cell) => {
            const row = cell.getRow();
            const employeeCode = cell.getValue();
            // Tìm nhân viên theo mã
            const employee = this.employeeList.find((emp: any) => emp.Code === employeeCode);
            if (employee) {
              row.update({
                EmployeeID: employee.ID || employee.EmployeeID,
                EmployeeName: employee.FullName || employee.Name
              });
            } else {
              row.update({
                EmployeeID: 0,
                EmployeeName: ''
              });
            }
          }
        },
        { 
          title: 'Tên nhân viên', 
          field: 'EmployeeName', 
          hozAlign: 'left', 
          headerHozAlign: 'center'
        },
        {
          title: 'Phòng ban',
          field: 'DepartmentName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: (cell) => {
            const employeeCode = cell.getRow().getData()['EmployeeCode'];
            const employee = this.employeeList.find((emp: any) => emp.Code === employeeCode);
            return employee ? (employee.DepartmentName || '') : '';
          }
        }
      ]
    });
  }

  addRow() {
    if (this.detailTable) {
      const masterID = this.formMaster.get('ID')?.value || 0;
      this.detailTable.addRow({
        ID: 0,
        EmployeeCode: '',
        EmployeeName: '',
        EmployeeID: 0,
        PhasedAllocationPersonID: masterID,
        DateReceive: null,
        StatusReceive: 0,
        IsDeleted: false
      });
    }
  }

  async saveData() {
    // 1. Validate form master
    if (this.formMaster.invalid) {
      Object.values(this.formMaster.controls).forEach(c => {
        if (c.invalid) {
          c.markAsTouched();
          c.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // 2. Lấy dữ liệu chi tiết trên bảng
    const tableRows = this.detailTable ? this.detailTable.getData() : [];

    // 2.1. Bắt buộc phải có ít nhất 1 dòng chi tiết
    if (!tableRows || tableRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng thêm ít nhất 1 nhân viên');
      return;
    }

    // 2.2. Check từng dòng: EmployeeCode không được để trống
    const invalidIndex = tableRows.findIndex((row: any) =>
      !row.IsDeleted && (!row.EmployeeCode || row.EmployeeCode.toString().trim() === '')
    );

    if (invalidIndex !== -1) {
      const rowNumber = invalidIndex + 1;
      this.notification.warning(
        'Cảnh báo',
        `Vui lòng nhập "Mã nhân viên" cho dòng số ${rowNumber}`
      );
      return;
    }

    // 2.3. Check mã nhân viên có tồn tại không
    const invalidEmployees: string[] = [];
    tableRows.forEach((row: any, idx: number) => {
      if (!row.IsDeleted && row.EmployeeCode) {
        const employee = this.employeeList.find((emp: any) => emp.Code === row.EmployeeCode);
        if (!employee) {
          invalidEmployees.push(`Dòng ${idx + 1}: Mã nhân viên [${row.EmployeeCode}] không tồn tại`);
        }
      }
    });

    if (invalidEmployees.length > 0) {
      this.notification.warning('Cảnh báo', invalidEmployees.join('\n'));
      return;
    }

    const formValue = this.formMaster.value;

    // 3. Lưu master trước
    const masterPayload = {
      ID: formValue.ID || 0,
      Code: formValue.Code,
      Name: formValue.Name,
      Year: formValue.Year,
      Month: formValue.Month,
      IsDeleted: formValue.IsDeleted || false
    };

    this.phaseAllocationService.saveData(masterPayload).subscribe({
      next: (masterResponse) => {
        if (masterResponse && masterResponse.status === 1) {
          const savedMaster = masterResponse.data;
          const masterID = savedMaster?.ID || formValue.ID || 0;

          // 4. Lưu detail
          const allRows = [
            ...tableRows,
            ...this.deletedRows
          ];

          const detailPayload = allRows
            .filter((row: any) => !row.IsDeleted)
            .map((row: any) => ({
              PhasedAllocationPersonID: masterID,
              EmployeeCode: row.EmployeeCode || ''
            }));

          if (detailPayload.length > 0) {
            this.phaseAllocationService.saveDataDetail(detailPayload).subscribe({
              next: (detailResponse) => {
                if (detailResponse && detailResponse.status === 1) {
                  this.notification.success(NOTIFICATION_TITLE.success, detailResponse.message || 'Cập nhật dữ liệu thành công');
                  this.activeModal.close();
                } else {
                  this.notification.warning(NOTIFICATION_TITLE.warning, detailResponse?.message || 'Có lỗi khi lưu chi tiết');
                }
              },
              error: (res: any) => {
                console.error('Lỗi khi lưu chi tiết:', res);
                this.notification.error(NOTIFICATION_TITLE.error, res.error?.message || 'Lỗi khi lưu chi tiết');
              }
            });
          } else {
            this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật dữ liệu thành công');
            this.activeModal.close();
          }
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, masterResponse?.message || 'Lỗi khi lưu master');
        }
      },
      error: (res: any) => {
        console.error('Lỗi khi lưu master:', res);
        this.notification.error(NOTIFICATION_TITLE.error, res.error?.message || 'Lỗi khi lưu dữ liệu');
      }
    });
  }
}

