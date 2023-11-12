import { NextApiRequest, NextApiResponse } from 'next';
import { openDatabase } from '../../../utils/db';

// Define the structure of an address book entry
interface AddressBookEntry {
  id: number;
  UUID: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

// The handler function with types for req and res
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AddressBookEntry[]>
) {
  if (req.method === 'GET') {
    const db = await openDatabase();
    const entries = await db.all<AddressBookEntry[]>('SELECT * FROM addressbook');
    res.json(entries);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
