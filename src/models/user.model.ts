export interface User {
  fullName: string;
  email: string;
  area: string;
  phone: string;
  password: string; 
  isAdmin: boolean;  
  createdAt: Date;     
  //emailVerified?: boolean;
  //verificationToken?: string;
}