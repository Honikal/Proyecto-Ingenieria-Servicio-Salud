export interface Socio {
  id: string;
  nombre: string;
  cantidadAsociados: number;
  email: string;
  password: string;
  telefono: string;
  logo:string;
  isActive:boolean;
  //cursos?: { nombre: string }[];
}