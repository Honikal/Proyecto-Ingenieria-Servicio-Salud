import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearCursos } from './crear-cursos';

describe('CrearCursos', () => {
  let component: CrearCursos;
  let fixture: ComponentFixture<CrearCursos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearCursos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearCursos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
