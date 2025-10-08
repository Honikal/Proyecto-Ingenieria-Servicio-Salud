export interface Matricula {
  idCurso: string;
  idUser: string;
  finalizado: boolean;
  pantallasCompletadas: string[];
  fechaMatricula: Date;
  fechaFinalizacion: Date;
  calificacion: number; 
}