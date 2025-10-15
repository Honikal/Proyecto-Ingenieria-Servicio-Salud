import { Pantalla } from "./pantalla.model";

export interface Modulo {
  id: number;                 
  nombre: string;             
  pantallas: Pantalla[];      
}