import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradePriceComponent } from './trade-price.component';

describe('TradePriceComponent', () => {
  let component: TradePriceComponent;
  let fixture: ComponentFixture<TradePriceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradePriceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TradePriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
