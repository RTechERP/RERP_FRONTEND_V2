import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelRegistrationImportExcelComponent } from './travel-registration-import-excel.component';

describe('TravelRegistrationImportExcelComponent', () => {
  let component: TravelRegistrationImportExcelComponent;
  let fixture: ComponentFixture<TravelRegistrationImportExcelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelRegistrationImportExcelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelRegistrationImportExcelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
