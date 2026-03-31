import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportExcelProjectTaskComponent } from './import-excel-project-task.component';

describe('ImportExcelProjectTaskComponent', () => {
  let component: ImportExcelProjectTaskComponent;
  let fixture: ComponentFixture<ImportExcelProjectTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportExcelProjectTaskComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportExcelProjectTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
