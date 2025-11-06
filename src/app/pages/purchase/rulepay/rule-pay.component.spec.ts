import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

import { RulePayComponent } from './rule-pay.component';

describe('RulePayComponent', () => {
  let component: RulePayComponent;
  let fixture: ComponentFixture<RulePayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RulePayComponent,
        ReactiveFormsModule,
        NzModalModule,
        NzButtonModule,
        NzIconModule,
        NzInputModule,
        NzFormModule,
        NzNotificationModule,
        NzSelectModule,
        NzSplitterModule,
        NzProgressModule,
        NzInputNumberModule,
        NzCheckboxModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RulePayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 