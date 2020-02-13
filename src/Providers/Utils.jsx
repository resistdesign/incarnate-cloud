/**
 * @typedef {Object} HandlerResponse
 * @property {number|string} statusCode The response HTTP status code.
 * @property {Object} headers The headers object.
 * @property {string} body A JSON string representing the return value of a function.
 * */

// SECURITY: Don't call private methods on services.
import {PATH_DELIMITER} from './Constants';
import ServiceResponse from '../Utils/ServiceResponse';

export const getMethodNameIsPrivate = (methodName = '') => methodName.charAt(0) === '_';

export const getCleanPathParts = (path = '') => path
  .split(PATH_DELIMITER)
  .filter(p => !!p);

/**
 * @returns {HandlerResponse} The handler response object.
 * */
export const getResponse = (statusCode = 200, value = undefined, headers = {}) => {
  const baseHeaders = typeof value === 'undefined' ? {...headers} : {'Content-Type': 'application/json', ...headers};
  const {
    headers: valueHeaders = {}
  } = (value instanceof ServiceResponse ? value : {});

  return {
    statusCode,
    headers: {
      ...baseHeaders,
      ...valueHeaders
    },
    body: typeof value === 'undefined' ? '' : JSON.stringify(value, null, '  ')
  };
};

export const getCORSHeaders = (clientOrigin = '') => ({
  'Access-Control-Allow-Origin': clientOrigin,
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS, HEAD, GET, POST, PUT, PATCH, DELETE',
  'Access-Control-Allow-Credentials': 'true'
});

export const getCleanHttpMethod = (method = 'POST') => `${method}`.toUpperCase();
