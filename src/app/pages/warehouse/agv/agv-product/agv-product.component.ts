import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  viewChild,
} from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { Tabulator } from 'tabulator-tables';
import { AgvProductService } from './agv-product.service';
import { AgvProductGroupService } from '../agv-product-group/agv-product-group.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import {
  AGVProductGroup,
  AGVProductGroupFields,
} from '../model/AGVProductGroup';

@Component({
  selector: 'app-agv-product',
  imports: [NzSplitterModule, NzCardModule, NzIconModule, NzButtonModule],
  templateUrl: './agv-product.component.html',
  styleUrl: './agv-product.component.css',
  standalone: true,
})
export class AgvProductComponent implements OnInit, AfterViewInit {
  //#region Khai báo biến
  tbl_AGVProductGroup!: Tabulator;
  tbl_AGVProduct!: Tabulator;

  agvProductGroup!: AGVProductGroup;
  //#endregion

  @ViewChild('tbl_AGVProductGroup', { static: false })
  tbl_AGVProductGroupRef!: ElementRef;

  @ViewChild('tbl_AGVProduct', { static: false })
  tbl_AGVProductRef!: ElementRef;
  constructor(
    private productService: AgvProductService,
    private groupService: AgvProductGroupService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.getProductGroup();
  }

  ngAfterViewInit(): void {}

  getProductGroup() {
    this.groupService.getGroups().subscribe({
      next: (response: any) => {
        // console.log(response);
        this.tbl_AGVProductGroup = response.data;
        this.drawTable(this.tbl_AGVProductGroup);
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
      },
    });
  }

  drawTable(datasource: any) {
    // console.log(datasource);
    this.tbl_AGVProductGroup = new Tabulator(
      this.tbl_AGVProductGroupRef.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        height: '87vh',
        data: datasource,
        columns: [
          {
            title: 'Stt',
            field: AGVProductGroupFields.NumberOrder,
          },
          {
            title: 'Mã loại',
            field: AGVProductGroupFields.AGVProductGroupNo,
          },
          {
            title: 'Tên loại',
            field: AGVProductGroupFields.AGVProductGroupName,
          },
        ],
      }
    );

    this.tbl_AGVProductGroup.on('rowClick', function (e, row) {
      console.log(e, row);
      console.log('e, row');
    });
  }
}
