import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentFileFormComponent } from './document-file-form.component';

describe('DocumentFileFormComponent', () => {
  let component: DocumentFileFormComponent;
  let fixture: ComponentFixture<DocumentFileFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentFileFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentFileFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
