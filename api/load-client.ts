import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs' };

const REGION = process.env.APP_REGION || 'ap-southeast-1';
const BUCKET_NAME = process.env.S3_BUCKET || 'prismscales3';

const createS3Client = () => {
  const accessKeyId = process.env.ACCESS_KEY_ID;
  const secretAccessKey = process.env.SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region: REGION,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
};

// Must match lambda_function.py _sanitize_brand_name exactly:
// keep alphanumeric, replace everything else with _, strip leading/trailing _, lowercase
function sanitizeBrandName(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').replace(/^_+|_+$/g, '').toLowerCase() || 'brand';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const brand = req.query.brand as string | undefined;
  if (!brand?.trim()) {
    return res.status(400).json({ error: 'Missing brand query parameter' });
  }

  const key = `branding-prismscale/${sanitizeBrandName(brand.trim())}/vars.json`;
  const s3Client = createS3Client();
  if (!s3Client) {
    return res.status(500).json({ error: 'AWS credentials not configured' });
  }

  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const response = await s3Client.send(cmd);
    const body = await response.Body?.transformToString('utf-8');
    if (!body) return res.status(404).json({ error: 'Client not found' });
    return res.status(200).json(JSON.parse(body));
  } catch (err: any) {
    if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
      return res.status(404).json({ error: `No saved data found for "${brand}"` });
    }
    console.error('load-client error:', err);
    return res.status(500).json({ error: 'Failed to load client data' });
  }
}
