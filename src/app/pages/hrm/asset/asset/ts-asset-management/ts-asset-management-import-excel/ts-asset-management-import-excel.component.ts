  import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css'; //import Tabulator stylesheet
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { DateTime } from 'luxon';

import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AssetsManagementService } from '../ts-asset-management-service/ts-asset-management.service';
import { TsAssetManagementPersonalService } from '../../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { UnitService } from '../../ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { TypeAssetsService } from '../../ts-asset-type/ts-asset-type-service/ts-asset-type.service';
import { AssetsService } from '../../ts-asset-source/ts-asset-source-service/ts-asset-source.service';
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}
function formatDate(value: any): string | null {
  if (!value) return null;
  // Cố gắng parse theo định dạng dd/M/yyyy hoặc dd/MM/yyyy
  const date = DateTime.fromFormat(value.trim(), 'd/M/yyyy');
  return date.isValid ? date.toISODate() : null;
}
@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzInputModule,
    NzSelectModule,
    NzProgressModule
  ],
  selector: 'app-ts-asset-management-import-excel',
  templateUrl: './ts-asset-management-import-excel.component.html',
  styleUrls: ['./ts-asset-management-import-excel.component.css']
})
export class TsAssetManagementImportExcelComponent implements OnInit, AfterViewInit {
  @Input() table: any;
  @Input() lastAddedIdProduct: number | null = null;
  @Input() searchText: string = '';
  @Input() id: number = 0;
  emPloyeeLists:any[]=[];
  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  tableExcel: any;
  dataTableExcel: any[] = [];
  listUnitCount: any[] = [];
  listMaker: any[] = [];
  listSourceAsset: any[] = [];
  listTypeAsset: any[] = [];
  // Biến hiển thị chính trên thanh tiến trình
  displayProgress: number = 0; // % hiển thị trên thanh
  displayText: string = '0/0'; // Text hiển thị trên thanh
  totalRowsAfterFileRead: number = 0; // Tổng số dòng dữ liệu hợp lệ sau khi đọc file
  processedRowsForSave: number = 0;
  constructor(private notification: NzNotificationService,
    private modalService: NgbModal,
    private assetsManagementService: AssetsManagementService,
    private unitService: UnitService,
    private soucerService: AssetsService,
    private typeAssetsService: TypeAssetsService,
    private tsAssetManagementPersonalService:TsAssetManagementPersonalService,
  ) { }
  ngOnInit() {

  }
  ngAfterViewInit(): void {
    this.loadUnit();
    this.drawtable();
  }
  drawtable() {
    if (!this.tableExcel) { // Chỉ khởi tạo nếu chưa có
      this.tableExcel = new Tabulator('#datatableExcel', {
        data: this.dataTableExcel, // Dữ liệu ban đầu rỗng
        layout: 'fitDataFill',
        height: '300px',
        selectableRows: 10,
        pagination: true,
        paginationSize: 50,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        autoColumns: true,
        autoColumnsDefinitions: {
          checkbox: {
            title: '',
            field: '',
            formatter: 'rowSelection',
            titleFormatter: 'rowSelection',
            hozAlign: 'center',
            headerHozAlign: 'center',
            headerSort: false,
            width: 60,
            cssClass: 'checkbox-center'
          },
          STT: {
            title: 'STT',
            field: 'STT',
            hozAlign: 'center',
            width: 70,
            headerHozAlign: 'center'
          },
          TSAssetCode: {
            title: 'Mã tài sản',
            field: 'TSAssetCode',
            hozAlign: 'left',
            headerHozAlign: 'center'
          },
          TSAssetName: {
            title: 'Tên tài sản',
            field: 'TSAssetName',
            hozAlign: 'left',
            headerHozAlign: 'center'
          },
          Seri: {
            title: 'Seri',
            field: 'Seri',
            hozAlign: 'left',
            headerHozAlign: 'center'
          },
          UnitName: {
            title: 'Đơn vị',
            field: 'UnitName',
            hozAlign: 'left',
            headerHozAlign: 'center',
            formatter: (cell: any) => cell.getValue() || ''
          },
          SpecificationsAsset: {
            title: 'Thông số',
            field: 'SpecificationsAsset',
            hozAlign: 'left',
            headerHozAlign: 'center'
          },
          DateBuy: {
            title: 'Ngày mua',
            field: 'DateBuy',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: formatDateCell
          },
          DateEffect: {
            title: 'Ngày hiệu lực',
            field: 'DateEffect',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: formatDateCell
          },
          Insurance: {
            title: 'Bảo hành (tháng)',
            field: 'Insurance',
            hozAlign: 'right',
            headerHozAlign: 'center'
          },
          AssetType: {
            title: 'Loại tài sản',
            field: 'AssetType',
            hozAlign: 'left',
            headerHozAlign: 'center',
            formatter: (cell: any) => cell.getValue() || ''
          },
          DepartmentName: {
            title: 'Phòng ban',
            field: 'Name',
            hozAlign: 'left',
            headerHozAlign: 'center'
          },
          Status: {
            title: 'Trạng thái',
            field: 'Status',
            hozAlign: 'left',
            headerHozAlign: 'center',
            formatter: function (cell: any) {
              const val = cell.getValue() as string;
              const el = cell.getElement();
              el.style.backgroundColor = '';
              el.style.color = '';
              if (val === 'Chưa sử dụng') {
                el.style.backgroundColor = '#00CC00';
                el.style.color = '#fff';
              } else if (val === 'Đang sử dụng') {
                el.style.backgroundColor = '#FFCC00';
                el.style.color = '#000';
              } else if (val === 'Đã thu hồi' || val === 'Hỏng') {
                el.style.backgroundColor = '#FFCCCC';
                el.style.color = '#000';
              } else if (val === 'Mất') {
                el.style.backgroundColor = '#BB0000';
                el.style.color = '#000';
              } else {
                el.style.backgroundColor = '#e0e0e0';
              }
              el.style.outline = '1px solid #e0e0e0';
              return val;
            }
          },
          TSCodeNCC: {
            title: 'Mã NCC',
            field: 'TSCodeNCC',
            hozAlign: 'left',
            headerHozAlign: 'center'
          },
          SourceName: {
            title: 'Nguồn gốc',
            field: 'SourceName',
            hozAlign: 'left',
            headerHozAlign: 'center',
            formatter: (cell: any) => cell.getValue() || ''
          },
          FullName: {
            title: 'Người quản lý',
            field: 'FullName',
            hozAlign: 'left',
            headerHozAlign: 'center'
          },
          CreatedBy: {
            title: 'Người tạo',
            field: 'CreatedBy',
            hozAlign: 'left',
            headerHozAlign: 'center'
          },
          CreatedDate: {
            title: 'Ngày tạo',
            field: 'CreatedDate',
            hozAlign: 'left',
            headerHozAlign: 'center'
          },
          UpdatedBy: {
            title: 'Người cập nhật',
            field: 'UpdatedBy',
            hozAlign: 'left',
            headerHozAlign: 'center'
          },
          UpdatedDate: {
            title: 'Ngày cập nhật',
            field: 'UpdatedDate',
            hozAlign: 'left',
            headerHozAlign: 'center',
            formatter: formatDateCell
          },
          IsAllocation: {
            title: 'Is Allocation',
            field: 'IsAllocation',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell: any) => cell.getValue() ? 'Có' : 'Không'
          },
          OfficeActiveStatus: {
            title: 'Office Active',
            field: 'OfficeActiveStatus',
            hozAlign: 'right',
            headerHozAlign: 'center'
          },
          WindowActiveStatus: {
            title: 'Windows Active',
            field: 'WindowActiveStatus',
            hozAlign: 'right',
            headerHozAlign: 'center'
          },
          Note: {
            title: 'Ghi chú',
            field: 'Note',
            hozAlign: 'left',
            headerHozAlign: 'center'
          }
        }
      });
    }
  }
  formatProgressText = (percent: number): string => {
    return this.displayText;
  }
  importFromExcel(): void {
    if (this.table) {
      this.table.import("xlsx", [".xlsx", ".csv", ".ods"], "buffer");
    } else {
      this.notification.warning('Thông báo', 'Bảng chưa được khởi tạo!');
    }
  }
  openFileExplorer() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      console.log('File đã chọn:', file.name); // Log để kiểm tra
      console.log('Phần mở rộng:', fileExtension); // Log để kiểm tra
      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        this.notification.warning('Thông báo', 'Vui lòng chọn tệp Excel (.xlsx hoặc .xls)!');
        input.value = ''; // Xóa input để có thể chọn lại file
        this.resetExcelImportState(); // Reset trạng thái khi có lỗi định dạng
        return;
      }
      this.filePath = file.name;
      this.excelSheets = [];
      this.selectedSheet = '';
      this.dataTableExcel = [];
      this.totalRowsAfterFileRead = 0;
      this.processedRowsForSave = 0; // Reset cho giai đoạn lưu
      // Đặt trạng thái ban đầu cho thanh tiến trình: Đang đọc file
      this.displayProgress = 0;
      this.displayText = 'Đang đọc file...';
      console.log('Progress bar state set to: Đang đọc file...'); // Log trạng thái ban đầu
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          this.displayProgress = Math.round((event.loaded / event.total) * 100);
          this.displayText = `Đang tải file: ${this.displayProgress}%`;
          // console.log(`Tiến trình đọc file: ${this.displayProgress}%`); // Bỏ comment nếu muốn log chi tiết tiến trình tải
        }
      };
      let startTime = Date.now(); // Ghi lại thời gian bắt đầu đọc file
      reader.onload = async (e: any) => {
        const data = e.target.result;
        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);
          console.log('Workbook đã được tải bởi ExcelJS.'); // Log
          this.excelSheets = workbook.worksheets.map(sheet => sheet.name);
          console.log('Danh sách sheets tìm thấy:', this.excelSheets); // Log
          if (this.excelSheets.length > 0) {
            this.selectedSheet = this.excelSheets[0];
            console.log('Sheet mặc định được chọn:', this.selectedSheet); // Log
            await this.readExcelData(workbook, this.selectedSheet);
            const elapsedTime = Date.now() - startTime;
            const minDisplayTime = 500; // Thời gian hiển thị tối thiểu cho trạng thái tải (500ms)
            if (elapsedTime < minDisplayTime) {
              // Nếu quá trình xử lý nhanh hơn thời gian tối thiểu, đợi thêm
              setTimeout(() => {
                this.displayProgress = 0; // Luôn hiển thị 0% cho trạng thái "0/tổng số dòng"
                if (this.totalRowsAfterFileRead === 0) {
                  this.displayText = 'Không có dữ liệu hợp lệ trong sheet.';
                } else {
                  this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
                }
                console.log('Dữ liệu đã được đọc và bảng Excel preview đã được cập nhật (sau delay).');
              }, minDisplayTime - elapsedTime);
            } else {
              // Nếu quá trình xử lý đã đủ lâu, cập nhật ngay lập tức
              this.displayProgress = 0;
              if (this.totalRowsAfterFileRead === 0) {
                this.displayText = 'Không có dữ liệu hợp lệ trong sheet.';
              } else {
                this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
              }
              console.log('Dữ liệu đã được đọc và bảng Excel preview đã được cập nhật.');
            }
          } else {
            console.warn('File Excel không chứa bất kỳ sheet nào.'); // Log
            this.notification.warning('Thông báo', 'File Excel không có sheet nào!');
            this.resetExcelImportState();
          }
        } catch (error) {
          console.error('Lỗi khi đọc tệp Excel trong FileReader.onload:', error); // Log chi tiết lỗi
          this.notification.error('Thông báo', 'Không thể đọc tệp Excel. Vui lòng đảm bảo tệp không bị hỏng và đúng định dạng.');
          this.resetExcelImportState(); // Reset trạng thái khi có lỗi
        }
        input.value = ''; // Xóa input để có thể chọn lại cùng file
      };
      reader.readAsArrayBuffer(file); // Bắt đầu đọc file ngay lập tức
    }
  }
  async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
    console.log(`Bắt đầu đọc dữ liệu từ sheet: "${sheetName}"`);
    try {
      const worksheet = workbook.getWorksheet(sheetName);
      if (!worksheet) throw new Error(`Sheet "${sheetName}" không tồn tại.`);

      // Đọc header từ hàng thứ 2
      const headerRow = worksheet.getRow(2);
      const headers: string[] = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || '';
      });
      // Cột hiển thị theo thứ tự autoColumnsDefinitions
      const columns = [
        { title: headers[0] || 'STT', field: 'STT', hozAlign: 'center', headerHozAlign: 'center', width: 70 },
        { title: headers[1] || 'Mã tài sản', field: 'TSAssetCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[2] || 'Tên tài sản', field: 'TSAssetName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[3] || 'Seri', field: 'Seri', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[4] || 'Đơn vị', field: 'UnitName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[5] || 'Thông số', field: 'SpecificationsAsset', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[6] || 'Ngày mua', field: 'DateBuy', hozAlign: 'center', headerHozAlign: 'center', formatter: formatDateCell },
        { title: headers[7] || 'Ngày hiệu lực', field: 'DateEffect', hozAlign: 'center', headerHozAlign: 'center', formatter: formatDateCell },
        { title: headers[8] || 'Bảo hành (tháng)', field: 'Insurance', hozAlign: 'right', headerHozAlign: 'center' },
        { title: headers[9] || 'Loại tài sản', field: 'AssetType', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[10] || 'Phòng ban', field: 'Name', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[11] || 'Trạng thái', field: 'Status', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[12] || 'Mã NCC', field: 'TSCodeNCC', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[13] || 'Nguồn gốc', field: 'SourceName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[14] || 'Người quản lý', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[15] || 'Người tạo', field: 'CreatedBy', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[16] || 'Ngày tạo', field: 'CreatedDate', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[17] || 'Người cập nhật', field: 'UpdatedBy', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[18] || 'Ngày cập nhật', field: 'UpdatedDate', hozAlign: 'left', headerHozAlign: 'center', formatter: formatDateCell },
        { title: headers[19] || 'Is Allocation', field: 'IsAllocation', hozAlign: 'center', headerHozAlign: 'center', formatter: (cell: any) => cell.getValue() ? 'Có' : 'Không' },
        { title: headers[20] || 'Office Active', field: 'OfficeActiveStatus', hozAlign: 'right', headerHozAlign: 'center' },
        { title: headers[21] || 'Windows Active', field: 'WindowActiveStatus', hozAlign: 'right', headerHozAlign: 'center' },
        { title: headers[22] || 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center' }
      ];
      if (this.tableExcel) this.tableExcel.setColumns(columns);
      const data: any[] = [];
      let validRecords = 0;
      let foundFirstDataRow = false;
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const firstCell = row.getCell(1).value;
          const isEmptyRow = !firstCell || !row.getCell(2).value || !row.getCell(3).value;
          if (!isEmptyRow) {
            const rowData: any = {
              STT: row.getCell(1).value?.toString() || '',
              TSAssetCode: row.getCell(2).value?.toString() || '',
              TSAssetName: row.getCell(3).value?.toString() || '',
              Seri: row.getCell(4).value?.toString() || '',
              UnitName: row.getCell(5).value?.toString() || '',
              SpecificationsAsset: row.getCell(6).value?.toString() || '',
              DateBuy: row.getCell(7).value?.toString() || '',
              DateEffect: row.getCell(8).value?.toString() || '',
              Insurance: row.getCell(9).value?.toString() || '',
              AssetType: row.getCell(10).value?.toString() || '',
              Name: row.getCell(11).value?.toString() || '',
              Status: row.getCell(12).value?.toString() || '',
              TSCodeNCC: row.getCell(13).value?.toString() || '',
              SourceName: row.getCell(14).value?.toString() || '',
              FullName: row.getCell(15).value?.toString() || '',
              CreatedBy: row.getCell(16).value?.toString() || '',
              CreatedDate: row.getCell(17).value?.toString() || '',
              UpdatedBy: row.getCell(18).value?.toString() || '',
              UpdatedDate: row.getCell(19).value?.toString() || '',
              IsAllocation: row.getCell(20).value?.toString()?.toLowerCase() === 'có',
              OfficeActiveStatus: row.getCell(21).value?.toString() || '',
              WindowActiveStatus: row.getCell(22).value?.toString() || '',
              Note: row.getCell(23).value?.toString() || '',
            };
            data.push(rowData);
          }
          if (typeof firstCell === 'number' && !isNaN(firstCell)) {
            foundFirstDataRow = true;
          }
          if (foundFirstDataRow && !isEmptyRow) {
            validRecords++;
          }
        }
      });
      this.dataTableExcel = data;
      this.totalRowsAfterFileRead = validRecords;
      this.displayProgress = 0;
      this.displayText = validRecords === 0
        ? 'Không có dữ liệu hợp lệ trong sheet.'
        : `0/${validRecords} bản ghi`;
      if (this.tableExcel) {
        this.tableExcel.replaceData(data);
      } else {
        this.drawtable();
      }

      console.log(`Đã load ${validRecords} bản ghi hợp lệ.`);
    } catch (error) {
      console.error('Lỗi khi đọc dữ liệu từ sheet:', error);
      this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet!');
      this.resetExcelImportState();
    }
  }
  onSheetChange() {
    console.log('Sheet đã thay đổi thành:', this.selectedSheet);
    if (this.filePath) {
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = async (e: any) => {
          const data = e.target.result;
          try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(data);
            await this.readExcelData(workbook, this.selectedSheet);
            // Sau khi thay đổi sheet và đọc dữ liệu, đặt lại thanh tiến trình
            this.displayProgress = 0;
            // displayText được cập nhật trong readExcelData
            console.log('Dữ liệu đã được đọc lại sau khi thay đổi sheet.'); // Log
          } catch (error) {
            console.error('Lỗi khi đọc tệp Excel khi thay đổi sheet:', error);
            this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet đã chọn!');
            this.resetExcelImportState(); // Reset trạng thái khi có lỗi
          }
        };
        reader.readAsArrayBuffer(file);
      }
    }
  }
   async saveExcelData() {
    if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      return;
    }

    const validDataToSave = this.dataTableExcel.filter(row => {
      const stt = row.STT;
      return typeof stt === 'number' || (typeof stt === 'string' && !isNaN(parseFloat(stt)) && isFinite(parseFloat(stt)));
    });

    if (validDataToSave.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu hợp lệ (STT là số) để lưu!');
      this.displayProgress = 0;
      this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
      return;
    } ``
    this.processedRowsForSave = 0;
    const totalAssetsToSave = validDataToSave.length;
    this.displayText = `Đang lưu: 0/${totalAssetsToSave} bản ghi`;
    this.displayProgress = 0;

    const assetsDataToSave = validDataToSave.map(row => {
      return {
        tSAssetManagements: [{
          ID: 0,
          STT: row.STT,
          TSAssetCode: row.TSAssetCode || '',
          TSAssetName: row.TSAssetName || '',
          IsAllocation: false,
          UnitID: this.getUnitIdByName(row.UnitName),
          Seri: row.Seri || '',
          SpecificationsAsset: row.SpecificationsAsset || '',
          DateBuy: formatDate(row.DateBuy),
          DateEffect: formatDate(row.DateEffect),
          Insurance: row.Insurance || 0,
          TSCodeNCC: row.TSCodeNCC || '',
          OfficeActiveStatus: 0,
          WindowActiveStatus: 0,
          Note: row.Note || '',
          StatusID: 1,
          SourceID: this.getSourceIdByName(row.SourceName),
          TSAssetID: this.getTypeIdByName(row.AssetType),
          Status: "Chưa sử dụng",
          EmployeeID:this.getEmployeeIDByName(row.FullName),
          SupplierID:0,
          DepartmentID:this.getDepartmentIDByName(row.Name),
        }]
      };
    });
    let successCount = 0;
    let errorCount = 0;
    let completedRequests = 0;
    const saveAssetWithDelay = (index: number) => {
      if (index >= assetsDataToSave.length) {
        this.showSaveSummary(successCount, errorCount, totalAssetsToSave);
        return;
      }
      const asset = assetsDataToSave[index];
      setTimeout(() => {
        this.assetsManagementService.saveDataAsset(asset).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              successCount++;
              console.log(asset);
            } else {
              errorCount++;
              console.error(`Lỗi khi lưu tài sản ${index + 1}:`, response.message);
            }
            completedRequests++;
            this.processedRowsForSave = completedRequests;
            this.displayProgress = Math.round((completedRequests / totalAssetsToSave) * 100);
            this.displayText = `Đang lưu: ${completedRequests}/${totalAssetsToSave} bản ghi`;
            saveAssetWithDelay(index + 1);
          },
          error: (err) => {
            errorCount++;
            console.error(`Lỗi API khi lưu tài sản ${index + 1}:`, err);
            completedRequests++;
            this.processedRowsForSave = completedRequests;
            this.displayProgress = Math.round((completedRequests / totalAssetsToSave) * 100);
            this.displayText = `Đang lưu: ${completedRequests}/${totalAssetsToSave} bản ghi`;
            saveAssetWithDelay(index + 1);
          }
        });
      }, 5);
    };
    saveAssetWithDelay(0);
  }
  showSaveSummary(successCount: number, errorCount: number, totalProducts: number) {
    console.log('--- Hiển thị tóm tắt kết quả lưu ---');
    console.log(`Tổng sản phẩm: ${totalProducts}, Thành công: ${successCount}, Thất bại: ${errorCount}`);

    if (errorCount === 0) {
      this.notification.success('Thông báo', `Đã lưu ${successCount} sản phẩm thành công`);
    } else if (successCount === 0) {
      this.notification.error('Thông báo', `Lưu thất bại ${errorCount}/${totalProducts} sản phẩm`);
    } else {
      this.notification.warning('Thông báo', `Đã lưu ${successCount} sản phẩm thành công, ${errorCount} sản phẩm thất bại`);
    }
    this.closeExcelModal();
  }
  // Hàm helper để lấy ID của đơn vị tính từ tên
  private getUnitIdByName(unitName: string): number {
    const unit = this.listUnitCount.find(u => u.UnitName === unitName);
    return unit ? unit.ID : 0;
  }

  // Hàm helper để lấy ID của hãng từ tên
  private getSourceIdByName(sourceName: string): number {
    const source = this.listSourceAsset.find(s => s.SourceName === sourceName);
    return source ? source.ID : 0;
  }
  // Hàm helper để lấy ID của ProductGroup từ tên
  private getTypeIdByName(typeName: string): number {
    const type = this.listTypeAsset.find(t => t.TypeName === typeName);
    return type ? type.ID : 0;
  }
  private getEmployeeIDByName(Name: string)
  {
  const emp = this.emPloyeeLists.find(t=>t.FullName==Name);
  return emp?emp.ID:0;

  }
    private getDepartmentIDByName(dpmName: string)
  {
  const dpm = this.emPloyeeLists.find(t=>t.DepartmentName==dpmName);
  return dpm?dpm.ID:0;

  }
  // Hàm helper để lấy ID của Location từ tên
  // Hàm để lấy danh sách đơn vị, ProductGroup và Location
  private loadUnit() {
   this.unitService.getUnit().subscribe((res: any) => {
      this.listUnitCount = res.data;
      console.log(this.listUnitCount);
    });
     this.soucerService.getAssets().subscribe((response: any) => {
      this.listSourceAsset = response.data;
      console.log(this.listSourceAsset);
    });
     this.typeAssetsService.getTypeAssets().subscribe((resppon: any) => {
      this.listTypeAsset = resppon.data;
      console.log(this.listTypeAsset);
    });
     const request = {
      status: 0,
      departmentid: 0,
      keyword: ''
    };
     this.tsAssetManagementPersonalService.getEmployee(request).subscribe((respon: any) => {
      this.emPloyeeLists = respon.employees;
    });
    this.assetsManagementService.getAssetAllocationDetail(1).subscribe({
      next: (res: any) => {
        this.listMaker = res.data || [];
      },
      error: (err: any) => {
        console.error('Lỗi khi lấy danh sách hãng:', err);
      }
    });
  }
  // Hàm mới để reset trạng thái nhập Excel
  private resetExcelImportState(): void {
    this.filePath = '';
    this.excelSheets = [];
    this.selectedSheet = '';
    this.dataTableExcel = [];
    this.displayText = '0/0';
    this.displayProgress = 0;
    this.totalRowsAfterFileRead = 0;
    this.processedRowsForSave = 0;

    if (this.tableExcel) {
      this.tableExcel.replaceData([]); // Xóa dữ liệu trong Tabulator preview
    }
    console.log('Trạng thái nhập Excel đã được reset.'); // Log
  }
  closeExcelModal() {
    this.modalService.dismissAll(true);
  }
}
