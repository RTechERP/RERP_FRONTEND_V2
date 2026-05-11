import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { MenuItem, SharedModule } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { CustomTable } from '../../../shared/custom-table/custom-table';
import { ColumnDef } from '../../../shared/custom-table/column-def.model';
import { BankList, BankListField } from './model/bank-list';
import { BankListService } from './bank-list.service';
import { BankListDetailComponent } from './bank-list-detail/bank-list-detail.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-bank-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzModalModule,
        Menubar,
        SharedModule,
        CustomTable
    ],
    templateUrl: './bank-list.component.html',
    styleUrls: ['./bank-list.component.css']
})
export class BankListComponent implements OnInit {
    data: BankList[] = [];
    selection: BankList | null = null;
    isLoading: boolean = false;
    columns: ColumnDef[] = [];
    menuBars: MenuItem[] = [];

    constructor(
        private bankListService: BankListService,
        private notification: NzNotificationService,
        private modalService: NgbModal,
        private nzModal: NzModalService
    ) { }

    ngOnInit(): void {
        this.initColumns();
        this.initMenuBar();
        this.loadData();
    }

    initColumns(): void {
        this.columns = [
            { field: 'STT', header: BankListField.STT.name, width: '80px', cssClass: 'text-center' },
            { field: 'BankName', header: BankListField.BankName.name, width: 'auto' },
        ];
    }

    initMenuBar(): void {
        this.menuBars = [
            {
                label: 'Thêm',
                icon: 'fa-solid fa-plus fa-lg text-primary',
                command: () => this.onAdd(),
            },
            {
                label: 'Sửa',
                icon: 'fa-solid fa-edit fa-lg text-warning',
                command: () => this.onEdit(),
            },
            {
                label: 'Xóa',
                icon: 'fa-solid fa-trash fa-lg text-danger',
                command: () => this.onDelete(),
            },
            {
                label: 'Tải lại',
                icon: 'fa-solid fa-rotate fa-lg text-info',
                command: () => this.loadData(),
            }
        ];
    }

    loadData(): void {
        this.isLoading = true;
        this.bankListService.getAll().subscribe({
            next: (res: any) => {
                this.data = res.data;
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                this.notification.error('Lỗi', 'Không thể tải danh sách ngân hàng');
                console.error(err);
            }
        });
    }

    onAdd(): void {
        const maxSTT = this.data.length > 0 ? Math.max(...this.data.map(item => item.STT || 0)) : 0;
        const modalRef = this.modalService.open(BankListDetailComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
        });
        modalRef.componentInstance.data = new BankList({ STT: maxSTT + 1 });
        modalRef.result.then((result) => {
            if (result) {
                this.loadData();
            }
        }, () => { });
    }

    onEdit(): void {
        if (!this.selection) {
            this.notification.warning('Thông báo', 'Vui lòng chọn một ngân hàng để sửa');
            return;
        }
        const modalRef = this.modalService.open(BankListDetailComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
        });
        modalRef.componentInstance.data = new BankList(this.selection);
        modalRef.result.then((result) => {
            if (result) {
                this.loadData();
                this.selection = null;
                console.log(this.selection);
            }
        }, () => { });
    }

    onDelete(): void {
        if (!this.selection) {
            this.notification.warning('Thông báo', 'Vui lòng chọn một ngân hàng để xóa');
            return;
        }

        this.nzModal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa ngân hàng "${this.selection.BankName}"?`,
            nzOkText: 'Xóa',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.isLoading = true;
                this.bankListService.delete(this.selection!.ID).subscribe({
                    next: () => {
                        this.isLoading = false;
                        this.notification.success('Thành công', 'Đã xóa ngân hàng');
                        this.selection = null;
                        this.loadData();
                    },
                    error: (err) => {
                        this.isLoading = false;
                        this.notification.error('Lỗi', 'Không thể xóa ngân hàng');
                        console.error(err);
                    }
                });
            }
        });
    }

    onSelectionChange(event: any): void {
        this.selection = event;
    }
}
