/**
 * Ensures the MongoDB connection string includes the database name
 * In production, we don't modify the URL as some providers don't support it
 */
export function ensureDatabaseUrl(uri: string, dbName: string = 'danbing'): string {
  // In production, return the URI as-is and handle database selection after connection
  if (process.env.NODE_ENV === 'production') {
    return uri;
  }
  
  // For local development, ensure database name is in the URL
  const urlParts = uri.match(/^(mongodb(?:\+srv)?:\/\/[^\/]+)(\/[^?]+)?(\?.*)?$/);
  
  if (!urlParts) {
    throw new Error('Invalid MongoDB connection string format');
  }
  
  const [, baseUrl, existingDb, queryParams = ''] = urlParts;
  
  // If no database name is specified, add it
  if (!existingDb || existingDb === '/') {
    return `${baseUrl}/${dbName}${queryParams}`;
  }
  
  // If database name is 'test' or empty, replace it
  const currentDb = existingDb.slice(1); // Remove leading slash
  if (currentDb === 'test' || currentDb === '') {
    return `${baseUrl}/${dbName}${queryParams}`;
  }
  
  // Otherwise, keep the existing database name
  return uri;
}

/**
 * Logs MongoDB connection information (sanitized)
 */
export function logMongoConnection(uri: string) {
  const sanitized = uri.replace(/:([^@]+)@/, ':****@');
  const dbMatch = uri.match(/\/([^/?]+)(\?|$)/);
  const dbName = dbMatch ? dbMatch[1] : 'default';
  
  console.log('[MongoDB] Connection info:');
  console.log('  URI:', sanitized);
  console.log('  Database:', dbName);
}