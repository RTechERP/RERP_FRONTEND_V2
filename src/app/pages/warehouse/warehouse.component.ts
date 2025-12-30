import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-warehouse',
    imports: [],
    templateUrl: './warehouse.component.html',
    styleUrl: './warehouse.component.css'
})
export class WarehouseComponent implements OnInit {

    ngOnInit(): void {
        document.title += ' | KHO'
    }
}
