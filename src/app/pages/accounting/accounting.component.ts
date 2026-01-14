import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-accounting',
    imports: [],
    templateUrl: './accounting.component.html',
    styleUrl: './accounting.component.css'
})
export class AccountingComponent implements OnInit {
    ngOnInit(): void {
        document.title += ' | KẾ TOÁN';
    }
}
