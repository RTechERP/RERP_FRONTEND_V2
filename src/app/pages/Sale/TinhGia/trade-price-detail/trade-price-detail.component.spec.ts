import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradePriceDetailComponent } from './trade-price-detail.component';

describe('TradePriceDetailComponent', () => {
  let component: TradePriceDetailComponent;
  let fixture: ComponentFixture<TradePriceDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradePriceDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TradePriceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
