import {AWS} from '../src';

module.exports = {
  handler: AWS(
    {
      subMap: {
        package: {
          subMap: {
            service: {
              factory: () => {
                return {
                  method: async arg1 => `Received: ${arg1}`
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
    'https://example.com'
  )
};
