import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisaRequestComponent } from './visa-request.component';

describe('VisaRequestComponent', () => {
  let component: VisaRequestComponent;
  let fixture: ComponentFixture<VisaRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisaRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisaRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
