import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

import { BonusCoefficientService } from './bonus-coefficient-service/bonus-coefficient.service';

@Component({
  selector: 'app-bonus-coefficient',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
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
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    CommonModule,
  ],
  templateUrl: './bonus-coefficient.component.html',
  styleUrl: './bonus-coefficient.component.css'
})
export class BonusCoefficientComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_Table', { static: false }) tb_TableElement!: ElementRef;

  private tb_Table!: Tabulator;

  groupsSale: any[] = [];
  usersGroupSale: any[] = [];
  data: any[] = [];
  textSum: number = 0;
  filters: any = {
    year: 0,
    quarter: 0,
    groupSaleId: 0,
  };
  quarterOptions: any[] = [
    { value: 1, label: 'Quý 1' },
    { value: 2, label: 'Quý 2' },
    { value: 3, label: 'Quý 3' },
    { value: 4, label: 'Quý 4' },
  ];

  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private bonusCoefficientService: BonusCoefficientService
  ) { }

  ngOnInit(): void {
    const now = DateTime.now();
    this.filters.year = now.year;
    if (now.month < 4) {
      this.filters.quarter = 1;
    } else if (now.month < 7) {
      this.filters.quarter = 2;
    } else if (now.month < 10) {
      this.filters.quarter = 3;
    } else {
      this.filters.quarter = 4;
    }
    this.loadData();
    this.loadGroupSales();
    this.loadUserGroupSales();
    this.calculateBonus();
  }

  ngAfterViewInit(): void {
    this.initTable();
  }
  search() {
    this.loadData();
  }
  loadGroupSales() {
    this.bonusCoefficientService.loadGroupSales().subscribe(
      (response) => {
        if (response.status === 1) {
          this.groupsSale = response.data;
          console.log(this.groupsSale, 'groupsSale');
        } else {
          this.notification.error('Lỗi khi tải nhóm sale:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải nhóm sale:', error);
      }
    );
  }

  loadBonusRules(groupId: number) {
    this.bonusCoefficientService.loadBonusRules(groupId).subscribe(
      (response) => {
        if (response.status === 1) {
          return response.data;
        } else {
          this.notification.error('Lỗi khi tải dữ liệu:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải dữ liệu:', error);
      }
    );
  }

  loadUserGroupSales() {
    this.bonusCoefficientService.loadUserGroupSales().subscribe(
      (response) => {
        if (response.status === 1) {
          this.usersGroupSale = response.data;
          console.log(this.usersGroupSale, 'usersGroupSale');
          if (this.tb_Table && this.data.length > 0) {
            this.tb_Table.redraw(true);
          }
        } else {
          this.notification.error('Lỗi khi tải dữ liệu:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải dữ liệu:', error);
      }
    );
  }

  loadData() {
    this.bonusCoefficientService.loadData(this.filters.quarter, this.filters.year, this.filters.groupSaleId).subscribe(
      (response) => {
        if (response.status === 1) {
          this.data = response.data;
          console.log(this.data, 'data');
          if (this.tb_Table) {
            this.tb_Table.replaceData(this.data);
          }
        } else {
          this.notification.error('Lỗi khi tải dữ liệu:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải dữ liệu:', error);
      }
    );
  }

  calculateBonus() {
    if (!this.data || this.data.length === 0) return;
    if (!this.filters.groupSaleId || this.filters.groupSaleId === 0) return;

    this.bonusCoefficientService.loadBonusRules(this.filters.groupSaleId).subscribe(
      (response) => {
        if (response.status === 1) {
          // Map data thành object với key là SaleUserTypeCode và value là PercentBonus
          const percentBonusMap: any = {};
          if (response.data && Array.isArray(response.data)) {
            response.data.forEach((item: any) => {
              if (item.SaleUserTypeCode && item.PercentBonus !== undefined) {
                percentBonusMap[item.SaleUserTypeCode] = item.PercentBonus;
              }
            });
          }

          let total = 0;
          let totalHeso = 0;
          let newAccLast = 0;
          let totalSale = 0;
          let coef = 0;

          // xử lý Leader/Admin/Mar/LeadT 
          this.data.forEach((item, i) => {
            const position = item.saleUserTypeCode;
            const perBonus = percentBonusMap[position] || 0;

      switch (position) {
        case "LeadG": // Leader
        case "Mar":   // Marketing
        case "Adm":   // Admin
        case "LeadT": // LeaderTeam
          coef = this.data[0]?.coefficient || 0;
          if (coef === 0) return;
          totalSale = this.data[0]?.totalSale || 0;

          item.bonusSales = perBonus * totalSale * coef;
          item.totalBonus = item.bonusSales;
          break;

        case "Sta": // Staff
          coef = item.coefficient || 0;
          if (coef === 0) return;
          totalSale = item.totalSale || 0;
          const newAcc = item.newAccountQty || 0;
          item.bonusAcc = newAcc * 500000;

          total += coef * totalSale;
          totalHeso += coef;
          newAccLast = newAcc;
          break;
      }
    });

    //  tính thưởng sale lại cho staff
    this.data.forEach(item => {
      const position = item.saleUserTypeCode;
      const perBonus = percentBonusMap[position] || 0;

      if (position === "Sta") {
        coef = item.coefficient || 0;
        if (coef === 0) return;

        const bonusSales = (total * perBonus / totalHeso) * coef;
        item.bonusSales = bonusSales;

        const bonusAdd = item.bonusAdd || 0;
        const bonusRank = item.bonusRank || 0;

         item.totalBonus =
           bonusAdd +
           bonusRank +
           bonusSales +
           (newAccLast * 500000);
       }
     });
          const staffPerBonus = percentBonusMap["Sta"] || 0;
          this.textSum = total * staffPerBonus;

          // Cập nhật bảng sau khi tính toán
          if (this.tb_Table) {
            this.tb_Table.redraw(true);
          }
        } else {
          this.notification.error('Lỗi khi tải dữ liệu:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải dữ liệu:', error);
      }
    );
  }

  formatCurrency = (value: number): string => {
    if (value == null || value === undefined) return '';
    return new Intl.NumberFormat('vi-VN').format(value);
  }

  parseCurrency = (value: string): number => {
    if (!value) return 0;
    return parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
  }

  save() {
    if (!this.data || this.data.length === 0) return;

    const payload = this.data.map(item => {
      return {
        ID: item.ID || 0,
        UserID: item.UserID || item.userId || 0,
        BonusSales: item.bonusSales || item.BonusSales || 0,
        BonusAcc: item.bonusAcc || item.BonusAcc || 0,
        BonusAdd: item.bonusAdd || item.BonusAdd || 0,
        BonusRank: item.bonusRank || item.BonusRank || 0,
        TotalBonus: item.totalBonus || item.TotalBonus || 0,
        Quy: this.filters.quarter,
        Year: DateTime.now().year
      };
    });

    this.bonusCoefficientService.saveBonusCoefficient(payload).subscribe(
      (response) => {
        if (response.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công');
          this.loadData();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi kết nối khi lưu dữ liệu');
      }
    );
  }

  initTable(): void {
    if (!this.tb_TableElement) {
      console.error('tb_Table element not found');
      return;
    }
    this.tb_Table = new Tabulator(this.tb_TableElement.nativeElement, {
      layout: 'fitColumns',
      data: this.data,
      pagination: true,
      paginationSize: 50,
      height: '100%',
      groupBy: 'SaleUserTypeName',
      movableColumns: true,
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
      columns: [
        {
          title: 'ID',
          field: 'ID',
          sorter: 'string',
          width: 150,
          visible: false,

        },
        {
          title: 'Nhân viên',
          field: 'UserID',
          sorter: 'string',
          width: 150,

          formatter: (cell) => {
            const value = cell.getValue();
            const user = this.usersGroupSale.find((u) => u.ID == value);
            return user ? user.FullName : value;
          },
        },
        {
          title: 'Performance',
          field: 'Performance',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Hệ số tính thưởng',
          field: 'Coefficient',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Thưởng doanh số',
          field: 'BonusSales',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Thưởng Ranking',
          field: 'BonusRank',
          sorter: 'string',
          width: 150,
          editor: "number"
        },
        {
          title: 'Thưởng new account',
          field: 'BonusAcc',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Thưởng thêm',
          field: 'BonusAdd',
          sorter: 'string',
          width: 150,
          editor: "number"
        },
        {
          title: 'Tổng thưởng',
          field: 'TotalBonus',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Chức vụ',
          field: 'SaleUserTypeName',
          sorter: 'string',
          width: 150,
          visible: false,
        },
        {
          title: 'Code',
          field: 'SaleUserTypeCode',
          sorter: 'string',
          width: 150,
          visible: false,
        }
      ],
    });
  }
}
