import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromptBarComponent } from './prompt-bar.component';

describe('PromptBarComponent', () => {
  let component: PromptBarComponent;
  let fixture: ComponentFixture<PromptBarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PromptBarComponent]
    });
    fixture = TestBed.createComponent(PromptBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
