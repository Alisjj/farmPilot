import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";

// Replace CommonJS require with dynamic ESM import (package.json has type: module)
let setupVite: any,
    serveStatic: any,
    log: any = () => {};
if (process.env.JEST_WORKER_ID === undefined) {
    const viteTools = await import("./vite");
    ({ setupVite, serveStatic, log } = viteTools as any);
}

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json.bind(res);
    res.json = ((bodyJson?: any) => {
        capturedJsonResponse = bodyJson;
        return originalResJson(bodyJson);
    }) as any;

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }

            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }

            log(logLine);
        }
    });

    next();
});

(async () => {
    if (process.env.JEST_WORKER_ID !== undefined) {
        await registerRoutes(app);
        app.use(
            (err: any, _req: Request, res: Response, _next: NextFunction) => {
                const status = err.status || err.statusCode || 500;
                const message = err.message || "Internal Server Error";
                res.status(status).json({ message });
            }
        );
        return; // Do not start server in test
    }
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        res.status(status).json({ message });
        throw err;
    });

    if (app.get("env") === "development") {
        await setupVite(app, server);
    } else {
        serveStatic(app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(port, () => {
        log(`serving on port ${port}`);
    });
})();
