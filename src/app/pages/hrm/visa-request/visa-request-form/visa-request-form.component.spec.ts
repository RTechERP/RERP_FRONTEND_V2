import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisaRequestFormComponent } from './visa-request-form.component';

describe('VisaRequestFormComponent', () => {
  let component: VisaRequestFormComponent;
  let fixture: ComponentFixture<VisaRequestFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisaRequestFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisaRequestFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
