export interface User {
  fullName: string;
  email: string;
  area: string;
  phone: string;
  password: string; 
  isAdmin: boolean;  
  isAuto: boolean;
  createdAt: Date;     
}