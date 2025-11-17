import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoRequestPriceRtcComponent } from './po-request-price-rtc.component';

describe('PoRequestPriceRtcComponent', () => {
  let component: PoRequestPriceRtcComponent;
  let fixture: ComponentFixture<PoRequestPriceRtcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoRequestPriceRtcComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoRequestPriceRtcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
