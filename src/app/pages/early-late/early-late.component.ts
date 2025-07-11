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
import { EmployeeService } from '../employee/employee-service/employee.service';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { EarlyLateService } from './early-late-service/early-late.service';
import { DepartmentServiceService } from '../department/department-service/department-service.service';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-early-late',
  templateUrl: './early-late.component.html',
  styleUrls: ['./early-late.component.css'],
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
    NzTimePickerModule,
    NzSpinModule,
    NgIf
  ]
})
export class EarlyLateComponent implements OnInit, AfterViewInit{

  private tabulator!: Tabulator;
  sizeSearch: string = '0';
  searchForm!: FormGroup;
  earlyLateForm!: FormGroup;
  departmentList: any[] = [];
  earlyLateList: any[] = [];
  employeeList: any[] = [];
  approverList: any[] = [];

  selectedEarlyLate: any = null;

  isLoading = false;
  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private earlyLateService: EarlyLateService,
    private departmentService: DepartmentServiceService,
    private employeeService: EmployeeService
  ) { }

  ngOnInit() {
    this.initializeForm();
    this.loadDepartment();
    this.loadEarlyLate();
    this.loadApprovers();
    this.loadEmployee();
  }
  ngAfterViewInit(): void {
    this.initializeTable();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  loadDepartment() {
    this.departmentService.getDepartments().subscribe({
      next: (data) => {
        this.departmentList = data.data;
      },
      error: (error) => {
        this.notification.error("Lỗi", "Lỗi tải danh sách phòng ban");
      }
    })
  }

  loadEarlyLate() {
    this.isLoading = true;
    this.earlyLateService.getEmployeeEarlyLate(this.searchForm.value).subscribe({
      next: (data) => {
        this.earlyLateList = data.data;
        this.tabulator.setData(this.earlyLateList);
        this.isLoading = false;
      }
    })
  }

  loadEmployee() {
    this.employeeService.getAllEmployee().subscribe({
      next: (data) => {
        this.employeeList = data.data;
      },
      error: (error) => {
        this.notification.error("Lỗi", "Lỗi tải danh sách nhân viên");
      }
    })
  }

  loadApprovers() {
    this.employeeService.getEmployeeApprove().subscribe({
      next: (data) => {
        this.approverList = data.data;
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi khi tải danh sách người duyệt: ' + error.message);
      }
    })
  }

  private initializeForm(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    this.searchForm = this.fb.group({
      month: [currentMonth, [Validators.required, Validators.min(1), Validators.max(12)]],
      year: [currentYear, [Validators.required, Validators.min(1), Validators.max(3000)]],
      departmentId: 0,
      status: -1,
      keyWord: '',
      pageNumber: 1,
      pageSize: 1000000,
      IDApprovedTP: 0
    });

    this.earlyLateForm = this.fb.group({
      ID: [0],
      EmployeeID: [null, Validators.required],
      ApprovedTP: [null, Validators.required],
      DateRegister: [new Date(), Validators.required],
      DateStart: [new Date(), Validators.required],
      DateEnd: [new Date(), Validators.required],
      Type: [1, Validators.required],
      Reason: ['', Validators.required],
      ReasonHREdit: [''],
    })

  }
  private initializeTable(): void { 
    this.tabulator = new Tabulator('#tb_early_late', {
      data: this.earlyLateList,
      layout: 'fitColumns',
      selectableRows: true,
      height: '85vh',
      rowHeader: {
        formatter: "rowSelection", 
        titleFormatter: "rowSelection", 
        headerSort: false, 
        width: 100, 
        frozen: true, 
        headerHozAlign: "center", 
        hozAlign: "center"
      },
      rowContextMenu: [
        {
          label: "TBP hủy duyệt hủy đăng ký",
          action: () => {
            
          }
        },
        {
          label: "HR hủy duyệt hủy đăng ký",
          action: () => {

          }
        }
      
      ],
      groupBy: 'DepartmentName',
      groupHeader: function(value, count, data, group){
        return value + "<span style='color:#d00; margin-left:10px;'>(" + count + " nhân viên)</span>";
      },
      columns: [
        {
          title: 'TBP duyệt', field: 'StatusText', hozAlign:'center',headerHozAlign:'center', width: 110
        },
        {
          title: 'HR duyệt', field: 'StatusHRText', hozAlign:'center',headerHozAlign:'center', width: 110
        },
        {
          title: 'Mã nhân viên', field: 'Code', hozAlign:'left',headerHozAlign:'center', width: 140
        },
        {
          title: 'Tên nhân viên', field: 'FullName', hozAlign:'left',headerHozAlign:'center', width: 200
        },
        {
          title: 'Người duyệt', field: 'ApprovedName', hozAlign:'left',headerHozAlign:'center', width: 200
        },
        {
          title: 'Bổ sung', field: 'IsProblem', hozAlign:'center',headerHozAlign:'center', width: 80,
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} />`;
          },
        },
        {
          title: 'Ngày', field: 'DateRegister', hozAlign:'center',headerHozAlign:'center', width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },
        {
          title: 'Từ', field: 'DateStart', hozAlign:'center',headerHozAlign:'center', width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('HH:mm dd/MM/yyyy') : '';
          }
        },
        {
          title: 'Đến', field: 'DateEnd', hozAlign:'center',headerHozAlign:'center', width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('HH:mm dd/MM/yyyy') : '';
          }
        },
        {
          title: 'Số phút', field: 'TimeRegister', hozAlign:'right',headerHozAlign:'center', width: 100
        },
        {
          title: 'Loại', field: 'TypeText', hozAlign:'left',headerHozAlign:'center', width: 150
        },
        {
          title: 'Lý do', field: 'Reason', hozAlign:'left',headerHozAlign:'center', width: 300
        },
        {
          title: 'Lý do sửa', field: 'ReasonHREdit', hozAlign:'left',headerHozAlign:'center', width: 300
        },
        {
          title: 'Lý do không đồng ý duyệt', field: 'ReasonDeciline', hozAlign:'left',headerHozAlign:'center', width: 300
        }
      ],
      pagination: true,
      paginationSize: 100,
      paginationSizeSelector: [10, 20, 50, 100]
    });
  }

  openAddModal() {
    this.earlyLateForm.reset({
      ID: 0,
      EmployeeID: null,
      ApprovedTP: null,
      DateStart: new Date(),
      DateEnd: new Date(),
      Type: 1,
      DateRegister: new Date(),
      Reason: '',
      ReasonHREdit: ''
    });
    this.earlyLateForm.get('EmployeeID')?.enable();
    this.earlyLateForm.get('ApprovedTP')?.enable();
    // Reset validation cho ReasonHREdit khi thêm mới
    this.earlyLateForm.get('ReasonHREdit')?.clearValidators();
    this.earlyLateForm.get('ReasonHREdit')?.updateValueAndValidity();
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addEarlyLateModal'));
    modal.show();
  }

  openEditModal() {
      const selectedRows = this.tabulator.getSelectedRows();
      if (selectedRows.length === 0) {
        this.notification.warning('Cảnh báo', 'Vui lòng chọn đăng ký đi muộn - về sớm cần sửa');
        return;
      }

      if (
        (selectedRows.length > 0 && selectedRows[0].getData()['IsApprovedTP'] === true && selectedRows[0].getData()['IsApproved'] === true)
      ) {
        this.notification.warning('Cảnh báo', 'Đăng ký đã được duyệt. Vui lòng hủy duyệt trước khi sửa!');
        return;
      }

      this.selectedEarlyLate = selectedRows[0].getData();
      this.earlyLateForm.patchValue({
        ID: this.selectedEarlyLate.ID,
        EmployeeID: this.selectedEarlyLate.EmployeeID,
        ApprovedTP: this.selectedEarlyLate.ApprovedTP,
        DateStart: this.selectedEarlyLate.DateStart,
        DateEnd: this.selectedEarlyLate.DateEnd,
        DateRegister: this.selectedEarlyLate.DateRegister,
        Type: this.selectedEarlyLate.Type,
        Reason: this.selectedEarlyLate.Reason,
        ReasonHREdit: this.selectedEarlyLate.ReasonHREdit
      })

      this.earlyLateForm.get('EmployeeID')?.disable();
      this.earlyLateForm.get('ApprovedTP')?.disable();

      this.earlyLateForm.get('ReasonHREdit')?.setValidators([Validators.required]);
      this.earlyLateForm.get('ReasonHREdit')?.updateValueAndValidity();

      const modal = new (window as any).bootstrap.Modal(document.getElementById('addEarlyLateModal'));
      modal.show();
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn ngày đăng ký cần xóa');
      return;
    }

    if (
      (selectedRows.length > 0 && selectedRows[0].getData()['IsApprovedTP'] === true && selectedRows[0].getData()['IsApproved'] === true)
    ) {
      this.notification.warning('Cảnh báo', 'Đăng ký đã được duyệt. Vui lòng hủy duyệt trước khi xóa!');
      return;
    }

    
    this.modal.confirm({
      nzTitle: "Xác nhận xóa",
      nzContent: `Bạn có chắc chắn muốn xóa danh sách ngày đã đăng ký này không?`,
      nzOkText:"Xóa",
      nzOkType:'primary', 
      nzOkDanger: true,
      nzOnOk: () => {
        for(let row of selectedRows) {
          let selectedEarlyLate = row.getData();
          this.earlyLateService.saveEmployeeEarlyLate({
            ...selectedEarlyLate,
            IsDeleted: true
          }).subscribe({
            next: (response) => {
              this.notification.success('Thành công', 'Xóa ngày đã đăng ký thành công');
              this.loadEarlyLate();
            },
            error: (error) => {
              this.notification.error('Lỗi', 'Xóa ngày đã đăng ký thất bại: ' + error.message);
            }
          });
        }
      },
      nzCancelText: 'Hủy'
    });
  }

  async exportToExcel() {

    //Nhóm dữ liệu theo phòng ban
    const grouped = this.earlyLateList.reduce((acc: any,  item: any) => {
      const dept = item.DepartmentName || 'Không xác định';
      if(!acc[dept]) acc[dept] = [];
      acc[dept].push(item);
      return acc;
    }, {});

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('KhaiBaoDiMuonVeSom');

    const columns = [
      { header: '', key: 'TBP duyệt', width: 20 }, 
      { header: '', key: 'HR duyệt', width: 20 },
      { header: '', key: 'Mã nhân viên', width: 15 },
      { header: '', key: 'Tên nhân viên', width: 30 },
      { header: '', key: 'Người duyệt', width: 30 },
      { header: '', key: 'Bổ sung', width: 10},
      { header: '', key: 'Ngày', width: 15 },
      { header: '', key: 'Từ', width: 10 },
      { header: '', key: 'Đến', width: 10 },
      { header: '', key: 'Số phút', width: 10 },
      { header: '', key: 'Loại', width: 15 },
      { header: '', key: 'Lý do', width: 30 },
      { header: '', key: 'Lý do sửa', width: 30 },
      { header: '', key: 'Lý do hủy', width: 30 }
    ]

    worksheet.columns = columns;

        //Thêm header một lần ở đầu file
        const headerRow = worksheet.addRow(columns.map(col => col.key)); 
        headerRow.eachCell((cell: ExcelJS.Cell) => {
          cell.font = { name: 'Tahoma', size: 10, bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9D9D9' }
          };
        });
        headerRow.height = 30;
        
        let rowIndex = 2; // Bắt đầu sau header
        for (const dept in grouped) {
          // Thêm dòng tiêu đề phòng ban
          const deptRow = worksheet.addRow([dept, '', '', '']);
          deptRow.font = { name: 'Tahoma', size: 9, bold: true };
          deptRow.alignment = { horizontal: 'left', vertical: 'middle' };
          deptRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFB7DEE8' }
          };
          deptRow.height = 25;
          // worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
          // rowIndex++;
      
          // Thêm dữ liệu nhân viên
          grouped[dept].forEach((item: any) => {
            const safe = (val: any) => (val && typeof val === 'object' && Object.keys(val).length === 0 ? '' : val);
            const formatDate = (val: any) => val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
            const formatHour = (val: any) => val ? DateTime.fromISO(val).toFormat('HH:mm') : '';
            const row = worksheet.addRow({
              'TBP duyệt': safe(item.StatusText),
              'HR  duyệt': safe(item.StatusHRText),
              'Mã nhân viên': safe(item.Code),
              'Tên nhân viên': safe(item.FullName),
              'Người duyệt': safe(item.ApprovedName),
              'Bổ sung': safe(item.IsProblem),
              'Ngày': safe(formatDate(item.DateRegister)),
              'Từ': safe(formatHour(item.DateStart)),
              'Đến': safe(formatHour(item.DateEnd)),
              'Số phút': safe(item.TimeRegister),
              'Loại': safe(item.TypeText),
              'Lý do': safe(item.Reason),
              'Lý do sửa': safe(item.ReasonHREdit),
              'Lý do hủy': safe(item.ReasonCancel),
            });
            row.eachCell((cell: ExcelJS.Cell) => {
              cell.font = { name: 'Tahoma', size: 10 };
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            });
            row.height = 40;
            rowIndex++;
          });
        }
      
        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `KhaiBaoDiMuonVeSom.xlsx`);   
  }

  closeModal() {
    const modal = document.getElementById('addEarlyLateModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
    this.earlyLateForm.reset();
    // Reset validation cho ReasonHREdit
    this.earlyLateForm.get('ReasonHREdit')?.clearValidators();
    this.earlyLateForm.get('ReasonHREdit')?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.earlyLateForm.invalid) {
      Object.values(this.earlyLateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    let formData = { ...this.earlyLateForm.value };

    // Log input values for debugging
    console.log('Raw StartDate:', formData.DateStart);
    console.log('Raw EndDate:', formData.DateEnd);

    // Validate StartDate and EndDate
    const startDate = new Date(formData.DateStart);
    const endDate = new Date(formData.DateEnd);

    if (isNaN(startDate.getTime())) {
      this.notification.error('Lỗi', 'Ngày bắt đầu không hợp lệ. Vui lòng kiểm tra lại.');
      this.earlyLateForm.get('StartDate')?.markAsTouched();
      return;
    }

    if (isNaN(endDate.getTime())) {
      this.notification.error('Lỗi', 'Ngày kết thúc không hợp lệ. Vui lòng kiểm tra lại.');
      this.earlyLateForm.get('EndDate')?.markAsTouched();
      return;
    }

    // Convert to UTC ISO strings
    const startDateObj = new Date(Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
      startDate.getUTCHours() + 7,
      startDate.getUTCMinutes()
    ));
    const endDateObj = new Date(Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
      endDate.getUTCHours() + 7,
      endDate.getUTCMinutes()
    ));

    formData.DateStart = startDateObj.toISOString();
    formData.DateEnd = endDateObj.toISOString();
    formData.TimeRegister = endDateObj.getTime() - startDateObj.getTime(); // Duration in milliseconds
    formData.IsDeleted = false;

    if (formData.ID && formData.ID > 0) {
      formData.IsApprovedHR = false;
      formData.IsApprovedTP = false;
    }

    if (formData.ID && formData.ID > 0) {
      if (!formData.ReasonHREdit || formData.ReasonHREdit.trim() === '') {
        this.notification.warning('Cảnh báo', 'Khi sửa thông tin ngày đăng ký, vui lòng nhập lý do sửa');
        this.earlyLateForm.get('ReasonHREdit')?.markAsTouched();
        return;
      }
    }

    // Log final formData for debugging
    console.log('Form Data:', JSON.stringify(formData));

    this.earlyLateService.saveEmployeeEarlyLate(formData).subscribe({
      next: () => {
        this.notification.success('Thành công', 'Lưu đăng ký thành công');
        this.closeModal();
        this.loadEarlyLate();
      },
      error: (response) => {
        this.notification.error('Lỗi', 'Lưu đăng ký thất bại: ' + response.error.message);
      },
    });
  }

  resetSearch() {
    this.initializeForm();
    this.loadEarlyLate();
  }

  isApproveTBP() {
    const selectedRows = this.tabulator.getSelectedRows();
    if(selectedRows.length == 0) {
      this.notification.warning("Thông báo", "Vui lòng chọn nhân viên để duyệt");
      return ;
    } 

    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn duyệt danh sách nhân viên đã chọn không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        for(let row of selectedRows) {
          const data = row.getData();
          let departmentId = data['DepartmentID'];
          let employeeName = data['FullName'];
          let approvedTP = data['ApprovedTP'];
          if(departmentId == 0) continue;
  
          // if (!Global.IsAdmin)
          //   {
          //       if (departmentId != Global.DepartmentID && Global.DepartmentID != 1)
          //       {
          //           MessageBox.Show($"Nhân viên [{employeeName}] không thuộc phòng [{Global.DepartmentName.ToUpper()}].\nVui lòng kiểm tra lại!", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
          //           return;
          //       }
          //       if (ApprovedTP != Global.EmployeeID)
          //       {
          //           MessageBox.Show($"Bạn không thể duyệt cho nhân viên thuộc nhóm khác.\nVui lòng kiểm tra lại!", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
          //           return;
          //       }
          //   }
  
          let id = data['ID'];
          if(id == 0) continue;
          let isApprovedTP = data['IsApprovedTP'];
          if(isApprovedTP) continue;
        
              this.earlyLateService.saveEmployeeEarlyLate({
                ...data,
                IsApprovedTP: true
              }).subscribe({
                next: (response) => {
                  this.notification.success('Thành công', 'TBP duyệt khai báo thành công');
                  this.loadEarlyLate();
                },
                error: (error) => {
                  this.notification.error('Thất bại', 'TBP duyệt khai báo thất bại' + error.message);
                }
              })
        }
      }
    });
  }


  isApproveHR() {
    const selectedRows = this.tabulator.getSelectedRows();
    if(selectedRows.length <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên cần duyệt');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn duyệt danh sách nhân viên đã chọn không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        for(let row of selectedRows) {
          const data = row.getData();
          let id = data['ID'];
          if(id == 0) continue;
    
          let isApprovedTP = data['IsApprovedTP'];
          if(!isApprovedTP) {
            this.notification.warning('Thông báo', 'TBP chưa duyệt. Vui lòng kiểm tra lại!');
            return;
          }
    
          this.earlyLateService.saveEmployeeEarlyLate({
            ...data,
            IsApproved: true
          }).subscribe({
            next: (response) => {
              this.notification.success('Thành công', 'HR duyệt khai báo thành công');
              this.loadEarlyLate();
            },
            error: (error) => {
              this.notification.error('Thất bại', 'HR duyệt khai báo thất bại' + error.message);
            }
          })
    
        }
      }
    });

  }

  isDisapproveHR() {
    const selectedRows = this.tabulator.getSelectedRows();
    if(selectedRows.length <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên cần duyệt');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn duyệt danh sách nhân viên đã chọn không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        for(let row of selectedRows) {
          const data = row.getData();
          let id = data['ID'];
          if(id == 0) continue;
    
    
          this.earlyLateService.saveEmployeeEarlyLate({
            ...data,
            IsApproved: false
          }).subscribe({
            next: (response) => {
              this.notification.success('Thành công', 'HR hủy duyệt khai báo thành công');
              this.loadEarlyLate();
            },
            error: (error) => {
              this.notification.error('Thất bại', 'HR hủy duyệt khai báo thất bại' + error.message);
            }
          })
    
        }
      }
    });
  }
}
