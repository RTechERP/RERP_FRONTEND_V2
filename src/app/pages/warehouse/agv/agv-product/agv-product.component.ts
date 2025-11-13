import { Component } from '@angular/core';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';

@Component({
  selector: 'app-agv-product',
  imports: [NzSplitterModule],
  templateUrl: './agv-product.component.html',
  styleUrl: './agv-product.component.css',
  standalone: true,
})
export class AgvProductComponent {}
