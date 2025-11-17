import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator, CellComponent, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { ProjectItemService } from './project-item-service/project-item.service';
// @ts-ignore
import { saveAs } from 'file-saver';
import { NzNotificationService } from 'ng-zorro-antd/notification'; function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}
@Component({
  standalone: true,
  imports: [
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
    NgbModalModule
  ],
  selector: 'app-project-item',
  templateUrl: './project-item.component.html',
  styleUrls: ['./project-item.component.css']
})
export class ProjectItemComponent implements OnInit, AfterViewInit {
  //Danh sách hạng mục công việc theo dự án
  projectItemData: any[] = [];
  // Bảng Tabu hạng mục công việc
  projectItemTable: Tabulator | null = null;
  // response message
  message: string = "";
  //reqest parameter
  keyWord: string = "";
  projectID: number | null = null;
  userID: number | null = null;
  status: number | null = null;
  constructor(private notification: NzNotificationService,
    private projectItemService: ProjectItemService
  ) { }
  private ngbModal = inject(NgbModal);
  ngOnInit() {

  }
  ngAfterViewInit(): void {
    this.getProjectItem();
//  this.getProjectItem;
this.drawExportTB();
  }
  getProjectItem() {
    const request = {
      ProjectID: this.projectID || 5298,
      UserID: this.userID || 0,
      Keyword: this.keyWord || "",
      Status: this.status || 1
    };
    this.projectItemService.getProjectItem(request).subscribe({
      next: (response) => {
        this.projectItemData = response.data;
        this.message = response.message;
        console.log("Mét xịt",this.message);
        console.log("Data",this.projectItemData);
        this.drawExportTB();
      },
      error: (error) => {
        console.error('Lỗi khi lấy hạng mục công việc:', error);
      }
    })
  }
  drawExportTB() {
    if (this.projectItemTable) {
      this.projectItemTable.setData(this.projectItemData);
    } else {
      this.projectItemTable = new Tabulator('#exportTable', {
        data: this.projectItemData,
        layout: "fitDataStretch",
        pagination: true,
        selectableRows: 1,
        height: '86vh',
        movableColumns: true,
        paginationSize: 30,
        paginationSizeSelector: [5, 10, 20, 50, 100],
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        dataTree: true,
        addRowPos: "bottom",
        history: true,
        columns: [
          {
            title: 'Duyệt',
            field: 'Status',
            formatter: function (cell: any) {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<input type="checkbox" ${checked ? 'checked' : ''} disabled/>`;
            },
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          { title: "Mã phiếu xuất", field: "Code" },
          { title: "Mã sản phẩm", field: "ProductCode" },
          { title: "Tên sản phẩm", field: "ProductName" },
          { title: "Mã nội bộ RTC", field: "ProductCodeRTC" },
          { title: "Hãng", field: "Maker" },
          { title: "Mã QR Code", field: "ProductQRCode" },
          { title: "Ghi chú", field: "Note" },
     
        ],
      });
    }
  }
}
