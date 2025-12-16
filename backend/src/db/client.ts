import { PrismaClient } from "@prisma/client";
import { loadEnv } from "../config/env";

const env = loadEnv();

export const prisma = new PrismaClient({
  datasourceUrl: env.databaseUrl,
});


