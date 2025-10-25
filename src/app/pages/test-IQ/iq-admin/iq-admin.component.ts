import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { TabulatorFull as Tabulator, CellComponent } from 'tabulator-tables';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { Router } from '@angular/router';

interface IqSubmission {
  id: string;
  candidateName: string;
  email?: string;
  score: number;
  total: number;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  answers: { questionId: string; selectedOptionIndex: number }[];
  dob?: string;
  phone?: string;
}

@Component({
  selector: 'app-iq-admin',
  templateUrl: './iq-admin.component.html',
  styleUrls: ['./iq-admin.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzInputModule,
    NzButtonModule,
    NzTypographyModule,
    NzTagModule,
    NzPopconfirmModule,
    NzEmptyModule,
    NzPageHeaderModule,
    NzIconModule,
    NzDividerModule,
    NzToolTipModule,
    NzModalModule,
	NzSplitterModule,
	NzFormModule,
  ],
})
export class IqAdminComponent implements OnInit, AfterViewInit {
  @ViewChild('tabulatorContainer') tabulatorContainer!: ElementRef;
  
  submissions: IqSubmission[] = [];
  filteredSubmissions: IqSubmission[] = [];
  searchText = '';
  tabulator!: Tabulator;
  sizeSearch: string = '0%';
  constructor(private modal: NzModalService,private router: Router) {}
  	dateStart: string | null = null;
	dateEnd: string | null = null;
    statusFilter: number | string = '';
	keyword: string = ''; 
  ngOnInit(): void {
    this.loadSubmissions();
  }

  ngAfterViewInit(): void {
    this.drawTabulator();
  }
    toggleSearchPanel(): void {
    this.sizeSearch = this.sizeSearch === '0%' ? '22%' : '0%';
  }
  private formatSeconds(totalSeconds: number): string {
    const minutes = Math.floor((totalSeconds || 0) / 60).toString().padStart(2, '0');
    const seconds = Math.floor((totalSeconds || 0) % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
  setDefautSearch(): void {
	//   this.dateStart = DateTime.local().startOf('day').toISO();
	//   this.dateEnd = DateTime.local().endOf('day').toISO();
	  this.keyword = '';
	  this.statusFilter = '';
	}
	searchProjects(): void {
    // const params = this.getProjectAjaxParams();
    // this.projectService.getBillExport(params).subscribe({
    //   next: (res: any) => {
    //     if (res?.status === 1) {
    //       this.billExportData = Array.isArray(res.billExportTechnical)
    //         ? res.billExportTechnical
    //         : [];
    //     } else {
    //       this.billExportData = [];
    //       this.notification.error('Lỗi', res?.message || 'Không thể tải dữ liệu');
    //     }
    //     this.updateTableData();
    //   },
    //   error: (err) => {
    //     console.error('Lỗi khi tìm kiếm:', err);
    //     this.notification.error('Lỗi', 'Không thể tải dữ liệu phiếu xuất');
    //   },
    // });
  }

  private drawTabulator(): void {
    this.tabulator = new Tabulator(this.tabulatorContainer.nativeElement, {
      data: this.filteredSubmissions,
      layout: 'fitColumns',
      pagination: 'local' as any,
      paginationSize: 10,
      paginationSizeSelector: [10, 20, 50, 100],
      selectableRows: true,
      columns: [
        {
          title: '',
          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          hozAlign: 'center',
          headerHozAlign: 'center',
          headerSort: false,
          width: 50,
          cellClick: (e: Event) => e.stopPropagation(),
        },
        { title: '#', formatter: 'rownum', hozAlign: 'center',headerHozAlign: 'center', width: 70, headerSort: false },
        {
          title: 'Tên',
          field: 'candidateName',

        },
		    {
          title: 'Ngày sinh',
          field: 'dob',
          hozAlign: 'center',headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            if (!value) return '';

            const date = new Date(value);
            return date.toLocaleDateString('vi-VN'); 
          }
        },
		    {
          title: 'Số điện thoại',
          field: 'phone',headerHozAlign: 'center'

        },
        {
          title: 'Email',
          field: 'email',headerHozAlign: 'center',


          formatter: (cell: CellComponent) => cell.getValue() || '-',
        },
        {
          title: 'Điểm',
          field: 'score',
          hozAlign: 'center',
          headerHozAlign: 'center',
          sorter: 'number',
          formatter: (cell: CellComponent) => {
            const row = cell.getRow().getData() as IqSubmission;
            const percentage = row.score / row.total;

            let color = 'red';
            if (percentage >= 0.8) color = 'green';
            else if (percentage >= 0.5) color = 'gold';

            return `<span style="color:${color}; font-weight:bold;">${row.score}/${row.total}</span>`;
          },
        },
        {
          title: 'Bắt đầu',
          field: 'startedAt',
          sorter: 'date',
          hozAlign: 'center',headerHozAlign: 'center',
          minWidth: 160,
          formatter: (cell: CellComponent) => {
            const value = cell.getValue();
            return value ? new Date(value).toLocaleString('vi-VN') : '-';
          },
        },
        {
          title: 'Nộp bài',
          field: 'submittedAt',
          sorter: 'date',
          hozAlign: 'center',headerHozAlign: 'center',
          minWidth: 160,
          formatter: (cell: CellComponent) => {
            const value = cell.getValue();
            return value ? new Date(value).toLocaleString('vi-VN') : '-';
          },
        },
        {
          title: 'Thời gian',
          field: 'durationSeconds',
          hozAlign: 'center',headerHozAlign: 'center',
          sorter: 'number',
          formatter: (cell: CellComponent) => this.formatSeconds(cell.getValue()),
        },
        {
          title: 'Đánh giá',
          field: 'score',
          hozAlign: 'center',headerHozAlign: 'center',
          formatter: (cell: CellComponent) => {
            const row = cell.getRow().getData() as IqSubmission;
            const score = row.score; 

            if (score === 20) return 'Xuất sắc';   
            if (score >= 15) return 'Tốt';         
            if (score >= 5) return 'Trung bình';  
            return 'Yếu';                         
          },
        }

        
      ],
    });
  }
  onShow(): void {
  const selectedRows = this.tabulator.getSelectedData() as IqSubmission[];
  if (!selectedRows || selectedRows.length === 0) {
    this.modal.warning({
      nzTitle: 'Cảnh báo',
      nzContent: 'Vui lòng chọn ít nhất một bài thi để xem kết quả.'
    });
    return;
  }
  if (selectedRows.length === 1) {
    const submissionId = selectedRows[0].id;
    this.viewDetail(submissionId);
  } else {
    this.modal.info({
      nzTitle: 'Thông tin',
      nzContent: `Bạn đã chọn ${selectedRows.length} bài thi. Chức năng này chỉ hỗ trợ xem một bài thi tại một thời điểm.`
    });
  }
}
  private updateTableData(): void {
    if (this.tabulator) {
      this.tabulator.setData(this.filteredSubmissions);
    }
  }

  private loadSubmissions(): void {
    try {
      const raw = localStorage.getItem('iq_submissions');
      this.submissions = raw ? JSON.parse(raw) : [];
      this.applyFilter();
    } catch {
      this.submissions = [];
      this.filteredSubmissions = [];
    }
  }

  private applyFilter(): void {
    const query = this.searchText.toLowerCase().trim();
    if (!query) {
      this.filteredSubmissions = [...this.submissions];
    } else {
      this.filteredSubmissions = this.submissions.filter(
        (s) =>
          (s.candidateName || '').toLowerCase().includes(query) ||
          (s.email || '').toLowerCase().includes(query)
      );
    }
    this.updateTableData();
  }

  viewDetail(id: string): void {
	this.router.navigate(['/iq-test', id]);
  }

 onDelete(id?: string): void {
    try {
      const raw = localStorage.getItem('iq_submissions');
      let list: IqSubmission[] = raw ? JSON.parse(raw) : [];

      let selectedRows: IqSubmission[] = [];

      if (id) {
        const found = list.find(s => s.id === id);
        if (!found) return;
        selectedRows = [found];
      } else {
        selectedRows = this.tabulator.getSelectedData() as IqSubmission[];
        if (!selectedRows || selectedRows.length === 0) {
          return;
        }
      }

      const names = selectedRows.map(s => s.candidateName).join(', ');

      this.modal.confirm({ 
        nzTitle: 'Xác nhận xóa',
        nzContent: `Bạn có chắc chắn muốn xóa các bản ghi sau: <strong>${names}</strong>?`,
        nzOkText: 'Xóa',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          const idsToDelete = selectedRows.map(s => s.id);
          list = list.filter(s => !idsToDelete.includes(s.id));
          localStorage.setItem('iq_submissions', JSON.stringify(list));
          this.loadSubmissions();
        }
      });

    } catch (err) {
      console.error('Xóa thất bại:', err);
    }
  }

}
