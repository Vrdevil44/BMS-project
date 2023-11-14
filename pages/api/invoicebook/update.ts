import { NextApiRequest, NextApiResponse } from 'next';
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090'); // Adjust this URL to your PocketBase server's URL

// Define the expected request body type
interface UpdateRequestBody {
  id: string; // Using string for ID since PocketBase uses string IDs
  UUID: string; // Assuming you're updating this as well
  name: string;
  companyname: string;
  email: string;
  phone: string;
  address: string;
}

// Define the response type
interface UpdateResponseData {
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateResponseData>
) {
  if (req.method === 'PUT') {
    const { id, UUID, name, companyname, email, phone, address } = req.body as UpdateRequestBody;

    if (!id) {
      res.status(400).json({ error: 'ID is required' });
      return;
    }

    try {
      const data = {
        UUID,
        name,
        companyname,
        email,
        phone,
        address,
      };

      const record = await pb.collection('invoicebook').update(id, data);

      if (record) {
        res.json({ message: 'Updated successfully' });
      } else {
        res.status(404).json({ error: 'No entry found with the given ID' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
