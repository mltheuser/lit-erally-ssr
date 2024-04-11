// test.js

import { startDevServer } from '@web/dev-server';
import Router from '@koa/router';

import { html } from './dyn.js'
import { hydrate, render } from './dynServer.js';

import './SimpleButton.js'

async function main() {
    const server = await startDevServer({
        config: {
            rootDir: "./",
            nodeResolve: true,
            port: 3000,
        },
        readCliArgs: true,
    });

    const app = server.koaApp;
    const router = new Router();

    router.get('/', async (ctx) => {
        const htmlString = html`
            <p>text</p>
            <div>
                <simple-button text=${[1, 2, 3]}>
                    <span>Let's have some different text!</span>
                    <counter-list counts="[129, 130]"></counter-list>
                </simple-button>
            </div>
        `
        const htmlRender = render(hydrate(htmlString));
        console.log("----")
        console.log(htmlRender)
        ctx.type = 'text/html';
        ctx.body = htmlRender;
    });

    app
        .use(router.routes())
}

main();