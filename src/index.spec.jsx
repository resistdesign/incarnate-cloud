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
    }
  }
};
