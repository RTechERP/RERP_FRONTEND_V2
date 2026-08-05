import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelRegistrationDetailComponent } from './travel-registration-detail.component';

describe('TravelRegistrationDetailComponent', () => {
  let component: TravelRegistrationDetailComponent;
  let fixture: ComponentFixture<TravelRegistrationDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelRegistrationDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelRegistrationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
