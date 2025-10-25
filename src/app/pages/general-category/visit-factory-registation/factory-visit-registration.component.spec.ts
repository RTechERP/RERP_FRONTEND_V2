import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FactoryVisitRegistrationComponent } from './factory-visit-registration.component';

describe('FactoryVisitRegistrationComponent', () => {
  let component: FactoryVisitRegistrationComponent;
  let fixture: ComponentFixture<FactoryVisitRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FactoryVisitRegistrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FactoryVisitRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
