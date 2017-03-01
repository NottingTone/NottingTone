export default from './routes';
import { keepRefreshingToken } from './refresh-token';

keepRefreshingToken()
.catch(e => {
	console.log(e);
});
