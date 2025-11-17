import { Component } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';

@Component({
  selector: 'app-agv-product',
  imports: [NzSplitterModule, NzCardModule, NzIconModule, NzButtonModule],
  templateUrl: './agv-product.component.html',
  styleUrl: './agv-product.component.css',
  standalone: true,
})
export class AgvProductComponent {}
