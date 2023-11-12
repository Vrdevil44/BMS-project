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

// Define the query parameters type
interface SearchQueryParams {
  UUID: string;
}

// Define the response type to include either an array of entries or an error message
type SearchResponseData = AddressBookEntry[] | { error: string };

// The handler function with types for req and res
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponseData>
) {
  if (req.method === 'GET') {
    // Ensure the query parameter is a string
    const UUID = typeof req.query.UUID === 'string' ? req.query.UUID : undefined;
    
    if (!UUID) {
      res.status(400).json({ error: 'UUID is required' });
      return;
    }

    const db = await openDatabase();
    const entry = await db.get<AddressBookEntry>('SELECT * FROM addressbook WHERE UUID = ?', [UUID]);
    
    if (entry) {
      res.json([entry]);  // Return the entry as an array for consistency with other endpoints
    } else {
      res.json([]);  // Return an empty array if no entry is found
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
