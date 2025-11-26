import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportExcelPartlistComponent } from './import-excel-partlist.component';

describe('ImportExcelPartlistComponent', () => {
  let component: ImportExcelPartlistComponent;
  let fixture: ComponentFixture<ImportExcelPartlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportExcelPartlistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportExcelPartlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
