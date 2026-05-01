// Global test setup
process.env.JWT_SECRET = 'test-secret-key-32-chars-minimum!';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost/orbit_test';
process.env.NODE_ENV = 'test';
process.env.ANTHROPIC_API_KEY = 'test-api-key';
process.env.ALLOWED_ORIGIN = 'http://localhost:3000';
process.env.ARTIST_NAME = 'Allyson Glado';
process.env.ARTIST_TONE = 'chaleureux';
process.env.ARTIST_BIO = 'Artiste reggae-pop de Paris';
process.env.BREVO_API_KEY = 'test-brevo-key';
process.env.BREVO_LIST_ID = '123';
process.env.CIRCLE_API_KEY = 'test-circle-key';
process.env.CIRCLE_WALLET_ID = 'test-wallet-id';
process.env.CIRCLE_API_URL = 'https://api.sandbox.circle.com';
