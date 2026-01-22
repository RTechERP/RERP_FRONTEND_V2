import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsletterFormViewAllComponent } from './newsletter-form-view-all.component';

describe('NewsletterFormViewAllComponent', () => {
  let component: NewsletterFormViewAllComponent;
  let fixture: ComponentFixture<NewsletterFormViewAllComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsletterFormViewAllComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewsletterFormViewAllComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
