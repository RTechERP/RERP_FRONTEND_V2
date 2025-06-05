import { Component } from '@angular/core';
import {
  Params,
  Route,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

@Component({
  selector: 'app-root',
  imports: [
    RouterLink,
    RouterOutlet,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule,
    NzButtonModule,
    NzTabsModule,
    NzDropDownModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true,
})
export class AppComponent {
  constructor(private router: Router) {}

  isCollapsed = true;
  selectedIndex = 0;
  dynamicTabs: Array<{
    title: string;
    content: string;
    queryParams?: Params;
    routerLink: string[];
  }> = [];

  newTab(routerLink: string[]): void {
    const { length } = this.dynamicTabs;
    const newTabId = length + 1;
    const title = `NewTab${newTabId}`;
    this.dynamicTabs = [
      ...this.dynamicTabs,
      {
        title,
        content: title,
        routerLink: routerLink,
        queryParams: {
          tab: newTabId,
        },
      },
    ];

    setTimeout(() => {
      this.selectedIndex = this.dynamicTabs.length - 1;
    });

    // this.dynamicTabs.forEach((tab, index) => {
    //   console.log(`Index: ${index}, Title: ${tab.title}`);
    // });
    // this.selectedIndex = newTabId - 1;

    // console.log(this.selectedIndex);
  }

  closeTab({ index }: { index: number }): void {
    this.dynamicTabs.splice(index, 1);

    if (this.dynamicTabs.length === 0) {
      this.router.navigate(['/welcome']);
    }
  }
}
