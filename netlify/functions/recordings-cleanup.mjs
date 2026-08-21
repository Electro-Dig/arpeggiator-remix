import { getStore } from '@netlify/blobs';

import { cleanupExpiredBlobRecordings } from '../blob-recording-backend.mjs';

export default async () => {
  if (Netlify.env.get('RECORDINGS_BACKEND') !== 'blobs') {
    return new Response(null, { status: 204 });
  }
  const store = getStore({
    name: Netlify.env.get('RECORDINGS_BLOB_STORE') || 'arpeggiator-recordings',
    consistency: 'strong',
  });
  const result = await cleanupExpiredBlobRecordings(store);
  console.log(JSON.stringify({ event: 'recordings-cleanup', ...result }));
  return Response.json(result);
};

export const config = {
  schedule: '@hourly',
};
