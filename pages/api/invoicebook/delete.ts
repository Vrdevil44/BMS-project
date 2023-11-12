import { NextApiRequest, NextApiResponse } from 'next';
import { openDatabase } from '../../../utils/db';

// Define the expected request body type
interface DeleteRequestBody {
  id: number;
}

// Define the response type
interface DeleteResponseData {
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteResponseData>
) {
  if (req.method === 'DELETE') {
    const { id } = req.body as DeleteRequestBody;

    if (!id) {
      res.status(400).json({ error: 'ID is required' });
      return;
    }

    const db = await openDatabase();
    const { changes } = await db.run('DELETE FROM addressbook WHERE id = ?', [id]);

    if (changes === 0) {
      res.status(404).json({ error: 'No entry found with the given ID' });
    } else {
      res.json({ message: 'Deleted successfully' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
