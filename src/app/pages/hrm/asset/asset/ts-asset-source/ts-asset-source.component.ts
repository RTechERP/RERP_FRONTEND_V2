import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
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
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
declare var bootstrap: any;
import { TsAssetManagementPersonalService } from '../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { updateCSS } from 'ng-zorro-antd/core/util';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { log } from 'ng-zorro-antd/core/logger';
import { AssetsService } from './ts-asset-source-service/ts-asset-source.service';
import { TsAssetSourceFormComponent } from './ts-asset-source-form/ts-asset-source-form.component';
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
    NgbModalModule,
    // TsAssetSourceFormComponent,
  ],
  selector: 'app-ts-asset-source',
  templateUrl: './ts-asset-source.component.html',
  styleUrls: ['./ts-asset-source.component.css'],
})
export class TsAssetSourceComponent implements OnInit, AfterViewInit {
  assetSourceData: any[] = [];
  constructor(
    private notification: NzNotificationService,
    private assetSourceService: AssetsService
  ) {}

  ngOnInit() {}
  ngAfterViewInit(): void {}
  getAssetSource() {
    this.assetSourceService.getAssets().subscribe((response: any) => {
      this.assetSourceData = response.data;
      console.log('source', this.assetSourceData);
    });
  }
}
