import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import { DangkyvppServiceService } from './officesupplyrequests-service/office-supply-requests-service.service';
import { RowComponent } from 'tabulator-tables';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzAnchorModule } from 'ng-zorro-antd/anchor';
import { NzBackTopModule } from 'ng-zorro-antd/back-top';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzCalendarModule } from 'ng-zorro-antd/calendar';
import { NzCascaderModule } from 'ng-zorro-antd/cascader';
import { NzCodeEditorModule } from 'ng-zorro-antd/code-editor';
import { NzColorPickerModule } from 'ng-zorro-antd/color-picker';
import { NzCommentModule } from 'ng-zorro-antd/comment';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzFormItemComponent } from 'ng-zorro-antd/form';
import { NzFormDirective } from 'ng-zorro-antd/form';
import { NzFormLabelComponent } from 'ng-zorro-antd/form';
import { NzFormControlComponent } from 'ng-zorro-antd/form';
import { NzFormSplitComponent } from 'ng-zorro-antd/form';
import { NzFormTextComponent } from 'ng-zorro-antd/form';

interface Unit {
  Code: string;
  Name: string;
}

interface Product {
  SupplyUnitID: number;
  Price: number;
  Type: number;
  RequestLimit: number;
}

@Component({
  selector: 'app-office-supply-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzModalModule,
    NzIconModule,
    NzTypographyModule,
    NzMessageModule,
    NzSplitterModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzDatePickerModule,
    NzCardModule,
    NzTableModule,
    NzDividerModule,
    NzSpaceModule,
    NzGridModule,
    NzCheckboxModule,
    NzToolTipModule,
    NzPopconfirmModule,
    NzBadgeModule,
    NzTagModule,
    NzProgressModule,
    NzSpinModule,
    NzEmptyModule,
    NzAlertModule,
    NzResultModule,
    NzStatisticModule,
    NzTimelineModule,
    NzStepsModule,
    NzCollapseModule,
    NzTabsModule,
    NzCarouselModule,
    NzDrawerModule,
    NzAffixModule,
    NzAnchorModule,
    NzBackTopModule,
    NzBreadCrumbModule,
    NzCalendarModule,
    NzCascaderModule,
    NzCodeEditorModule,
    NzColorPickerModule,
    NzCommentModule,
    NzDescriptionsModule,
    NzDropDownModule,
    NzFormItemComponent,
    NzFormDirective,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzFormSplitComponent,
    NzFormTextComponent
  ],
  templateUrl: './office-supply-requests.component.html',
  styleUrls: ['./office-supply-requests.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class OfficeSupplyRequestsComponent implements OnInit {
  table: any;
  table2: any;
  dataTable1: any[] = [];
  dataTable2: any[] = [];
  dataDeparment: any[] = [];
  listDKVPP: any[] = [];
  listUnit: any[] = [];
  isLoading: boolean = false;
  selectedList: any[] = [];
  sizeSearch = '0';
  isVisible = false;

  newUnit: Unit = {
    Code: '',
    Name: ''
  };

  typeOptions = [
    { id: 2, name: 'Dùng chung' },
    { id: 1, name: 'Cá nhân' }
  ];

  newProduct: Product = {
    SupplyUnitID: 0,
    Price: 0,
    Type: 2,
    RequestLimit: 0
  };

  searchParams = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    departmentId: 0,
    keyword: ''
  };

  constructor(
    private lstDKVPP: DangkyvppServiceService,
    private message: NzMessageService,
    private modal: NzModalService
  ) { }

  ngOnInit(): void {
    this.getdataDeparment();
    this.getdataDKVPP();
  }

  ngAfterViewInit(): void {
    this.drawTable();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }

  getdataDeparment(): void {
    this.lstDKVPP.getdataDepartment().subscribe({
      next: (res) => {
        if (res && Array.isArray(res.data)) {
          this.dataDeparment = res.data;
        } else {
          this.dataDeparment = [];
          this.message.warning("Phản hồi không chứa danh sách");
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy đơn vị tính:', err);
        this.message.error('Có lỗi xảy ra khi lấy danh sách phòng ban');
      }
    });
  }

  getdataDKVPP(): void {
    this.isLoading = true;
    const searchDate = new Date(this.searchParams.year, this.searchParams.month);

    this.lstDKVPP.spGetOfficeSupplyRequests(
      this.searchParams.keyword,
      searchDate,
      0,
      this.searchParams.departmentId
    ).subscribe({
      next: (res) => {
        if (res && Array.isArray(res.data)) {
          this.listDKVPP = res.data;
          this.dataTable1 = this.listDKVPP;
          if (this.table) {
            this.table.replaceData(this.dataTable1);
          }
        } else {
          this.listDKVPP = [];
          this.dataTable1 = [];
          if (this.table) {
            this.table.replaceData([]);
          }
          this.message.warning("Không tìm thấy dữ liệu phù hợp");
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu:', err);
        this.dataTable1 = [];
        if (this.table) {
          this.table.replaceData([]);
        }
        this.message.error('Có lỗi xảy ra khi lấy dữ liệu');
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  onYearChange(value: number): void {
    this.searchParams.year = value;
    this.getdataDKVPP();
  }

  onMonthChange(value: number): void {
    this.searchParams.month = value;
    this.getdataDKVPP();
  }

  onDepartmentChange(value: number): void {
    this.searchParams.departmentId = value;
    this.getdataDKVPP();
  }

  onKeywordChange(value: string): void {
    this.searchParams.keyword = value;
    this.getdataDKVPP();
  }

  private drawTable(): void {
    if (this.table) {
      this.table.replaceData(this.dataTable1);
    } else {
      this.table = new Tabulator('#datatable1', {
        data: this.dataTable1,
        layout: 'fitDataFill',
        height: '40vh',
        pagination: true,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        rowHeader: {
          headerSort: false,
          resizable: false,
          frozen: true,
          formatter: "rowSelection",
          headerHozAlign: "center",
          hozAlign: "center",
          titleFormatter: "rowSelection",
          cellClick: (e, cell) => {
            e.stopPropagation();
          },
        },
        columns: [
          {
            title: 'Admin duyệt',
            field: 'IsAdminApproved',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return `<input type="checkbox" ${value === true ? 'checked' : ''} disabled />`;
            },
          },
          {
            title: 'TBP duyệt',
            field: 'IsApproved',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return `<input type="checkbox" ${value === true ? 'checked' : ''} disabled />`;
            },
          },
          {
            title: 'Ngày TBP duyệt',
            field: 'DateApproved',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              if (value && typeof value === 'object') return '';
              const date = new Date(value);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}-${month}-${year}`;
            }
          },
          { title: 'Họ tên TBP duyệt', field: 'FullNameApproved', hozAlign: 'left', headerHozAlign: 'center', width: 200 },
          { title: 'Người đăng ký', field: 'UserName', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
          { title: 'Phòng ban', field: 'DepartmentName', hozAlign: 'left', headerHozAlign: 'center', width: 160 },
          {
            title: 'Ngày đăng ký',
            field: 'DateRequest',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 200,
            formatter: (cell) => {
              const value = cell.getValue();
              if (!value) return '';
              const date = new Date(value);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}-${month}-${year}`;
            }
          }
        ]
      });

      this.table.on("rowClick", (e: MouseEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.getdataOfficeSupplyRequestsDetail(rowData['ID']);
      });
    }

    if (this.table2) {
      this.table2.replaceData(this.dataTable2);
    } else {
      this.table2 = new Tabulator('#datatable2', {
        data: this.dataTable2,
        layout: 'fitDataFill',
        height: "43vh",
        pagination: true,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        groupBy: "FullName",
        groupHeader: function(value, count, data, group) {
          const code = data[0]?.Code || '';
          return "Nhân viên: " + code + " - " + value + " <span>(" + count + " items)</span>";
        },
        rowHeader: {
          headerSort: false,
          resizable: false,
          frozen: true,
          formatter: "rowSelection",
          headerHozAlign: "center",
          hozAlign: "center",
          titleFormatter: "rowSelection",
          cellClick: (e, cell) => {
            e.stopPropagation();
          },
        },
        columns: [
          {
            title: 'Văn phòng phẩm',
            field: 'OfficeSupplyName',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 350,
            frozen:true,
            formatter: function (cell) {
              const value = cell.getValue();
              if (value === null || value === undefined) return '';
              if (typeof value === 'object') {
                return value.Name || value.name || '';
              }
              return value;
            }
          },
          { title: 'ĐVT', field: 'Unit', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'SL đề xuất', field: 'Quantity', hozAlign: 'right', headerHozAlign: 'center' },
          { title: 'SL thực tế', field: 'QuantityReceived', hozAlign: 'right', headerHozAlign: 'center' },
          { title: 'Vượt định mức', field: 'ExceedLimit', hozAlign: 'center', headerHozAlign: 'center' },
          { title: 'Lý do vượt định mức', field: 'ReasonExceedLimit', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center',   
            width:250,
            formatter: "textarea",
            formatterParams: {
            maxHeight: 100
          }, },
        ]
      });
    }
  }

  getdataOfficeSupplyRequestsDetail(id: number): void {
    this.lstDKVPP.spGetOfficeSupplyRequestsDetail(id).subscribe({
      next: (res) => {
        this.dataTable2 = res.data;
        this.drawTable();
      },
      error: (err) => {
        this.message.error('Có lỗi xảy ra khi lấy chi tiết');
      }
    });
  }

  PushSelectedList(): boolean {
    this.selectedList = [];
    var dataSelect = this.table.getSelectedData();
    dataSelect.forEach((row: any) => {
      this.selectedList.push(row);
    });
    if (this.selectedList.length === 0) {
      this.message.warning('Vui lòng chọn ít nhất 1 người đăng ký để duyệt/hủy duyệt!');
      return false;
    }
    return true;
  }

  IsAdminApproved(): void {
    if (!this.PushSelectedList()) {
      return;
    }
    const ids = this.selectedList.map(item => item.ID);
    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: 'Bạn có chắc chắn muốn duyệt các VPP đã chọn không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.lstDKVPP.IsAdminApproved(ids).subscribe({
          next: (res) => {
            this.getdataDKVPP();
            this.selectedList = [];
            this.message.success('Duyệt thành công!');
          },
          error: (error: any) => {
            this.message.error('Có lỗi xảy ra khi duyệt!');
          }
        });
      }
    });
  }

  UnAdminApproved(): void {
    if (!this.PushSelectedList()) {
      return;
    }

    const canUnapproveItems = this.selectedList.filter(item => !item.IsApproved);
    const cannotUnapproveItems = this.selectedList.filter(item => item.IsApproved);

    if (canUnapproveItems.length === 0) {
      this.message.error('Không có item nào có thể hủy duyệt!');
      return;
    }

    if (cannotUnapproveItems.length > 0) {
      this.modal.confirm({
        nzTitle: 'Cảnh báo',
        nzContent: `Có ${cannotUnapproveItems.length} item đã được TBP duyệt không thể hủy. Bạn có muốn tiếp tục hủy duyệt ${canUnapproveItems.length} item còn lại không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.processUnadminApproval(canUnapproveItems);
        }
      });
    } else {
      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: 'Bạn có chắc chắn muốn hủy duyệt các VPP đã chọn không?',
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.processUnadminApproval(canUnapproveItems);
        }
      });
    }
  }

  private processUnadminApproval(items: any[]): void {
    const ids = items.map(item => item.ID);
    this.lstDKVPP.UnAdminApproved(ids).subscribe({
      next: (res) => {
        this.getdataDKVPP();
        this.selectedList = [];
        this.message.success('Hủy duyệt thành công!');
      },
      error: (error: any) => {
        this.message.error('Có lỗi xảy ra khi hủy duyệt!');
      }
    });
  }

  IsApproved(): void {
    if (!this.PushSelectedList()) {
      return;
    }

    const approvedItems = this.selectedList.filter(item => item.IsAdminApproved);
    const unapprovedItems = this.selectedList.filter(item => !item.IsAdminApproved);

    if (approvedItems.length === 0) {
      this.message.error('Không có item nào được admin duyệt để thực hiện duyệt!');
      return;
    }

    if (unapprovedItems.length > 0) {
      this.modal.confirm({
        nzTitle: 'Cảnh báo',
        nzContent: `Có ${unapprovedItems.length} item chưa được admin duyệt. Bạn có muốn tiếp tục duyệt ${approvedItems.length} item đã được admin duyệt không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.processApproval(approvedItems);
        }
      });
    } else {
      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: 'Bạn có chắc chắn muốn duyệt các VPP đã chọn không?',
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.processApproval(approvedItems);
        }
      });
    }
  }

  private processApproval(items: any[]): void {
    const ids = items.map(item => item.ID);
    this.lstDKVPP.IsApproved(ids).subscribe({
      next: (res) => {
        this.getdataDKVPP();
        this.selectedList = [];
        this.message.success('Duyệt thành công!');
      },
      error: (error: any) => {
        this.message.error('Có lỗi xảy ra khi duyệt!');
      }
    });
  }

  UnIsApproved(): void {
    if (!this.PushSelectedList()) {
      return;
    }

    const canUnapproveItems = this.selectedList.filter(item => item.IsAdminApproved);
    const cannotUnapproveItems = this.selectedList.filter(item => !item.IsAdminApproved);

    if (canUnapproveItems.length === 0) {
      this.message.error('Không có item nào được admin duyệt để hủy duyệt!');
      return;
    }

    if (cannotUnapproveItems.length > 0) {
      this.modal.confirm({
        nzTitle: 'Cảnh báo',
        nzContent: `Có ${cannotUnapproveItems.length} item chưa được admin duyệt. Bạn có muốn tiếp tục hủy duyệt ${canUnapproveItems.length} item đã được admin duyệt không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.processUnapproval(canUnapproveItems);
        }
      });
    } else {
      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: 'Bạn có chắc chắn muốn hủy duyệt các VPP đã chọn không?',
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.processUnapproval(canUnapproveItems);
        }
      });
    }
  }

  private processUnapproval(items: any[]): void {
    const ids = items.map(item => item.ID);
    this.lstDKVPP.UnIsApproved(ids).subscribe({
      next: (res) => {
        this.getdataDKVPP();
        this.selectedList = [];
        this.message.success('Hủy duyệt thành công!');
      },
      error: (error: any) => {
        this.message.error('Có lỗi xảy ra khi hủy duyệt!');
      }
    });
  }
}

//reset trong 

