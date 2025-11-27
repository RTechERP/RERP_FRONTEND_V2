import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
// NG-ZORRO modules
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
// Services
import { DangkyvppServiceService } from '../officesupplyrequests-service/office-supply-requests-service.service';
import { OfficeSupplyService } from '../../OfficeSupply/office-supply-service/office-supply-service.service';
import { EmployeeService } from '../../../employee/employee-service/employee.service';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';

@Component({
  selector: 'app-office-supply-request-admin-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzNotificationModule,
    NzSelectModule,
    NzSpinModule,
    NzSplitterModule,
    NzCheckboxModule,
    NzNotificationModule,
    NzGridModule,
    NzTabsModule,
    HasPermissionDirective
  ],
  templateUrl: './office-supply-request-admin-detail.component.html',
  styleUrls: ['./office-supply-request-admin-detail.component.css']
})
export class OfficeSupplyRequestAdminDetailComponent implements OnInit, AfterViewInit {
  @ViewChild('tbRequestDetail', { static: false }) tbRequestDetailRef!: ElementRef;
  @ViewChild('tbEmployee', { static: false }) tbEmployeeRef!: ElementRef;
  @Input() editData: any = null;

  private tbRequestDetail!: Tabulator;
  private tbEmployee!: Tabulator;

  dateRequest: Date = new Date();
  departmentId: number | null = null;
  requesterId: number | null = null;
  requestId: number = 0;

  departmentList: any[] = [];
  employeeList: any[] = [];
  filteredEmployeeList: any[] = [];
  employeeListForSelect: any[] = [];
  employeeGroups: any[] = [];
  selectedEmployeeList: any[] = [];
  employeeTableData: any[] = [];
  officeSupplyList: any[] = [];
  officeSupplyListForSelect: any[] = [];
  unitList: any[] = [];
  detailIdMap: Map<string, number> = new Map();
  deletedDetails: any[] = [];
  deletedOfficeSupplyIds: Set<number> = new Set();
  originalDetailData: any[] = [];
  selectedEmployee: any = null; // Nhân viên được chọn để đăng ký VPP
  employeeVPPData: Map<number, any[]> = new Map(); // Lưu VPP của từng nhân viên: EmployeeID -> VPP data

  isLoading = false;
  isSaving = false;
  activeTabIndex = 0;

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private officeSupplyRequestService: DangkyvppServiceService,
    private officeSupplyService: OfficeSupplyService,
    private employeeService: EmployeeService
  ) { }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadEmployees();
    this.loadOfficeSupplies();
    this.loadUnits();

    if (this.editData) {
      this.loadEditData();
    }
  }

  loadEditData(): void {
    const requestInfo = this.editData.requestInfo || {};
    const detailData = this.editData.detailData || [];

    this.requestId = this.editData.requestId || 0;
    this.dateRequest = requestInfo.DateRequest ? new Date(requestInfo.DateRequest) : new Date();
    this.departmentId = requestInfo.DepartmentID || null;
    // Bỏ auto-fill người đăng ký - để người dùng tự chọn
    // this.requesterId = requestInfo.EmployeeIDRequest || null;
    this.requesterId = null;

    // Reset deleted details và deleted office supply IDs khi load lại
    this.deletedDetails = [];
    this.deletedOfficeSupplyIds.clear();
    this.originalDetailData = [...detailData];

    // Tạo mapping EmployeeID + OfficeSupplyID -> DetailID
    this.detailIdMap.clear();
    detailData.forEach((detail: any) => {
      const key = `${detail.EmployeeID}_${detail.OfficeSupplyID}`;
      this.detailIdMap.set(key, detail.ID || 0);
    });
  }

  loadEditDetailData(detailData: any[]): void {
    if (!detailData || detailData.length === 0) return;

    const employeeMap = new Map<number, any[]>();
    detailData.forEach((detail: any) => {
      const empId = detail.EmployeeID;
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, []);
      }
      employeeMap.get(empId)!.push(detail);
    });

    if (this.tbEmployee && employeeMap.size > 0) {
      const employeeRows: any[] = [];
      employeeMap.forEach((details, empId) => {
        const emp = this.employeeList.find((e: any) => (e.ID || e.EmployeeID) === empId);
        if (emp) {
          employeeRows.push({
            EmployeeID: empId,
            EmployeeCode: emp.Code || '',
            EmployeeName: emp.FullName || '',
            DepartmentName: emp.DepartmentName || '',
            PositionName: emp.ChucVuHD || ''
          });
        }
      });
      this.tbEmployee.replaceData(employeeRows);
      this.updateSelectedEmployeeList();
    }

    if (this.tbRequestDetail && detailData.length > 0) {
      const vppRows: any[] = [];
      const processedVppIds = new Set<number>();

      detailData.forEach((detail: any) => {
        const vppId = detail.OfficeSupplyID;
        if (!processedVppIds.has(vppId)) {
          processedVppIds.add(vppId);
          const vpp = this.officeSupplyList.find((v: any) => v.ID === vppId);
          if (vpp) {
            vppRows.push({
              DetailID: detail.ID || 0,
              OfficeSupplyID: vppId,
              OfficeSupplyName: vpp.NameRTC || vpp.NameNCC || '',
              UnitName: vpp.Unit || '',
              RequestLimit: vpp.RequestLimit || 0,
              Quantity: detail.Quantity || detail.RequestLimit || 0,
              QuantityReceived: detail.QuantityReceived || 0,
              ExceedsLimit: detail.ExceedsLimit === true || detail.ExceedsLimit === 1,
              Reason: detail.Reason || ''
            });
          }
        }
      });

      this.tbRequestDetail.replaceData(vppRows);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (!this.tbEmployee) {
        this.initializeEmployeeTable();
      }
      if (!this.tbRequestDetail) {
        setTimeout(() => {
          this.initializeRequestDetailTable();
        }, 200);
      }
    }, 1000);
  }

  // Load departments
  loadDepartments(): void {
    this.officeSupplyRequestService.getdataDepartment().subscribe({
      next: (res) => {
        if (res && Array.isArray(res.data)) {
          this.departmentList = res.data;
        } else {
          this.departmentList = [];
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách phòng ban');
      }
    });
  }

  // Load employees
  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (res: any) => {
        let employees = [];
        if (res?.data && Array.isArray(res.data)) {
          employees = res.data;
        } else if (Array.isArray(res)) {
          employees = res;
        } else if (res?.status === 1 && res?.data && Array.isArray(res.data)) {
          employees = res.data;
        }
        console.log('employees', employees);
        const all = employees.filter((emp: any) => (emp.Status === 0 || emp.Status === '0' || emp.Status === null || emp.Status === undefined));
        this.employeeList = all;
        this.groupEmployees();
        this.filterEmployeesByDepartment();
        this.updateEmployeeListForSelect();

        setTimeout(() => {
          if (!this.tbEmployee) {
            this.initializeEmployeeTable();
          }
          if (!this.tbRequestDetail) {
            setTimeout(() => {
              this.initializeRequestDetailTable();
              if (this.editData) {
                setTimeout(() => {
                  this.loadEditDetailData(this.editData.detailData || []);
                }, 500);
              }
            }, 200);
          } else if (this.editData) {
            setTimeout(() => {
              this.loadEditDetailData(this.editData.detailData || []);
            }, 500);
          }
        }, 100);
      },
      error: (error: any) => {
        console.error('Error loading employees:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách nhân viên: ' + (error?.message || error?.error?.message || ''));
      }
    });
  }

  // Group employees by department
  groupEmployees(): void {
    const groupMap = new Map<string, any[]>();

    this.employeeList.forEach((emp: any) => {
      const deptName = emp.DepartmentName || 'Chưa có phòng ban';

      if (!groupMap.has(deptName)) {
        groupMap.set(deptName, []);
      }
      groupMap.get(deptName)!.push(emp);
    });

    // Chuyển Map thành Array và sắp xếp
    this.employeeGroups = Array.from(groupMap.entries()).map(([label, options]) => ({
      label: label,
      options: options.sort((a: any, b: any) => {
        const nameA = (a.Code || '') + ' - ' + (a.FullName || '');
        const nameB = (b.Code || '') + ' - ' + (b.FullName || '');
        return nameA.localeCompare(nameB);
      })
    }));

    // Sắp xếp các nhóm theo tên phòng ban
    this.employeeGroups.sort((a, b) => a.label.localeCompare(b.label));
  }

  // Filter employees by department
  filterEmployeesByDepartment(): void {
    if (this.departmentId && this.departmentId > 0) {
      this.filteredEmployeeList = this.employeeList.filter(
        (emp: any) => Number(emp.DepartmentID) === Number(this.departmentId)
      );
    } else {
      this.filteredEmployeeList = this.employeeList;
    }

    this.updateEmployeeListForSelect();
  }

  // Update employee list formatted for list editor
  updateEmployeeListForSelect(): void {
    const employeesToUse = this.selectedEmployeeList.length > 0
      ? this.selectedEmployeeList
      : this.filteredEmployeeList;

    this.employeeListForSelect = employeesToUse.map((emp: any) => ({
      value: emp.ID || emp.EmployeeID,
      label: `${emp.Code} - ${emp.FullName}`
    }));

    if (this.tbEmployee) {
      const employeeColumn = this.tbEmployee.getColumn('EmployeeID');
      if (employeeColumn) {
        const currentDef = employeeColumn.getDefinition();
        employeeColumn.updateDefinition({
          ...currentDef,
          editorParams: {
            ...(currentDef as any).editorParams,
            values: this.employeeListForSelect
          }
        } as any);
      }
    }

    if (this.tbRequestDetail) {
      const employeeColumn = this.tbRequestDetail.getColumn('EmployeeID');
      if (employeeColumn) {
        const currentDef = employeeColumn.getDefinition();
        employeeColumn.updateDefinition({
          ...currentDef,
          editorParams: {
            ...(currentDef as any).editorParams,
            values: this.employeeListForSelect
          }
        } as any);
      }
    }
  }

  // Load office supplies
  loadOfficeSupplies(): void {
    this.officeSupplyService.getdata('').subscribe({
      next: (res) => {
        if (res && res.data && res.data.officeSupply) {
          this.officeSupplyList = res.data.officeSupply;
          this.updateOfficeSupplyListForSelect();
        } else {
          this.officeSupplyList = [];
          this.officeSupplyListForSelect = [];
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách văn phòng phẩm');
      }
    });
  }

  // Update office supply list formatted for list editor
  updateOfficeSupplyListForSelect(): void {
    this.officeSupplyListForSelect = this.officeSupplyList.map((vpp: any) => ({
      value: vpp.ID,
      label: vpp.NameRTC || vpp.NameNCC || ''
    }));
  }

  // Load units
  loadUnits(): void {
    this.officeSupplyService.getUnit().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.unitList = Array.isArray(res.data) ? res.data : [];
        } else {
          this.unitList = [];
        }
      },
      error: (error) => {
        console.error('Error loading units:', error);
      }
    });
  }

  // Initialize employee table (Tab 1)
  private initializeEmployeeTable(): void {
    const container = this.tbEmployeeRef?.nativeElement;
    if (!container) {
      setTimeout(() => {
        this.initializeEmployeeTable();
      }, 100);
      return;
    }

    if (this.tbEmployee) {
      return;
    }

    this.tbEmployee = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.employeeTableData,
      layout: 'fitDataStretch',
      height: '100%',
      selectableRows: true, // Cho phép chọn nhiều dòng
      selectableRowsRangeMode: "click",
      rowHeader: {
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        headerSort: false,
        width: 40,
        frozen: true,
        headerHozAlign: "center",
        hozAlign: "center"
      },
      columns: [
        {
          title: '',
          field: 'action',
          width: 40,
          hozAlign: 'center',
          headerHozAlign: 'center',
          frozen: true,
          headerSort: false,
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
          headerClick: () => {
            this.addNewEmployeeRow();
          },
          formatter: (cell: any) => {
            return `<i class="fa-solid fa-xmark" style="cursor:pointer;color:red;"></i>`;
          },
          cellClick: (e: any, cell: any) => {
            const row = cell.getRow();
            row.delete();
            this.updateSelectedEmployeeList();
          }
        },
        {
          title: 'STT',
          field: 'STT',
          width: 60,
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: 'rownum',
          frozen: true
        },
        {
          title: 'Nhân viên',
          field: 'EmployeeID',
          width: 300,
          headerHozAlign: 'center',
          headerSort: false,
          editor: 'list',
          editorParams: {
            values: this.employeeListForSelect
          },
          formatter: (cell: any) => {
            const empId = parseInt(cell.getValue()) || 0;
            if (!empId || empId === 0) {
              return '--Chọn nhân viên--';
            }

            const employeesToSearch = this.selectedEmployeeList.length > 0
              ? this.selectedEmployeeList
              : this.filteredEmployeeList;
            const emp = employeesToSearch.find((e: any) => (e.ID || e.EmployeeID) === empId);
            if (emp) {
              return `${emp.Code} - ${emp.FullName}`;
            }

            const allEmp = this.employeeList.find((e: any) => (e.ID || e.EmployeeID) === empId);
            if (allEmp) {
              return `${allEmp.Code} - ${allEmp.FullName}`;
            }

            return '--Chọn nhân viên--';
          },
          cellEdited: (cell: any) => {
            const empId = parseInt(cell.getValue()) || 0;
            const row = cell.getRow();
            const rowData = row.getData();

            // Kiểm tra xem nhân viên đã được chọn trong các dòng khác chưa
            if (empId > 0 && this.tbEmployee) {
              const allRows = this.tbEmployee.getRows();
              const isDuplicate = allRows.some((r: any) => {
                // Bỏ qua dòng hiện tại
                if (r === row) {
                  return false;
                }
                const rData = r.getData();
                const rEmpId = parseInt(rData['EmployeeID']) || 0;
                return rEmpId === empId && rEmpId > 0;
              });

              if (isDuplicate) {
                this.notification.warning(NOTIFICATION_TITLE.warning, 'Nhân viên này đã được chọn rồi. Vui lòng chọn nhân viên khác');
                // Reset lại giá trị
                row.update({
                  EmployeeID: null,
                  EmployeeCode: '',
                  EmployeeName: '',
                  DepartmentName: '',
                  PositionName: ''
                });
                return;
              }
            }

            let emp = this.employeeList.find((e: any) => (e.ID || e.EmployeeID) === empId);
            if (!emp && this.selectedEmployeeList.length > 0) {
              emp = this.selectedEmployeeList.find((e: any) => (e.ID || e.EmployeeID) === empId);
            }
            if (!emp) {
              emp = this.filteredEmployeeList.find((e: any) => (e.ID || e.EmployeeID) === empId);
            }

            if (emp) {
              row.update({
                EmployeeCode: emp.Code || '',
                EmployeeName: emp.FullName || '',
                DepartmentName: emp.DepartmentName || '',
                PositionName: emp.ChucVuHD || ''
              });
            }

            setTimeout(() => {
              this.updateSelectedEmployeeList();
            }, 0);
          }
        },
        {
          title: 'Phòng ban',
          field: 'DepartmentName',
          width: 200,
          headerHozAlign: 'center',
          editor: false
        },
        {
          title: 'Chức vụ',
          field: 'PositionName',
          width: 200,
          headerHozAlign: 'center',
          editor: false
        },
      ]
    } as any);

    // Xử lý khi selection thay đổi
    this.tbEmployee.on('rowSelectionChanged', (data: any[], rows: any[]) => {
      if (data && data.length > 0) {
        // Lưu VPP hiện tại của nhân viên đang được chọn trước khi chuyển
        if (this.selectedEmployee && this.selectedEmployee.EmployeeID && this.tbRequestDetail) {
          const currentVPPData = this.tbRequestDetail.getData();
          if (currentVPPData && currentVPPData.length > 0) {
            // Copy array để tránh reference issue
            const vppDataCopy = currentVPPData.map((item: any) => ({ ...item }));
            this.employeeVPPData.set(this.selectedEmployee.EmployeeID, vppDataCopy);
            console.log(`Saved VPP for employee ${this.selectedEmployee.Code} (ID: ${this.selectedEmployee.EmployeeID}), count=${vppDataCopy.length}`);
          }
        }

        // Lấy tất cả nhân viên được chọn
        const selectedEmployees: any[] = [];

        data.forEach((rowData: any) => {
          const empId = parseInt(rowData['EmployeeID']) || 0;

          if (empId > 0) {
            // Tìm thông tin đầy đủ của nhân viên
            let emp = this.employeeList.find((e: any) => (e.ID || e.EmployeeID) === empId);
            if (!emp) {
              emp = this.filteredEmployeeList.find((e: any) => (e.ID || e.EmployeeID) === empId);
            }

            if (emp) {
              selectedEmployees.push({
                ID: empId,
                EmployeeID: empId,
                Code: rowData['EmployeeCode'] || emp.Code || '',
                FullName: rowData['EmployeeName'] || emp.FullName || '',
                DepartmentName: rowData['DepartmentName'] || emp.DepartmentName || '',
                PositionName: rowData['PositionName'] || emp.ChucVuHD || ''
              });
            }
          }
        });

        // Lưu danh sách nhân viên được chọn
        this.selectedEmployeeList = selectedEmployees;

        // Nếu chỉ có 1 nhân viên được chọn, load VPP của nhân viên đó
        // Nếu có nhiều nhân viên, để trống bảng VPP (sẽ dùng chung VPP cho tất cả)
        if (selectedEmployees.length === 1) {
          this.selectedEmployee = selectedEmployees[0];
          this.loadVPPForEmployee(selectedEmployees[0].EmployeeID);
        } else if (selectedEmployees.length > 1) {
          // Nếu có nhiều nhân viên, để trống bảng VPP (sẽ dùng chung VPP cho tất cả)
          this.selectedEmployee = null;
          if (this.tbRequestDetail) {
            this.tbRequestDetail.replaceData([]);
          }
        }
      } else {
        // Lưu VPP hiện tại trước khi bỏ chọn
        if (this.selectedEmployee && this.selectedEmployee.EmployeeID && this.tbRequestDetail) {
          const currentVPPData = this.tbRequestDetail.getData();
          if (currentVPPData && currentVPPData.length > 0) {
            this.employeeVPPData.set(this.selectedEmployee.EmployeeID, currentVPPData);
          }
        }

        // Không có dòng nào được chọn
        this.selectedEmployee = null;
        this.selectedEmployeeList = [];
        if (this.tbRequestDetail) {
          this.tbRequestDetail.replaceData([]);
        }
      }
    });

    this.loadEmployees();
  }

  // Add new employee row
  addNewEmployeeRow(): void {
    if (this.tbEmployee) {
      this.tbEmployee.addRow({
        EmployeeID: null,
        EmployeeCode: '',
        EmployeeName: '',
        DepartmentName: '',
        PositionName: ''
      });
    }
  }

  // Load VPP cho nhân viên được chọn
  loadVPPForEmployee(employeeId: number): void {
    if (!this.tbRequestDetail) {
      setTimeout(() => {
        this.loadVPPForEmployee(employeeId);
      }, 100);
      return;
    }

    // Ưu tiên: Nếu đã có VPP data được lưu trong employeeVPPData, load từ đó
    if (this.employeeVPPData.has(employeeId)) {
      const savedVPPData = this.employeeVPPData.get(employeeId);
      if (savedVPPData && savedVPPData.length > 0) {
        // Copy array để tránh reference issue
        const vppDataCopy = savedVPPData.map((item: any) => ({ ...item }));
        this.tbRequestDetail.replaceData(vppDataCopy);
        console.log(`Loaded VPP for employee ID ${employeeId}, count=${vppDataCopy.length}`);

        // Focus vào dòng đầu tiên sau khi load data
        setTimeout(() => {
          const firstRow = this.tbRequestDetail.getRows()[0];
          if (firstRow) {
            this.tbRequestDetail.scrollToRow(firstRow, "top", false);
          }
        }, 100);
        return;
      }
    }

    // Nếu đang edit và có dữ liệu, load VPP của nhân viên này từ detailData
    if (this.editData && this.editData.detailData) {
      const employeeDetails = this.editData.detailData.filter((detail: any) =>
        detail.EmployeeID === employeeId
      );

      if (employeeDetails.length > 0) {
        const vppRows: any[] = [];
        const processedVppIds = new Set<number>();

        employeeDetails.forEach((detail: any) => {
          const vppId = detail.OfficeSupplyID;
          if (!processedVppIds.has(vppId)) {
            processedVppIds.add(vppId);
            const vpp = this.officeSupplyList.find((v: any) => v.ID === vppId);
            if (vpp) {
              vppRows.push({
                DetailID: detail.ID || 0,
                OfficeSupplyID: vppId,
                OfficeSupplyName: vpp.NameRTC || vpp.NameNCC || '',
                UnitName: vpp.Unit || '',
                RequestLimit: vpp.RequestLimit || 0,
                Quantity: detail.Quantity || detail.RequestLimit || 0,
                QuantityReceived: detail.QuantityReceived || 0,
                ExceedsLimit: detail.ExceedsLimit === true || detail.ExceedsLimit === 1,
                Reason: detail.Reason || ''
              });
            }
          }
        });

        // Lưu vào employeeVPPData để lần sau load lại
        this.employeeVPPData.set(employeeId, vppRows);
        this.tbRequestDetail.replaceData(vppRows);

        // Focus vào dòng đầu tiên sau khi load data
        setTimeout(() => {
          const firstRow = this.tbRequestDetail.getRows()[0];
          if (firstRow) {
            this.tbRequestDetail.scrollToRow(firstRow, "top", false);
          }
        }, 100);
        return;
      }
    }

    // Nếu không có dữ liệu, để trống bảng VPP
    this.tbRequestDetail.replaceData([]);
  }

  // Update selected employee list from employee table
  updateSelectedEmployeeList(): void {
    if (!this.tbEmployee) return;

    const tableData = this.tbEmployee.getData();
    const newSelectedList = tableData
      .filter((row: any) => row.EmployeeID && row.EmployeeID > 0)
      .map((row: any) => {
        const fullEmp = this.employeeList.find((e: any) => (e.ID || e.EmployeeID) === row.EmployeeID);
        return {
          ID: row.EmployeeID,
          EmployeeID: row.EmployeeID,
          Code: row.EmployeeCode || fullEmp?.Code || '',
          FullName: row.EmployeeName || fullEmp?.FullName || '',
          DepartmentName: row.DepartmentName || fullEmp?.DepartmentName || '',
          PositionName: row.PositionName || fullEmp?.ChucVuHD || ''
        };
      });

    const hasChanged = JSON.stringify(this.selectedEmployeeList) !== JSON.stringify(newSelectedList);
    if (hasChanged) {
      this.selectedEmployeeList = newSelectedList;
      this.updateEmployeeListForSelectWithoutColumnUpdate();
    }
  }

  // Update employee list without updating column definition (to avoid infinite loop)
  updateEmployeeListForSelectWithoutColumnUpdate(): void {
    const employeesToUse = this.selectedEmployeeList.length > 0
      ? this.selectedEmployeeList
      : this.filteredEmployeeList;

    this.employeeListForSelect = employeesToUse.map((emp: any) => ({
      value: emp.ID || emp.EmployeeID,
      label: `${emp.Code} - ${emp.FullName}`
    }));
  }

  // Initialize request detail table (Tab 2)
  private initializeRequestDetailTable(): void {
    const container = this.tbRequestDetailRef?.nativeElement;
    if (!container) {
      setTimeout(() => {
        this.initializeRequestDetailTable();
      }, 100);
      return;
    }

    if (this.tbRequestDetail) {
      return;
    }

    this.tbRequestDetail = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      data: [],

      height: '100%',
      selectableRows: false,
      rowHeader: false,
      columns: [
        {
          title: '',
          field: 'action',
          width: 40,
          hozAlign: 'center',
          headerHozAlign: 'center',
          frozen: true,
          headerSort: false,
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
          headerClick: () => {
            this.addNewRow();
          },
          formatter: (cell: any) => {
            return `<i class="fa-solid fa-xmark" style="cursor:pointer;color:red;"></i>`;
          },
          cellClick: (e: any, cell: any) => {
            const row = cell.getRow();
            const rowData = row.getData();

            // Lưu OfficeSupplyID đã bị xóa
            const officeSupplyId = rowData['OfficeSupplyID'];
            if (officeSupplyId && officeSupplyId > 0) {
              this.deletedOfficeSupplyIds.add(officeSupplyId);
            }

            row.delete();
          }
        },
        {
          title: 'STT',
          field: 'STT',
          width: 60,
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: 'rownum',
          frozen: true,
          headerSort: false
        },
        {
          title: 'VPP',
          field: 'OfficeSupplyID',
          width: 250,
          headerHozAlign: 'center',
          headerSort: false,
          editor: 'list',
          editorParams: {
            values: this.officeSupplyListForSelect
          },
          formatter: (cell: any) => {
            const vppId = parseInt(cell.getValue()) || 0;
            if (!vppId || vppId === 0) {
              return '--Chọn VPP--';
            }
            const vpp = this.officeSupplyList.find((v: any) => v.ID === vppId);
            return vpp ? (vpp.NameRTC || vpp.NameNCC || '--Chọn VPP--') : '--Chọn VPP--';
          },
          cellEdited: (cell: any) => {
            const vppId = parseInt(cell.getValue()) || 0;
            const row = cell.getRow();
            const vpp = this.officeSupplyList.find((v: any) => v.ID === vppId);
            if (vpp) {
              const requestLimit = vpp.RequestLimit || 0;
              row.update({
                OfficeSupplyName: vpp.NameRTC || vpp.NameNCC || '',
                UnitName: vpp.Unit || '',
                RequestLimit: requestLimit
              });
            }
          }
        },
        {
          title: 'DVT',
          field: 'UnitName',
          width: 100,
          hozAlign: 'center',
          headerHozAlign: 'center',
          editor: false,
          headerSort: false
        },
        {
          title: 'Định mức',
          field: 'RequestLimit',
          width: 120,
          hozAlign: 'right',
          headerHozAlign: 'center',
          editor: false,
          headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value || 0;
          }
        },
        {
          title: 'Số lượng đăng ký',
          field: 'Quantity',
          width: 150,
          hozAlign: 'right',
          headerHozAlign: 'center',
          editor: 'number',
          editorParams: { min: 0 },
          headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value || 0;
          },
          cellEdited: (cell: any) => {
            const quantity = parseFloat(cell.getValue()) || 0;
            const row = cell.getRow();
            const rowData = row.getData();

            // Kiểm tra vượt định mức: nếu số lượng đăng ký > 1 thì tự động tích vượt định mức
            if (quantity > 1) {
              row.update({
                ExceedsLimit: true
              });
              setTimeout(() => {
                this.tbRequestDetail?.redraw();
              }, 100);
            } else {
              row.update({
                ExceedsLimit: false,
                Reason: ''
              });
              setTimeout(() => {
                this.tbRequestDetail?.redraw();
              }, 100);
            }
          }
        },
        {
          title: 'Số lượng thực nhận',
          field: 'QuantityReceived',
          width: 150,
          hozAlign: 'right',
          headerHozAlign: 'center',
          editor: false,
          headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value || 0;
          }
        },
        {
          title: 'Vượt định mức',
          field: 'ExceedsLimit',
          width: 150,
          hozAlign: 'center',
          headerHozAlign: 'center',
          headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = checked;
            input.addEventListener('change', () => {
              cell.setValue(input.checked);
              const row = cell.getRow();
              const rowData = row.getData();
              if (!input.checked) {
                row.update({ Reason: '' });
              }
            });
            return input;
          },
          mutator: (value: any) => {
            return value === true || value === 'true' || value === 1 || value === '1';
          }
        },
        {
          title: 'Lý do vượt định mức',
          field: 'Reason',
          width: 300,
          headerHozAlign: 'center',
          headerSort: false,
          editor: 'input',
          editorParams: {
            elementAttributes: {
              placeholder: 'Nhập lý do vượt định mức...'
            }
          },
          formatter: (cell: any) => {
            const value = cell.getValue();
            const rowData = cell.getRow().getData();
            const exceedsLimit = rowData['ExceedsLimit'] === true || rowData['ExceedsLimit'] === 1 || rowData['ExceedsLimit'] === 'true' || rowData['ExceedsLimit'] === '1';
            if (exceedsLimit) {
              return value || '';
            }
            return '';
          }
        },
      ]
    } as any);

    this.loadEmployees();
  }

  // Add new row
  addNewRow(): void {
    if (this.tbRequestDetail) {
      this.tbRequestDetail.addRow({
        OfficeSupplyID: null,
        RequestLimit: 0,
        Quantity: 1,
        QuantityReceived: 0,
        ExceedsLimit: false,
        Reason: ''
      });
    }
  }

  // On department change
  onDepartmentChange(): void {
    // Lưu VPP hiện tại trước khi đổi phòng ban
    if (this.selectedEmployee && this.selectedEmployee.EmployeeID && this.tbRequestDetail) {
      const currentVPPData = this.tbRequestDetail.getData();
      if (currentVPPData && currentVPPData.length > 0) {
        this.employeeVPPData.set(this.selectedEmployee.EmployeeID, currentVPPData);
      }
    }

    this.selectedEmployeeList = [];
    this.selectedEmployee = null; // Reset nhân viên được chọn
    this.employeeVPPData.clear(); // Clear VPP data khi đổi phòng ban
    this.filterEmployeesByDepartment();

    // Xóa dữ liệu VPP khi đổi phòng ban
    if (this.tbRequestDetail) {
      this.tbRequestDetail.replaceData([]);
    }

    // Tự động load nhân viên của phòng ban vào bảng nhân viên
    if (this.departmentId && this.departmentId > 0 && this.tbEmployee) {
      const employeesInDept = this.filteredEmployeeList.map((emp: any) => ({
        EmployeeID: emp.ID || emp.EmployeeID,
        EmployeeCode: emp.Code || '',
        EmployeeName: emp.FullName || '',
        DepartmentName: emp.DepartmentName || '',
        PositionName: emp.ChucVuHD || ''
      }));

      this.tbEmployee.replaceData(employeesInDept);
      this.updateSelectedEmployeeList();
    } else if (!this.departmentId || this.departmentId <= 0) {
      // Nếu không chọn phòng ban, xóa hết dữ liệu
      if (this.tbEmployee) {
        this.tbEmployee.replaceData([]);
        this.updateSelectedEmployeeList();
      }
    }
  }

  // On tab change
  onTabChange(event: any): void {
    const index = typeof event === 'number' ? event : (event?.index ?? event);
    this.activeTabIndex = index;

    setTimeout(() => {
      if (index === 0 && !this.tbEmployee) {
        this.initializeEmployeeTable();
      } else if (index === 1 && !this.tbRequestDetail) {
        this.initializeRequestDetailTable();
      }
    }, 100);
  }

  // Validate form
  validateForm(): boolean {
    if (!this.dateRequest) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ngày đăng ký');
      return false;
    }

    // Kiểm tra ngày đăng ký: chỉ cho phép đăng ký từ ngày 1-5 của tháng
    const currentDate = new Date();
    const currentDay = currentDate.getDate();

    if (currentDay > 5) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Chỉ được đăng ký VPP từ ngày 1 đến ngày 5 của tháng. Hiện tại đã quá thời hạn đăng ký!'
      );
      return false;
    }

    if (!this.departmentId || this.departmentId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn phòng ban');
      return false;
    }

    if (!this.requesterId || this.requesterId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn người đăng ký');
      return false;
    }

    const tableData = this.tbRequestDetail?.getData() || [];
    if (tableData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng thêm ít nhất 1 dòng đăng ký');
      return false;
    }

    // Kiểm tra nhân viên được chọn
    const selectedRows = this.tbEmployee?.getSelectedData() || [];
    const validSelectedEmployees = selectedRows.filter((row: any) => {
      const empId = parseInt(row['EmployeeID']) || 0;
      return empId > 0;
    });

    if (validSelectedEmployees.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 nhân viên để đăng ký VPP (click vào dòng nhân viên)');
      return false;
    }

    for (let i = 0; i < tableData.length; i++) {
      const rowData = tableData[i];
      if (!rowData['OfficeSupplyID'] || rowData['OfficeSupplyID'] <= 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn VPP ở dòng ${i + 1}`);
        return false;
      }

      const quantity = parseFloat(rowData['Quantity']) || 0;
      const exceedsLimit = rowData['ExceedsLimit'] === true || rowData['ExceedsLimit'] === 1 || rowData['ExceedsLimit'] === 'true' || rowData['ExceedsLimit'] === '1';

      // Kiểm tra: nếu số lượng đăng ký > 1 thì phải tích vượt định mức và nhập lý do
      if (quantity > 1) {
        if (!exceedsLimit) {
          this.notification.warning(NOTIFICATION_TITLE.warning, `Số lượng đăng ký lớn hơn 1 ở dòng ${i + 1}. Vui lòng tích "Vượt định mức" và nhập lý do`);
          return false;
        }
        const reason = rowData['Reason'] || '';
        if (!reason || reason.trim() === '') {
          this.notification.warning(NOTIFICATION_TITLE.warning, `Số lượng đăng ký lớn hơn 1 ở dòng ${i + 1}. Vui lòng nhập lý do vượt định mức`);
          return false;
        }
      }

      if (exceedsLimit) {
        const reason = rowData['Reason'] || '';
        if (!reason || reason.trim() === '') {
          this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng nhập lý do vượt định mức ở dòng ${i + 1}`);
          return false;
        }
      }
    }

    return true;
  }

  // Save data
  save(): void {
    this.updateSelectedEmployeeList();

    // Lưu VPP hiện tại của nhân viên đang được chọn trước khi save
    if (this.selectedEmployee && this.selectedEmployee.EmployeeID && this.tbRequestDetail) {
      const currentVPPData = this.tbRequestDetail.getData();
      if (currentVPPData && currentVPPData.length > 0) {
        // Copy array để tránh reference issue
        const vppDataCopy = currentVPPData.map((item: any) => ({ ...item }));
        this.employeeVPPData.set(this.selectedEmployee.EmployeeID, vppDataCopy);
        console.log(`Saved VPP for employee ${this.selectedEmployee.Code} (ID: ${this.selectedEmployee.EmployeeID}) before save, count=${vppDataCopy.length}`);
      }
    }

    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;

    // Lấy TẤT CẢ nhân viên có VPP data trong employeeVPPData (không cần chọn lại)
    let employeesToProcess: any[] = [];

    // Lấy tất cả EmployeeID có VPP data
    const employeeIdsWithVPP = Array.from(this.employeeVPPData.keys());

    if (employeeIdsWithVPP.length === 0) {
      // Nếu không có VPP data nào được lưu, kiểm tra nhân viên đang được chọn
      if (this.selectedEmployee && this.selectedEmployee.EmployeeID && this.tbRequestDetail) {
        const currentVPPData = this.tbRequestDetail.getData();
        if (currentVPPData && currentVPPData.length > 0) {
          // Lưu VPP hiện tại và thêm nhân viên vào danh sách
          const vppDataCopy = currentVPPData.map((item: any) => ({ ...item }));
          this.employeeVPPData.set(this.selectedEmployee.EmployeeID, vppDataCopy);
          employeeIdsWithVPP.push(this.selectedEmployee.EmployeeID);
        }
      }
    }

    if (employeeIdsWithVPP.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu VPP để lưu. Vui lòng đăng ký VPP cho ít nhất 1 nhân viên');
      this.isSaving = false;
      return;
    }

    // Tìm thông tin đầy đủ của từng nhân viên
    employeesToProcess = employeeIdsWithVPP
      .map((empId: number) => {
        // Tìm trong employeeList
        let emp = this.employeeList.find((e: any) => {
          const eId = parseInt(e.ID || e.EmployeeID) || 0;
          return eId === empId;
        });

        // Nếu không tìm thấy, tìm trong filteredEmployeeList
        if (!emp) {
          emp = this.filteredEmployeeList.find((e: any) => {
            const eId = parseInt(e.ID || e.EmployeeID) || 0;
            return eId === empId;
          });
        }

        // Nếu không tìm thấy, tìm trong selectedEmployeeList
        if (!emp) {
          emp = this.selectedEmployeeList.find((e: any) => {
            const eId = parseInt(e.ID || e.EmployeeID) || 0;
            return eId === empId;
          });
        }

        // Nếu không tìm thấy, tìm trong bảng nhân viên
        if (!emp && this.tbEmployee) {
          const tableData = this.tbEmployee.getData();
          const rowData = tableData.find((row: any) => {
            const rEmpId = parseInt(row['EmployeeID']) || 0;
            return rEmpId === empId;
          });

          if (rowData) {
            return {
              ID: empId,
              EmployeeID: empId,
              Code: rowData['EmployeeCode'] || '',
              FullName: rowData['EmployeeName'] || '',
              DepartmentName: rowData['DepartmentName'] || '',
              PositionName: rowData['PositionName'] || ''
            };
          }
        }

        if (emp) {
          return {
            ID: empId,
            EmployeeID: empId,
            Code: emp.Code || '',
            FullName: emp.FullName || '',
            DepartmentName: emp.DepartmentName || '',
            PositionName: emp.ChucVuHD || ''
          };
        }

        return null;
      })
      .filter((emp: any) => emp !== null);

    if (employeesToProcess.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy thông tin nhân viên để lưu');
      this.isSaving = false;
      return;
    }

    // Debug: Log tất cả nhân viên và VPP data của họ
    console.log('=== DEBUG SAVE ===');
    console.log('Total employees with VPP data:', employeesToProcess.length);
    console.log('employeesToProcess:', employeesToProcess);
    console.log('employeeVPPData keys:', Array.from(this.employeeVPPData.keys()));
    employeesToProcess.forEach((emp: any) => {
      const empId = emp.ID || emp.EmployeeID;
      const hasVPP = this.employeeVPPData.has(empId);
      const vppData = hasVPP ? this.employeeVPPData.get(empId) : [];
      console.log(`Employee ${emp.Code} (ID: ${empId}): hasVPP=${hasVPP}, vppCount=${vppData?.length || 0}`);
    });
    console.log('==================');

    const dateRequestStr = this.dateRequest ? new Date(this.dateRequest).toISOString() : new Date().toISOString();

    const officeSupplyRequest: any = {
      ID: this.requestId || 0,
      EmployeeIDRequest: this.requesterId,
      DateRequest: dateRequestStr,
      DepartmentID: this.departmentId,
      IsApproved: false,
      IsDeleted: false,
      IsAdminApproved: false
    };

    const officeSupplyRequestsDetails: any[] = [];

    // Xử lý từng nhân viên có VPP data
    for (const employee of employeesToProcess) {
      const employeeId = employee.ID || employee.EmployeeID;

      // Lấy VPP data của nhân viên này từ employeeVPPData
      let vppDataForEmployee: any[] = [];

      // Ưu tiên: Nếu là nhân viên đang được chọn, lấy từ table hiện tại (và cập nhật vào Map)
      if (employeeId === (this.selectedEmployee?.EmployeeID || this.selectedEmployee?.ID) && this.tbRequestDetail) {
        const currentData = this.tbRequestDetail.getData();
        if (currentData && currentData.length > 0) {
          vppDataForEmployee = currentData.map((item: any) => ({ ...item }));
          // Cập nhật vào Map để đảm bảo data mới nhất
          this.employeeVPPData.set(employeeId, vppDataForEmployee.map((item: any) => ({ ...item })));
          console.log(`Employee ${employee.Code} (ID: ${employeeId}): Using current table data, count=${vppDataForEmployee.length}`);
        }
      }

      // Nếu chưa có data, lấy từ employeeVPPData
      if (!vppDataForEmployee || vppDataForEmployee.length === 0) {
        if (this.employeeVPPData.has(employeeId)) {
          const savedData = this.employeeVPPData.get(employeeId) || [];
          vppDataForEmployee = savedData.map((item: any) => ({ ...item }));
          console.log(`Employee ${employee.Code} (ID: ${employeeId}): Using saved VPP data, count=${vppDataForEmployee.length}`);
        }
      }

      // Nếu vẫn không có VPP data, bỏ qua nhân viên này
      if (!vppDataForEmployee || vppDataForEmployee.length === 0) {
        console.log(`Employee ${employee.Code} (ID: ${employeeId}): No VPP data, skipping`);
        continue;
      }

      for (const rowData of vppDataForEmployee) {
        if (!rowData['OfficeSupplyID'] || rowData['OfficeSupplyID'] <= 0) {
          continue;
        }

        const quantity = parseFloat(rowData['Quantity']) || 0;
        const quantityReceived = parseFloat(rowData['QuantityReceived']) || 0;
        const exceedsLimit = rowData['ExceedsLimit'] === true || rowData['ExceedsLimit'] === 1 || rowData['ExceedsLimit'] === 'true' || rowData['ExceedsLimit'] === '1';

        // Nếu số lượng đăng ký > 1 thì tự động set vượt định mức
        const actualExceedsLimit = quantity > 1;
        const reason = actualExceedsLimit ? (rowData['Reason'] || '') : '';

        // Tìm DetailID từ mapping nếu đang edit
        // Chỉ dùng mapping để tìm DetailID, không dùng rowData['DetailID'] vì nó không chính xác cho nhân viên mới
        const employeeId = employee.ID || employee.EmployeeID;
        const officeSupplyId = rowData['OfficeSupplyID'];
        const mapKey = `${employeeId}_${officeSupplyId}`;
        const detailId = this.detailIdMap.get(mapKey) || 0;

        // Nếu detailId = 0, đây là detail mới (nhân viên mới hoặc VPP mới)
        // Nếu detailId > 0, đây là detail cũ cần update

        // Chỉ tạo detail nếu chưa có trong deletedDetails (để tránh trùng với detail đã bị xóa)
        const isDeleted = this.deletedDetails.some((del: any) =>
          del.EmployeeID === employeeId && del.OfficeSupplyID === officeSupplyId
        );

        if (!isDeleted) {
          const detail: any = {
            ID: detailId, // 0 = tạo mới, > 0 = update
            OfficeSupplyRequestsID: this.requestId || 0,
            EmployeeID: employeeId,
            OfficeSupplyID: officeSupplyId,
            Quantity: quantity,
            QuantityReceived: quantityReceived,
            ExceedsLimit: actualExceedsLimit
          };

          if (reason && reason.trim() !== '') {
            detail.Reason = reason;
          }

          officeSupplyRequestsDetails.push(detail);

          console.log(`Detail: EmployeeID=${employeeId}, OfficeSupplyID=${officeSupplyId}, DetailID=${detailId} (${detailId > 0 ? 'UPDATE' : 'CREATE NEW'})`);
        }
      }
    }

    // Tìm và đánh dấu IsDeleted cho các detail có OfficeSupplyID đã bị xóa
    if (this.deletedOfficeSupplyIds.size > 0 && this.requestId > 0) {
      this.deletedOfficeSupplyIds.forEach((officeSupplyId) => {
        // Tìm tất cả detail có OfficeSupplyID này trong originalDetailData
        this.originalDetailData.forEach((originalDetail: any) => {
          if (originalDetail.OfficeSupplyID === officeSupplyId && originalDetail.ID > 0) {
            const deletedDetail: any = {
              ID: originalDetail.ID,
              OfficeSupplyRequestsID: this.requestId,
              EmployeeID: originalDetail.EmployeeID,
              OfficeSupplyID: originalDetail.OfficeSupplyID,
              Quantity: originalDetail.Quantity || 0,
              QuantityReceived: originalDetail.QuantityReceived || 0,
              ExceedsLimit: originalDetail.ExceedsLimit || false,
              Reason: originalDetail.Reason || null,
              IsDeleted: true
            };
            this.deletedDetails.push(deletedDetail);
          }
        });
      });
    }

    // Thêm các detail đã bị xóa vào danh sách
    if (this.deletedDetails.length > 0) {
      officeSupplyRequestsDetails.push(...this.deletedDetails);
    }

    if (officeSupplyRequestsDetails.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu. Vui lòng kiểm tra lại');
      this.isSaving = false;
      return;
    }

    const dto: any = {
      officeSupplyRequest: officeSupplyRequest,
      officeSupplyRequestsDetails: officeSupplyRequestsDetails
    };

    console.log('=== DEBUG PAYLOAD ===');
    console.log('officeSupplyRequest:', officeSupplyRequest);
    console.log('officeSupplyRequestsDetails:', officeSupplyRequestsDetails);
    console.log('DTO:', dto);
    console.log('DTO JSON:', JSON.stringify(dto, null, 2));
    console.log('===================');

    this.officeSupplyRequestService.saveData(dto).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res?.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            `Đã tạo ${officeSupplyRequestsDetails.length} chi tiết đăng ký VPP thành công!`
          );
          this.activeModal.close({ success: true });
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            res?.message || 'Lưu dữ liệu thất bại'
          );
        }
      },
      error: (error: any) => {
        this.isSaving = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi lưu dữ liệu: ' + (error?.message || 'Lỗi không xác định')
        );
      }
    });
  }

  // Close modal
  close(): void {
    this.activeModal.dismiss();
  }
}
