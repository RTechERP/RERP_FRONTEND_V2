import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  inject,
  Inject,
  EnvironmentInjector,
  ApplicationRef
} from '@angular/core';
import { Tabulator } from 'tabulator-tables';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { VehicleBookingManagementService } from '../vehicle-booking-management.service';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFloatButtonModule } from 'ng-zorro-antd/float-button';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { NzTableComponent } from "ng-zorro-antd/table";
import { DateTime } from 'luxon';
import type { Editor } from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { RowComponent } from "tabulator-tables";
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-vehicle-booking-file-images-form',
  imports: [
    CommonModule, NzCheckboxModule, NzFormModule,
    FormsModule,
    NzTabsModule,
    FormsModule, NzFlexModule, NzRadioModule,
    NzSelectModule,
    NzGridModule,
    NzFloatButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzInputNumberModule,
    NzSpinModule
  ],
  templateUrl: './vehicle-booking-file-images-form.component.html',
  styleUrl: './vehicle-booking-file-images-form.component.css'
})
export class VehicleBookingFileImagesFormComponent implements OnInit, AfterViewInit {
  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal

  ) { }

  private vehicleBookingManagementService = inject(VehicleBookingManagementService);
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  public activeModal = inject(NgbActiveModal);
  vehicleTypeID: any;
  vehicleImageList: any[] = [];
  listID: any[] = [];
  loading: boolean = false;
  
  get hasImages(): boolean {
    return this.vehicleImageList && this.vehicleImageList.length > 0 && 
           this.vehicleImageList.some((item: any) => item.urlImage);
  }
  
  ngOnInit(): void {
    console.log("dataInput", this.dataInput);
  }

  ngAfterViewInit(): void {
    // Khởi tạo bảng trước với dữ liệu rỗng
    this.drawTbVehicleCategory();
    // Sau đó mới load dữ liệu
    setTimeout(() => {
      this.getListImage();
    }, 100);
  }
  convertProjectToList() {
    for (const item of this.dataInput) {
      const newItem = {
        ID: item.ID,
        ReceiverName: item.ReceiverName,
        TimeNeedPresent: item.TimeNeedPresent,
        ReceiverPhoneNumber: item.ReceiverPhoneNumber,
        PackageName: item.PackageName,
        SpecificDestinationAddress: item.SpecificDestinationAddress
      }
      this.listID.push(newItem);
    }
  }
  getListImage() {
    this.listID = []; 
    this.convertProjectToList();
    this.loading = true;
    this.vehicleBookingManagementService.getListImage(this.listID).subscribe({
      next: (response: any) => {
        try {
          let imageData = [];
          if (response?.data?.data && Array.isArray(response.data.data)) {
            imageData = response.data.data;
          } else if (response?.data && Array.isArray(response.data)) {
            imageData = response.data;
          } else {
          }
          this.vehicleImageList = imageData;
          if (this.tb_ExportVehicleSchedule) {
            this.tb_ExportVehicleSchedule.setData(this.vehicleImageList);
          } 
        } catch (error) {
          this.vehicleImageList = [];
        } finally {
          this.loading = false;
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.vehicleImageList = [];
        if (this.tb_ExportVehicleSchedule) {
          this.tb_ExportVehicleSchedule.setData([]);
        }
        this.notification.error('Thông báo', error.error.message || 'Lỗi khi tải ảnh kiện hàng!');
      }
    });
  }


  tb_ExportVehicleSchedule: Tabulator | null = null;
  drawTbVehicleCategory() {
    // Destroy bảng cũ nếu đã tồn tại
    if (this.tb_ExportVehicleSchedule) {
      try {
        this.tb_ExportVehicleSchedule.destroy();
      } catch (e) {
        console.warn('Error destroying old table:', e);
      }
    }
    
    this.tb_ExportVehicleSchedule = new Tabulator('#example-table', {

      height: "80vh",
      layout: "fitColumns",
      columnDefaults: {
        resizable: true,
      },
      data: this.vehicleImageList,
      columns: [
        { title: "Danh sách các kiện hàng", field: "type", sorter: "string" },
      ],
      groupBy: "Title",
      rowFormatter: function (row) {
        var element = row.getElement(),
          data: any = row.getData(),
          width = element.offsetWidth,
          rowTable, cellContents;

        //clear current row data
        while (element.firstChild) element.removeChild(element.firstChild);

        //define a table layout structure and set width of row
        rowTable = document.createElement("table")
        rowTable.style.width = "100%";              // 👈 set full width
        rowTable.style.tableLayout = "fixed";

        const rowTabletr = document.createElement("tr");

         // format TimeNeedPresent
        let timeText = "Chưa có thời gian nhận";
        if (data.TimeNeedPresent) {
          const date = new Date(data.TimeNeedPresent);
          const dd = String(date.getDate()).padStart(2, "0");
          const MM = String(date.getMonth() + 1).padStart(2, "0"); // tháng bắt đầu từ 0
          const yyyy = date.getFullYear();
          const HH = String(date.getHours()).padStart(2, "0");
          const mm = String(date.getMinutes()).padStart(2, "0");
          timeText = `${dd}/${MM}/${yyyy} ${HH}:${mm}`;
        }

        //add image on left of row
        cellContents = `
        <td style="padding-right:20px; vertical-align:middle;">
          <a href="${data.urlImage}" target="_blank">
            <img src="${data.urlImage}" style="width:200px; height:200px; object-fit:cover; cursor:pointer;" />
          </a>
        </td>
      `;


cellContents += `
  <td style="padding-left:20px; vertical-align:middle; text-align:left;">
    <div><strong>Người nhận:</strong> ${data.ReceiverName}</div>
    <div><strong>Tên kiện hàng:</strong> ${data.PackageName}</div>
    <div><strong>Thời gian nhận:</strong> ${timeText}</div>
    <div><strong>Số điện thoại người nhận:</strong> ${data.ReceiverPhoneNumber}</div>
    <div style="white-space: normal; word-wrap: break-word; max-width:300px;">
      <strong>Địa chỉ giao hàng:</strong> ${data.SpecificDestinationAddress}
    </div>
  </td>
`;




        rowTabletr.innerHTML = cellContents;

        rowTable.appendChild(rowTabletr);

        //append newly formatted contents to the row
        element.append(rowTable);
      },
    });
  }


  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}
