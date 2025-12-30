import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-general-category',
    imports: [],
    templateUrl: './general-category.component.html',
    styleUrl: './general-category.component.css'
})
export class GeneralCategoryComponent implements OnInit {

    ngOnInit(): void {
        document.title += ' | DANH MỤC'
    }
}
