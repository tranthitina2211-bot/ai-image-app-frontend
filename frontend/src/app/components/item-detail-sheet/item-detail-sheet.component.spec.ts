import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemDetailSheetComponent } from './item-detail-sheet.component';

describe('ItemDetailSheetComponent', () => {
  let component: ItemDetailSheetComponent;
  let fixture: ComponentFixture<ItemDetailSheetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ItemDetailSheetComponent]
    });
    fixture = TestBed.createComponent(ItemDetailSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
