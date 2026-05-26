import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrOfferLetterComponent } from './hr-offer-letter.component';

describe('HrOfferLetterComponent', () => {
  let component: HrOfferLetterComponent;
  let fixture: ComponentFixture<HrOfferLetterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrOfferLetterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrOfferLetterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
