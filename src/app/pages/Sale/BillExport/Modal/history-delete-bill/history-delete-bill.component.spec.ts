import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryDeleteBillComponent } from './history-delete-bill.component';

describe('HistoryDeleteBillComponent', () => {
  let component: HistoryDeleteBillComponent;
  let fixture: ComponentFixture<HistoryDeleteBillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryDeleteBillComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryDeleteBillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
