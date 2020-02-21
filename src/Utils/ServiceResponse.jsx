export default class ServiceResponse {
  /**
   * @type {number}
   * */
  statusCode = 400;

  /**
   * @type {*}
   * */
  data;

  /**
   * @type {Object.<string>}
   * */
  headers;

  /**
   * @type {Object}
   * */
  other;

  constructor(statusCode = 400, data, headers = {}, other = {}) {
    this.statusCode = statusCode;
    this.data = data;
    this.headers = headers;
    this.other = other;
  }

  toJSON = () => this.data;
}
