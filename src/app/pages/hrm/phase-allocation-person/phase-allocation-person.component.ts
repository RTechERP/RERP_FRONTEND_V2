import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
  AfterViewInit,
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { PhaseAllocationPersonService } from './phase-allocation-person-service/phase-allocation-person.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { forkJoin } from 'rxjs';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PhaseAllocationPersonFormComponent } from './phase-allocation-person-form/phase-allocation-person-form.component';
import { ChooseEmployeeComponent } from './choose-employee/choose-employee.component';
import { EmployeeService } from '../employee/employee-service/employee.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzGridModule,
    NzInputModule,
    NzSelectModule,
    NzTabsModule,
    NgbModalModule,
    NzModalModule,
    HasPermissionDirective,
  ],
  selector: 'app-phase-allocation-person',
  templateUrl: './phase-allocation-person.component.html',
  styleUrls: ['./phase-allocation-person.component.css'],
})
export class PhaseAllocationPersonComponent
  implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('masterTableRef', { static: true })
  masterTableRef!: ElementRef<HTMLDivElement>;
  @ViewChild('detailTableRef', { static: true })
  detailTableRef!: ElementRef<HTMLDivElement>;

  private ngbModal = inject(NgbModal);
  selectedRow: any = '';
  sizeTbDetail: any = '0';
  masterTable: Tabulator | null = null;
  detailTable: Tabulator | null = null;
  masterData: any[] = [];
  detailData: any[] = [];
  filterText: string = '';
  detailTabTitle: string = 'Chi tiết phân bổ';

  // Filter năm và tháng
  currentYear: number = new Date().getFullYear();
  currentMonth: number = new Date().getMonth() + 1;
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

  exportingExcel = false;
  exportingExcelDetail = false;
  allMasterData: any[] = []; // Lưu tất cả dữ liệu để filter local
  allDetailData: any[] = []; // Lưu tất cả dữ liệu detail để filter local

  formData: any = {
    master: { ID: 0, Year: this.currentYear, Month: this.currentMonth },
    details: [],
  };
  activeRowId: number | null = null;

  // Filter cho Master table
  masterFilterStatus: number | null = null;
  masterStatusOptions: { value: number | null; label: string }[] = [
    { value: null, label: 'Tất cả' },
    { value: 0, label: 'Chưa hoàn thành' },
    { value: 1, label: 'Đã hoàn thành' },
  ];

  // Filter cho Detail table
  detailFilterCode: string = '';
  detailFilterName: string = '';
  detailFilterStatus: number | null = null;
  detailStatusOptions: { value: number | null; label: string }[] = [
    { value: null, label: 'Tất cả' },
    { value: 0, label: 'Chưa nhận' },
    { value: 1, label: 'Đã nhận' },
  ];

  // Employee list để add nhân viên
  employeeList: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private phaseAllocationService: PhaseAllocationPersonService,
    private modal: NzModalService,
    private employeeService: EmployeeService
  ) {
    // Tạo danh sách năm (từ năm hiện tại - 5 đến năm hiện tại + 5)
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.yearOptions.push(i);
    }
  }

  ngAfterViewInit(): void {
    this.drawTable();
    this.loadData();
    this.loadEmployees();
  }

  ngOnInit() {
    // Không cần debounce nữa vì chỉ tìm kiếm khi nhấn Enter
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
      },
    });
  }

  loadData() {
    this.phaseAllocationService
      .getPhasedAllocationPerson(this.currentYear, this.currentMonth)
      .subscribe({
        next: (response) => {
          if (response && response.status === 1 && response.data) {
            this.allMasterData = Array.isArray(response.data)
              ? response.data
              : [];
            this.filterData();
          } else {
            this.allMasterData = [];
            if (this.masterTable) {
              this.masterTable.setData([]);
            }
          }
        },
        error: (error: any) => {
          console.error('Lỗi khi tải dữ liệu:', error);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải dữ liệu'
          );
          this.allMasterData = [];
          if (this.masterTable) {
            this.masterTable.setData([]);
          }
        },
      });
  }

  filterData() {
    if (!this.masterTable) return;

    let filteredData = [...this.allMasterData];

    // Filter theo trạng thái
    if (this.masterFilterStatus !== null) {
      filteredData = filteredData.filter((item: any) => {
        return item.StatusAllocation === this.masterFilterStatus;
      });
    }

    // Filter theo từ khóa tìm kiếm
    if (this.filterText && this.filterText.trim() !== '') {
      const keyword = this.filterText.toLowerCase().trim();
      filteredData = filteredData.filter((item: any) => {
        const code = (item.Code || '').toLowerCase();
        const name = (item.ContentAllocation || '').toLowerCase();
        const type = (item.TypeAllocationText || '').toLowerCase();
        const status = (item.StatusAllocationText || '').toLowerCase();
        return (
          code.includes(keyword) ||
          name.includes(keyword) ||
          type.includes(keyword) ||
          status.includes(keyword)
        );
      });
    }

    // Set dữ liệu đã filter vào table
    this.masterTable.setData(filteredData).then(() => {
      // Auto select dòng đầu tiên sau khi load dữ liệu
      if (filteredData.length > 0 && this.masterTable) {
        const rows = this.masterTable.getRows();
        if (rows.length > 0) {
          const firstRow = rows[0];
          firstRow.getElement().click();
        }
      }
    });
  }

  ngOnDestroy() {
    // Cleanup nếu cần
  }

  drawTable() {
    this.masterTable = new Tabulator(this.masterTableRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      data: [],
      paginationMode: 'local',
      rowFormatter: (row) => {
        const el = row.getElement();
        const data = row.getData();

        el.classList.toggle('row-focused', data['ID'] === this.activeRowId);
      },
      columns: [
        { title: 'ID', field: 'ID', visible: false },
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 70,
          sorter: 'number',
          bottomCalc: 'count',
        },
        {
          title: 'Mã cấp phát',
          field: 'Code',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: 'textarea',

        },
        {
          title: 'Nội dung cấp phát',
          field: 'ContentAllocation',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: 'textarea',

        },
        {
          title: 'Loại',
          field: 'TypeAllocationText',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Năm',
          field: 'YearValue',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Tháng',
          field: 'MontValue',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Trạng thái',
          field: 'StatusAllocationText',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: 'textarea',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Tìm trạng thái...',
        },
      ],
    });

    this.masterTable.on('rowClick', (evt, row: RowComponent) => {
      this.sizeTbDetail = null;
      const rowData = row.getData();
      this.selectedRow = rowData;
      const ID = rowData['ID'];
      const code = rowData['Code'] || '';
      this.activeRowId = ID;
      this.masterTable!.redraw(true); // 🔥 BẮT BUỘC

      // Cập nhật tiêu đề tab với mã phân bổ
      this.detailTabTitle = `Chi tiết phân bổ: ${code}`;

      this.phaseAllocationService
        .getPhasedAllocationPersonDetail(ID)
        .subscribe({
          next: (response) => {
            if (response && response.status === 1 && response.data) {
              this.detailData = Array.isArray(response.data)
                ? response.data
                : [];
              this.allDetailData = [...this.detailData];
              this.resetDetailFilters();
              this.drawDetailTable();
            } else {
              this.detailData = [];
              this.allDetailData = [];
              this.drawDetailTable();
            }
          },
          error: (error) => {
            console.error('Lỗi khi lấy chi tiết:', error);
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Lỗi khi tải chi tiết phân bổ'
            );
            this.detailData = [];
            this.allDetailData = [];
            this.drawDetailTable();
          },
        });
    });

    // this.masterTable.on('rowClick', (e: UIEvent, row: RowComponent) => {

    // });
  }

  private drawDetailTable(): void {
    if (this.detailTable) {
      this.detailTable.setData(this.detailData);
      return;
    }

    this.detailTable = new Tabulator(this.detailTableRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      height: '81vh',
      data: this.detailData,
      groupBy: 'DepartmentName',
      paginationMode: 'local',

      pagination: false,
      layout: 'fitDataStretch',
      columns: [
        {
          title: 'STT',
          formatter: 'rownum',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 50,
        },
        {
          title: 'Mã nhân viên',
          field: 'EmployeeCode',
          headerHozAlign: 'center',
          hozAlign: 'left',
          formatter: 'textarea',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Tìm mã...',
          bottomCalc: 'count'
        },
        {
          title: 'Tên nhân viên',
          field: 'EmployeeFullName',
          headerHozAlign: 'center',
          hozAlign: 'left',
          formatter: 'textarea',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Tìm tên...',
        },
        {
          title: 'Phòng ban',
          field: 'DepartmentName',
          headerHozAlign: 'center',
          hozAlign: 'left',
          formatter: 'textarea',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Tìm phòng ban...',
        },
        {
          title: 'Số lượng',
          field: 'Quantity',
          headerHozAlign: 'center',
          hozAlign: 'right',
          formatter: 'textarea',
          width: 50
        },
        {
          title: 'Đơn vị',
          field: 'UnitName',
          headerHozAlign: 'center',
          hozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Ngày nhận',
          field: 'DateReceive',
          headerHozAlign: 'center',
          hozAlign: 'center',
          width: 130,
          formatter: (cell) => {
            const value = cell.getValue();
            if (!value) return '';

            let dt;
            try {
              dt = DateTime.fromISO(value);
            } catch {
              const d = new Date(value);
              if (isNaN(d.getTime())) return '';
              dt = DateTime.fromJSDate(d);
            }

            return `
    <div style="line-height:1.2">
      <div>${dt.toFormat('dd/MM/yyyy')}</div>
      <div style="font-size:12px; color:#666">${dt.toFormat('HH:mm:ss')}</div>
    </div>
  `;
          }
        },
        {
          title: 'Trạng thái nhận',
          field: 'StatusReceive',
          headerHozAlign: 'center',
          hozAlign: 'center',
          width: 100,
          formatter: (cell) => {
            const value = cell.getValue();
            const checked =
              value === true ||
              value === 'true' ||
              value === 1 ||
              value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''
              } style="pointer-events: none; accent-color: #1677ff;" />`;
          },
          bottomCalc: (values) => {
            return values.filter(v =>
              v === true || v === 'true' || v === 1 || v === '1'
            ).length;
          },
          bottomCalcFormatter: (cell) => {
            return `Đã nhận: ${cell.getValue()}`;
          },
        },
      ],
    });
  }

  onAddPhaseAllocation() {
    const modalRef = this.ngbModal.open(PhaseAllocationPersonFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.dataInput = {
      ID: 0,
      Year: this.currentYear,
      Month: this.currentMonth,
    };
    modalRef.result.then(
      (result) => {
        this.loadData();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  getSelectedIds(): number[] {
    if (this.masterTable) {
      const selectedRows = this.masterTable.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }

  onDeletePhaseAllocation() {
    const selectedRows = this.masterTable?.getSelectedData?.() || [];
    if (!selectedRows.length) {
      this.notification.warning('Thông báo', 'Vui lòng chọn bản ghi cần xóa');
      return;
    }

    const count = selectedRows.length;
    const content = `Bạn có muốn xóa ${count} phân bổ đã chọn không?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: content,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const deleteRequests = selectedRows.map((row: any) => {
          const payload = {
            ID: row.ID,
            IsDeleted: true,
          };
          return this.phaseAllocationService.saveData(payload);
        });

        forkJoin(deleteRequests).subscribe({
          next: (responses: any[]) => {
            const success = responses.filter((r) => r?.status === 1).length;
            const failed = responses.length - success;

            if (failed === 0) {
              this.notification.success(
                'Thành công',
                `Đã xóa ${success} phân bổ.`
              );
            } else if (success === 0) {
              this.notification.error('Lỗi', 'Không xóa được phân bổ nào.');
            } else {
              this.notification.warning(
                'Kết quả',
                `Xóa thành công ${success}, lỗi ${failed}.`
              );
            }

            this.masterTable?.deselectRow?.(this.masterTable.getSelectedRows());
            this.loadData();
            this.detailData = [];
            this.detailTable?.setData?.([]);
          },
          error: (res: any) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              res.error?.message || 'Lỗi khi xóa'
            );
          },
        });
      },
    });
  }

  onEditPhaseAllocation() {
    // const selectedData = this.masterTable?.getSelectedData?.();
    // if (!selectedData || selectedData.length === 0) {
    //     this.notification.warning('Cảnh báo', 'Vui lòng chọn phân bổ cần sửa!');
    //     return;
    // }
    if (!this.selectedRow || this.selectedRow === null) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn cấp phát cần sửa!');
      return;
    }
    const selectedRow = this.selectedRow;
    const phasedID = selectedRow['ID'];

    // Gọi lại API để lấy detail mới nhất
    this.phaseAllocationService
      .getPhasedAllocationPersonDetail(phasedID)
      .subscribe({
        next: (response) => {
          const detailData = response?.data || [];

          const modalRef = this.ngbModal.open(
            PhaseAllocationPersonFormComponent,
            {
              size: 'xl',
              backdrop: 'static',
              keyboard: false,
              centered: true,
            }
          );
          modalRef.componentInstance.dataInput = {
            master: selectedRow,
            details: detailData,
          };
          modalRef.result.then(
            (result) => {
              this.loadData();
              // Reload lại detail nếu đang mở
              if (this.detailData.length > 0) {
                this.phaseAllocationService
                  .getPhasedAllocationPersonDetail(phasedID)
                  .subscribe((res) => {
                    if (res && res.status === 1 && res.data) {
                      this.detailData = Array.isArray(res.data) ? res.data : [];
                      this.detailTable?.setData?.(this.detailData);
                    }
                  });
              }
            },
            (dismissed) => {
              console.log('Modal dismissed');
            }
          );
        },
        error: (err) => {
          this.notification.error(
            'Lỗi',
            'Không thể lấy dữ liệu chi tiết phân bổ'
          );
          console.error(err);
        },
      });
  }

  onCopyAllocation() {
    if (!this.selectedRow || this.selectedRow === null) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn cấp phát cần copy!');
      return;
    }
    const selectedRow = this.selectedRow;
    const phasedID = selectedRow['ID'];
    this.phaseAllocationService
      .getPhasedAllocationPersonDetail(phasedID)
      .subscribe({
        next: (response) => {
          const detailData = response?.data || [];
          const masterCopy = { ...this.selectedRow };
          masterCopy.ID = 0;
          masterCopy.Code = masterCopy.Code + ' - COPY';
          masterCopy.ContentAllocation = masterCopy.ContentAllocation + ' - COPY';
          const detailCopy = detailData.map((row: any) => ({
            ...row,
            ID: 0
          }));
          const modalRef = this.ngbModal.open(
            PhaseAllocationPersonFormComponent,
            {
              size: 'xl',
              backdrop: 'static',
              keyboard: false,
              centered: true,
            }
          );
          modalRef.componentInstance.dataInput = {
            master: masterCopy,
            details: detailCopy,
          };
          modalRef.result.then(
            (result) => {
              this.loadData();
              // Reload lại detail nếu đang mở
              if (this.detailData.length > 0) {
                this.phaseAllocationService
                  .getPhasedAllocationPersonDetail(phasedID)
                  .subscribe((res) => {
                    if (res && res.status === 1 && res.data) {
                      this.detailData = Array.isArray(res.data) ? res.data : [];
                      this.detailTable?.setData?.(this.detailData);
                    }
                  });
              }
            },
            (dismissed) => {
              console.log('Modal dismissed');
            }
          );
        },
        error: (err) => {
          this.notification.error(
            'Lỗi',
            'Không thể lấy dữ liệu chi tiết phân bổ'
          );
          console.error(err);
        },
      });
  }

  closePanel() {
    this.sizeTbDetail = '0';
    this.detailData = [];
    this.allDetailData = [];
    this.detailTabTitle = 'Chi tiết phân bổ';
    if (this.detailTable) {
      this.detailTable.setData([]);
    }
  }

  // Reset các filter cho detail table
  resetDetailFilters() {
    this.detailFilterCode = '';
    this.detailFilterName = '';
    this.detailFilterStatus = null;
  }

  // Filter dữ liệu detail theo các tiêu chí
  filterDetailData() {
    if (!this.detailTable) return;

    let filteredData = [...this.allDetailData];

    // Filter theo mã nhân viên
    if (this.detailFilterCode && this.detailFilterCode.trim() !== '') {
      const keyword = this.detailFilterCode.toLowerCase().trim();
      filteredData = filteredData.filter((item: any) => {
        const code = (item.EmployeeCode || '').toLowerCase();
        return code.includes(keyword);
      });
    }

    // Filter theo tên nhân viên
    if (this.detailFilterName && this.detailFilterName.trim() !== '') {
      const keyword = this.detailFilterName.toLowerCase().trim();
      filteredData = filteredData.filter((item: any) => {
        const name = (item.EmployeeFullName || '').toLowerCase();
        return name.includes(keyword);
      });
    }

    // Filter theo trạng thái nhận
    if (this.detailFilterStatus !== null) {
      filteredData = filteredData.filter((item: any) => {
        const status = item.StatusReceive === 1 || item.StatusReceive === true || item.StatusReceive === '1' || item.StatusReceive === 'true';
        return this.detailFilterStatus === 1 ? status : !status;
      });
    }

    this.detailData = filteredData;
    this.detailTable.setData(this.detailData);
  }

  // Xử lý thay đổi filter detail
  onDetailFilterChange() {
    this.filterDetailData();
  }

  // Xử lý thay đổi filter master theo trạng thái
  onMasterFilterChange() {
    this.closePanel();
    this.filterData();
  }

  // Thêm nhân viên vào detail (giống form sửa đợt cấp phát)
  onAddEmployee() {
    if (!this.selectedRow || !this.selectedRow.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đợt cấp phát trước!');
      return;
    }

    if (!this.detailTable) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bảng chi tiết chưa được khởi tạo!');
      return;
    }

    // Lấy danh sách EmployeeID đã có trong detail
    const selectedEmployeeIds = new Set(
      this.allDetailData
        .map((r: any) => r.EmployeeID)
        .filter((id: number) => id > 0)
    );

    // Lọc employee chưa được chọn
    const availableEmployees = this.employeeList.filter(
      (emp) => !selectedEmployeeIds.has(emp.ID)
    );

    const modalRef = this.ngbModal.open(ChooseEmployeeComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });

    modalRef.componentInstance.employeeList = availableEmployees;

    modalRef.result.then(
      (selectedEmployees: any[]) => {
        if (!this.detailTable || !selectedEmployees?.length) return;

        const masterID = this.selectedRow.ID;

        // Lấy danh sách EmployeeID đã có
        const existingIds = new Set(
          this.allDetailData
            .map((r: any) => r.EmployeeID)
            .filter((id: number) => id > 0)
        );

        // Map employee được chọn → row detail để lưu
        const newDetails = selectedEmployees
          .filter((emp) => !existingIds.has(emp.ID))
          .map((emp) => ({
            ID: 0,
            EmployeeID: emp.ID,
            EmployeeCode: emp.Code || '',
            PhasedAllocationPersonID: masterID,
            StatusReceive: 0,
            Quantity: 1,
            UnitName: '',
            ContentReceive: '',
            IsDeleted: false,
          }));

        if (newDetails.length === 0) {
          this.notification.info('Thông báo', 'Không có nhân viên mới để thêm!');
          return;
        }

        // Gọi API lưu detail
        this.phaseAllocationService.saveDataDetail(newDetails).subscribe({
          next: (response) => {
            if (response && response.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                `Đã thêm ${newDetails.length} nhân viên thành công!`
              );
              // Reload lại detail
              this.phaseAllocationService
                .getPhasedAllocationPersonDetail(masterID)
                .subscribe((res) => {
                  if (res && res.status === 1 && res.data) {
                    this.detailData = Array.isArray(res.data) ? res.data : [];
                    this.allDetailData = [...this.detailData];
                    this.detailTable?.setData?.(this.detailData);
                  }
                });
            } else {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                response?.message || 'Lỗi khi thêm nhân viên'
              );
            }
          },
          error: (err) => {
            console.error('Lỗi khi thêm nhân viên:', err);
            this.notification.error(
              NOTIFICATION_TITLE.error,
              err.error?.message || 'Lỗi khi thêm nhân viên'
            );
          },
        });
      },
      () => {
        // dismissed
      }
    );
  }

  // Update trạng thái đã nhận cho các nhân viên được tick
  onUpdateReceived() {
    if (!this.detailTable) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bảng chi tiết chưa được khởi tạo!');
      return;
    }

    const selectedRows = this.detailTable.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên cần cập nhật!');
      return;
    }

    // Lọc chỉ những row chưa nhận
    const rowsToUpdate = selectedRows.filter((row: any) => {
      const status = row.StatusReceive === 1 || row.StatusReceive === true || row.StatusReceive === '1' || row.StatusReceive === 'true';
      return !status;
    });

    if (rowsToUpdate.length === 0) {
      this.notification.info('Thông báo', 'Tất cả nhân viên đã chọn đều đã nhận!');
      return;
    }

    const count = rowsToUpdate.length;
    const content = `Bạn có chắc muốn cập nhật trạng thái "Đã nhận" cho ${count} nhân viên?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận cập nhật',
      nzContent: content,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const masterID = this.selectedRow?.ID;
        if (!masterID) return;

        // Tạo payload để update
        const updatePayload = rowsToUpdate.map((row: any) => ({
          ID: row.ID,
          EmployeeID: row.EmployeeID,
          EmployeeCode: row.EmployeeCode || '',
          PhasedAllocationPersonID: masterID,
          StatusReceive: 1,
          DateReceive: new Date().toISOString(),
          Quantity: row.Quantity || 1,
          UnitName: row.UnitName || '',
          ContentReceive: row.ContentReceive || '',
          IsDeleted: false,
        }));

        this.phaseAllocationService.saveDataDetail(updatePayload).subscribe({
          next: (response) => {
            if (response && response.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                `Đã cập nhật ${count} nhân viên thành công!`
              );
              // Reload lại detail
              this.phaseAllocationService
                .getPhasedAllocationPersonDetail(masterID)
                .subscribe((res) => {
                  if (res && res.status === 1 && res.data) {
                    this.detailData = Array.isArray(res.data) ? res.data : [];
                    this.allDetailData = [...this.detailData];
                    this.detailTable?.setData?.(this.detailData);
                    this.detailTable?.deselectRow();
                  }
                });
            } else {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                response?.message || 'Lỗi khi cập nhật trạng thái'
              );
            }
          },
          error: (err) => {
            console.error('Lỗi khi cập nhật trạng thái:', err);
            this.notification.error(
              NOTIFICATION_TITLE.error,
              err.error?.message || 'Lỗi khi cập nhật trạng thái'
            );
          },
        });
      },
    });
  }

  searchPhaseAllocation() {
    // Đóng panel chi tiết khi tìm kiếm
    this.closePanel();
    this.filterData();
  }

  onYearChange() {
    // Đóng panel chi tiết khi thay đổi năm
    this.closePanel();
    this.loadData();
  }

  onMonthChange() {
    // Đóng panel chi tiết khi thay đổi tháng
    this.closePanel();
    this.loadData();
  }

  async exportToExcel() {
    if (!this.masterTable) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Bảng chưa được khởi tạo!'
      );
      return;
    }

    this.exportingExcel = true;

    try {
      // Lấy tất cả dữ liệu master
      const response = await this.phaseAllocationService
        .getPhasedAllocationPerson(this.currentYear, this.currentMonth)
        .toPromise();

      if (!response || response.status !== 1 || !response.data) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không có dữ liệu để xuất excel!'
        );
        this.exportingExcel = false;
        return;
      }

      const allMasterData = Array.isArray(response.data) ? response.data : [];

      if (allMasterData.length === 0) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không có dữ liệu để xuất excel!'
        );
        this.exportingExcel = false;
        return;
      }

      // Lấy chi tiết cho tất cả master
      const detailRequests = allMasterData.map((master: any) =>
        this.phaseAllocationService
          .getPhasedAllocationPersonDetail(master.ID)
          .toPromise()
      );

      const detailResponses = await Promise.all(detailRequests);

      // Chuẩn bị dữ liệu xuất
      const exportData = allMasterData.map((master: any, idx: number) => {
        const detailResponse = detailResponses[idx];
        const details =
          detailResponse?.data && Array.isArray(detailResponse.data)
            ? detailResponse.data
            : [];

        const formatDate = (val: any) => {
          if (!val) return '';
          try {
            return DateTime.fromISO(val).toFormat('dd/MM/yyyy HH:mm');
          } catch {
            const date = new Date(val);
            return isNaN(date.getTime())
              ? ''
              : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy HH:mm');
          }
        };

        return {
          STT: idx + 1,
          'Mã cấp phát': master.Code || '',
          'Nội dung cấp phát': master.ContentAllocation || '',
          Năm: master.YearValue || '',
          Tháng: master.MonthValue || '',
          'Ngày tạo': formatDate(master.CreatedDate),
          'Số lượng nhân viên': details.length,
          'Danh sách nhân viên': details
            .map((d: any) => `${d.EmployeeCode} - ${d.EmployeeFullName}`)
            .join('; '),
        };
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('CAPPHAT');

      // Thêm header
      worksheet.columns = [
        {
          header: 'STT',
          key: 'STT',
          width: 8,
          style: { alignment: { horizontal: 'center', vertical: 'middle' } },
        },
        { header: 'Mã cấp phát', key: 'Mã cấp phát', width: 20 },
        { header: 'Nội dung cấp phát', key: 'Nội dung cấp phát', width: 50 },
        { header: 'Năm', key: 'Năm', width: 10 },
        { header: 'Tháng', key: 'Tháng', width: 10 },
        { header: 'Ngày tạo', key: 'Ngày tạo', width: 18 },
        { header: 'Số lượng nhân viên', key: 'Số lượng nhân viên', width: 20 },
        {
          header: 'Danh sách nhân viên',
          key: 'Danh sách nhân viên',
          width: 50,
        },
      ];

      // Thêm dữ liệu
      exportData.forEach((row: any) => worksheet.addRow(row));

      // Định dạng header
      worksheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
        cell.font = {
          name: 'Times New Roman',
          size: 10,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true,
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1677FF' },
        };
      });
      worksheet.getRow(1).height = 30;

      // Định dạng các dòng dữ liệu
      worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber !== 1) {
          row.height = 30;
          row.getCell('STT').alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
          };
          row.getCell('STT').font = { name: 'Times New Roman', size: 10 };

          ['Năm', 'Tháng', 'Ngày tạo', 'Số lượng nhân viên'].forEach(
            (colName: string) => {
              const cell = row.getCell(colName);
              if (cell) {
                cell.alignment = {
                  horizontal: 'center',
                  vertical: 'middle',
                  wrapText: true,
                };
                cell.font = { name: 'Times New Roman', size: 10 };
              }
            }
          );

          row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
            const headerValue =
              worksheet.getRow(1).getCell(colNumber).value?.toString() || '';
            if (
              colNumber !== 1 &&
              !['Năm', 'Tháng', 'Ngày tạo', 'Số lượng nhân viên'].includes(
                headerValue
              )
            ) {
              cell.font = { name: 'Times New Roman', size: 10 };
              cell.alignment = {
                horizontal: 'left',
                vertical: 'middle',
                wrapText: true,
              };
            }
          });
        }
      });

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileName = `CapPhat_${this.currentYear}_${String(
        this.currentMonth
      ).padStart(2, '0')}.xlsx`;
      saveAs(blob, fileName);

      this.notification.success(
        NOTIFICATION_TITLE.success,
        'Xuất Excel thành công!'
      );
    } catch (error: any) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Lỗi khi xuất Excel: ' + error.message
      );
    } finally {
      this.exportingExcel = false;
    }
  }

  async exportDetailToExcel() {
    if (!this.selectedRow || !this.selectedRow.ID) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một dòng để xuất chi tiết!'
      );
      return;
    }

    if (!this.detailData || this.detailData.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu chi tiết để xuất!'
      );
      return;
    }

    this.exportingExcelDetail = true;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Chi tiết phân bổ');

      // Helper format date
      const formatDate = (val: any) => {
        if (!val) return '';
        try {
          return DateTime.fromISO(val).toFormat('dd/MM/yyyy HH:mm');
        } catch {
          const date = new Date(val);
          return isNaN(date.getTime())
            ? ''
            : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy HH:mm');
        }
      };

      // Thêm thông tin master
      worksheet.addRow(['Mã cấp phát:', this.selectedRow.Code || '']);
      worksheet.addRow(['Nội dung cấp phát:', this.selectedRow.ContentAllocation || '']);
      worksheet.addRow(['Năm:', this.selectedRow.YearValue || '']);
      worksheet.addRow(['Tháng:', this.selectedRow.MontValue || '']);
      worksheet.addRow([]); // Dòng trống

      // Style cho thông tin master
      for (let i = 1; i <= 4; i++) {
        const row = worksheet.getRow(i);
        row.getCell(1).font = { name: 'Times New Roman', size: 12, bold: true };
        row.getCell(2).font = { name: 'Tahoma', size: 8.5 };
      }

      // Header chi tiết - dòng 6
      const headerRow = worksheet.addRow([
        'STT',
        'Mã nhân viên',
        'Tên nhân viên',
        'Số lượng',
        'Đơn vị',
        'Ngày nhận',
        'Trạng thái nhận'
      ]);

      // Style header: Font 12 Times New Roman, background xanh lá nhạt, border
      headerRow.eachCell((cell: ExcelJS.Cell) => {
        cell.font = {
          name: 'Times New Roman',
          size: 12,
          bold: true,
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true,
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF90EE90' }, // Light green
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      headerRow.height = 25;

      // Nhóm dữ liệu theo phòng ban
      const groupedData: { [key: string]: any[] } = {};
      this.detailData.forEach((detail: any) => {
        const deptName = detail.DepartmentName || 'Chưa xác định';
        if (!groupedData[deptName]) {
          groupedData[deptName] = [];
        }
        groupedData[deptName].push(detail);
      });

      // Thêm dữ liệu chi tiết theo nhóm phòng ban
      let totalReceivedCount = 0;
      let globalIndex = 0;

      Object.keys(groupedData).sort().forEach((deptName: string) => {
        const deptEmployees = groupedData[deptName];
        let deptReceivedCount = 0;

        // Dòng tiêu đề phòng ban
        const deptHeaderRow = worksheet.addRow([
          'Phòng ban: ' + deptName,
          '',
          '',
          '',
          '',
          '',
          ''
        ]);
        // Merge cells cho tên phòng ban
        worksheet.mergeCells(deptHeaderRow.number, 1, deptHeaderRow.number, 7);
        deptHeaderRow.getCell(1).font = {
          name: 'Tahoma',
          size: 10,
          bold: true,
        };
        deptHeaderRow.getCell(1).alignment = {
          horizontal: 'left',
          vertical: 'middle',
        };
        deptHeaderRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFB0E0E6' }, // Light blue (Powder Blue)
        };
        deptHeaderRow.getCell(1).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        deptHeaderRow.height = 22;

        // Thêm nhân viên trong phòng ban
        deptEmployees.forEach((detail: any) => {
          globalIndex++;
          const statusReceive = detail.StatusReceive === true ||
            detail.StatusReceive === 'true' ||
            detail.StatusReceive === 1 ||
            detail.StatusReceive === '1';

          if (statusReceive) {
            deptReceivedCount++;
            totalReceivedCount++;
          }

          const dataRow = worksheet.addRow([
            globalIndex,
            detail.EmployeeCode || '',
            detail.EmployeeFullName || '',
            detail.Quantity || '',
            detail.UnitName || '',
            formatDate(detail.DateReceive),
            statusReceive ? '✓' : ''
          ]);

          // Style dữ liệu: Font 8.5 Tahoma, border
          dataRow.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
            cell.font = {
              name: 'Tahoma',
              size: 8.5,
            };
            cell.alignment = {
              horizontal: colNumber === 1 || colNumber === 4 || colNumber === 6 || colNumber === 7 ? 'center' : 'left',
              vertical: 'middle',
              wrapText: true,
            };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
            // Màu xanh lá cho dấu tích ở cột trạng thái
            if (colNumber === 7 && statusReceive) {
              cell.font = {
                name: 'Tahoma',
                size: 12,
                bold: true,
                color: { argb: 'FF008000' }, // Green
              };
            }
          });
        });

        // Dòng tổng kết phòng ban
        const deptCountRow = worksheet.addRow([
          '',
          'Số lượng: ' + deptEmployees.length,
          '',
          '',
          '',
          '',
          'Đã nhận: ' + deptReceivedCount + '/' + deptEmployees.length
        ]);
        deptCountRow.eachCell((cell: ExcelJS.Cell) => {
          cell.font = {
            name: 'Tahoma',
            size: 8.5,
            italic: true,
          };
          cell.alignment = {
            horizontal: 'left',
            vertical: 'middle',
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });

      // Thêm dòng tổng cộng cuối cùng
      const countRow = worksheet.addRow([
        'TỔNG CỘNG:',
        this.detailData.length + ' nhân viên',
        '',
        '',
        '',
        '',
        'Đã nhận: ' + totalReceivedCount + '/' + this.detailData.length
      ]);
      countRow.eachCell((cell: ExcelJS.Cell) => {
        cell.font = {
          name: 'Times New Roman',
          size: 12,
          bold: true,
        };
        cell.alignment = {
          horizontal: 'left',
          vertical: 'middle',
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFD700' }, // Gold
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      countRow.height = 22;

      // Set column widths
      worksheet.columns = [
        { width: 8 },   // STT
        { width: 15 },  // Mã NV
        { width: 35 },  // Tên NV
        { width: 12 },  // Số lượng
        { width: 12 },  // Đơn vị
        { width: 18 },  // Ngày nhận
        { width: 15 },  // Trạng thái
      ];

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileName = `ChiTietPhanBo_${this.selectedRow.Code || 'NoCode'}_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.xlsx`;
      saveAs(blob, fileName);

      this.notification.success(
        NOTIFICATION_TITLE.success,
        'Xuất Excel chi tiết thành công!'
      );
    } catch (error: any) {
      console.error('Lỗi xuất Excel chi tiết:', error);
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Lỗi khi xuất Excel chi tiết: ' + error.message
      );
    } finally {
      this.exportingExcelDetail = false;
    }
  }
}
