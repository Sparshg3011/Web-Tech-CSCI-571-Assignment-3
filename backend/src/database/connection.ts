import mongoose from 'mongoose';

const sanitizeUri = (uri: string): string => uri.replace(/^['"]|['"]$/g, '').trim();

export const connectToDatabase = async (): Promise<void> => {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    throw new Error('MONGODB_URI environment variable is not set.');
  }

  const uri = sanitizeUri(rawUri);

  if (!uri) {
    throw new Error('MONGODB_URI is empty after sanitization');
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error);
  });
};

export const disconnectFromDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};


