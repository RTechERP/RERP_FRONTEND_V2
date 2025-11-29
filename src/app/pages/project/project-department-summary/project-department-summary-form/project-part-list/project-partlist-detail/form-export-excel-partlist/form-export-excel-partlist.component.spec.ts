import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormExportExcelPartlistComponent } from './form-export-excel-partlist.component';

describe('FormExportExcelPartlistComponent', () => {
  let component: FormExportExcelPartlistComponent;
  let fixture: ComponentFixture<FormExportExcelPartlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormExportExcelPartlistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormExportExcelPartlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
