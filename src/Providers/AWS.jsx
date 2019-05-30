import Incarnate, {SubMapDeclaration} from 'incarnate';
import ParseCookies from 'cookie';

const PATH_DELIMITER = '/';
const METHODS = {
  OPTIONS: 'OPTIONS'
};

/**
 * Built-in dependency names.
 * */
export const DEP_NAMES = {
  INPUT: 'INPUT',
  PACKAGES: 'PACKAGES',
  HEADERS: 'HEADERS',
  COOKIES: 'COOKIES',
  PATH: 'PATH'
};

// SECURITY: Don't call private methods on services.
const getMethodNameIsPrivate = (methodName = '') => methodName.charAt(0) === '_';

const getCleanPathParts = (path = '') => path
  .split(PATH_DELIMITER)
  .filter(p => !!p);

const getResponse = (statusCode = 200, value = undefined, headers = {}) => ({
  statusCode,
  headers: typeof value === 'undefined' ? {...headers} : {'Content-Type': 'application/json', ...headers},
  body: typeof value === 'undefined' ? '' : JSON.stringify(value, null, '  ')
});

const getCORSHeaders = (clientOrigin = '') => ({
  'Access-Control-Allow-Origin': clientOrigin,
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS, HEAD, GET, POST, PUT, PATCH, DELETE',
  'Access-Control-Allow-Credentials': 'true'
});

const getCleanHttpMethod = (method = 'POST') => `${method}`.toUpperCase();

/**
 * Create an Incarnate managed Lambda handler.
 * @param {Object} incarnateConfig The incarnate configuration object.
 * @param {Array.<string>} allowedPaths A SECURITY measure to prevent access of values and methods outside of services.
 * @param {Object} allowedOrigin The allowed CORS origin returned to `OPTIONS` requests.
 * @param {number} dependencyResolutionTimeoutMS The maximum number of milliseconds allotted for resolving service dependencies. Default: 300000 (5 minutes)
 *
 * @returns {Function} The Lambda handler.
 * */
export default (incarnateConfig = {}, allowedPaths = [], allowedOrigin = '', dependencyResolutionTimeoutMS = 300000) => {
  const corsHeaders = getCORSHeaders(allowedOrigin);
  const getResponseWithCORS = (statusCode = 200, value = undefined, headers = {}) => {
    return getResponse(
      statusCode,
      value,
      {
        ...corsHeaders,
        ...headers
      }
    );
  };

  return async (event) => {
    const {
      httpMethod = 'POST',
      headers,
      multiValueHeaders,
      path = '',
      body: bodyString = '[]'
    } = event;
    const cleanHttpMethod = getCleanHttpMethod(httpMethod);

    if (cleanHttpMethod === METHODS.OPTIONS) {
      return getResponseWithCORS(200);
    }

    // SECURITY: IMPORTANT: Only expose allowed paths. (`/package/service/method`)
    if (allowedPaths.indexOf(path) === -1) {
      return getResponseWithCORS(404, {message: 'Not Found'});
    }

    const body = JSON.parse(bodyString);
    const {
      subMap = {}
    } = incarnateConfig;
    const cleanPathParts = getCleanPathParts(path);
    const cleanPath = cleanPathParts.join(PATH_DELIMITER);
    const inc = new Incarnate(new SubMapDeclaration({
      ...incarnateConfig,
      pathDelimiter: PATH_DELIMITER,
      subMap: {
        [DEP_NAMES.INPUT]: {
          subMap: {
            [DEP_NAMES.HEADERS]: {
              factory: () => ({
                ...headers,
                ...multiValueHeaders
              })
            },
            [DEP_NAMES.COOKIES]: {
              dependencies: {
                suppliedHeaders: DEP_NAMES.HEADERS
              },
              factory: ({suppliedHeaders = {}} = {}) => {
                const {Cookie: cookieString = ''} = suppliedHeaders;

                return ParseCookies(cookieString);
              }
            },
            [DEP_NAMES.PATH]: {
              factory: () => cleanPath
            }
          }
        },
        [DEP_NAMES.PACKAGES]: {
          shared: {
            [DEP_NAMES.INPUT]: DEP_NAMES.INPUT
          },
          subMap
        }
      }
    }));
    const [packageName, serviceName, methodName] = cleanPathParts;
    const methodNameIsPrivate = getMethodNameIsPrivate(methodName);
    const args = body instanceof Array ? body : [];

    if (!!packageName && !!serviceName && !!methodName && !methodNameIsPrivate) {
      const servicePath = [
        DEP_NAMES.PACKAGES,
        packageName,
        serviceName
      ];

      let serviceInstance = {};

      try {
        serviceInstance = await inc.getResolvedPathAsync(servicePath, dependencyResolutionTimeoutMS);
      } catch (error) {
        const {
          message,
          source: {
            error: {
              message: sourceMessage
            } = {},
            path,
            causePath
          } = {}
        } = error || {};

        return getResponseWithCORS(
          500,
          {
            message,
            source: {
              message: sourceMessage,
              path,
              causePath
            }
          }
        );
      }

      const {[methodName]: serviceMethod} = serviceInstance;

      if (serviceMethod instanceof Function) {
        try {
          const returnValue = await serviceMethod(...args);

          return getResponseWithCORS(200, returnValue);
        } catch (error) {
          const {message = ''} = error || {};

          return getResponseWithCORS(500, {message});
        }
      } else {
        return getResponseWithCORS(404, {message: 'Not Found'});
      }
    } else {
      return getResponseWithCORS(404, {message: 'Not Found'});
    }
  }
};
