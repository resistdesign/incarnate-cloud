import expect from 'expect.js';
import {AWS} from './index.jsx';
import MockAPIGatewayEvent from '../Mock Data/AWS/Mock API Gateway Event';

module.exports = {
  AWS: {
    'Should return a response': async () => {
      const cloudFunction = AWS(
        {
          subMap: {
            package: {
              subMap: {
                service: {
                  factory: () => {
                    return {
                      method: a1 => a1
                    };
                  }
                }
              }
            }
          }
        },
        [
          '/package/service/method'
        ],
        'http://example.com'
      );
      const {
        body: responseBody
      } = await cloudFunction(MockAPIGatewayEvent);

      expect(responseBody).to.be.a('string');

      const parsedResponseBody = JSON.parse(responseBody);

      expect(parsedResponseBody).to.be.a('string');
      expect(parsedResponseBody).to.equal('Arguments in JSON');
    },
    'should return asynchronous dependency errors': async () => {
      const errorMessage = 'X_FAILED';
      const cloudFunction = AWS(
        {
          subMap: {
            config: {
              subMap: {
                x: {
                  factory: async () => {
                    throw new Error(errorMessage);
                  }
                }
              }
            },
            package: {
              shared: {
                config: 'config'
              },
              subMap: {
                service: {
                  dependencies: {
                    x: 'config.x'
                  },
                  strict: true,
                  factory: () => {
                    return {
                      method: a1 => a1
                    };
                  }
                }
              }
            }
          }
        },
        [
          '/package/service/method'
        ],
        'http://example.com'
      );
      const result = await cloudFunction(MockAPIGatewayEvent);
      const {
        statusCode,
        body: responseBody = 'undefined'
      } = result || {};
      const {
        source: {
          message: sourceMessage
        } = {}
      } = JSON.parse(responseBody) || {};

      expect(statusCode).to.be(500);
      expect(sourceMessage).to.be(errorMessage);
    }
  }
};
