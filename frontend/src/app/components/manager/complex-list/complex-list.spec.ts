import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplexList } from './complex-list';

describe('ComplexList', () => {
  let component: ComplexList;
  let fixture: ComponentFixture<ComplexList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplexList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComplexList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
