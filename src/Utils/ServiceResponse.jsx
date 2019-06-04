export default class ServiceResponse {
  /**
   * @type {number}
   * */
  statusCode = 400;

  /**
   * @type {*}
   * */
  data;

  constructor(statusCode = 400, data) {
    this.statusCode = statusCode;
    this.data = data;
  }

  toJSON = () => this.data;
}
