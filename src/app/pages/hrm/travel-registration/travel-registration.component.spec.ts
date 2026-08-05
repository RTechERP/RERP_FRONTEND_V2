import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelRegistrationComponent } from './travel-registration.component';

describe('TravelRegistrationComponent', () => {
  let component: TravelRegistrationComponent;
  let fixture: ComponentFixture<TravelRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelRegistrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
