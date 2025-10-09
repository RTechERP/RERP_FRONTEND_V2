import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryImportExportComponent } from './history-import-export.component';

describe('HistoryImportExportComponent', () => {
  let component: HistoryImportExportComponent;
  let fixture: ComponentFixture<HistoryImportExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryImportExportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryImportExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
