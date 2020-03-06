import {parse as ParseURL} from 'url';
import {getRequestResponse} from './Common';

/**
 * Create an Incarnate managed Google Cloud Function handler.
 * @param {Object} config
 * @param {Object} config.incarnateConfig The incarnate configuration object.
 * @param {Array.<string>} config.allowedPaths A SECURITY measure to prevent access of values and methods outside of services.
 * @param {string|string[]|RegExp|RegExp[]|AllowedOriginProcessor|AllowedOriginProcessor[]} config.allowedOrigin The allowed CORS origin returned to `OPTIONS` requests.
 * @param {number} config.dependencyResolutionTimeoutMS The maximum number of milliseconds allotted for resolving service dependencies. Default: 300000 (5 minutes)
 *
 * @returns {Function} The Google Cloud Function handler.
 * */
export default ({
                  incarnateConfig = {},
                  allowedPaths = [],
                  allowedOrigin = '',
                  dependencyResolutionTimeoutMS = 300000
                } = {}) => {
  return async (req = {}, res) => {
    const {
      method: httpMethod = 'POST',
      headers = {},
      url = '',
      rawBody: bodyString = '[]'
    } = req;
    const {
      pathname: path = ''
    } = ParseURL(url);
    const {
      statusCode = 200,
      headers: responseHeaders = {},
      body = ''
    } = await getRequestResponse({
      incarnateConfig,
      allowedPaths,
      allowedOrigin,
      dependencyResolutionTimeoutMS,
      event: req,
      httpMethod,
      headers,
      multiValueHeaders: {},
      path,
      bodyString
    });

    // Set each header on the response.
    Object
      .keys(responseHeaders)
      .forEach(k => res.set(k, responseHeaders[k]));

    res
      .status(statusCode)
      .send(body);
  }
};
