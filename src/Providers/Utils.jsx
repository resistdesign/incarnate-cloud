// SECURITY: Don't call private methods on services.
import {PATH_DELIMITER} from './Constants';

export const getMethodNameIsPrivate = (methodName = '') => methodName.charAt(0) === '_';

export const getCleanPathParts = (path = '') => path
  .split(PATH_DELIMITER)
  .filter(p => !!p);

export const getResponse = (statusCode = 200, value = undefined, headers = {}) => ({
  statusCode,
  headers: typeof value === 'undefined' ? {...headers} : {'Content-Type': 'application/json', ...headers},
  body: typeof value === 'undefined' ? '' : JSON.stringify(value, null, '  ')
});

export const getCORSHeaders = (clientOrigin = '') => ({
  'Access-Control-Allow-Origin': clientOrigin,
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS, HEAD, GET, POST, PUT, PATCH, DELETE',
  'Access-Control-Allow-Credentials': 'true'
});

export const getCleanHttpMethod = (method = 'POST') => `${method}`.toUpperCase();
