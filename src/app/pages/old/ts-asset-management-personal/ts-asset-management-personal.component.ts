import { AfterViewInit, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
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
import { TsAssetManagementPersonalService } from './ts-asset-management-personal-service/ts-asset-management-personal.service';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
@Component({
  selector: 'app-ts-asset-management-personal',
  standalone: true,
  imports: [
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
  ],
  templateUrl: './ts-asset-management-personal.component.html',
  styleUrls: ['./ts-asset-management-personal.component.css']
})
export class TsAssetManagementPersonalComponent implements OnInit, AfterViewInit {
  assetManagemnetPersonalData: any[] = [];
  tableAssetManagementPersonal: Tabulator | null = null;
  constructor(private tsAssetmanagementPersonal: TsAssetManagementPersonalService) { }
  ngOnInit() {
    this.getAssetManagementPersonal();
  }
  ngAfterViewInit(): void {
    this.getAssetManagementPersonal();
    this.drawTableAssetManagementPersonal();

  }
  getAssetManagementPersonal() {
    this.tsAssetmanagementPersonal.getAssetsManagementPersonal().subscribe((data: any) => {
      this.assetManagemnetPersonalData = data.tSAssetManagmentPersonal;
      this.tableAssetManagementPersonal?.setData(data.tSAssetManagmentPersonal);
      console.log('Data:', this.assetManagemnetPersonalData)
    });
  }
  drawTableAssetManagementPersonal(): void {
    this.tableAssetManagementPersonal = new Tabulator('#dataTableAssetManagementPersonal',
      {
        layout: 'fitDataStretch',
        height: '87vh',
        pagination: true,
        selectableRows: 1,
        columns: [
          { title: 'STT', field: 'STT', hozAlign: 'right', width: 70, headerHozAlign: 'center' },
          { title: 'ID', field: 'ID', hozAlign: 'right', width: 70, headerHozAlign: 'center' , visible:false},
          { title: 'UnitCountID', field: 'UnitCountID', headerHozAlign: 'center', hozAlign: 'right' },
          { title: 'TSTypeAssetPersonalID', field: 'TSTypeAssetPersonalID', headerHozAlign: 'center', hozAlign: 'right' },
          { title: 'Số lượng trong kho', field: 'RemainingQuantity', headerHozAlign: 'center', hozAlign: 'right' },
          {
            title: 'Ngày nhập',
            field: 'CreatedDate',
            hozAlign:'center',
            formatter: function (cell) {
              const value = cell.getValue();
              if (!value) return '';
              const dt = DateTime.fromISO(value);
              return dt.isValid ? dt.toFormat('dd/MM/yyyy') : '';
            }
          },
           { title: 'Note', field: 'Note', hozAlign: 'left' }
        ]
      });
  }


}
