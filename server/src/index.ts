import cors from "cors"
import express from "express"
import morgan from "morgan"
import swaggerUi from "swagger-ui-express"
import YAML from "yaml"
import { z } from "zod"

import { errorHandler } from "./middleware/error.middleware"
import { buildOpenApiSpec } from "./openapi"
import { coursesRouter } from "./routes/courses.routes"
import { eventsRouter } from "./routes/events.routes"
import { healthRouter } from "./routes/health.routes"
import { validatorRouter } from "./routes/validator.routes"

const envSchema = z.object({
	PORT: z.coerce.number().int().positive().default(4000),
	CORS_ORIGIN: z.string().default("http://localhost:5173"),
})

const env = envSchema.parse(process.env)

const app = express()
const openApiSpec = buildOpenApiSpec()
const openApiYaml = YAML.stringify(openApiSpec)

app.use(morgan("dev"))
app.use(
	cors({
		origin: env.CORS_ORIGIN,
	}),
)
app.use(express.json())

app.use("/api", healthRouter)
app.use("/api", coursesRouter)
app.use("/api", validatorRouter)
app.use("/api", eventsRouter)
const isProduction = env.NODE_ENV === "production";

let jwtPrivateKey = env.JWT_PRIVATE_KEY;
let jwtPublicKey = env.JWT_PUBLIC_KEY;

if (!jwtPrivateKey || !jwtPublicKey) {
  if (isProduction) {
    throw new Error(
      "JWT_PRIVATE_KEY and JWT_PUBLIC_KEY are required in production"
    );
  }
  const pair = generateEphemeralDevJwtKeys();
  jwtPrivateKey = pair.privateKeyPem;
  jwtPublicKey = pair.publicKeyPem;
  console.warn(
    "[learnvault] JWT: using ephemeral RSA keys (dev only). Add JWT_PRIVATE_KEY / JWT_PUBLIC_KEY to server/.env for stable tokens across restarts."
  );
}

const nonceStore = createNonceStore(env.REDIS_URL);
const jwtService = createJwtService(jwtPrivateKey, jwtPublicKey);
const authService = createAuthService(nonceStore, jwtService);

const app = express();

const openApiSpec = buildOpenApiSpec();
const openApiYaml = YAML.stringify(openApiSpec);

app.set("trust proxy", 1);

app.use(morgan("dev"));
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(globalLimiter);

app.use("/api", healthRouter);
app.use("/api/auth", createAuthRouter(authService));
app.use("/api", createMeRouter(jwtService));
app.use("/api", coursesRouter);
app.use("/api", validatorRouter);
app.use("/api", eventsRouter);
app.use("/api", commentsRouter);
app.use("/api", adminMilestonesRouter);


app.get("/api/docs", (_req, res) => {
	res.type("application/yaml").send(openApiYaml)
})

if (process.env.NODE_ENV !== "production") {
	app.use("/api/docs/ui", swaggerUi.serve, swaggerUi.setup(openApiSpec))
}

app.use(errorHandler)

app.listen(env.PORT, () => {
	console.log(`Server listening on port ${env.PORT}`)
})
