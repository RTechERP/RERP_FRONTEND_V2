import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilmManagementImportExcelComponent } from './film-management-import-excel.component';

describe('FilmManagementImportExcelComponent', () => {
  let component: FilmManagementImportExcelComponent;
  let fixture: ComponentFixture<FilmManagementImportExcelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilmManagementImportExcelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilmManagementImportExcelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
