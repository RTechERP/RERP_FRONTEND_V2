import { Title } from '@angular/platform-browser';
import {
  Component,
  Input,
  TemplateRef,
  ViewEncapsulation,
  ChangeDetectorRef,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { firstValueFrom } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { VehicleManagementService } from '../../../vehicle-management/vehicle-management.service';
import { VehicleCategoryComponent } from '../../../vehicle-management/vehicle-category/vehicle-category.component';
import { VehicleManagementFormComponent } from '../../../vehicle-management/vehicle-management-form/vehicle-management-form.component';
import { CommonModule } from '@angular/common';
import { DEFAULT_TABLE_CONFIG } from '../../../../../../tabulator-default.config';
import { inject } from '@angular/core';
const COL = {
  number: 'number',
  date: 'date',
  money: 'money',
  multiline: 'multiline',
} as const;
type ColumnType = (typeof COL)[keyof typeof COL];
type ColumnDef = { key: string; type?: ColumnType };
import * as ExcelJS from 'exceljs';
import { VehicleRepairService } from '../../../vehicle-repair/vehicle-repair-service/vehicle-repair.service';
import { VehicleRepairHistoryService } from '../vehicle-repair-history-service/vehicle-repair-history-service.service';
import { VehicleRepairComponentFormComponent } from '../../../vehicle-repair/vehicle-repair-component-form/vehicle-repair-component-form.component';
import { VehicleRepairHistoryFormComponent } from '../vehicle-repair-history-form/vehicle-repair-history-form.component';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
@Component({
  standalone: true,
  selector: 'app-vehicle-repair-history',
  imports: [
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    CommonModule,
    NzUploadModule,
  ],
  templateUrl: './vehicle-repair-history.component.html',
  styleUrl: './vehicle-repair-history.component.css',
})
export class VehicleRepairHistoryComponent implements AfterViewInit {
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private VehicleManagementService: VehicleManagementService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private vehicleRepairHistoryService: VehicleRepairHistoryService,
    private VehicleRepairService: VehicleRepairService,
    private cdr: ChangeDetectorRef
  ) {}
  @ViewChild('tbVehicleManagement', { static: false })
  tbVehicleManagementEl!: ElementRef;
  @ViewChild('vehicleRepairHistoryTable', { static: false })
  vehicleRepairHistoryTableEl!: ElementRef;
  searchText: string = '';
  private ngbModal = inject(NgbModal);
  tb_vehicleManagement: Tabulator | null = null;
  vehicleMnagemens: any[] = [];
  selectedRow: any;
  selectedID: number = 0;
  showFilePanel = false;
  sizeTbDetail: any = '0';
  sizeFilePanel: any = '0'; // Size của panel file đính kèm (0 = ẩn)
  vehicleRepairHistorys: any[] = [];
  vehicleRepairHistoryFile: any[] = [];
  vehicleRepairHistoryTable: Tabulator | null = null;
  vehicleRepairHistoryFileTable: Tabulator | null = null;
  ngAfterViewInit(): void {
    this.getVehicleManagement();
  }
  async getVehicleManagement() {
    this.VehicleManagementService.getVehicleManagement().subscribe({
      next: (response: any) => {
        console.log('tb_vehicleManagement', response.data);
        var list: any = response.data;
        this.vehicleMnagemens = list.filter(
          (x: any) => x.VehicleCategoryID === 1
        );

        this.drawTbVehicle();
        this.drawTableDetail();
        this.drawTableFile();
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }
  onSearch() {
    if (this.tb_vehicleManagement) {
      if (!this.searchText.trim()) {
        this.tb_vehicleManagement.clearFilter(false); // <-- Thêm false ở đây
      } else {
        this.tb_vehicleManagement.setFilter([
          [
            { field: 'DriverName', type: 'like', value: this.searchText },
            { field: 'LicensePlate', type: 'like', value: this.searchText },
            { field: 'VehicleName', type: 'like', value: this.searchText },
            { field: 'STT', type: 'like', value: this.searchText },
            { field: 'PhoneNumber', type: 'like', value: this.searchText },
          ],
        ]);
      }
    }
  }
  drawTbVehicle() {
    if (!this.tbVehicleManagementEl) return;

    this.tb_vehicleManagement = new Tabulator(
      this.tbVehicleManagementEl.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        height: '88vh',
        groupBy: 'VehicleCategoryText',
        selectableRows: 1,
        data: this.vehicleMnagemens,
        columns: [
          {
            title: 'STT',
            field: 'STT',
            headerHozAlign: 'center',
          },
          {
            title: 'Tên xe',
            field: 'VehicleName',
            headerHozAlign: 'center',
            width: 200,
          },
          {
            title: 'Biển số',
            field: 'LicensePlate',
            headerHozAlign: 'center',
            width: 200,
          },
          {
            title: 'Chỗ ngồi',
            field: 'Slot',
            headerHozAlign: 'center',
            hozAlign: 'right',
          },
          {
            title: 'Lái xe',
            field: 'DriverName',
            headerHozAlign: 'center',
            width: 200,
          },
          {
            title: 'Liên hệ',
            field: 'PhoneNumber',
            headerHozAlign: 'center',
          },
        ],
      }
    );

    this.tb_vehicleManagement.on('rowClick', (evt, row: RowComponent) => {
      const rowData = row.getData();
      const ID = rowData['ID'];
      this.vehicleRepairHistoryService
        .getVehicleRepairHistory(ID)
        .subscribe((respon) => {
          setTimeout(() => {
            this.drawTableDetail();
            this.drawTableFile();
          }, 0);
          this.vehicleRepairHistorys = respon.data.dataList;
          this.vehicleRepairHistoryFile = respon.data.fileList;
          console.log('responseđw', respon);
          console.log(
            'proposeVehicleRepairDetailData',
            this.vehicleRepairHistorys
          );
          console.log(
            'proposeVehicleRepairDetailFile',
            this.vehicleRepairHistoryFile
          );
        });
    });
    this.tb_vehicleManagement.on(
      'rowClick',
      (e: UIEvent, row: RowComponent) => {
        this.selectedRow = row.getData();
        this.sizeTbDetail = null;
        this.sizeFilePanel = '0'; // Reset file panel khi chọn xe mới
      }
    );
  }
  closePanel() {
    this.sizeTbDetail = '0';
  }
  drawTableFile() {
    const element = document.getElementById('vehicleRepairHistoryFileTable');
    if (!element) {
      console.warn(
        'Element #vehicleRepairHistoryFileTable not found, retrying...'
      );
      setTimeout(() => this.drawTableFile(), 100);
      return;
    }

    if (this.vehicleRepairHistoryFileTable) {
      this.vehicleRepairHistoryFileTable.setData(this.vehicleRepairHistoryFile);
      // Redraw để đảm bảo bảng hiển thị đúng
      setTimeout(() => {
        this.vehicleRepairHistoryFileTable?.redraw(true);
      }, 50);
    } else {
      this.vehicleRepairHistoryFileTable = new Tabulator(
        '#vehicleRepairHistoryFileTable',
        {
          data: this.vehicleRepairHistoryFile,
          height: '100%',
          rowContextMenu: [
            {
              label: '🖼️ Preview file',
              action: (_e, row) => this.openPreviewByRow(row.getData()),
            },
          ],
          paginationMode: 'local',
          columns: [
            {
              title: 'STT',
              formatter: 'rownum',
              hozAlign: 'center',
              width: 60,
            },
            {
              title: 'File',
              field: 'FileName',
              minWidth: 180,
              formatter: (cell) => {
                const name = cell.getValue() || 'Preview';
                return `<a href="javascript:void(0)" class="preview-link">${name}</a>`;
              },
              cellClick: (_e, cell) =>
                this.openPreviewByRow(cell.getRow().getData()),
            },
            {
              title: 'Đường dẫn Server',
              field: 'ServerPath',
              width: 500,
            },
          ],
        }
      );
    }
  }
  private openPreviewByRow(d: any) {
    const full = d?.FilePath || d?.ServerPath || '';
    if (!full) {
      this.notification.warning('Thông báo', 'Không có FilePath');
      return;
    }
    const url = this.VehicleRepairService.buildPreviewUrl(full);
    window.open(url, '_blank');
  }
  drawTableDetail() {
    if (!this.vehicleRepairHistoryTableEl) return;

    if (this.vehicleRepairHistoryTable) {
      this.vehicleRepairHistoryTable.setData(this.vehicleRepairHistorys);
    } else {
      this.vehicleRepairHistoryTable = new Tabulator(
        this.vehicleRepairHistoryTableEl.nativeElement,
        {
          data: this.vehicleRepairHistorys,
          selectableRows: 1,
          paginationMode: 'local',
          ...DEFAULT_TABLE_CONFIG,
          height: '100%', // Dùng 100% thay vì 83vh vì giờ nằm trong splitter

          columns: [
            {
              title: 'THÔNG TIN ĐỀ XUẤT - PHÊ DUYỆT',
              cssClass: 'group-approve',

              columns: [
                { title: 'STT', field: 'STT', hozAlign: 'center', width: 60 },

                // { title: 'Người duyệt', field: 'ApproveName', width: 190 },
                {
                  title: 'Ngày nhận đề xuất từ lái xe',
                  field: 'DateReport',
                  width: 120,
                  hozAlign: 'center',
                  formatter: (cell) => {
                    const v = cell.getValue();
                    if (!v) return '';
                    const d = new Date(v);
                    return d.toLocaleDateString('vi-VN');
                  },
                },
                {
                  title: 'Người đề xuất',
                  field: 'EmployeePropose',
                  width: 120,
                },
                {
                  title: 'Nội dung đề xuất',
                  field: 'ProposeContent',
                  width: 120,
                  formatter: 'textarea',
                },
                {
                  title: 'Lý do',
                  field: 'Reason',
                  width: 120,
                  formatter: 'textarea',
                },

                {
                  title: 'Ngày phê duyệt',
                  field: 'DateApprove',
                  width: 120,
                  hozAlign: 'center',
                  formatter: (cell) => {
                    const v = cell.getValue();
                    if (!v) return '';
                    const d = new Date(v);
                    return d.toLocaleDateString('vi-VN');
                  },
                },
              ],
            },
            {
              cssClass: 'group-info',
              title: 'THÔNG TIN HẠNG MỤC',
              columns: [
                { title: 'Đơn vị tính', field: 'Unit', width: 100 },
                {
                  title: 'Số lượng',
                  field: 'Quantity',
                  hozAlign: 'right',
                  width: 100,
                },
                {
                  title: 'Đơn giá',
                  field: 'UnitPrice',
                  hozAlign: 'right',
                  formatter: 'money',
                  width: 120,
                  formatterParams: {
                    decimal: ',',
                    thousand: '.',
                    symbol: 'đ',
                    symbolAfter: true,
                    precision: 0,
                  },
                },
                {
                  title: 'Thành tiền',
                  field: 'TotalPrice',
                  hozAlign: 'right',
                  formatter: 'money',
                  width: 120,
                  formatterParams: {
                    decimal: ',',
                    thousand: '.',
                    symbol: 'đ',
                    symbolAfter: true,
                    precision: 0,
                  },
                },
                {
                  title: 'Ngày thực hiện',
                  field: 'TimeStartRepair',
                  width: 120,
                  hozAlign: 'center',
                  formatter: (cell) => {
                    const v = cell.getValue();
                    if (!v) return '';
                    const d = new Date(v);
                    return d.toLocaleDateString('vi-VN');
                  },
                },
                { title: 'Thời gian bảo hành' },
              ],
            },
            {
              cssClass: 'group-ncc',
              title: 'THÔNG TIN NHÀ CUNG CẤP',
              columns: [
                { title: 'Tên NCC', field: 'GaraName', width: 200 },
                { title: 'Địa chỉ', field: 'AddressGara', width: 200 },
                { title: 'Liên hệ', field: 'SDTGara', width: 150 },
                {
                  title: 'VehicleRepairTypeID',
                  field: 'VehicleRepairTypeID',
                  width: 120,
                  visible: false,
                },
              ],
            },

            {
              title: 'Ghi chú',
              field: 'Note',
              width: 250,
              formatter: 'textarea',
            },
          ],
        }
      );
      this.vehicleRepairHistoryTable.on(
        'rowClick',
        (evt, row: RowComponent) => {
          const rowData = row.getData();
          const ID = rowData['ID'];
          this.vehicleRepairHistoryService
            .getVehicleRepairHistoryFile(ID)
            .subscribe({
              next: (respon) => {
                this.vehicleRepairHistoryFile = respon.data.dataList || [];
                console.log('responseđw', respon);
                console.log(
                  'proposeVehicleRepairDetailData',
                  this.vehicleRepairHistorys
                );
                console.log(
                  'proposeVehicleRepairDetailFile',
                  this.vehicleRepairHistoryFile
                );

                // Hiển thị panel file đính kèm (30% chiều cao)
                this.sizeFilePanel = '30%';
                this.cdr.detectChanges();

                // Đợi panel được render xong rồi mới vẽ bảng
                setTimeout(() => {
                  this.drawTableFile();
                }, 150);
              },
              error: (err) => {
                console.error('Error loading files:', err);
                this.notification.error(
                  'Thông báo',
                  'Không thể tải danh sách file đính kèm'
                );
              },
            });
        }
      );
    }
  }
  onAddVehicle() {
    const modalRef = this.modalService.open(VehicleManagementFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.result.then(
      (result) => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Tạo sản phẩm thành công');
        setTimeout(() => this.getVehicleManagement(), 100);
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  createdText(text: String) {
    return `<span class="fs-12">${text}</span>`;
  }
  onDeleteVehicle() {
    if (!this.selectedID || this.selectedID === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn xe để xóa!');
      return;
    }

    this.modal.confirm({
      nzTitle: this.createdText('Bạn có chắc muốn xóa dự án đã chọn?'),
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const status = {
          ID: this.selectedID,
          IsDeleted: true,
        };
        this.VehicleManagementService.saveDataVehicleManagement(
          status
        ).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success(
                'Thông báo',
                'Xóa lĩnh vực dự án thành công'
              );
              setTimeout(() => this.getVehicleManagement(), 100);
            } else {
              this.notification.warning(NOTIFICATION_TITLE.warning, 'Thất bại');
            }
          },
          error: (err) => {
            console.error(err);
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Lỗi kết nối');
          },
        });
      },
    });
  }
  onViewVehicleCategory() {
    const modalRef = this.modalService.open(VehicleCategoryComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.result.then(
      (result) => {},
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  //#region Xuất excel
  async exportToExcel() {
    let table = this.tb_vehicleManagement;
    if (!table) return;
    let data = table.getData();
    if (!data || data.length === 0) {
      this.notification.error('', 'Không có dữ liệu để xuất!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lĩnh vực dự án');
    const columns = table.getColumns();

    const headers = columns.map((col: any) => col.getDefinition().title);

    // Thêm dòng header và lưu lại dòng đó để thao tác
    const headerRow = worksheet.addRow(headers);

    // Gán style màu xám cho từng ô trong dòng header
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D9D9D9' }, // Màu xám nhạt
      };
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    data.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });
      worksheet.addRow(rowData);
    });

    const startRow = 2;
    const column = 'A';

    const rowCount = worksheet.rowCount;

    for (let i = startRow; i <= rowCount - 2; i += 3) {
      const cell1 = worksheet.getCell(`${column}${i}`);
      const cell2 = worksheet.getCell(`${column}${i + 1}`);
      const cell3 = worksheet.getCell(`${column}${i + 2}`);

      if (cell1.value === cell2.value && cell1.value === cell3.value) {
        worksheet.mergeCells(`${column}${i}:${column}${i + 2}`);
        // Căn giữa nếu cần
        cell1.alignment = { vertical: 'middle' };
      }
    }

    // Format cột có giá trị là Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: columns.length,
      },
    };

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.alignment = {
          ...cell.alignment,
          wrapText: true,
          vertical: 'middle', // tùy chọn: căn giữa theo chiều dọc
        };
      });
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Timelinecongviec.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  addVehicleRepair() {
    // yêu cầu chọn dòng trước
    if (!this.selectedID) {
      this.notification.warning(
        'Thông báo',
        'Chọn xe trước khi thêm sửa chữa.'
      );
      return;
    }

    const modalRef = this.ngbModal.open(VehicleRepairComponentFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    // truyền tối thiểu ID; truyền thêm tên/biển số để hiển thị tức thì nếu muốn
    modalRef.componentInstance.dataInput = {
      VehicleManagementID: this.selectedID,
      VehicleName: this.selectedRow?.VehicleName,
      LicensePlate: this.selectedRow?.LicensePlate,
      EmployeeID: this.selectedRow?.EmployeeID, // nếu backend có
    };

    modalRef.result.then(
      () => this.getVehicleManagement(),
      () => {}
    );
  }
  private detailCache = new Map<number, any[]>();
  editProposeVehicleRepair() {
    const sel = this.vehicleRepairHistoryTable?.getSelectedData() || [];
    if (!sel.length) {
      this.notification.warning(
        'Thông báo',
        'Chọn một dòng nhà cung cấp trong danh sách lịch sử sửa chữa để bổ sung thông tin sửa chữa'
      );
      return;
    }

    const rowData = { ...sel[0] };
    const details = this.detailCache.get(rowData.ID) || null;
    this.vehicleRepairHistoryService
      .getVehicleRepairHistoryFile(rowData.ID)
      .subscribe({
        next: (res) => {
          console.log('Existing files:', res);
          const files = res?.data?.dataList || []; // [{ID,FileName,ServerPath,OriginName,...}]
          const modalRef = this.ngbModal.open(
            VehicleRepairHistoryFormComponent,
            {
              size: 'xl',
              backdrop: 'static',
              keyboard: false,
              centered: true,
            }
          );
          modalRef.componentInstance.dataInput = rowData;
          modalRef.componentInstance.prefetchedDetails = details;
          modalRef.componentInstance.existingFiles = files; // <-- truyền danh sách file đã có

          modalRef.result
            .then(() => {
              this.getVehicleManagement();
              this.drawTableDetail();
              this.drawTableFile();
            })
            .catch(() => {});
        },
        error: () =>
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Không lấy được danh sách file'
          ),
      });
  }
  async exportAllVehicles_ByTemplateRow5() {
    const vehicles = this.vehicleMnagemens || [];
    if (!vehicles.length) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu xe');
      return;
    }

    const templateUrl = 'assets/templateForm/MauTheoDoiXe.xlsx';
    const tmplWb = await this.loadTemplate(templateUrl);
    const tmpl = tmplWb.getWorksheet('Template') ?? tmplWb.worksheets[0];
    if (!tmpl) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không thấy sheet Template'
      );
      return;
    }

    const outWb = new ExcelJS.Workbook();

    for (const v of vehicles) {
      const res = await firstValueFrom(
        this.vehicleRepairHistoryService.getVehicleRepairHistory(v.ID)
      ).catch(() => null);
      const rows = res?.data?.dataList || [];

      // Gọi API lấy file riêng cho từng history
      const fileTasks = (rows || []).map((r: any) =>
        firstValueFrom(
          this.vehicleRepairHistoryService.getVehicleRepairHistoryFile(r.ID)
        )
          .then((res: any) => ({ id: r.ID, files: res?.data?.dataList || [] }))
          .catch(() => ({ id: r.ID, files: [] }))
      );
      const perRowFiles = await Promise.all(fileTasks);

      // Map file theo từng ID
      const filesByHistory: Record<number, { name: string; path: string }[]> =
        {};
      for (const x of perRowFiles) {
        const hid = Number(x.id);
        const list = (x.files || []).map((f: any) => ({
          name: f.OriginName || f.FileName || '',
          path: f.ServerPath || '',
        }));
        filesByHistory[hid] = list;
      }

      // gom file theo ID history
      // sheet theo xe
      const wsName = this.safeSheetName(
        `${v?.VehicleName || 'Xe'} - ${v?.LicensePlate || v?.ID}`
      );
      const ws = outWb.addWorksheet(wsName);
      this.cloneTemplateInto(tmpl, ws);

      // thay token tiêu đề nếu có
      this.fillTokens(ws, {
        '{{VehicleName}}': v?.VehicleName ?? '',
        '{{LicensePlate}}': v?.LicensePlate ?? '',
        '{{DriverName}}': v?.DriverName ?? '',
        '{{Phone}}': v?.PhoneNumber ?? '',
      });
      const titleCell = ws.getCell('A1'); // đúng ô chứa dòng tiêu đề
      if (typeof titleCell.value === 'string') {
        const vehicleName = v?.VehicleName || '';
        const licensePlate = v?.LicensePlate || '';

        const display = `${vehicleName}`.toUpperCase();

        titleCell.value = (titleCell.value as string).replace('XXX', display);
      }
      // mapping cột đúng thứ tự template. BẮT ĐẦU từ dòng 5.
      const START_ROW = 5;
      const columns: ColumnDef[] = [
        { key: 'STT' },
        { key: 'DateReport', type: COL.date },
        { key: 'EmployeeRepairName' },
        { key: 'ProposeContent' },
        { key: 'Reason' },
        { key: 'DateApprove', type: COL.date },
        { key: 'Unit' },
        { key: 'Quantity', type: COL.number },
        { key: 'UnitPrice', type: COL.money },
        { key: 'TotalPrice', type: COL.money },
        { key: 'TimeEndRepair', type: COL.date },
        { key: 'WarrantyPeriod' },
        { key: 'LinkChungTu', type: COL.multiline },
        { key: 'GaraName' },
        { key: 'AddressGara' },
        { key: 'SDTGara' },
        { key: 'Note' },
      ];
      // chuẩn hóa data theo mapping
      const data = rows.map((r: any, i: number) => {
        const hid = Number(r?.ID ?? 0);
        const list = filesByHistory[hid] || [];
        const fileLinks = list
          .map((f, idx) => `${idx + 1}) ${f.path}`)
          .join('\n');

        return {
          STT: i + 1,
          DateReport: r?.DateReport,
          EmployeeRepairName: r?.EmployeeRepairName ?? r?.ApproveName ?? '',
          ProposeContent:
            r?.ProposeContent ?? r?.Content ?? r?.VehicleRepairTypeName ?? '',
          Reason: r?.Reason ?? '',
          DateApprove: r?.DateApprove ?? r?.DateReportApprove ?? '',
          Unit: r?.Unit ?? '',
          Quantity: r?.Quantity ?? null,
          UnitPrice: r?.UnitPrice ?? null,
          TotalPrice: r?.TotalPrice ?? null,
          TimeEndRepair: r?.TimeEndRepair ?? r?.DateImplement ?? '',
          WarrantyPeriod: r?.WarrantyPeriod ?? '',
          LinkChungTu: fileLinks, // <-- toàn bộ ServerPath
          GaraName: r?.GaraName ?? '',
          AddressGara: r?.AddressGara ?? '',
          SDTGara: r?.SDTGara ?? '',
          Note: r?.Note ?? '',
        };
      });
      // ghi data từ dòng 5, cột 1
      this.writeDataAt(ws, START_ROW, 1, columns, data);
    }

    await this.downloadXlsx(outWb, `TheoDoiXe_${this.dateStamp()}.xlsx`);
  }

  // ==== helpers ====
  private async loadTemplate(url: string): Promise<ExcelJS.Workbook> {
    const resp = await fetch(url);

    if (!resp.ok) {
      throw new Error(
        `Không tải được template: ${url} - status ${resp.status}`
      );
    }

    const buf = await resp.arrayBuffer();
    console.log('Template byteLength = ', buf.byteLength);

    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buf);
    } catch (e) {
      // debug xem có phải trả về HTML không
      const text = new TextDecoder().decode(new Uint8Array(buf).slice(0, 200));
      console.error('First 200 bytes of template:', text);
      throw e;
    }

    return wb;
  }

  private safeSheetName(name: string): string {
    return (
      (name || '')
        .replace(/[\\/?*\[\]:]/g, ' ')
        .trim()
        .slice(0, 31) || 'Sheet'
    );
  }

  private cloneTemplateInto(src: ExcelJS.Worksheet, dst: ExcelJS.Worksheet) {
    const maxRow = Math.max(src.actualRowCount || 0, src.rowCount || 0);
    const maxCol = Math.max(src.actualColumnCount || 0, src.columnCount || 0);

    dst.pageSetup = { ...src.pageSetup };
    dst.headerFooter = { ...src.headerFooter };
    dst.properties = { ...src.properties };
    (dst as any).views = (src as any).views
      ? JSON.parse(JSON.stringify((src as any).views))
      : undefined;

    for (let c = 1; c <= maxCol; c++) {
      const sc = src.getColumn(c),
        dc = dst.getColumn(c);
      if (sc.width) dc.width = sc.width;
      if (sc.alignment) dc.alignment = { ...sc.alignment };
      if ((sc as any).numFmt) (dc as any).numFmt = (sc as any).numFmt;
      if ((sc as any).style) (dc as any).style = { ...(sc as any).style };
    }
    for (let r = 1; r <= maxRow; r++) {
      const sr = src.getRow(r),
        dr = dst.getRow(r);
      if (sr.height) dr.height = sr.height;
    }
    (src.model.merges || []).forEach((ref) => dst.mergeCells(ref));

    for (let r = 1; r <= maxRow; r++) {
      const sRow = src.getRow(r),
        dRow = dst.getRow(r);
      for (let c = 1; c <= maxCol; c++) {
        const s = sRow.getCell(c),
          d = dRow.getCell(c);
        const sv: any = s.value;
        if (sv && typeof sv === 'object') {
          if ('sharedFormula' in sv) {
            // Ô thuộc shared formula => chỉ lấy kết quả
            d.value = sv.result ?? null;
          } else if ('formula' in sv) {
            // Công thức đơn lẻ: tùy chọn 1) giữ công thức, 2) chỉ lấy result
            // Khuyến nghị: chỉ lấy result để tránh phụ thuộc
            d.value = sv.result ?? null; // hoặc: d.value = { formula: sv.formula, result: sv.result ?? null };
          } else {
            d.value = sv; // hyperlink, rich text, v.v…
          }
        } else {
          d.value = s.value as any; // số, chuỗi thường
        }
        if (s.font) d.font = { ...s.font };
        if (s.alignment) d.alignment = { ...s.alignment };
        if (s.border) d.border = { ...s.border };
        if (s.fill) d.fill = { ...s.fill };
        if (s.numFmt) d.numFmt = s.numFmt;
        const cur = (d.alignment ?? {}) as Partial<ExcelJS.Alignment>;
        d.alignment = { ...cur, wrapText: !!cur.wrapText };
      }
      dRow.commit?.();
    }
  }

  private fillTokens(ws: ExcelJS.Worksheet, kv: Record<string, string>) {
    const maxR = ws.rowCount,
      maxC = ws.columnCount;
    for (let r = 1; r <= maxR; r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= maxC; c++) {
        const cell = row.getCell(c);
        const v = cell.value;
        if (typeof v === 'string') {
          let out = v,
            changed = false;
          for (const k of Object.keys(kv)) {
            if (out.indexOf(k) >= 0) {
              out = out.split(k).join(kv[k] ?? '');
              changed = true;
            }
          }
          if (changed) cell.value = out;
        }
      }
    }
  }

  private writeDataAt(
    ws: ExcelJS.Worksheet,
    startRow: number,
    startCol: number,
    columns: ColumnDef[],
    rows: any[]
  ) {
    for (let r = 0; r < rows.length; r++) {
      const rowObj = rows[r];
      const excelRow = ws.getRow(startRow + r);
      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];
        const cell = excelRow.getCell(startCol + c);
        const raw = rowObj[col.key];

        if (col.type === COL.date) {
          const d = raw ? new Date(raw) : null;
          if (d && !isNaN(d.getTime())) {
            cell.value = d;
            cell.numFmt = 'dd/mm/yyyy';
          } else cell.value = '';
        } else if (col.type === COL.number) {
          const n = Number(raw);
          cell.value = isNaN(n) ? null : n;
        } else if (col.type === COL.money) {
          const n = Number(raw);
          cell.value = isNaN(n) ? null : n;
          cell.numFmt = '#,##0" đ"';
        } else if (col.type === COL.multiline) {
          const text = String(raw || '').trim();

          // tách nhiều dòng
          const lines = text.split('\n').filter((x) => x.trim() !== '');
          const first = lines[0] || '';
          const firstUrl = (first.match(/https?:\/\/[^\s]+/) || [first])[0]; // bắt link đầu tiên

          // gán hyperlink nếu có
          if (firstUrl && firstUrl.length > 5) {
            cell.value = {
              text,
              hyperlink: firstUrl,
              tooltip: 'Mở file đính kèm đầu tiên',
            } as any;
            // thêm format màu xanh + gạch chân
            cell.font = { color: { argb: '0000FF' }, underline: true };
          } else {
            cell.value = text;
          }

          // bật xuống dòng + căn lề
          cell.alignment = {
            vertical: 'top',
            horizontal: 'left',
            wrapText: true,
          };

          // tính chiều cao động (ước lượng)
          const approxLines = Math.ceil(text.length / 70) + lines.length - 1;
          excelRow.height = Math.min(approxLines * 20, 400);
        } else {
          cell.value = raw ?? '';
        }

        const cur = (cell.alignment ?? {}) as Partial<ExcelJS.Alignment>;
        cell.alignment = { ...cur, vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
          bottom: { style: 'thin' },
        };
      }
      excelRow.commit?.();
    }
  }

  private async downloadXlsx(workbook: ExcelJS.Workbook, filename: string) {
    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private dateStamp(): string {
    const d = new Date(),
      p = (n: number) => n.toString().padStart(2, '0');
    return `${p(d.getDate())}${p(d.getMonth() + 1)}${d
      .getFullYear()
      .toString()
      .slice(-2)}`;
  }
}
