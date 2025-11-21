import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
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
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
(window as any).luxon = { DateTime };
declare var bootstrap: any;
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FilmManagementService } from './film-management-service/film-management.service';
import { FirmManagementDetailComponent } from './firm-management-detail/firm-management-detail.component';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { FirmManagementImportExcelComponent } from './firm-management-import-excel/firm-management-import-excel.component';
@Component({
  standalone: true,
  imports: [
    NzUploadModule,
    CommonModule,
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
    NgbModalModule,
    NzModalModule
  ],
  selector: 'app-film-management',
  templateUrl: './film-management.component.html',
  styleUrls: ['./film-management.component.css']
})
export class FilmManagementComponent implements OnInit, AfterViewInit {
  private ngbModal = inject(NgbModal);
  modalData: any = [];
  selectedRow: any = "";
  sizeTbDetail: any = '0';
  filmTable: Tabulator | null = null;
  filmDetailTable: Tabulator | null = null;
  filmData: any[] = [];
  filmDetailData: any[] = [];
  filterText: string = "";
  constructor(private notification: NzNotificationService,
    private filmManagementService: FilmManagementService,
  private modal: NzModalService) { }
  ngAfterViewInit(): void {
    this.drawTable();
  }
  ngOnInit() {
  }
  drawTable() {
    this.filmTable = new Tabulator('#filmTable', {
      layout: "fitColumns",
      pagination: true,
      selectableRows: 5,
      height: '92vh',
      ajaxURL: this.filmManagementService.getFilmAjax(),
      ajaxConfig: "GET",
      paginationMode: 'remote',
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: "center",
        minWidth: 60,
        resizable: true
      },
      movableColumns: true,
      paginationSize: 30,
      paginationSizeSelector: [5, 10, 20, 50, 100],
      reactiveData: true,
      ajaxRequestFunc: (_url, _config, params) => {
        const request = {
          keyWord: this.filterText || "",
          page: params.page || 1,
          size: params.size || 30,
        };
        return this.filmManagementService.getFilm(request).toPromise();
      },
      ajaxResponse: (url, params, response) => {
        return {
          data: response.data.data || [],
          last_page: response.data.TotalPage?.[0]?.TotalPage|| 1
        };
      },
      placeholder: 'Không có dữ liệu',
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
      dataTree: true,
      responsiveLayout: "collapse",
      addRowPos: "bottom",
      history: true,
      columns: [
        { title: "ID", field: "ID", visible: false },
        { title: "STT", field: "STT", hozAlign: "right", headerHozAlign: "center" },
        { title: "Mã phim", field: "Code", hozAlign: "left", headerHozAlign: "center", widthGrow: 2 },
        { title: "Tên phim", field: "Name", hozAlign: "left", headerHozAlign: "center", widthGrow: 1 },
        {
          title: 'Yêu cầu kết quả',
          field: 'RequestResult',
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} disabled/>`;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
      ]
    });
    this.filmTable.on('rowClick', (evt, row: RowComponent) => {
      const rowData = row.getData();
      const ID = rowData['ID'];
      this.filmManagementService.getFilmDetail(ID).subscribe(respon => {
        this.filmDetailData = respon.data;
      
        this.drawFilmDetailTable();
      });
    });
    this.filmTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
      this.selectedRow = row.getData();
      this.sizeTbDetail = null;
    });
  }
  drawFilmDetailTable(): void {
    if (this.filmDetailTable) {
      this.filmDetailTable.setData(this.filmDetailData);
    } else {
      this.filmDetailTable = new Tabulator('#filmDetailTable',
        {
          data: this.filmDetailData,
          layout: "fitDataStretch",
          paginationSize: 5,
          movableColumns: true,
          reactiveData: true,
          columns: [

            {
              title: "STT",
              formatter: "rownum",   // tự tăng số thứ tự
              hozAlign: "right",
              headerHozAlign: "center",
              width: 70
            },
            { title: 'Nội dung công việc', field: 'WorkContent1', headerHozAlign: 'center' },
            { title: 'Đơn vị tính', field: 'UnitName', headerHozAlign: 'center' },
            { title: 'Năng xuất trung bình', field: 'PerformanceAVG', headerHozAlign: 'center' },

          ]
        });
    }

  }
    onAddFilm() {
      const modalRef = this.ngbModal.open(FirmManagementDetailComponent, {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      });
      modalRef.componentInstance.dataInput = { ID: 0 };
      modalRef.result.then(
        (result) => {
        //  this.getGroup();
        },
        (dismissed) => {
          console.log('Modal dismissed');
        }
      );
    }
     getSelectedIds(): number[] {
    if (this.filmTable) {
      const selectedRows = this.filmTable.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }
onDeleteFilm() {
  const selectedIds = this.getSelectedIds();
  if (!selectedIds || selectedIds.length === 0) {
    this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn bản ghi cần xóa');
    return;
  }
  this.modal.confirm({
    nzTitle: 'Xác nhận xóa',
    nzContent: 'Bạn có chắc chắn muốn xóa film này không?',
    nzOkText: 'Đồng ý',
    nzCancelText: 'Hủy',
    nzOnOk: () => {
      const payload = {
        filmManagements: [{
          ID: selectedIds[0],
          IsDeleted: true
        }]
      };

      this.filmManagementService.saveData(payload).subscribe({
        next: () => {
          this.notification.success(NOTIFICATION_TITLE.success, 'Xóa film thành công!');
          this.drawTable();
        },
        error: () => {
          this.notification.warning(NOTIFICATION_TITLE.error, 'Lỗi kết nối máy chủ!');
        }
      });
    }
  });
}
 onEditFilm() {
    const selectedData = this.filmTable?.getSelectedData?.();
    const detailData = this.filmDetailTable?.getData?.();
    if (!selectedData || selectedData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn mã film cần sửa!');
      return;
    }
    const selectedRow = selectedData[0];
    const modalRef = this.ngbModal.open(FirmManagementDetailComponent, {
         size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
    });
 modalRef.componentInstance.dataInput = {
    master: selectedRow,
    details: detailData,
  };
    modalRef.result.then(
        (result) => {
          this.drawTable();
        },
        (dismissed) => {
          console.log('Modal dismissed');
        }
      );
  }
  openModalImportExcel() {
    const modalRef = this.ngbModal.open(FirmManagementImportExcelComponent, {
      // centered: true,
      // backdrop: 'static',
      // keyboard: false,
      // windowClass: 'full-screen-modal',
       size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
    });
  }
}
