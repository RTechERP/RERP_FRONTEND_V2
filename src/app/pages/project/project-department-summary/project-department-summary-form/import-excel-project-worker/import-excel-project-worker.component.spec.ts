import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportExcelProjectWorkerComponent } from './import-excel-project-worker.component';

describe('ImportExcelProjectWorkerComponent', () => {
  let component: ImportExcelProjectWorkerComponent;
  let fixture: ComponentFixture<ImportExcelProjectWorkerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportExcelProjectWorkerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportExcelProjectWorkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
