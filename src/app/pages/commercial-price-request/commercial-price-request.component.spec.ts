import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommercialPriceRequestComponent } from './commercial-price-request.component';

describe('CommercialPriceRequestComponent', () => {
  let component: CommercialPriceRequestComponent;
  let fixture: ComponentFixture<CommercialPriceRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommercialPriceRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommercialPriceRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
