import { config } from "dotenv";
import { defineConfig } from "@prisma/config";

config({ path: ".env" });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "npx tsx src/prisma/seed.ts",
  },
});
