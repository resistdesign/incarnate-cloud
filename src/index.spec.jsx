import expect from 'expect.js';
import {AWS} from './index.jsx';
import MockAPIGatewayEvent from '../Mock Data/AWS/Mock API Gateway Event';
import {DEP_NAMES} from './Providers/AWS';

module.exports = {
  AWS: {
    'should return a response': async () => {
      const cloudFunction = AWS({
        incarnateConfig: {
          subMap: {
            package: {
              subMap: {
                service: {
                  factory: () => {
                    return {
                      methodName: a1 => a1
                    };
                  }
                }
              }
            }
          }
        },
        allowedPaths: [
          '/package/service/method-name'
        ],
        allowedOrigin: 'http://example.com'
      });
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
      const cloudFunction = AWS({
        incarnateConfig: {
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
                    x: 'config/x'
                  },
                  strict: true,
                  factory: () => {
                    return {
                      methodName: a1 => a1
                    };
                  }
                }
              }
            }
          }
        },
        allowedPaths: [
          '/package/service/method-name'
        ],
        allowedOrigin: 'http://example.com'
      });
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
    },
    'should handle missing strict dependencies gracefully': async () => {
      const cloudFunction = AWS({
        incarnateConfig: {
          subMap: {
            config: {
              subMap: {
                x: {
                  factory: () => undefined
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
                    x: 'config/x'
                  },
                  strict: true,
                  factory: () => {
                    return {
                      methodName: a1 => a1
                    };
                  }
                }
              }
            }
          }
        },
        allowedPaths: [
          '/package/service/method-name'
        ],
        allowedOrigin: 'http://example.com',
        // IMPORTANT: Add a reasonable timeout.
        dependencyResolutionTimeoutMS: 1000
      });
      const result = await cloudFunction(MockAPIGatewayEvent);
      const {
        statusCode,
        body: responseBody = '{}'
      } = result || {};
      const {message} = JSON.parse(responseBody) || {};

      expect(statusCode).to.be(500);
      expect(message).to.be('RESOLUTION_TIMEOUT');
    },
    'should supply request specific built-in dependencies': async () => {
      const getDepPath = p => `${DEP_NAMES.INPUT}/${p}`;
      const cloudFunction = AWS({
        incarnateConfig: {
          subMap: {
            package: {
              shared: {
                [DEP_NAMES.INPUT]: DEP_NAMES.INPUT
              },
              subMap: {
                service: {
                  dependencies: {
                    event: getDepPath(DEP_NAMES.EVENT),
                    context: getDepPath(DEP_NAMES.CONTEXT),
                    identity: getDepPath(DEP_NAMES.IDENTITY)
                  },
                  factory: d => ({
                    methodName: () => d
                  })
                }
              }
            }
          }
        },
        allowedPaths: [
          '/package/service/method-name'
        ],
        allowedOrigin: 'http://example.com',
        // IMPORTANT: Add a reasonable timeout.
        dependencyResolutionTimeoutMS: 1000
      });
      const result = await cloudFunction(MockAPIGatewayEvent);
      const {
        statusCode,
        body: responseBody = '{}'
      } = result || {};
      const {
        event,
        context,
        identity
      } = JSON.parse(responseBody) || {};

      expect(statusCode).to.be(200);

      expect(event).to.be.an(Object);
      expect(event.test).to.be('TEST_EVENT');

      expect(context).to.be.an(Object);
      expect(context.test).to.be('TEST_CONTEXT');

      expect(identity).to.be.an(Object);
      expect(identity.test).to.be('TEST_IDENTITY');
    }
  }
};
