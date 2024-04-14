import Router from '@koa/router';

import html from '../../webcomponent-lib/crossPlatform/html-parser.js';
import hydrate from '../../webcomponent-lib/server/ss-hydrate.js';
import render from '../../webcomponent-lib/server/ssr.js';

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

    console.log(htmlRender)

    ctx.type = 'text/html';
    ctx.body = htmlRender;
});

export default router;