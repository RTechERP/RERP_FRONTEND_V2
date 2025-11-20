import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryMoneyComponent } from './history-money.component';

describe('HistoryMoneyComponent', () => {
  let component: HistoryMoneyComponent;
  let fixture: ComponentFixture<HistoryMoneyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryMoneyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryMoneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
