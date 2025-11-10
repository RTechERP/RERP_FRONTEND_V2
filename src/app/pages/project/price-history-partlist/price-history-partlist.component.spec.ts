import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceHistoryPartlistComponent } from './price-history-partlist.component';

describe('PriceHistoryPartlistComponent', () => {
  let component: PriceHistoryPartlistComponent;
  let fixture: ComponentFixture<PriceHistoryPartlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceHistoryPartlistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PriceHistoryPartlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});