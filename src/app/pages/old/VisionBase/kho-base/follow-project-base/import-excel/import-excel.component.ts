import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, AfterViewChecked, IterableDiffers, TemplateRef, input, Input, inject } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, NonNullableFormBuilder, AbstractControl } from '@angular/forms';
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
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import { KhoBaseService } from '../../kho-base-service/kho-base.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-import-excel',
  templateUrl: './import-excel.component.html',
  styleUrls: ['./import-excel.component.css'],
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
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
    NzCheckboxModule,
    CommonModule,
  ]
})
export class ImportExcelComponent implements OnInit {

  constructor(
    public activeModal: NgbActiveModal,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private khoBaseService: KhoBaseService,
  ) { }

  ngOnInit() {
  }

  sheetNames: string[] = [];
  selectedSheet: string | null = null;
  workbook: XLSX.WorkBook | null = null;

  tableData: any[] = [];
  tableHeaders: string[] = [];

  @ViewChild('excelTable', { static: true }) excelTable!: ElementRef;
  tabulator!: Tabulator;

  onFileChange(evt: any) {
    this.resetPreview();
    const target: DataTransfer = <DataTransfer>evt.target;
    if (target.files.length !== 1) return;

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      this.workbook = XLSX.read(bstr, { type: 'binary' });
      this.sheetNames = this.workbook.SheetNames;
    };
    reader.readAsBinaryString(target.files[0]);
  }
  private resetPreview() {
    // reset chọn sheet + dữ liệu
    this.selectedSheet = null;
    this.sheetNames = [];
    this.tableHeaders = [];
    this.tableData = [];

    // reset Tabulator nếu đã khởi tạo
    if (this.tabulator) {
      this.tabulator.clearData();
      this.tabulator.setColumns([]);
    }
  }

  onSheetChange() {
    if (this.workbook && this.selectedSheet) {
      const ws = this.workbook.Sheets[this.selectedSheet];
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

      // Làm sạch + convert
      this.tableData = rawData.map(row => {
        const newRow: any = {};

        Object.keys(row).forEach(key => {
          // Bỏ các cột rác __EMPTY
          if (!key.startsWith('__EMPTY')) {
            let value = row[key];

            // Nếu là số seri Excel date -> convert
            if (typeof value === 'number' && key.toLowerCase().includes('ngày')) {
              const parsed = XLSX.SSF.parse_date_code(value);
              if (parsed) {
                value = `${String(parsed.d).padStart(2, '0')}/${String(parsed.m).padStart(2, '0')}/${parsed.y}`;
              }
            }
            newRow[key.trim()] = value;
          }
        });

        return newRow;
      });

      this.tableHeaders = this.tableData.length > 0 ? Object.keys(this.tableData[0]) : [];
      this.renderTable();
    }
  }

  renderTable() {
    if (this.tabulator) {
      // cập nhật lại columns trước
      this.tabulator.setColumns(this.tableHeaders.map(col => {
        let align: "left" | "center" | "right" = "left";
        if (col.toLowerCase().includes("ngày")) align = "center";
        else if (this.tableData.length > 0 && typeof this.tableData[0][col] === "number") align = "right";
        return { title: col, field: col, width: 150, headerHozAlign: 'center', hozAlign: align };
      }));
      // rồi thay data
      this.tabulator.replaceData(this.tableData);
      return;
    }

    // lần đầu tạo
    this.tabulator = new Tabulator(this.excelTable.nativeElement, {
      data: this.tableData,
      layout: 'fitDataStretch',
      reactiveData: true,
      height: '77vh',
      selectableRows: 1,
      responsiveLayout: false,
      pagination: true,
      paginationMode: 'local',
      paginationSize: 20,
      paginationSizeSelector: [20, 50, 100, 200, 500],
      columns: this.tableHeaders.map(col => {
        let align: "left" | "center" | "right" = "left";
        if (col.toLowerCase().includes("ngày")) align = "center";
        else if (this.tableData.length > 0 && typeof this.tableData[0][col] === "number") align = "right";
        return { title: col, field: col, width: 150, headerHozAlign: 'center', hozAlign: align };
      }),

    });
  }


  importData() {
    console.log('Dữ liệu đã chọn:', this.tableData);
    // Gọi API backend
    this.khoBaseService.postImportExcel(this.tableData).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          const status = res?.status ?? 0;
          const created = res?.created ?? 0;
          const updated = res?.updated ?? 0;
          const skipped = res?.skipped ?? 0;
          const errors = Array.isArray(res?.errors) ? res.errors : [];
          // Toast ngắn
          this.notification.success('Nhập dữ liệu thành công!',
            `Tạo mới: ${created} • Cập nhật: ${updated} • Bỏ qua: ${skipped}`);

          // Modal chi tiết
          this.modal.success({
            nzTitle: 'Hoàn tất nhập dữ liệu',
            nzContent: `
              <div>Tạo mới: <b>${created}</b> • Cập nhật: <b>${updated}</b> • Bỏ qua: <b>${skipped}</b></div>`,
            nzOkText: 'Đóng',
            nzOnOk: () => this.activeModal.close('success'),
            nzWidth: 720
          });
        } else {
          this.notification.error('Thông báo', 'Nhập dữ liệu thất bại!');
        }
      },
      error: () => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi nhập dữ liệu!');
      }
    });
  }
}
