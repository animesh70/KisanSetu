let connectionPromise = null;
let connection = null;

export class MongooseNotConfiguredError extends Error {
  constructor() {
    super('MongoDB is not configured for equipment sharing.');
    this.name = 'MongooseNotConfiguredError';
    this.code = 'MONGODB_NOT_CONFIGURED';
  }
}

export function isMongooseConfigured() {
  return Boolean(String(process.env.MONGODB_URI || '').trim());
}

export async function getMongooseConnection() {
  if (!isMongooseConfigured()) throw new MongooseNotConfiguredError();
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    const mongooseModule = await import('mongoose');
    const mongoose = mongooseModule.default || mongooseModule;
    const nextConnection = mongoose.createConnection(process.env.MONGODB_URI, {
      dbName: String(process.env.MONGODB_DB_NAME || 'kisansetu').trim() || 'kisansetu',
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 5
    });
    await nextConnection.asPromise();
    connection = nextConnection;
    return nextConnection;
  })().catch((error) => {
    connectionPromise = null;
    connection = null;
    throw error;
  });

  return connectionPromise;
}

export async function closeMongooseConnection() {
  if (!connection) {
    connectionPromise = null;
    return;
  }
  await connection.close();
  connection = null;
  connectionPromise = null;
}
