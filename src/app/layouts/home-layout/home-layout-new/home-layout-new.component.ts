import { Component, OnInit } from '@angular/core';
import { AppNotifycationDropdownComponent, NotifyItem } from "../../../pages/old/app-notifycation-dropdown/app-notifycation-dropdown.component";
import { AppUserDropdownComponent } from "../../../pages/systems/app-user/app-user-dropdown.component";
import { NzBadgeComponent } from "ng-zorro-antd/badge";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { MenuItem } from '../../../pages/systems/menus/menu.types';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-home-layout-new',
    imports: [
        CommonModule,
        AppNotifycationDropdownComponent,
        AppUserDropdownComponent,
        NzBadgeComponent,
        NzDropDownModule
    ],
    templateUrl: './home-layout-new.component.html',
    styleUrl: './home-layout-new.component.css'
})
export class HomeLayoutNewComponent implements OnInit {

    notifItems: NotifyItem[] = [];
    menus: MenuItem[] = [];
    menuKey: string = '';
    isMenuOpen = false;
    constructor(

    ) { }

    ngOnInit(): void {
        this.isMenuOpen = (key: string) => this.menus.some((m) => m.key === key && m.isOpen);
    }

    onPick(n: NotifyItem) {
        console.log('picked:', n);
        // TODO: điều hướng/đánh dấu đã đọc...
    }


    toggleMenu(key: string) {
        // this.menus.forEach((x) => (x.isOpen = false));
        const m = this.menus.find((x) => x.key === key);
        if (m) m.isOpen = !m.isOpen;

        if (m?.isOpen) this.menuKey = key;
    }
}
