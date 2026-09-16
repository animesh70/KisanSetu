let clientPromise = null;
let client = null;

export class MongoNotConfiguredError extends Error {
  constructor() {
    super('MongoDB is not configured for shared logistics.');
    this.name = 'MongoNotConfiguredError';
    this.code = 'MONGODB_NOT_CONFIGURED';
  }
}

export function isMongoConfigured() {
  return Boolean(String(process.env.MONGODB_URI || '').trim());
}

export function getMongoDbName() {
  return String(process.env.MONGODB_DB_NAME || 'kisansetu').trim() || 'kisansetu';
}

async function connectClient() {
  if (!isMongoConfigured()) throw new MongoNotConfiguredError();
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    // Dynamic import keeps the rest of KisanSetu usable even if shared-logistics
    // MongoDB support has not been installed/configured yet.
    const { MongoClient } = await import('mongodb');
    const nextClient = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    await nextClient.connect();
    client = nextClient;
    return nextClient;
  })().catch((error) => {
    clientPromise = null;
    client = null;
    throw error;
  });

  return clientPromise;
}

export async function getDb() {
  const connectedClient = await connectClient();
  return connectedClient.db(getMongoDbName());
}

export async function getCollection(name) {
  const db = await getDb();
  return db.collection(name);
}

export async function closeMongoConnection() {
  if (!client) {
    clientPromise = null;
    return;
  }
  await client.close();
  client = null;
  clientPromise = null;
}
