import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-purchase',
    imports: [],
    templateUrl: './purchase.component.html',
    styleUrl: './purchase.component.css'
})
export class PurchaseComponent implements OnInit {

    ngOnInit(): void {
        document.title += ' | MUA HÀNG';
    }
}
