import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportImportExportComponent } from './report-import-export.component';

describe('ReportImportExportComponent', () => {
  let component: ReportImportExportComponent;
  let fixture: ComponentFixture<ReportImportExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportImportExportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportImportExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
