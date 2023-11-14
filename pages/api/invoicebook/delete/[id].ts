// delete.ts
import { NextApiRequest, NextApiResponse } from 'next';
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Define the response type
interface DeleteResponseData {
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteResponseData>
) {
  // The ID is part of the URL path, so it's in req.query for dynamic routes
  const { id } = req.query;

  if (req.method === 'DELETE') {
    // Check if the ID is a string
    if (typeof id !== 'string') {
      res.status(400).json({ error: 'ID must be a string' });
      return;
    }

    try {
      // Use the id variable to delete the correct entry
      await pb.collection('addressbook').delete(id);
      res.json({ message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'An error occurred during deletion' });
    }
  } else {
    // If the method is not DELETE, return a 405 Method Not Allowed
    res.setHeader('Allow', ['DELETE']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}