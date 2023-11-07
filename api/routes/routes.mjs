import clientRoutes from './client.mjs';
import oauthRoutes from './oauth.mjs';
import sessionRoutes from './session.mjs';

const allRoutes = {
  ...clientRoutes,
  ...oauthRoutes,
  ...sessionRoutes
};

export default allRoutes;