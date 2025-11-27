import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportExcelDiffComponent } from './import-excel-diff.component';

describe('ImportExcelDiffComponent', () => {
  let component: ImportExcelDiffComponent;
  let fixture: ComponentFixture<ImportExcelDiffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportExcelDiffComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportExcelDiffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
