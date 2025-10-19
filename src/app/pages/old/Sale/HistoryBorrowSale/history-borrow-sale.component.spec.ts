import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryBorrowSaleComponent } from './history-borrow-sale.component';

describe('HistoryBorrowSaleComponent', () => {
  let component: HistoryBorrowSaleComponent;
  let fixture: ComponentFixture<HistoryBorrowSaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryBorrowSaleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryBorrowSaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
