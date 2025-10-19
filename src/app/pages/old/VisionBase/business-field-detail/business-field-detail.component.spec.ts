import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessFieldComponent } from './business-field-detail.component';

describe('BusinessFieldComponent', () => {
  let component: BusinessFieldComponent;
  let fixture: ComponentFixture<BusinessFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
