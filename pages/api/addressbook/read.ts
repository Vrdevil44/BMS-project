import { NextApiRequest, NextApiResponse } from 'next';
import PocketBase from 'pocketbase';

// Initialize PocketBase client
const pb = new PocketBase('http://127.0.0.1:8090'); // Replace with your PocketBase server URL

// Define the structure of an address book entry
interface AddressBookEntry {
  id: string;
  UUID: string;
  name: string;
  companyname: string;
  email: string;
  phone: string;
  address: string;
}

// Define a type for error responses
interface ErrorResponse {
  message: string;
}
// Define a generic API response type that can handle both data and error messages
type ApiResponse = {
  data?: AddressBookEntry[];
  error?: string;
}

// Update the handler function's response type
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method === 'GET') {
    try {
      // Fetch data from PocketBase
      const resultList = await pb.collection('addressbook').getList(1, 50, {
          // Add your filter conditions here if needed
      });

      // Map the data to your AddressBookEntry structure if necessary
      const entries = resultList.items.map(item => ({
        id: item.id,
        UUID: item.UUID, // Make sure the field names match those in your PocketBase collection
        name: item.name,
        companyname: item.companyname,
        email: item.email,
        phone: item.phone,
        address: item.address
      }));

      res.json({ data: entries }); // Wrap the entries in a data object
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" }); // Use an error object
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
