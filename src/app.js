import Koa from 'koa';
import 'winston-daily-rotate-file';
import './http-logger';
import logger from './koa-logger';
import routes from './routes';
import config from './config';

const app = new Koa();

app.keys = [config.cookie.secret];
app.use(logger);
app.use(routes);

app.listen(process.env.PORT || 3000);
