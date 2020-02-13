/**
 * @typedef {Object} HandlerResponse
 * @property {number|string} statusCode The response HTTP status code.
 * @property {Object} headers The headers object.
 * @property {string} body A JSON string representing the return value of a function.
 * */

// SECURITY: Don't call private methods on services.
import {PATH_DELIMITER} from './Constants';
import ServiceResponse from '../Utils/ServiceResponse';

const CLEAN_CONTENT_TYPE_HEADER_NAME = 'content-type';
const JSON_CONTENT_TYPE = 'application/json';

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
  const mergedHeaders = {
    ...baseHeaders,
    ...valueHeaders
  };
  const contentType = Object
    .keys(mergedHeaders)
    .reduce((acc, k) => {
      if (typeof acc !== 'undefined') {
        return acc;
      } else {
        const cleanKey = `${k}`.toLowerCase();

        if (cleanKey === CLEAN_CONTENT_TYPE_HEADER_NAME) {
          return mergedHeaders[k];
        } else {
          return undefined;
        }
      }
    }, undefined);
  const contentIsJSON = typeof contentType === 'string' && contentType.indexOf(JSON_CONTENT_TYPE) !== -1;

  return {
    statusCode,
    headers: mergedHeaders,
    body: typeof value === 'undefined' ?
      '' :
      (
        !!contentIsJSON ?
          // Content is JSON.
          JSON.stringify(value, null, '  ') :
          // Content is NOT JSON.
          value
      )
  };
};

export const getCORSHeaders = (clientOrigin = '') => ({
  'Access-Control-Allow-Origin': clientOrigin,
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS, HEAD, GET, POST, PUT, PATCH, DELETE',
  'Access-Control-Allow-Credentials': 'true'
});

export const getCleanHttpMethod = (method = 'POST') => `${method}`.toUpperCase();
