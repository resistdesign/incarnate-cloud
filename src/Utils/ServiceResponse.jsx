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

  constructor(statusCode = 400, data, headers = {}) {
    this.statusCode = statusCode;
    this.data = data;
    this.headers = headers;
  }

  toJSON = () => this.data;
}
