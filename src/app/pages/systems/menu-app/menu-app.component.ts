import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuApp } from './model/menu-app';
import { CommonModule } from '@angular/common';
import { AngularSlickgridModule } from 'angular-slickgrid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AppUserService } from '../../../services/app-user.service';
import { MenuAppService } from './menu-app.service';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { MenuAppDetailComponent } from './menu-app-detail/menu-app-detail.component';

@Component({
    selector: 'app-menu-app',
    imports: [

    ],
    templateUrl: './menu-app.component.html',
    styleUrl: './menu-app.component.css'
})
export class MenuAppComponent {

    constructor(
        private modalService: NgbModal
    ) { }

    initModal(menu: any = new MenuApp()) {

        const modalRef = this.modalService.open(MenuAppDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            scrollable: true,
            fullscreen: true,
        });

        modalRef.componentInstance.menu = menu;

    }

    onCreate() {
        this.initModal();
    }

}
