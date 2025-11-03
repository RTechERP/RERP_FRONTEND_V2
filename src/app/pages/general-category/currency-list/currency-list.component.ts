import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../old/project/project-service/project.service';
import { TabulatorFull as Tabulator, CellComponent } from 'tabulator-tables';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FormsModule } from '@angular/forms';
import { CurrencyDetailComponent } from '../currency-detail/currency-detail.component';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
@Component({
  selector: 'app-currency-list',
  templateUrl: './currency-list.component.html',
  styleUrls: ['./currency-list.component.css'],
  standalone: true,
  imports: [NzInputModule, FormsModule, CommonModule, NgbModule, NzModalModule,NzSplitterModule,NzIconModule, NzButtonModule],
})
export class CurrencyListComponent implements OnInit {
  currencyData: any[] = [];
  currencyTable: Tabulator | null = null;
  selectedCurrency: any = null;
  searchText: string = '';
  showForm = false;

  constructor(
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private nzModal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(params: any = {}): void {
    this.projectService.getAll(params).subscribe((res: any) => {
      this.currencyData = res?.data || [];

      if (this.currencyTable) {
        this.currencyTable.setData(this.currencyData);
      } else {
        this.drawCurrencyTable();
      }
    });
  }

  private drawCurrencyTable(): void {
    const formatNumber = (value: any) => (+value || 0).toLocaleString('vi-VN');
    const formatDate = (value: any) =>
      value ? new Date(value).toLocaleDateString('vi-VN') : '';

    this.currencyTable = new Tabulator('#currency-table', {
      data: this.currencyData,
      layout: 'fitDataStretch',
      pagination: 'local',
      paginationSize: 30,
      paginationSizeSelector: [5, 10, 20, 50, 100],
      reactiveData: true,
      selectableRows: 5,
      selectable: 10,
      height: '100%',
      placeholder: 'Không có dữ liệu',
      columns: [
        {
          title: '',
          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          hozAlign: 'center',
          headerSort: false,
          width: 50,
        },
        {
          title: 'STT',
          hozAlign: 'center',
          width: 60,
          formatter: 'rownum',
          headerSort: false,
        },
        { title: 'ID', field: 'ID', visible: false },
        { title: 'Mã tiền tệ', field: 'Code' },
        { title: 'Tên tiếng Anh', field: 'NameEnglist' },
        { title: 'Tên tiếng Việt', field: 'NameVietNamese' },
        { title: 'Đơn vị nhỏ nhất', field: 'MinUnit' },
        {
          title: 'Tỉ giá',
          field: 'CurrencyRate',
          hozAlign: 'right',
          formatter: (cell: CellComponent) => formatNumber(cell.getValue()),
        },
        {
          title: 'Ngày bắt đầu',
          field: 'DateStart',
          formatter: (cell: CellComponent) => formatDate(cell.getValue()),
        },
        {
          title: 'Ngày hết hạn',
          field: 'DateExpried',
          formatter: (cell: CellComponent) => formatDate(cell.getValue()),
        },
        {
          title: 'Tỷ giá chính ngạch',
          field: 'CurrencyRateOfficialQuota',
          hozAlign: 'right',
          formatter: (cell: CellComponent) => formatNumber(cell.getValue()),
        },
        {
          title: 'Ngày hết hạn TGCN',
          field: 'DateExpriedOfficialQuota',
          formatter: (cell: CellComponent) => formatDate(cell.getValue()),
        },
        {
          title: 'Tỷ giá tiểu ngạch',
          field: 'CurrencyRateUnofficialQuota',
          hozAlign: 'right',
          formatter: (cell: CellComponent) => formatNumber(cell.getValue()),
        },
        {
          title: 'Ngày hết hạn TGTN',
          field: 'DateExpriedUnofficialQuota',
          formatter: (cell: CellComponent) => formatDate(cell.getValue()),
        },
        { title: 'Ghi chú', field: 'Note' },
      ],
      rowSelectionChanged: (data: any[]) => {
        this.selectedCurrency = data.length === 1 ? data[0] : null;
      },
    } as any);
  }

  handleFormClosed(): void {
    this.showForm = false;
    this.loadData();
  }

  handleCurrencySaved(event: any): void {
    if (event.mode === 'add') {
      this.notification.success('Thành công', 'Thêm mới thành công');
    } else {
      this.notification.success('Thành công', 'Cập nhật thành công');
    }
    this.loadData();
    this.showForm = false;
  }

  onAdd(): void {
  const modalRef = this.modalService.open(CurrencyDetailComponent, {
    centered: true,
    size: 'xl',
    backdrop: 'static',
    keyboard: false,
  });

  const instance = modalRef.componentInstance;

  instance.saved.subscribe((event: { mode: 'add' | 'edit' }) => {
    if (event.mode === 'add') {
      this.notification.success('Thành công', 'Thêm mới thành công');
    }
    this.loadData();
  });

  modalRef.result.catch(() => {
    console.log('Modal dismissed');
  });
}
  

  onEditProduct(): void {
  const selected = this.currencyTable?.getSelectedData();

  if (!selected || selected.length === 0) {
    this.notification.warning('Thông báo', 'Vui lòng chọn một đơn vị để sửa!');
    return;
  }

  if (selected.length > 1) {
    this.notification.warning('Thông báo', 'Chỉ được chọn một bản ghi để sửa!');
    return;
  }

  const selectedProduct = { ...selected[0] };

  const modalRef = this.modalService.open(CurrencyDetailComponent, {
    size: 'xl',
    backdrop: 'static',
    keyboard: false,
    centered: true,
  });

  modalRef.componentInstance.dataInput = selectedProduct;

  modalRef.result.then(
    () => this.loadData(),
    () => console.log('Modal dismissed')
  );
}


  onDeleteMultiple(): void {
    const selected = this.currencyTable?.getSelectedData();

    if (!selected || selected.length === 0) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn ít nhất một bản ghi cần xóa!',
        { nzStyle: { fontSize: '0.75rem' } }
      );
      return;
    }

    const names = selected.map((r) => r.NameVietNamese || r.Code).join(', ');

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa các bản ghi sau: <strong>${names}</strong>?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmDelete(selected),
    });
  }

  confirmDelete(selectedRows: any[]): void {
    const deleteRequests = selectedRows.map((row: any) => {
      const deleteData = {
        ID: row.ID,
        Code: row.Code || '',
        NameEnglist: row.NameEnglist || '',
        NameVietNamese: row.NameVietNamese || '',
        MinUnit: row.MinUnit || '',
        CurrencyRate: row.CurrencyRate || 0,
        Note: row.Note || '',
        CurrencyRateOfficialQuota: row.CurrencyRateOfficialQuota || 0,
        CurrencyRateUnofficialQuota: row.CurrencyRateUnofficialQuota || 0,
        DateExpried: row.DateExpried || null,
        DateStart: row.DateStart || null,
        DateExpriedOfficialQuota: row.DateExpriedOfficialQuota || null,
        DateExpriedUnofficialQuota: row.DateExpriedUnofficialQuota || null,
        IsDeleted: true,
        DeletedAt: new Date(),
        UpdatedBy: this.projectService.LoginName || 'Current User',
        UpdatedDate: new Date(),
        CreatedBy: row.CreatedBy || '',
        CreatedDate: row.CreatedDate || null,
      };

      return this.projectService.save(deleteData).toPromise();
    });

    Promise.all(deleteRequests)
      .then((responses) => {
        const successCount = responses.filter((res: any) =>
          res?.Success || res?.success || res?.status === 1
        ).length;

        this.notification.success(
          'Thông báo',
          `Đã xóa ${successCount} bản ghi thành công!`,
          { nzStyle: { fontSize: '0.75rem' } }
        );

        this.loadData();
      })
      .catch((error) => {
        this.notification.error(
          'Lỗi',
          'Không thể xóa: ' + (error.message || 'Unknown error'),
          { nzStyle: { fontSize: '0.75rem' } }
        );
      });
  }

  onSearch(): void {
    this.loadData({ code: this.searchText });
  }
}
