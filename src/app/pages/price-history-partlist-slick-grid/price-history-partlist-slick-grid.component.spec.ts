import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceHistoryPartlistSlickGridComponent } from './price-history-partlist-slick-grid.component';

describe('PriceHistoryPartlistSlickGridComponent', () => {
  let component: PriceHistoryPartlistSlickGridComponent;
  let fixture: ComponentFixture<PriceHistoryPartlistSlickGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceHistoryPartlistSlickGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PriceHistoryPartlistSlickGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
