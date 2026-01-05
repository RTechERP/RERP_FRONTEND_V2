import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
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
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectWorkerService } from '../project-woker/project-worker-service/project-worker.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-import-excel',
  standalone:true,
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
  ],
  templateUrl: './import-excel-project-worker.component.html',
  styleUrl: './import-excel-project-worker.component.css'
})
export class ImportExcelProjectWorkerComponent implements OnInit, AfterViewInit {
  @Input() projectId: number = 0;
  @Input() projectCodex: string = '';
  @Input() tb_projectWorker: any;
  @Input() tb_solutionVersion: any;
  @Input() tb_POVersion: any;
  @Input() dataProjectWorker: any[] = [];
  @Input() dataSolution: any[] = [];
  @Input() dataSolutionVersion: any[] = [];
  @Input() dataPOVersion: any[] = [];
  @Input() selectedVersionID: number = 0;
  @Input() selectedVersionCode: string = '';
  @Input() type: number = 0;

  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  tableExcel: any;
  dataTableExcel: any[]=[];
  workbook: ExcelJS.Workbook | null = null; // Lưu workbook để sử dụng khi thay đổi sheet
  
  // Thông tin version và type
  versionID: number = 0;
  projectTypeID: number = 0;
  
  // Biến hiển thị chính trên thanh tiến trình
  displayProgress: number = 0; // % hiển thị trên thanh
  displayText: string = '0/0'; // Text hiển thị trên thanh
  
  totalRowsAfterFileRead: number = 0; // Tổng số dòng dữ liệu hợp lệ sau khi đọc file
  processedRowsForSave: number = 0; // Số dòng đã được xử lý khi lưu vào DB


  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private projectWorkerService: ProjectWorkerService,
    public activeModal: NgbActiveModal,
  ) { }
  ngOnInit(): void {
    // Xác định versionID và projectTypeID từ các bảng đã chọn
    this.determineVersionAndType();
  }

  // Xác định versionID và projectTypeID từ các bảng đã chọn
  determineVersionAndType(): void {
    // Ưu tiên sử dụng inputs từ parent component (SlickGrid)
    if (this.selectedVersionID > 0) {
      this.versionID = this.selectedVersionID;
      
      // Tìm projectTypeID từ data tương ứng
      if (this.type === 1 && this.dataSolutionVersion.length > 0) {
        const versionData = this.dataSolutionVersion.find((v: any) => v.ID === this.selectedVersionID);
        if (versionData) {
          this.projectTypeID = versionData.ProjectTypeID || 0;
        }
      } else if (this.type === 2 && this.dataPOVersion.length > 0) {
        const versionData = this.dataPOVersion.find((v: any) => v.ID === this.selectedVersionID);
        if (versionData) {
          this.projectTypeID = versionData.ProjectTypeID || 0;
        }
      }
      return;
    }

    // Fallback: Kiểm tra bảng solutionVersion (Tabulator)
    if (this.tb_solutionVersion) {
      const selectedData = this.tb_solutionVersion.getSelectedData();
      if (selectedData && selectedData.length > 0) {
        this.versionID = selectedData[0].ID || 0;
        this.projectTypeID = selectedData[0].ProjectTypeID || 0;
        return;
      }
    }

    // Fallback: Kiểm tra bảng POVersion (Tabulator)
    if (this.tb_POVersion) {
      const selectedData = this.tb_POVersion.getSelectedData();
      if (selectedData && selectedData.length > 0) {
        this.versionID = selectedData[0].ID || 0;
        this.projectTypeID = selectedData[0].ProjectTypeID || 0;
        return;
      }
    }
  }
  ngAfterViewInit(): void {
    this.drawtable();
  }

  drawtable(){
    if (!this.tableExcel) { // Chỉ khởi tạo nếu chưa có
      this.tableExcel = new Tabulator('#datatableExcel', {
        data: this.dataTableExcel, // Dữ liệu ban đầu rỗng
        layout: 'fitDataStretch',
        height: '300px', // Chiều cao cố định cho bảng trong modal
        selectableRows: false,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        columns: [
          { title: "TT", field: "TT", hozAlign: "center", headerHozAlign: "center"},
          { title: "Nội dung công việc", field: "WorkContent", hozAlign: "left", headerHozAlign: "center",  formatter: 'textarea' },
          { title: "Số người", field: "AmountPeople", hozAlign: "right", headerHozAlign: "center", },
          { title: "Số ngày", field: "NumberOfDay", hozAlign: "right", headerHozAlign: "center",  },
          { title: "Tổng nhân công", field: "TotalWorkforce", hozAlign: "right", headerHozAlign: "center", },
          { title: "Đơn giá", field: "Price", hozAlign: "right", headerHozAlign: "center",  },
          { title: "Thành tiền", field: "TotalPrice", hozAlign: "right", headerHozAlign: "center",  }
        ]
      });   
    }
  }
  formatProgressText = (percent: number): string => {
    return this.displayText;
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
        this.workbook = null; // Reset workbook

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
                this.workbook = new ExcelJS.Workbook();
                await this.workbook.xlsx.load(data);
                console.log('Workbook đã được tải bởi ExcelJS.'); // Log

                this.excelSheets = this.workbook.worksheets.map(sheet => sheet.name);
                console.log('Danh sách sheets tìm thấy:', this.excelSheets); // Log

                if (this.excelSheets.length > 0) {
                    this.selectedSheet = this.excelSheets[0];
                    console.log('Sheet mặc định được chọn:', this.selectedSheet); // Log
                    await this.readExcelData(this.workbook, this.selectedSheet);
                    
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
      if (!worksheet) {
        throw new Error(`Sheet "${sheetName}" không tồn tại trong workbook.`);
      }

      const data: any[] = [];
      let validRecords = 0;
      const regex = /^-?[\d\.]+$/; // Regex để validate STT

      // Đọc dữ liệu từ hàng thứ 2 trở đi (hàng 1 là header)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const cell1 = row.getCell(1);
          const stt = this.getCellText(cell1).trim();
          
          // Bỏ qua nếu STT rỗng
          if (!stt) return;

          // Validate STT bằng regex (chỉ chấp nhận số và dấu chấm)
          if (!regex.test(stt)) return;

          const cell2 = row.getCell(2);
          const workContent = this.getCellText(cell2);
          const amountPeople = this.parseNumber(row.getCell(3).value);
          const numberOfDay = this.parseNumber(row.getCell(4).value);
          const cell6 = row.getCell(6);
          const priceStr = this.getCellText(cell6);
          
          // Format giá: bỏ dấu phẩy và chấm (trừ dấu chấm thập phân cuối cùng nếu có)
          const price = this.parsePrice(priceStr);
          
          // Tính toán
          const totalWorkforce = amountPeople * numberOfDay;
          const totalPrice = price * totalWorkforce;

          const rowData: any = {
            TT: stt,
            WorkContent: workContent,
            AmountPeople: amountPeople,
            NumberOfDay: numberOfDay,
            TotalWorkforce: totalWorkforce,
            Price: price,
            TotalPrice: totalPrice
          };

          data.push(rowData);
          validRecords++;
        }
      });

      this.dataTableExcel = data;
      this.totalRowsAfterFileRead = validRecords;
      console.log(`Đã đọc ${validRecords} bản ghi hợp lệ từ sheet.`);

      // Cập nhật hiển thị
      this.displayProgress = 0;
      if (this.totalRowsAfterFileRead === 0) {
        this.displayText = 'Không có dữ liệu hợp lệ trong sheet.';
      } else {
        this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
      }

      // Cập nhật Tabulator
      if (this.tableExcel) {
        this.tableExcel.replaceData(this.dataTableExcel);
      } else {
        this.drawtable();
      }

    } catch (error) {
      console.error('Lỗi khi đọc dữ liệu từ sheet:', error);
      this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet! Vui lòng kiểm tra định dạng dữ liệu.');
      this.resetExcelImportState();
    }
  }

  // Helper function để lấy text từ cell Excel (xử lý cả RichText)
  private getCellText(cell: any): string {
    if (!cell) return '';
    
    try {
      // ExcelJS có property .text để lấy text trực tiếp
      if (cell.text !== undefined && cell.text !== null) {
        return String(cell.text);
      }
    } catch (e) {
      // Bỏ qua lỗi nếu không thể đọc .text
    }
    
    // Nếu không có .text, thử lấy từ .value
    try {
      const value = cell.value;
      if (value === null || value === undefined) return '';
      
      // Nếu là RichText object (ExcelJS)
      if (typeof value === 'object' && value.richText) {
        // Lấy text từ richText array
        if (Array.isArray(value.richText)) {
          return value.richText.map((rt: any) => rt?.text || '').join('');
        }
      }
      
      // Nếu là object có thuộc tính text
      if (typeof value === 'object' && 'text' in value && value.text !== null && value.text !== undefined) {
        return String(value.text);
      }
      
      // Nếu là string hoặc number, chuyển sang string
      return String(value);
    } catch (e) {
      // Nếu có lỗi, trả về chuỗi rỗng
      return '';
    }
  }

  // Helper function để parse number
  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const str = value.toString().replace(/[,\.]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  // Helper function để parse giá (bỏ dấu phẩy/chấm)
  private parsePrice(priceStr: string): number {
    if (!priceStr) return 0;
    // Bỏ tất cả dấu phẩy và chấm
    const cleaned = priceStr.toString().replace(/[,\.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  async onSheetChange() {
    console.log('Sheet đã thay đổi thành:', this.selectedSheet);
    if (this.selectedSheet && this.workbook) {
      try {
        await this.readExcelData(this.workbook, this.selectedSheet);
        // Sau khi thay đổi sheet và đọc dữ liệu, đặt lại thanh tiến trình
        this.displayProgress = 0;
        // displayText được cập nhật trong readExcelData
        console.log('Dữ liệu đã được đọc lại sau khi thay đổi sheet.'); // Log
      } catch (error) {
        console.error('Lỗi khi đọc dữ liệu từ sheet đã chọn:', error);
        this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet đã chọn!');
        this.resetExcelImportState(); // Reset trạng thái khi có lỗi
      }
    } else if (!this.workbook) {
      this.notification.warning('Thông báo', 'Vui lòng chọn file Excel trước!');
    }
  }

  saveExcelData() {
    console.log('--- Bắt đầu saveExcelData ---');

    // Xác định lại versionID và projectTypeID
    this.determineVersionAndType();

    if (this.versionID === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản giải pháp hoặc phiên bản PO!');
      return;
    }

    if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      return;
    }

    // Validate dữ liệu: chỉ lấy các dòng có STT hợp lệ (regex)
    const regex = /^-?[\d\.]+$/;
    const validDataToSave = this.dataTableExcel.filter(row => {
      const stt = row.TT?.toString()?.trim() || '';
      return stt && regex.test(stt);
    });

    if (validDataToSave.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu hợp lệ để lưu!');
      return;
    }

    // Kiểm tra xem có dữ liệu đã tồn tại không (theo logic WinForm)
    this.checkAndConfirmOverwrite();
  }

  // Kiểm tra và xác nhận ghi đè dữ liệu cũ
  checkAndConfirmOverwrite(): void {
    const payload = {
      projectID: this.projectId || 0,
      projectWorkerTypeID: 0,
      IsApprovedTBP: -1,
      IsDeleted: 0, // Chỉ lấy dữ liệu chưa xóa
      KeyWord: '',
      versionID: this.versionID || 0
    };

    this.projectWorkerService.getProjectWorker(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const existingData = response.data || [];
          
          if (existingData.length > 0) {
            // Có dữ liệu tồn tại, hỏi xác nhận
            this.modal.confirm({
              nzTitle: 'Xác nhận',
              nzContent: 'Nhân công dự án đã tồn tại.\nBạn có muốn ghi đè không?',
              nzOkText: 'Có',
              nzCancelText: 'Không',
              nzOnOk: () => {
                // Xóa mềm tất cả bản ghi cũ trước khi tạo mới
                this.softDeleteExistingData(existingData);
              }
            });
          } else {
            // Không có dữ liệu tồn tại, tạo mới trực tiếp
            this.createNewData();
          }
        } else {
          // Lỗi khi kiểm tra, vẫn tiếp tục tạo mới
          this.createNewData();
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi kiểm tra dữ liệu tồn tại:', err);
        // Lỗi khi kiểm tra, vẫn tiếp tục tạo mới
        this.createNewData();
      }
    });
  }

  // Xóa mềm tất cả bản ghi cũ
  softDeleteExistingData(existingData: any[]): void {
    // Tạo payload để xóa mềm (set IsDeleted = true)
    const deletePayload = existingData.map((item: any) => ({
      ID: item.ID,
      IsDeleted: true
    }));

    this.projectWorkerService.saveWorker(deletePayload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          console.log('Đã xóa mềm dữ liệu cũ thành công');
          // Sau khi xóa mềm xong, tạo mới dữ liệu
          this.createNewData();
        } else {
          this.notification.error('Lỗi', 'Không thể xóa dữ liệu cũ!');
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi xóa mềm dữ liệu cũ:', err);
        this.notification.error('Lỗi', 'Không thể xóa dữ liệu cũ!');
      }
    });
  }

  // Tạo mới dữ liệu từ Excel
  createNewData(): void {
    // Validate dữ liệu: chỉ lấy các dòng có STT hợp lệ (regex)
    const regex = /^-?[\d\.]+$/;
    const validDataToSave = this.dataTableExcel.filter(row => {
      const stt = row.TT?.toString()?.trim() || '';
      return stt && regex.test(stt);
    });

    if (validDataToSave.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu hợp lệ để lưu!');
      return;
    }

    // Reset tiến trình
    this.processedRowsForSave = 0;
    const totalRowsToSave = validDataToSave.length;
    this.displayText = `Đang lưu: 0/${totalRowsToSave} bản ghi`;
    this.displayProgress = 0;

    // Map dữ liệu thành ProjectWorker (tất cả ID = 0 để tạo mới)
    const projectWorkers = validDataToSave.map((row) => {
      return {
        ID: 0, // Tạo mới
        TT: row.TT?.toString()?.trim() || '',
        WorkContent: row.WorkContent?.toString() || '',
        AmountPeople: row.AmountPeople || 0,
        NumberOfDay: row.NumberOfDay || 0,
        TotalWorkforce: row.TotalWorkforce || 0,
        Price: row.Price || 0,
        TotalPrice: row.TotalPrice || 0,
        ParentID: 0, // Sẽ được tính bởi API
        ProjectID: this.projectId,
        ProjectWorkerVersionID: this.versionID,
        ProjectTypeID: this.projectTypeID,
        IsDeleted: false
      };
    });

    console.log('Dữ liệu ProjectWorker gửi đi (tạo mới):', projectWorkers);

    // Gọi API để lưu
    this.projectWorkerService.saveWorker(projectWorkers).subscribe({
      next: (response: any) => {
        console.log('Response từ saveWorker API:', response);
        
        if (response.status === 1) {
          this.displayProgress = 100;
          this.displayText = `Đã lưu: ${totalRowsToSave}/${totalRowsToSave} bản ghi`;
          this.notification.success('Thành công', `Đã lưu ${totalRowsToSave} nhân công thành công!`);
          
          // Đóng modal và trả về kết quả
          setTimeout(() => {
            this.activeModal.close({ success: true });
          }, 500);
        } else if (response.status === 2) {
          this.notification.warning('Thông báo', response.message || 'TT đã tồn tại, vui lòng kiểm tra lại!');
        } else {
          this.notification.error('Lỗi', response.message || 'Lưu dữ liệu thất bại!');
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi lưu nhân công:', err);
        const msg = err.error?.message || err.message || 'Lỗi kết nối server khi lưu dữ liệu!';
        this.notification.error('Thông báo', msg);
        this.displayText = 'Lỗi khi lưu dữ liệu!';
        this.displayProgress = 0;
      }
    });
  }


  // Hàm mới để reset trạng thái nhập Excel
  private resetExcelImportState(): void {
    this.filePath = '';
    this.excelSheets = [];
    this.selectedSheet = '';
    this.dataTableExcel = [];
    this.workbook = null; // Reset workbook
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
    this.activeModal.close({ success: true });
  }
  downloadTemplate() {
    const fileName = 'NhanCongDuAnTemplate.xlsx';
    this.projectWorkerService.downloadTemplate(fileName).subscribe({
      next: (blob: Blob) => {
        // Kiểm tra xem có phải là blob hợp lệ không
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.success('Thông báo', 'Tải file mẫu thành công!');
        } else {
          this.notification.error('Thông báo', 'File tải về không hợp lệ!');
        }
      },
      error: (res: any) => {
        console.error('Lỗi khi tải file mẫu:', res);
        // Nếu error response là blob (có thể server trả về lỗi dạng blob)
        if (res.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorText = JSON.parse(reader.result as string);
              this.notification.error('Thông báo', errorText.message || 'Tải file mẫu thất bại!');
            } catch {
              this.notification.error('Thông báo', 'Tải file mẫu thất bại!');
            }
          };
          reader.readAsText(res.error);
        } else {
          const errorMsg = res?.error?.message || res?.message || 'Tải file mẫu thất bại. Vui lòng thử lại!';
          this.notification.error('Thông báo', errorMsg);
        }
      }
    });
  }
}
