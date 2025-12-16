export interface EnvConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  uploadDir: string;
}

export const loadEnv = (): EnvConfig => {
  const {
    PORT,
    NODE_ENV,
    DATABASE_URL,
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    UPLOAD_DIR,
  } = process.env;

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error("JWT secrets are not set");
  }

  return {
    port: PORT ? parseInt(PORT, 10) : 4000,
    nodeEnv: NODE_ENV || "development",
    databaseUrl: DATABASE_URL,
    jwtSecret: JWT_SECRET,
    jwtRefreshSecret: JWT_REFRESH_SECRET,
    uploadDir: UPLOAD_DIR || "uploads",
  };
};


