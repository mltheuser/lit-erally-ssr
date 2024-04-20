import Router from '@koa/router';
import homeRoutes from '../routes/home.js'

const router = new Router();

router.use(homeRoutes.routes(), homeRoutes.allowedMethods());

export default router;