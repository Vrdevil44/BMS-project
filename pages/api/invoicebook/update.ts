import { NextApiRequest, NextApiResponse } from 'next';
import { openDatabase } from '../../../utils/db';

// Define the expected request body type
interface UpdateRequestBody {
  id: number;
  name: string;
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
    const { id, name, email, phone, address } = req.body as UpdateRequestBody;

    if (!id) {
      res.status(400).json({ error: 'ID is required' });
      return;
    }

    const db = await openDatabase();
    const { changes } = await db.run(
      'UPDATE addressbook SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [name, email, phone, address, id]
    );
    
    if (changes === 0) {
      res.status(404).json({ error: 'No entry found with the given ID' });
    } else {
      res.json({ message: 'Updated successfully' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
