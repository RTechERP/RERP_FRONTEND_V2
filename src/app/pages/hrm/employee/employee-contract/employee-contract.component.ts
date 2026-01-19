import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
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
import { EmployeeService } from '../employee-service/employee.service';
import { ContractServiceService } from '../../contract/contract-service/contract-service.service';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { DateTime } from 'luxon';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { ProjectService } from '../../../project/project-service/project.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-employee-contract',
  templateUrl: './employee-contract.component.html',
  styleUrls: ['./employee-contract.component.css'],
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
    FormsModule,
    NzDatePickerModule
  ]
})
export class EmployeeContractComponent implements OnInit, OnChanges {

  private tabulatorEmployeeContract!: Tabulator;
  @Input() selectedEmployee: any;
  employeeId: any = null;
  contractType: any = 0;
  employeeList: any[] = [];
  contractTypeList: any[] = [];
  employeeContractList: any[] = [];
  employeeContractForm!: FormGroup;
  employeeContractSearchForm!: FormGroup;
  selectedContract: any = null;
  isPrinting: boolean = false;

  readonly INDEFINITE_CONTRACT_TYPE_ID = 5;
  isDateEndRequired: boolean = true;

  contractId: any = 0;
  keyword: any = '';

  constructor(
    private employeeService: EmployeeService,
    private contractService: ContractServiceService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private projectService: ProjectService
  ) {

  }

  private initForm() {
    this.employeeContractForm = this.fb.group({
      STT: [''],
      ID: [0],
      EmployeeID: ['', Validators.required],
      EmployeeLoaiHDLDID: ['', Validators.required],
      DateStart: ['', Validators.required],
      DateEnd: ['', Validators.required],
      ContractNumber: ['', Validators.required],
      StatusSign: [1],
      DateSign: [''],
      IsDelete: false
    });

    this.employeeContractForm.get('EmployeeLoaiHDLDID')?.valueChanges.subscribe((contractTypeId: number | null) => {
      this.onContractTypeChange(contractTypeId);
    });

    this.onContractTypeChange(this.employeeContractForm.get('EmployeeLoaiHDLDID')?.value);
  }

  initFormSearch() {
    this.employeeContractSearchForm = this.fb.group({
      employee: [this.selectedEmployee?.ID || null],
      contractType: [0],
      filter: ['']
    });
  }

  ngOnInit() {
    this.loadEmployees();
    this.loadContractType();
    this.initializeTable();
    this.initForm();
    this.initFormSearch();

    if (this.selectedEmployee?.ID) {
      this.employeeId = this.selectedEmployee.ID;
      this.loadEmployeeContract(this.selectedEmployee.ID);
    }

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedEmployee'] && this.selectedEmployee?.ID) {
      this.loadEmployeeContract(this.selectedEmployee.ID);
    }
  }

  onContractTypeChange(contractTypeId: number | null) {
    const dateEndControl = this.employeeContractForm?.get('DateEnd');
    if (!dateEndControl) {
      return;
    }

    const isIndefinite = contractTypeId === this.INDEFINITE_CONTRACT_TYPE_ID;
    this.isDateEndRequired = !isIndefinite;

    if (isIndefinite) {
      dateEndControl.clearValidators();
      dateEndControl.setValue(null, { emitEvent: false });
    } else {
      dateEndControl.setValidators([Validators.required]);
    }

    dateEndControl.updateValueAndValidity({ emitEvent: false });
  }

  // loadEmployees() {
  //   this.employeeService.getEmployees().subscribe({
  //     next: (data) => {
  //       // Format employee data for select options
  //       this.employeeList = data.data.map((employee: any) => ({
  //         ID: Number(employee.ID),
  //         FullName: `${employee.Code} - ${employee.FullName}`,
  //         ...employee
  //       }));
  //       this.initFormSearch();
  //     },
  //     error: (error) => {
  //       this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
  //     }
  //   });
  // }

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

  loadContractType() {
    this.contractService.getContracts().subscribe({
      next: (data) => {
        this.contractTypeList = data.data;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách loại hợp đồng: ' + error.message);
      }
    })
  }

  loadEmployeeContract(employeeID: number) {
    if (this.employeeId != employeeID) this.employeeId = employeeID;
    this.employeeService.getEmployeeContract(employeeID).subscribe({
      next: (data: any) => {
        this.employeeContractList = data.data.map((item: any, index: number) => ({
          ...item,
          STT: index + 1
        }));
        this.tabulatorEmployeeContract.setData(this.employeeContractList);
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải hợp đồng nhân viên: ' + error.message);
      }
    });
  }

  openAddModal() {
    this.employeeContractForm.reset();
    let stt = this.employeeContractList.length + 1;
    this.employeeContractForm.patchValue({
      ID: 0,
      STT: stt,
      EmployeeID: this.employeeId,
      StatusSign: 1,
      DateStart: new Date().toISOString().split('T')[0],
      DateEnd: new Date().toISOString().split('T')[0],
      DateSign: new Date().toISOString().split('T')[0],
      IsDelete: false
    });

    const modal = new (window as any).bootstrap.Modal(document.getElementById('addEmployeeContractModal'));
    modal.show();
  }

  openEditModal() {
    const selectedRows = this.tabulatorEmployeeContract.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn hợp đồng lao động cần chỉnh sửa');
      return;
    }
    this.selectedContract = selectedRows[0].getData();
    if (this.selectedContract.IsDelete) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Hợp đồng đã xóa không được sửa!');
      return;
    }
    this.employeeContractForm.patchValue({
      ID: this.selectedContract.ID,
      STT: this.selectedContract.STT,
      EmployeeID: this.employeeId,
      EmployeeLoaiHDLDID: this.selectedContract.EmployeeLoaiHDLDID,
      DateStart: this.selectedContract.DateStart,
      DateEnd: this.selectedContract.DateEnd,
      ContractNumber: this.selectedContract.ContractNumber,
      StatusSign: this.selectedContract.StatusSign,
      DateSign: this.selectedContract.DateSign,
      IsDelete: this.selectedContract.IsDelete
    });
    const modalEl = document.getElementById('addEmployeeContractModal');
    if (modalEl) {
      let modalInstance = (window as any).bootstrap.Modal.getInstance(modalEl);
      if (!modalInstance) {
        // Nếu chưa có instance thì tạo mới
        modalInstance = new (window as any).bootstrap.Modal(modalEl);
      }
      modalInstance.show();
    }
  }

  private initializeTable(): void {
    this.tabulatorEmployeeContract = new Tabulator('#tb_employee_contract', {
      data: this.employeeContractList,
      layout: 'fitColumns',
      responsiveLayout: true,
      selectableRows: 1,
      groupBy: 'FullName',
      rowContextMenu: [
        {
          label: "In hợp đồng",
          action: () => {
            this.printContract();
          }
        },
      ],
      groupHeader: function (value, count, data, group) {
        return (
          value ?? 'Không có thông tin' +
          "<span style='color:#d00; margin-left:10px;'>(" +
          count +
          ' hd)</span>'
        );
      },

      height: '70vh',
      columns: [
        {
          title: "STT",
          field: "STT",
          hozAlign: "center",
          headerHozAlign: "center",
          frozen: true,
          formatter: function (cell) {
            const row = cell.getRow();
            const group = row.getGroup();

            if (group) {
              const rowsInGroup = group.getRows();
              const indexInGroup = rowsInGroup.indexOf(row);
              return String(indexInGroup + 1);
            } else {
              return String(row.getTable().getRows().indexOf(row) + 1);
            }
          },
        },
        { title: 'Loại HĐLĐ', field: 'LoaiHDLD', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Số hợp đồng', field: 'ContractNumber', hozAlign: 'left', headerHozAlign: 'center' },
        {
          title: 'Ngày bắt đầu', field: 'DateStart', hozAlign: 'center', headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },
        {
          title: 'Ngày kết thúc', field: 'DateEnd', hozAlign: 'center', headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },
        { title: 'Trạng thái', field: 'StatusSignText', hozAlign: 'left', headerHozAlign: 'center' },
        {
          title: 'Ngày ký', field: 'DateSign', hozAlign: 'center', headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },
      ],
      rowFormatter: function (row) {

        var data = row.getData();

        if (data['IsDelete'] == 1) {
          row.getElement().style.backgroundColor = 'red';
          row.getElement().style.color = 'white';
        }
      },
    });

    this.tabulatorEmployeeContract.on('rowClick', (e: any, row: any) => {
      this.tabulatorEmployeeContract.deselectRow();
      row.select();
    });
  }

  onSubmit() {
    if (this.employeeContractForm.invalid) {
      Object.keys(this.employeeContractForm.controls).forEach(key => {
        const control = this.employeeContractForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity();
        }
      });
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const formData = this.employeeContractForm.value;
    this.employeeService.saveEmployeeContract(formData).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật hợp đồng lao động thành công');
        this.closeModal();
        this.loadEmployeeContract(this.selectedEmployee.ID);
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Cập nhật phòng ban thất bại: ' + error.message);
      }
    });
  }

  closeModal() {
    const modal = document.getElementById('addEmployeeContractModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
    this.employeeContractForm.reset();
  }


  openDeleteModal() {
    const selectedRows = this.tabulatorEmployeeContract.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn hợp đồng lao động cần xóa');
      return;
    }

    const selectedEmployeeContract = selectedRows[0].getData();
    this.modal.confirm({
      nzTitle: "Xác nhận xóa",
      nzContent: `Bạn có chắc chắn muốn xóa hợp đồng lao động này không?`,
      nzOkText: "Xóa",
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.employeeService.saveEmployeeContract({
          ...selectedEmployeeContract,
          IsDelete: true
        }).subscribe({
          next: (response) => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa hợp đồng lao động thành công');
            this.loadEmployeeContract(this.selectedEmployee.ID);
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Xóa hợp đồng lao động thất bại: ' + error.message);
          }
        });
      },
      nzCancelText: 'Hủy'
    });
  }

  async onSearch() {
    if (this.employeeId == null || this.employeeId <= 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn nhân viên!');
      return;
    }
    this.employeeService.filterEmployeeContract(
      this.employeeId ?? 0,
      this.contractType ?? 0,
      this.keyword ?? ''
    ).subscribe({
      next: (data: any) => {

        this.employeeContractList = Array.isArray(data.data) ? data.data : [data.data];
        this.initializeTable();
        // this.tabulatorEmployeeContract.setData(data.data);
      },
      error: (error) => {
        console.error('Error searching employee contracts:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tìm kiếm hợp đồng lao động');
      }
    });
  }

  printContract() {
    let selectedRows = this.tabulatorEmployeeContract.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn hợp đồng lao động cần in');
      return;
    }

    const selectedContract = selectedRows[0].getData();


    this.isPrinting = true;

    this.employeeService.printContract(selectedContract['ID']).subscribe({
      next: (response: any) => {

        if (response && response.data) {
          console.log(response.data);
          const contractResponse = Array.isArray(response.data) ? response.data[0] : response.data;
          const contractRequest = {
            // ===== Thông tin hợp đồng =====
            ID: contractResponse.ID,
            EmployeeID: contractResponse.EmployeeID,
            EmployeeLoaiHDLDID: contractResponse.EmployeeLoaiHDLDID,
            ContractNumber: contractResponse.ContractNumber,
            DateContract: contractResponse.DateContract,
            FullName: contractResponse.FullName,
            DateOfBirth: contractResponse.BirthOfDate,
            CCCD_CMND: contractResponse.SoCMTND,
            IssuedBy: contractResponse.NoiCap,
            Address: contractResponse.DcThuongTru,
            PhoneNumber: contractResponse.SDTCaNhan,
            Sex: contractResponse.Sex,
            Nationality: contractResponse.QuocTich,
            DateRange: contractResponse.NgayCap,
            ContractType: contractResponse.LoaiHDLD,
            ContractDuration: contractResponse.ContractDuration,
            Position: contractResponse.Position,
            Department: contractResponse.DepartmentName,
            Salary: contractResponse.MucDongBHXHHienTai,
            NotificationDate: contractResponse.NotificationDate,

            // ===== Thông tin công ty (BỔ SUNG) =====
            CompanyNameHeader: contractResponse.CompanyName,
            COMPANYCODE: contractResponse.COMPANYCODE,
            CompanyName: contractResponse.CompanyName,
            TaxCodeCom: contractResponse.TaxCodeCom,
            AddressCom: contractResponse.AddressCom,
            PhoneNumberCom: contractResponse.PhoneNumberCom,
            DirectorCom: contractResponse.DirectorCom,
            PositionCom: contractResponse.PositionCom
          };

          // 2. Gửi dữ liệu sang API generate để lấy file Word
          this.employeeService.generateWordDocument(contractRequest).subscribe({
            next: (fileBlob: Blob) => {
              // 3. Tải file về
              const contractNumber = contractResponse.ContractNumber?.replace('/', '');
              const contractTypeId = selectedContract['EmployeeLoaiHDLDID'];
              let fileName = contractNumber;
              if (contractTypeId === 4) fileName += '_12T';
              fileName += '.docx';

              const url = window.URL.createObjectURL(fileBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);

              this.notification.success(NOTIFICATION_TITLE.success, 'In hợp đồng lao động thành công');
              this.isPrinting = false;
            },
            error: (err) => {
              this.isPrinting = false;
              this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tạo file Word: ' + err.message);
            }
          });
        } else {
          this.isPrinting = false;
          this.notification.error(NOTIFICATION_TITLE.error, 'Không nhận được dữ liệu hợp đồng từ server');
        }
      },
      error: (error) => {
        this.isPrinting = false;
        console.error('Error printing contract:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể in hợp đồng lao động: ' + error.message);
      }
    });
  }
  async exportExcel() {
    let data = this.tabulatorEmployeeContract.getData();
    if (data == null) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất excel!');
      return;
    }
    let date = DateTime.local().toFormat('ddMMyy');
    let fullName = data[0]?.FullName;
    this.projectService.exportExcelGroup(this.tabulatorEmployeeContract, data, 'HDLD', `HDLD_${fullName}_${date}`, 'FullName')
  }


}