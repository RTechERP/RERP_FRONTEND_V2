import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsletterService } from '../newsletter.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { environment } from '../../../../../../environments/environment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NewsletterDetailComponent } from '../newsletter-detail/newsletter-detail.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { FormsModule } from '@angular/forms';
import { DateTime } from 'luxon';

@Component({
    selector: 'app-newsletter-form-view-all',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzIconModule,
        NzCardModule,
        NzGridModule,
        NzSpinModule,
        NzToolTipModule,
        NzFormModule,
        NzInputModule,
        NzSelectModule,
        NzDatePickerModule,
        NzSplitterModule
    ],
    templateUrl: './newsletter-form-view-all.component.html',
    styleUrl: './newsletter-form-view-all.component.css'
})
export class NewsletterFormViewAllComponent implements OnInit {
    newsletters: any[] = [];
    isLoading = false;
    isSearchVisible = true;

    // Filter params
    dateStart: Date = new Date();
    dateEnd: Date = new Date();
    keyWord: string = '';
    typeID: number = 0;
    newsletterTypes: any[] = [];

    constructor(
        private newsletterService: NewsletterService,
        private notification: NzNotificationService,
        private modalService: NgbModal
    ) { }

    ngOnInit(): void {
        // Set default date range (this month)
        this.dateStart = this.getFirstDayOfMonth();
        this.dateEnd = this.getLastDayOfMonth();

        this.loadNewsletterTypes();
        this.loadNewsletters();
    }

    private getFirstDayOfMonth(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }

    private getLastDayOfMonth(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    loadNewsletterTypes(): void {
        this.newsletterService.getNewsletterType().subscribe({
            next: (response: any) => {
                this.newsletterTypes = response.data || [];
            },
            error: (error: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi tải danh sách loại bản tin');
            }
        });
    }

    loadNewsletters(): void {
        this.isLoading = true;
        const params = {
            FromDate: this.dateStart ? DateTime.fromJSDate(this.dateStart).toFormat('yyyy-MM-dd') : null,
            ToDate: this.dateEnd ? DateTime.fromJSDate(this.dateEnd).toFormat('yyyy-MM-dd') : null,
            Keyword: this.keyWord || '',
            TypeId: this.typeID || 0,
            IsPublish: 1
        };

        this.newsletterService.getNewsletter(params).subscribe({
            next: (response: any) => {
                const data = response.data || [];
                this.newsletters = data.sort((a: any, b: any) => {
                    const dateA = a.CreatedDate ? new Date(a.CreatedDate).getTime() : 0;
                    const dateB = b.CreatedDate ? new Date(b.CreatedDate).getTime() : 0;
                    return dateB - dateA;
                });
                this.isLoading = false;
            },
            error: (error: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi tải danh sách bản tin');
                this.isLoading = false;
            }
        });
    }

    toggleSearchPanel(): void {
        this.isSearchVisible = !this.isSearchVisible;
    }

    resetSearch(): void {
        this.dateStart = this.getFirstDayOfMonth();
        this.dateEnd = this.getLastDayOfMonth();
        this.keyWord = '';
        this.typeID = 0;
        this.loadNewsletters();
    }

    openNewsletterDetail(newsletterId: number): void {
        const modalRef = this.modalService.open(NewsletterDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: true,
            scrollable: true
        });

        modalRef.componentInstance.newsletterId = newsletterId;
    }

    getNewsletterImageUrl(item: any): string {
        const serverPath = item?.ServerImgPath;
        const imageName = item?.Image;

        if (!serverPath && !imageName) return 'assets/images/no-image.png';

        const host = environment.host + 'api/share/';
        let urlImage = (serverPath || imageName || '').replace("\\\\192.168.1.190\\", "");
        urlImage = urlImage.replace(/\\/g, '/');

        return host + urlImage;
    }
}
