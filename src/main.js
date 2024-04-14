import { startDevServer } from '@web/dev-server';
import router from './server/config/router-config.js'

import './client/components/simple-button.js'

async function main() {
    const server = await startDevServer({
        config: {
            rootDir: "./",
            nodeResolve: true,
            port: 3000,
            middlewares: [
                function (context, next) {
                    if (context.url.startsWith('/src/server/')) {
                        context.status = 404;
                        context.body = 'Not Found';
                    } else {
                        return next();
                    }
                },
            ],
        },
        readCliArgs: true,
    });

    const app = server.koaApp;

    // Mount the router middleware
    app.use(router.routes());
    app.use(router.allowedMethods());
}

main();