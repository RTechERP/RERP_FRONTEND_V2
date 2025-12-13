import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryExportAccountantComponent } from './history-export-accountant.component';

describe('HistoryExportAccountantComponent', () => {
  let component: HistoryExportAccountantComponent;
  let fixture: ComponentFixture<HistoryExportAccountantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryExportAccountantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryExportAccountantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
