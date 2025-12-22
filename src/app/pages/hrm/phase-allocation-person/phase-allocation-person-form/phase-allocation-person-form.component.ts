import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Component, OnInit, AfterViewInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalModule,
} from '@ng-bootstrap/ng-bootstrap';
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
import { ChooseEmployeeComponent } from '../choose-employee/choose-employee.component';
import { NzModalService } from 'ng-zorro-antd/modal';

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
    HasPermissionDirective,
    ChooseEmployeeComponent,
    NgbModalModule,
  ],
  selector: 'app-phase-allocation-person-form',
  templateUrl: './phase-allocation-person-form.component.html',
  styleUrl: './phase-allocation-person-form.component.css',
})
export class PhaseAllocationPersonFormComponent
  implements OnInit, AfterViewInit
{
  @Input() dataInput: any;

  public activeModal = inject(NgbActiveModal);
  formMaster!: FormGroup;
  detailTable: Tabulator | null = null;
  detailData: any[] = [];
  employeeList: any[] = [];
  employeeEditorValues: any[] = [];
  deletedRows: any[] = [];
  private ngbModal = inject(NgbModal);

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
    { value: 12, label: 'Tháng 12' },
  ];
  typeAllocationOptions: { value: number; label: string }[] = [
    { value: 1, label: 'Quà' },
    { value: 2, label: 'Tài sản cá nhân' },
    { value: 3, label: 'Cơm ca' },
  ];

  constructor(
    private notification: NzNotificationService,
    private phaseAllocationService: PhaseAllocationPersonService,
    private employeeService: EmployeeService,
    private fb: FormBuilder,
    private modalService: NgbModal
  ) {
    // Tạo danh sách năm
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.yearOptions.push(i);
    }
  }

  ngOnInit() {
    this.initForm();
    console.log(this.dataInput);
    if (this.dataInput?.master) {
      // Có dữ liệu master để sửa
      this.patchFormData(this.dataInput.master);
      console.log(this.dataInput?.details);
      this.detailData = (this.dataInput?.details || []).map((d: any) => ({
        ID: d.ID || 0,
        EmployeeCode: d.EmployeeCode || '',
        EmployeeName: d.EmployeeFullName || '',
        EmployeeID: d.EmployeeID || 0,
        PhasedAllocationPersonID: d.PhasedAllocationPersonID || 0,
        DateReceive: d.DateReceive || null,
        StatusReceive: d.StatusReceive || 0,
        IsDeleted: d.IsDeleted || false,
        Quantity: d.Quantity || 1,
        UnitName: d.UnitName || '',
        ContentReceive: d.ContentReceive || '',
        DepartmentName: d.DepartmentName || '',
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
        IsDeleted: false,
      });
      this.detailData = [];
    }
  }

  ngAfterViewInit(): void {
    this.loadEmployees();
  }

  initForm() {
    this.formMaster = this.fb.group({
      ID: [0],
      Code: ['', Validators.required],
      Name: ['', Validators.required],
      Year: [new Date().getFullYear(), Validators.required],
      Month: [new Date().getMonth() + 1, Validators.required],
      TypeAllocation: [0, Validators.required],
      IsDeleted: [false],
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
        this.employeeEditorValues = Object.values(
          this.employeeList.reduce((groups: any, emp: any) => {
            const dept = emp.DepartmentName || 'Khác';

            if (!groups[dept]) {
              groups[dept] = {
                label: dept,
                options: [],
              };
            }

            groups[dept].options.push({
              label: `${emp.Code} - ${emp.FullName}`,
              value: emp.Code,
              keywords: `${emp.Code},${emp.FullName},${dept}`, // 🔍 search tốt
              description: emp.FullName,
            });

            return groups;
          }, {})
        );

        this.drawTable();
      },
      error: (error: any) => {
        console.error('Lỗi khi tải danh sách nhân viên:', error);
        this.employeeList = [];
      },
    });
  }

  patchFormData(data: any) {
    if (!data) return;
    this.formMaster.patchValue({
      ID: data.ID || 0,
      Code: data.Code || '',
      Name: data.ContentAllocation || '',
      Year: data.Year || new Date().getFullYear(),
      Month: data.Month || new Date().getMonth() + 1,
      TypeAllocation: data.TypeAllocation || 0,
      IsDeleted: data.IsDeleted || false,
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
      rowHeader: {
        formatter: 'rowSelection',
        titleFormatter: 'rowSelection',
        headerSort: false,
        resizable: false,
        frozen: true,
        headerHozAlign: 'center',
        hozAlign: 'center',
        width: 20,
        cellClick: function (e, cell) {
          cell.getRow().toggleSelect();
        },
      },
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
          formatter: () =>
            `<i class="fas fa-times text-danger cursor-pointer delete-btn" title="Xóa dòng"></i>`,
          cellClick: (e, cell) => {
            if ((e.target as HTMLElement).classList.contains('fas')) {
              const row = cell.getRow();
              const rowData = row.getData();

              // Nếu là dòng đã tồn tại trong DB thì push vào deletedRows
              if (rowData['ID'] && rowData['ID'] > 0) {
                this.deletedRows.push({
                  ...rowData,
                  IsDeleted: true,
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
          visible: false,
        },
        {
          title: 'Mã nhân viên',
          field: 'EmployeeCode',
          editor: 'list',

          editorParams: {
            values: this.employeeEditorValues,
            autocomplete: true,
            listOnEmpty: true,
            clearable: true,
            placeholderEmpty: 'Không tìm thấy nhân viên',
            filterFunc: function (term, label, value, item) {
              const t = term.toLowerCase();
              return (
                label.toLowerCase().includes(t) ||
                item.keywords?.toLowerCase().includes(t)
              );
            },
          },

          cellEdited: (cell) => {
            const row = cell.getRow();
            const code = cell.getValue()?.trim();

            if (!code) {
              row.update({
                EmployeeID: 0,
                EmployeeName: '',
                DepartmentName: '',
              });
              return;
            }

            const emp = this.employeeList.find((e: any) => e.Code === code);

            if (!emp) {
              row.update({
                EmployeeID: 0,
                EmployeeName: '',
                DepartmentName: '',
              });
              return;
            }

            // 🔹 kiểm tra trùng EmployeeID
            const isDuplicate = this.detailTable
              ?.getData()
              .some((r: any) => r.EmployeeID === emp.ID && r !== row.getData());

            if (isDuplicate) {
              // ❌ trùng → rollback
              row.update({
                EmployeeCode: '',
                EmployeeID: 0,
                EmployeeName: '',
                DepartmentName: '',
              });
              this.notification.warning(
                'Cảnh báo',
                `Nhân viên ${emp.FullName} đã được chọn!`
              );
              return;
            }

            // ✅ hợp lệ
            row.update({
              EmployeeID: emp.ID,
              EmployeeName: emp.FullName,
              DepartmentName: emp.DepartmentName,
            });
          },
        },
        {
          title: 'Tên nhân viên',
          field: 'EmployeeName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Phòng ban',
          field: 'DepartmentName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Nội dung',
          field: 'ContentReceive',
          hozAlign: 'left',
          headerHozAlign: 'center',
          editor: 'input',
          cellEdited: (cell) => {
            const table = cell.getTable();
            const selectedRows = table.getSelectedRows();
            const content = cell.getValue();

            // 👉 CHỈ bulk update khi có checkbox được tick
            if (selectedRows.length > 0) {
              selectedRows.forEach((row) => {
                row.update({ ContentReceive: content });
              });
              table.deselectRow();
            }
            // ❌ nếu không tick checkbox nào
            // → Tabulator đã tự update đúng dòng đang edit
          },
        },
        {
          title: 'Số lượng',
          field: 'Quantity',
          hozAlign: 'right',
          headerHozAlign: 'center',
          editor: 'input',
          editorParams: {
            elementAttributes: {
              type: 'number', // 🔥 chỉ cho nhập số
              min: '0',
              step: '1',
            },
          },
          cellEdited: (cell) => {
            const table = cell.getTable();
            const selectedRows = table.getSelectedRows();
            const content = cell.getValue();

            // 👉 CHỈ bulk update khi có checkbox được tick
            if (selectedRows.length > 0) {
              selectedRows.forEach((row) => {
                row.update({ Quantity: content });
              });
              table.deselectRow();
            }
            // ❌ nếu không tick checkbox nào
            // → Tabulator đã tự update đúng dòng đang edit
          },
        },
        {
          title: 'Đơn vị',
          field: 'UnitName',
          editor: 'input',

          cellEdited: (cell) => {
            const table = cell.getTable();
            const selectedRows = table.getSelectedRows();
            const newUnit = cell.getValue();

            // 👉 CHỈ bulk update khi có checkbox được tick
            if (selectedRows.length > 0) {
              selectedRows.forEach((row) => {
                row.update({ UnitName: newUnit });
              });
              table.deselectRow();
            }
            // ❌ nếu không tick checkbox nào
            // → Tabulator đã tự update đúng dòng đang edit
          },
        },

        {
          title: 'Trạng thái nhận',
          field: 'StatusReceive',
          hozAlign: 'center',
          formatter: (cell) => {
            const checked = cell.getValue() === 1 ? 'checked' : '';
            return `<input type="checkbox" ${checked} />`;
          },
          cellClick: (e, cell) => {
            const newVal = cell.getValue() === 1 ? 0 : 1;
            cell.setValue(newVal, true);
          },
          cellEdited: (cell) => {
            const table = cell.getTable();
            const selectedRows = table.getSelectedRows();
            const newUnit = cell.getValue();

            // 👉 CHỈ bulk update khi có checkbox được tick
            if (selectedRows.length > 0) {
              selectedRows.forEach((row) => {
                row.update({ StatusReceive: newUnit });
              });
              table.deselectRow();
            }
            // ❌ nếu không tick checkbox nào
            // → Tabulator đã tự update đúng dòng đang edit
          },
        },
      ],
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
        IsDeleted: false,
        Quantity: 1,
        UnitName: '',
        ContentReceive: '',
      });
    }
  }
  openChooseEmployee() {
    if (!this.detailTable) {
      console.warn('Detail table not initialized');
      return;
    }
    const selectedEmployeeIds = new Set(
      this.detailTable
        .getData()
        .map((r: any) => r.EmployeeID)
        .filter((id: number) => id > 0)
    );

    // 🔹 Lọc employee chưa được chọn
    const availableEmployees = this.employeeList.filter(
      (emp) => !selectedEmployeeIds.has(emp.ID)
    );
    const modalRef = this.modalService.open(ChooseEmployeeComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
      windowClass: 'second-modal-window', // Thêm class tùy chỉnh
    });

    modalRef.componentInstance.employeeList = availableEmployees;
    //    modalRef.componentInstance.selectedEmployeeIds = currentEmployeeIds;
    modalRef.result.then(
      (selectedEmployees: any[]) => {
        if (!this.detailTable || !selectedEmployees?.length) return;

        const masterID = this.formMaster.get('ID')?.value || 0;

        // 🔹 Lấy danh sách EmployeeID đã có
        const existingIds = new Set(
          this.detailTable
            .getData()
            .map((r: any) => r.EmployeeID)
            .filter((id: number) => id > 0)
        );

        // 🔹 Map employee được chọn → row detail
        const newRows = selectedEmployees
          .filter((emp) => !existingIds.has(emp.ID)) // chống trùng (dù đã lọc từ trước)
          .map((emp) => ({
            ID: 0,
            EmployeeCode: emp.Code,
            EmployeeName: emp.FullName,
            EmployeeID: emp.ID,
            PhasedAllocationPersonID: masterID,
            DepartmentName: emp.DepartmentName,
            DateReceive: null,
            StatusReceive: 0,
            IsDeleted: false,
            Quantity: 1,
            UnitName: '',
            ContentReceive: '',
          }));

        if (newRows.length) {
          this.detailTable.addData(newRows);
        }
      },
      () => {
        // dismissed
      }
    );
  }

  async saveData() {
    // 1. Validate form master
    if (this.formMaster.invalid) {
      Object.values(this.formMaster.controls).forEach((c) => {
        if (c.invalid) {
          c.markAsTouched();
          c.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(
        'Cảnh báo',
        'Vui lòng điền đầy đủ thông tin bắt buộc'
      );
      return;
    }

    // 2. Lấy dữ liệu chi tiết trên bảng
    const tableRows = this.detailTable ? this.detailTable.getData() : [];

    // // 2.1. Bắt buộc phải có ít nhất 1 dòng chi tiết
    // if (!tableRows || tableRows.length === 0) {
    //   this.notification.warning(
    //     'Cảnh báo',
    //     'Vui lòng thêm ít nhất 1 nhân viên'
    //   );
    //   return;
    // }

    // 2.2. Check từng dòng: EmployeeCode không được để trống
    const invalidIndex = tableRows.findIndex(
      (row: any) =>
        !row.IsDeleted &&
        (!row.EmployeeCode || row.EmployeeCode.toString().trim() === '')
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
        const employee = this.employeeList.find(
          (emp: any) => emp.Code === row.EmployeeCode
        );
        if (!employee) {
          invalidEmployees.push(
            `Dòng ${idx + 1}: Mã nhân viên [${row.EmployeeCode}] không tồn tại`
          );
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
      ContentAllocation: formValue.Name,
      YearValue: formValue.Year,
      MontValue: formValue.Month,
      TypeAllocation: formValue.TypeAllocation,
      IsDeleted: formValue.IsDeleted || false,
      StatusAllocation: formValue.StatusAllocation || 0,
    };

    this.phaseAllocationService.saveData(masterPayload).subscribe({
      next: (masterResponse) => {
        if (masterResponse && masterResponse.status === 1) {
          const savedMaster = masterResponse.data;
          const masterID = savedMaster?.ID || formValue.ID || 0;

          // 4. Lưu detail
          const allRows = [...tableRows, ...this.deletedRows];

          const detailPayload = allRows.map((row: any) => ({
            ID: row.ID,
            EmployeeID: row.EmployeeID,
            PhasedAllocationPersonID: masterID,
            StatusReceive: row.StatusReceive,
            Quantity: parseInt(row.Quantity, 10) || 0,
            UnitName: row.UnitName,
            ContentReceive: row.ContentReceive,
            IsDeleted: row.IsDeleted,
          }));
          console.log(detailPayload);
          if (detailPayload.length > 0) {
            this.phaseAllocationService
              .saveDataDetail(detailPayload)
              .subscribe({
                next: (detailResponse) => {
                  if (detailResponse && detailResponse.status === 1) {
                    this.notification.success(
                      NOTIFICATION_TITLE.success,
                      detailResponse.message || 'Cập nhật dữ liệu thành công'
                    );
                    this.activeModal.close();
                  } else {
                    this.notification.warning(
                      NOTIFICATION_TITLE.warning,
                      detailResponse?.message || 'Có lỗi khi lưu chi tiết'
                    );
                  }
                },
                error: (res: any) => {
                  console.error('Lỗi khi lưu chi tiết:', res);
                  this.notification.error(
                    NOTIFICATION_TITLE.error,
                    res.error?.message || 'Lỗi khi lưu chi tiết'
                  );
                },
              });
          } else {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              'Cập nhật dữ liệu thành công'
            );
            this.activeModal.close();
          }
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            masterResponse?.message || 'Lỗi khi lưu master'
          );
        }
      },
      error: (res: any) => {
        console.error('Lỗi khi lưu master:', res);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          res.error?.message || 'Lỗi khi lưu dữ liệu'
        );
      },
    });
  }
}
