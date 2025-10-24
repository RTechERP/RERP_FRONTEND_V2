import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { BillImportServiceService } from '../../../../BillImport/bill-import-service/bill-import-service.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BillExportService } from '../../../bill-export-service/bill-export.service';
@Component({
  selector: 'app-bill-import-chose-serial',
  templateUrl: './bill-import-chose-serial.component.html',
  styleUrls: ['./bill-import-chose-serial.component.css']
})
export class BillImportChoseSerialComponent implements OnInit {
  @Input() existingSerials: { ID: number, Serial: string }[] = [];
  @Input() quantity: number = 0;
  @Input() type: number = 0;
  @ViewChild('serialTable') serialTable!: ElementRef;
  table!: Tabulator;
  constructor(
    public activeModal: NgbActiveModal,
    private billExportService: BillExportService,
    private notification: NzNotificationService,
  ) { }
  ngOnInit(): void {
    // thay vì ngAfterViewInit
    setTimeout(() => this.drawTable(), 0);
  }
  ngAfterViewInit(): void {
  }
  drawTable(): void {
    let data: { Index: number; Serial: string, ID: number }[];
    if (this.existingSerials?.length > 0) {
      data = this.existingSerials.map((item, index) => ({
        Index: index + 1,
        Serial: item.Serial,
        ID: item.ID // giữ ID
      }));
    } else {
      data = Array.from({ length: this.quantity }, (_, index) => ({
        Index: index + 1,
        Serial: '',
        ID: 0 // serial mới
      }));
    }
    this.table = new Tabulator(this.serialTable.nativeElement, {
      data,
      layout: 'fitColumns',
      height: '400px',
      columns: [
        { title: 'STT', field: 'Index', hozAlign: 'center', width: 80 },
        {
          title: 'Serial',
          field: 'Serial',
          editor: 'input',
          validator: ['required']
        },
        {
          title: 'ID',
          field: 'ID',
          visible: false // Ẩn cột ID
        }
      ]
      ,
      placeholder: 'Không có dữ liệu',
    });
  }
  cancel() {
    this.activeModal.dismiss();
  }
  async save() {
    const data = this.table.getData(); 
  
    // Kiểm tra tất cả dòng có Serial không rỗng 
    const isValid = data.every(row => row.Serial && row.Serial.trim() !== ''); 
    if (!isValid) { 
      this.notification.error('Thông báo','Vui lòng nhập đầy đủ Serial cho tất cả dòng!'); 
      return; 
    }
  
    // Kiểm tra trùng lặp Serial 
    const serialSet = new Set(data.map(row => row.Serial)); 
    if (serialSet.size !== data.length) { 
      this.notification.error('Thông báo','Có serial trùng lặp!'); 
      return; 
    }
  
    // Xử lý danh sách serial 
    let globalIndex = 1; 
    const serials = data.flatMap(row => { 
      return row.Serial.split(',').map((serial: string) => ({
        ID: row.ID || 0,
        STT: globalIndex++,
        SerialNumber: serial.trim()
      })); 
    });
  
    const payload = { 
      billExportDetailSerialNumbers: this.type === 2 ? serials : null, 
      billImportDetailSerialNumbers: this.type === 1 ? serials : null, 
      type: this.type 
    }; 
  
    try { 
      const response = await this.billExportService.saveDataBillDetailSerialNumber(payload).toPromise(); 
      if (response?.status === 1 && response.data) {
        let result: { ID: number; Serial: string }[] = [];
      
        if (response?.status === 1 && response.data) {
          this.notification.success('Thông báo', 'Lưu serial thành công!');
        
          // Chuẩn hóa dữ liệu trả ra cho modal
          let result: { ID: number; Serial: string }[] = [];
        
          if (Array.isArray(response.data)) {
            // Trường hợp response.data là mảng
            result = response.data.map((item: any) => ({
              ID: item.ID,
              Serial: item.SerialNumber
            }));
          } else if (response.data.billExportDetailSerialNumbers) {
            // Trường hợp có nested array
            result = response.data.billExportDetailSerialNumbers.map((item: any) => ({
              ID: item.ID,
              Serial: item.SerialNumber
            }))
          }
            else if(response.data.billImportDetailSerialNumbers){
              result = response.data.billImportDetailSerialNumbers.map((item: any) => ({
                ID: item.ID,
                Serial: item.SerialNumber
              }));
          }
        
          this.activeModal.close(result);
        } else {
          this.notification.error('Thông báo', 'Lưu serial thất bại!');
          console.error('Lỗi response:', response);
        }
        
      
        this.notification.success('Thông báo','Lưu serial thành công!');
        this.activeModal.close(result);
      }
       else { 
        this.notification.error('Thông báo','Lưu serial thất bại!'); 
        console.error('Lỗi response:', response); 
      } 
    } catch (error) { 
      this.notification.error('Thông báo','Lỗi khi lưu serial!'); 
      console.error('Lỗi API:', error); 
    }
  }
}
