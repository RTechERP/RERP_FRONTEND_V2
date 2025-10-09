import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import * as bootstrap from 'bootstrap';

import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { IS_ADMIN } from '../../../app.config';
import { DEPARTMENTID } from '../../../app.config';
import { DateTime } from 'luxon';
import { ListProductProjectService } from './list-product-project-service/list-product-project.service';



@Component({
  selector: 'app-list-product-project',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NgbModule,
    NzDatePickerModule,
    NzDropDownModule,
    NzMenuModule,
  ],
  templateUrl: './list-product-project.component.html',
  styleUrl: './list-product-project.component.css'
})
export class ListProductProjectComponent implements OnInit, AfterViewInit {
  table:any;
  dataTable:any[]=[];
  sreachParam={
  selectedProject: {
      ProjectCode: "",
      ID: 0,
      // Có thể thêm ProjectName nếu cần
      // ProjectName: ""
    },
    WareHouseCode: "HN",
  }
  cbbProject:any;

  constructor(
    private listproductprojectService: ListProductProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
  ) { }
  ngOnInit(): void {
    this.loadData();
    this.getProject();
  }
  ngAfterViewInit(): void {
    this.drawTable();
  }
  loadData() {
    if (this.sreachParam.selectedProject == null) {
      this.sreachParam.selectedProject = {
        ProjectCode: "",
        ID: 0
      };
    }
    this.listproductprojectService.getData(this.sreachParam.selectedProject.ProjectCode, this.sreachParam.selectedProject.ID, this.sreachParam.WareHouseCode).subscribe({
      next: (res) => {
          this.dataTable=res.data;
          this.table?.replaceData(this.dataTable);
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy sản phẩm theo dự án');
      }
    });
  }
  getProject(){
    this.listproductprojectService.getProject().subscribe({
      next: (res) => {
          this.cbbProject=res.data;
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dự án');
      }
    });
  }

   //#region xuất excel
   async exportExcel() {
    const table = this.table;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Danh sách sản phẩm theo dự án _${this.sreachParam.selectedProject?.ProjectCode || ''}`);


    const columns = table.getColumns();
    // Bỏ qua cột đầu tiên
    const filteredColumns = columns.slice(1);
    const headers = ['STT', ...filteredColumns.map(
      (col: any) => col.getDefinition().title
    )];
    worksheet.addRow(headers);

    data.forEach((row: any, index: number) => {
      const rowData = [index + 1, ...filteredColumns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }
        if (field === 'IsApproved') {
          value = value === true ? '✓' : '';  // hoặc '✓' / '✗'
        }

        return value;
      })];

      worksheet.addRow(rowData);
      worksheet.views = [
        { state: 'frozen', ySplit: 1 } // Freeze hàng đầu tiên
      ];
    });

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
        // Giới hạn độ dài tối đa của cell là 50 ký tự
        maxLength = Math.min(Math.max(maxLength, cellValue.length + 2), 50);
        cell.alignment = { wrapText: true, vertical: 'middle' };
      });
      // Giới hạn độ rộng cột tối đa là 30
      column.width = Math.min(maxLength, 30);
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: filteredColumns.length,
      },
    };

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
    link.download = `DanhSachSPTheoDuAn_${this.sreachParam.selectedProject?.ProjectCode || ''}.xlsx`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //#endregion
  drawTable(){
    this.table = new Tabulator('#table_ListProductProject', {
      index: "ProductID",
      data: this.dataTable,
      layout: "fitColumns", // ✅ Tự chia đều
      responsiveLayout: "collapse", // ✅ Tự co lại nếu không đủ không gian
      height: "80vh",
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      selectableRows: 1,
    // Group theo Mã dự án -> sau đó nhóm theo Kho
    groupBy: [
      (data) => {
        return data.ProjectCode
          ? `Dự án: ${data.ProjectFullName ? ` - ${data.ProjectFullName}` : ""}`
          : "Dự án: -";
      },
      (data) => data.StoreName ? `Kho: ${data.StoreName}` : "Kho: Kho HN"
    ],
    groupStartOpen: true,
    groupToggleElement: "header",
    groupHeader: (value, count, data, group) => {
      // Không hiện (3), (5) v.v.
      return value;
    },
      columns: [
        { title: "Mã dự án", field: "ProjectCode", hozAlign: "center", headerHozAlign: "center" },
        { title: "Mã sản phẩm", field: "ProductCode", hozAlign: "center", headerHozAlign: "center" },
        { title: "Tên sản phẩm", field: "ProductName", hozAlign: "left", headerHozAlign: "center" },
        { title: "Mã nội bộ", field: "ProductNewCode", hozAlign: "center", headerHozAlign: "center" },
        { title: "Tồn đầu kỳ", field: "NumberInStoreDauky", hozAlign: "right", headerHozAlign: "center",  formatter: "money",
          formatterParams: {
            precision: 2, // ✅ hiển thị 2 chữ số sau dấu thập phân: 1234.50
            thousand: ",",
            decimal: "."
          } },
        { title: "Nhập dự án", field: "Import", hozAlign: "right", headerHozAlign: "center",  formatter: "money",
          formatterParams: {
            precision: 2, // ✅ hiển thị 2 chữ số sau dấu thập phân: 1234.50
            thousand: ",",
            decimal: "."
          } },
        { title: "Xuất dự án", field: "Export", hozAlign: "right", headerHozAlign: "center",  formatter: "money",
          formatterParams: {
            precision: 2, // ✅ hiển thị 2 chữ số sau dấu thập phân: 1234.50
            thousand: ",",
            decimal: "."
          } },
        { title: "Tồn dự án", field: "QuantityImportExport", hozAlign: "right", headerHozAlign: "center",  formatter: "money",
          formatterParams: {
            precision: 2, // ✅ hiển thị 2 chữ số sau dấu thập phân: 1234.50
            thousand: ",",
            decimal: "."
          } },
        { title: "Tồn cuối kỳ", field: "NumberInStoreCuoiKy", hozAlign: "right", headerHozAlign: "center",  formatter: "money",
          formatterParams: {
            precision: 2, // ✅ hiển thị 2 chữ số sau dấu thập phân: 1234.50
            thousand: ",",
            decimal: "."
          } }
      ]
    });
  }
}
