import { NextApiRequest, NextApiResponse } from 'next';
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

interface CreateRequestBody {
  name: string;
  email: string;
  phone: string;
  address: string;
  companyname: string;
}

interface CreateResponseData {
  id?: string;
  UUID?: string;
  error?: string;
}

function generateCustomID(length = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateResponseData>
) {
  if (req.method === 'POST') {
    try {
      const { name, companyname, email, phone, address } = req.body as CreateRequestBody;

      // Generate a custom UUID
      const customUUID = generateCustomID();

      // Create the record in the PocketBase collection
      const record = await pb.collection('addressbook').create({
        UUID: customUUID, // Include the generated custom UUID
        name,
        companyname,
        email,
        phone,
        address
      });

      res.status(200).json({ id: record.id, UUID: customUUID }); // Send back the ID and the custom UUID of the new record
    } catch (error) {
      console.error('Failed to create entry', error);
      res.status(500).json({ error: 'Failed to create entry' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
