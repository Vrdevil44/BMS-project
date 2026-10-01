import { CollectionName, Entry } from './types';

// All fake: invented names, example.com emails, 555-01xx phone numbers.
export const SEED: Record<CollectionName, Entry[]> = {
  addressbook: [
    { id: 'c1', UUID: 'CUST-1001', name: 'Ada Quill', companyname: 'Quillworks Ltd', email: 'ada@example.com', phone: '555-0101', address: '1 Imaginary Lane, Faketown' },
    { id: 'c2', UUID: 'CUST-1002', name: 'Bram Teller', companyname: 'Teller & Sons', email: 'bram@example.com', phone: '555-0102', address: '22 Placeholder Ave, Nowhereville' },
    { id: 'c3', UUID: 'CUST-1003', name: 'Cleo Marsh', companyname: 'Marsh Mercantile', email: 'cleo@example.com', phone: '555-0103', address: '303 Sample Street, Exampleton' },
    { id: 'c4', UUID: 'CUST-1004', name: 'Dov Lindqvist', companyname: 'Lindqvist Logistics', email: 'dov@example.com', phone: '555-0104', address: '4 Test Road, Mockburg' },
  ],
  invoicebook: [
    { id: 'i1', UUID: 'CUST-1001', name: 'Ada Quill', companyname: 'Quillworks Ltd', email: 'ada@example.com', phone: '555-0101', address: '1 Imaginary Lane, Faketown' },
    { id: 'i2', UUID: 'CUST-1003', name: 'Cleo Marsh', companyname: 'Marsh Mercantile', email: 'cleo@example.com', phone: '555-0103', address: '303 Sample Street, Exampleton' },
    { id: 'i3', UUID: 'CUST-1002', name: 'Bram Teller', companyname: 'Teller & Sons', email: 'bram@example.com', phone: '555-0102', address: '22 Placeholder Ave, Nowhereville' },
  ],
};
