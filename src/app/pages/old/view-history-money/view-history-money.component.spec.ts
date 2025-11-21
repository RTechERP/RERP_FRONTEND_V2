import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewHistoryMoneyComponent } from './view-history-money.component';

describe('ViewHistoryMoneyComponent', () => {
  let component: ViewHistoryMoneyComponent;
  let fixture: ComponentFixture<ViewHistoryMoneyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewHistoryMoneyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewHistoryMoneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
