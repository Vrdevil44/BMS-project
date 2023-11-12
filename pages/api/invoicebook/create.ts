import { NextApiRequest, NextApiResponse } from 'next';
import { openDatabase } from '../../../utils/db';

// Define the expected request body type
interface CreateRequestBody {
  name: string;
  email: string;
  phone: string;
  address: string;
}

// Define the response type
interface CreateResponseData {
  id?: number;
  UUID?: string;
  error?: string;
}

// Utility function to generate a custom, shorter UUID
function generateCustomID(length: number = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// The handler function with types for req and res
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateResponseData>
) {
  if (req.method === 'POST') {
    const { name, email, phone, address } = req.body as CreateRequestBody;

    // Generate a custom UUID for the new entry
    const UUID = generateCustomID();

    const db = await openDatabase();
    const result = await db.run(
      'INSERT INTO addressbook (UUID, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
      [UUID, name, email, phone, address]
    );

    if (!result.lastID) {
      res.status(500).json({ error: 'Failed to create entry' });
    } else {
      res.json({ id: result.lastID, UUID });  // Sending back the UUID along with the ID
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
