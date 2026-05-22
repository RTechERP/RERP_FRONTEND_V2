import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryMoneyPrimengComponent } from './history-money-primeng.component';

describe('HistoryMoneyPrimengComponent', () => {
  let component: HistoryMoneyPrimengComponent;
  let fixture: ComponentFixture<HistoryMoneyPrimengComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryMoneyPrimengComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryMoneyPrimengComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
