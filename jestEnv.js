process.env.SESSION_TABLE = 'OrdskySession';
// Included to silent x-ray in unit tests
process.env.AWS_XRAY_CONTEXT_MISSING = 'LOG_ERROR';
process.env.AWS_REGION = 'eu-north-1';
process.env.ENDPOINT = 'www.example.com';
