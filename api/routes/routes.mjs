import oauthRoutes from './oauth.mjs';
import sessionRoutes from './session.mjs';

const allRoutes = {
  ...oauthRoutes,
  ...sessionRoutes
};

export default allRoutes;