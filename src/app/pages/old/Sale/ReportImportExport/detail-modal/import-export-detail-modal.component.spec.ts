import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportExportModalComponent } from './import-export-detail-modal..component';

describe('ImportExportModalComponent', () => {
  let component: ImportExportModalComponent;
  let fixture: ComponentFixture<ImportExportModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportExportModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportExportModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
