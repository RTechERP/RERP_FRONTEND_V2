import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-sales',
    imports: [],
    templateUrl: './sales.component.html',
    styleUrl: './sales.component.css'
})
export class SalesComponent implements OnInit {
    ngOnInit(): void {
        document.title += ' | SALE'
    }
}
