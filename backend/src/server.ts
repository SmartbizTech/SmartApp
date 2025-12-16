import app from "./app";
import { loadEnv } from "./config/env";

const env = loadEnv();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend server running on port ${env.port}`);
});

