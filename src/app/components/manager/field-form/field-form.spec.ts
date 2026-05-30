import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FieldForm } from './field-form';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

describe('FieldForm', () => {
  let component: FieldForm;
  let fixture: ComponentFixture<FieldForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldForm, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FieldForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
