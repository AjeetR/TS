import { decrypt } from './src/lib/aes';
const aes = {
  decrypt
};

export const PRODUCTION = process.env.NODE_ENV === 'production';

const DEFAULT_DEBUG = PRODUCTION ? 'info' : 'silly';
export const DEBUG = process.env.DEBUG || DEFAULT_DEBUG;

export const PORT = process.env.PORT || 3010;

export const BATCH_SIZE = process.env.BATCH_SIZE || 10;

export const REQUEST_TIMEOUT = process.env.REQUEST_TIMEOUT || 150;

export const REQUEST_QUEUE_URL =
  'https://sqs.us-east-1.amazonaws.com/765105446317/acm-dev-identrust-requests';

export const DENY_LIST_DNS_NAMES = [
  'denythis.hyid.co'
];

// this is slightly weird - there is the first try, and then two retries - for a total of 3 attempts
//export const RETRY_COUNT = 2;
export const RETRY_COUNT = 0;
export const RETRY_DELAY_MS = 5000;

const accounts = {
  // HydrantID account on ACM-Dev
  'e29d567e-419d-452b-aaf9-c22f9cc13594': {
    accountType: 890,
    baseUrl: 'https://secure-stg.identrust.com/app/tsapi',
    apiKey: 'uUU0AuWjyDo3tpkjYVgrVl7XQrIGkcHpI6h0CDyO',
    apiPassword: aes.decrypt('88a1aede332d886586a801c97b95090d:4f4892a20e94f7056e7984bda023b890'),
  },
};

export const ACCOUNTS_API = accounts;
