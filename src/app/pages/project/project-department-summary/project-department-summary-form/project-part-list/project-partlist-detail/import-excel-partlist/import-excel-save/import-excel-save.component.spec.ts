import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportExcelSaveComponent } from './import-excel-save.component';

describe('ImportExcelSaveComponent', () => {
  let component: ImportExcelSaveComponent;
  let fixture: ComponentFixture<ImportExcelSaveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportExcelSaveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportExcelSaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
