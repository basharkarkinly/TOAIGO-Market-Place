export enum BookingStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Rejected = 'Rejected',
}

export enum Role {
  User = 'User',
  Merchant = 'Merchant',
  Admin = 'Admin',
}

export interface User {
  id: string;
  name: string;
  role: Role;
  merchantId?: string; // Only for merchants
}

export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface Merchant {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  services: Service[];
  operatingHours: {
    [key: string]: string; 
  };
}

export interface Booking {
  id: string;
  merchant: Merchant;
  merchantId: string;
  date: string;
  time: string;
  guests: number;
  notes: string;
  status: BookingStatus;
  createdAt: Date;
  // New financial fields
  serviceName: string;
  bookingCost: number;
  commission: number;
  merchantPayout: number;
}
