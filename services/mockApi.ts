
import { Merchant, Booking, BookingStatus, User, Role, Service } from '../types.ts';

const COMMISSION_RATE = 0.05; // 5%

let merchants: Merchant[] = [
  {
    id: '1',
    name: 'The Golden Spoon Diner',
    category: 'Restaurant',
    description: 'A classic American diner experience with a modern twist. Famous for our all-day breakfast and handcrafted milkshakes.',
    imageUrl: 'https://picsum.photos/seed/diner/800/600',
    services: [
      { id: 's1-1', name: 'Table for 2 Reservation', price: 10 },
      { id: 's1-2', name: 'Table for 4 Reservation', price: 15 },
      { id: 's1-3', name: 'Booth Seating (up to 6)', price: 20 },
    ],
    operatingHours: {
      'Monday-Friday': '8:00 AM - 10:00 PM',
      'Saturday-Sunday': '7:00 AM - 11:00 PM',
    },
  },
  {
    id: '2',
    name: 'Serenity Spa & Wellness',
    category: 'Service',
    description: 'Your urban oasis for relaxation and rejuvenation. We offer a wide range of treatments from massages to facials.',
    imageUrl: 'https://picsum.photos/seed/spa/800/600',
    services: [
      { id: 's2-1', name: 'Swedish Massage (60 min)', price: 120 },
      { id: 's2-2', name: 'Deep Tissue Massage (60 min)', price: 140 },
      { id: 's2-3', name: 'Signature Facial (75 min)', price: 180 },
    ],
    operatingHours: {
      'Tuesday-Sunday': '10:00 AM - 8:00 PM',
      'Monday': 'Closed',
    },
  },
  {
    id: '3',
    name: 'Cityscape Boutique Hotel',
    category: 'Accommodation',
    description: 'Chic and stylish rooms with breathtaking city views. Enjoy our rooftop bar and 24/7 concierge service.',
    imageUrl: 'https://picsum.photos/seed/hotel/800/600',
    services: [
      { id: 's3-1', name: 'Queen Room', price: 250 },
      { id: 's3-2', name: 'King Suite', price: 400 },
      { id: 's3-3', name: 'Penthouse', price: 1200 },
    ],
    operatingHours: {
      'All Week': '24 Hours',
    },
  },
    {
    id: '4',
    name: 'Adventure Hub Rentals',
    category: 'Activity',
    description: 'Rent kayaks, paddleboards, and mountain bikes to explore the great outdoors. Guided tours available!',
    imageUrl: 'https://picsum.photos/seed/adventure/800/600',
    services: [
      { id: 's4-1', name: 'Kayak Rental (Half Day)', price: 45 },
      { id: 's4-2', name: 'Mountain Bike (Full Day)', price: 70 },
      { id: 's4-3', name: 'Guided Hike (3 hours)', price: 50 },
    ],
    operatingHours: {
      'All Week': '9:00 AM - 6:00 PM',
    },
  },
];

const users: User[] = [
    { id: 'user1', name: 'Alex', role: Role.User },
    { id: 'merchant1', name: 'Golden Spoon Manager', role: Role.Merchant, merchantId: '1' },
    { id: 'merchant2', name: 'Serenity Spa Owner', role: Role.Merchant, merchantId: '2' },
    { id: 'admin1', name: 'TOAIGO Admin', role: Role.Admin },
];

let bookings: Booking[] = [];

export const api = {
  getMerchants: async (): Promise<Merchant[]> => {
    return new Promise(resolve => setTimeout(() => resolve(merchants), 500));
  },
  getMerchantById: async (id: string): Promise<Merchant | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(merchants.find(m => m.id === id)), 300));
  },
  createBooking: async (bookingDetails: Omit<Booking, 'id' | 'status' | 'createdAt' | 'commission' | 'merchantPayout'>): Promise<Booking> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const commission = bookingDetails.bookingCost * COMMISSION_RATE;
        const merchantPayout = bookingDetails.bookingCost - commission;

        const newBooking: Booking = {
          ...bookingDetails,
          id: Date.now().toString(),
          status: BookingStatus.Pending,
          createdAt: new Date(),
          commission,
          merchantPayout
        };
        bookings.unshift(newBooking);
        resolve(newBooking);
      }, 700);
    });
  },
  getBookings: async (): Promise<Booking[]> => {
    return new Promise(resolve => setTimeout(() => resolve(bookings), 500));
  },
  getUsers: async (): Promise<User[]> => {
    return new Promise(resolve => setTimeout(() => resolve(users), 100));
  },
  login: async (userId: string): Promise<User | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(users.find(u => u.id === userId)), 200));
  },
  updateBookingStatus: async (bookingId: string, status: BookingStatus): Promise<Booking | undefined> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const booking = bookings.find(b => b.id === bookingId);
              if (booking) {
                  booking.status = status;
                  resolve({...booking});
              } else {
                  resolve(undefined);
              }
          }, 400);
      });
  },
  updateMerchantServices: async (merchantId: string, services: Service[]): Promise<Merchant | undefined> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const merchantIndex = merchants.findIndex(m => m.id === merchantId);
              if (merchantIndex !== -1) {
                  merchants[merchantIndex].services = services;
                  resolve({...merchants[merchantIndex]});
              } else {
                  resolve(undefined);
              }
          }, 400);
      })
  }
};