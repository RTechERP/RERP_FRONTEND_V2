import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryApprovedBillLogComponent } from './history-approved-bill-log.component';

describe('HistoryApprovedBillLogComponent', () => {
  let component: HistoryApprovedBillLogComponent;
  let fixture: ComponentFixture<HistoryApprovedBillLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryApprovedBillLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryApprovedBillLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
