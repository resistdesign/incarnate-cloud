import {getRequestResponse} from './Common';

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
  return async (event) => {
    const {
      httpMethod = 'POST',
      headers,
      multiValueHeaders,
      path = '',
      body: bodyString = '[]'
    } = event;

    return getRequestResponse({
      incarnateConfig,
      allowedPaths,
      allowedOrigin,
      dependencyResolutionTimeoutMS,
      event,
      httpMethod,
      headers,
      multiValueHeaders,
      path,
      bodyString
    });
  }
};
