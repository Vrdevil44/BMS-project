import { NextApiRequest, NextApiResponse } from 'next';
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090'); // Adjust the URL as needed

// Define the structure of an address book entry
interface AddressBookEntry {
  id: string; // Change to string because PocketBase uses string IDs
  UUID: string;
  name: string;
  companyname: string;
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponseData>
) {
  if (req.method === 'GET') {
    const UUID = typeof req.query.UUID === 'string' ? req.query.UUID : undefined;
    
    if (!UUID) {
      res.status(400).json({ error: 'UUID is required' });
      return;
    }

    try {
      const entry = await pb.collection('invoicebook').getFirstListItem(`UUID="${UUID}"`, {});
      if (entry) {
        // Map the data to match the AddressBookEntry interface
        const mappedEntry: AddressBookEntry = {
          id: entry.id,
          UUID: entry.UUID,
          name: entry.name,
          companyname: entry.companyname,
          email: entry.email,
          phone: entry.phone,
          address: entry.address
        };
        res.json([mappedEntry]);
      } else {
        res.json([]); // Return an empty array if no entry is found
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
