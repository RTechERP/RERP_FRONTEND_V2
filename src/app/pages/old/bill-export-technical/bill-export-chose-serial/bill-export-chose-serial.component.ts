import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { BillExportTechnicalService } from '../bill-export-technical-service/bill-export-technical.service';
@Component({
  selector: 'app-bill-export-chose-serial',
  templateUrl: './bill-export-chose-serial.component.html',
  styleUrls: ['./bill-export-chose-serial.component.css']
})
export class BillExportChoseSerialComponent implements OnInit, AfterViewInit {
 @Input() existingSerials: { ID: number, Serial: string }[] = [];
  @Input() quantity: number = 0;

  @ViewChild('serialTable1') serialTable1!: ElementRef;
  table!: Tabulator;

  constructor(
     public activeModal: NgbActiveModal,
     private BillExportTechnicalService: BillExportTechnicalService
  ) { }

 ngOnInit(): void { }

  ngAfterViewInit(): void {
    setTimeout(() => this.initTable(), 0);
  }
initTable(): void {
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

    this.table = new Tabulator(this.serialTable1.nativeElement, {
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
        }
      ]
      ,
      placeholder: 'Không có dữ liệu',
    });
  }
  async save() {
    const data = this.table.getData();
    const isValid = data.every(row => row.Serial && row.Serial.trim() !== '');
    if (!isValid) {
      alert('Vui lòng nhập đầy đủ Serial cho tất cả dòng!');
      return;
    }

    let globalIndex = 1;
    const serials = data.flatMap(row => {
      return row.Serial.split(',').map((serial: string) => ({
        ID: row.ID || 0, 
        STT: globalIndex++,
        SerialNumber: serial.trim(),
       WarehouseID:1
      }));
    });

    try {
      const response = await this.BillExportTechnicalService.saveData({
        billExportTechDetailSerials: serials
      }).toPromise();

      if (response?.status === 1 && response.data) {
        this.activeModal.close(response.data);
      } else {
        alert('Lưu serial thất bại!');
        console.error('Lỗi response:', response);
      }
    } catch (error) {
      alert('Lỗi khi lưu serial!');
      console.error('Lỗi API:', error);
    }
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
