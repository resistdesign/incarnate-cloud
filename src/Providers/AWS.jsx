import Incarnate, {SubMapDeclaration} from 'incarnate';
import ParseCookies from 'cookie';
import toCamelCase from 'lodash.camelcase';
import ServiceResponse from '../Utils/ServiceResponse';
import {
  DEP_NAMES,
  METHODS,
  PATH_DELIMITER
} from './Constants';
import {
  getCleanHttpMethod,
  getCleanPathParts,
  getCORSHeaders,
  getMethodNameIsPrivate,
  getResponse
} from './Utils';

/**
 * Create an Incarnate managed Lambda handler.
 * @param {Object} config
 * @param {Object} config.incarnateConfig The incarnate configuration object.
 * @param {Array.<string>} config.allowedPaths A SECURITY measure to prevent access of values and methods outside of services.
 * @param {Object} config.allowedOrigin The allowed CORS origin returned to `OPTIONS` requests.
 * @param {number} config.dependencyResolutionTimeoutMS The maximum number of milliseconds allotted for resolving service dependencies. Default: 300000 (5 minutes)
 *
 * @returns {Function} The Lambda handler.
 * */
export default ({
                  incarnateConfig = {},
                  allowedPaths = [],
                  allowedOrigin = '',
                  dependencyResolutionTimeoutMS = 300000
                } = {}) => {
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
            },
            [DEP_NAMES.EVENT]: {
              factory: () => event
            },
            [DEP_NAMES.CONTEXT]: {
              dependencies: {
                event: DEP_NAMES.EVENT
              },
              factory: ({event: {requestContext = {}} = {}} = {}) => requestContext
            },
            [DEP_NAMES.IDENTITY]: {
              dependencies: {
                context: DEP_NAMES.CONTEXT
              },
              factory: ({context: {identity = {}} = {}} = {}) => identity
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
          data,
          error: directError,
          source: {
            error: {
              message: sourceMessage
            } = {},
            path,
            causePath
          } = {}
        } = error || {};
        const responseData = error instanceof ServiceResponse ?
          error :
          (
            directError instanceof ServiceResponse ?
              directError :
              {
                message,
                data,
                source: {
                  message: sourceMessage,
                  path,
                  causePath
                }
              }
          );
        const {statusCode = 500} = responseData;

        return getResponseWithCORS(statusCode, responseData);
      }

      const camelCaseMethodName = toCamelCase(methodName);
      const {[camelCaseMethodName]: serviceMethod} = serviceInstance;

      if (serviceMethod instanceof Function) {
        try {
          const returnValue = await serviceMethod(...args);
          const returnValueAsObject = returnValue instanceof Object ? returnValue : {};
          const {statusCode = 200} = returnValueAsObject;

          return getResponseWithCORS(statusCode, returnValue);
        } catch (error) {
          const errorAsObject = error instanceof Object ? error : {};
          const {statusCode = 500} = errorAsObject;

          return getResponseWithCORS(statusCode, error);
        }
      } else {
        return getResponseWithCORS(404, {message: 'Not Found'});
      }
    } else {
      return getResponseWithCORS(404, {message: 'Not Found'});
    }
  }
};
