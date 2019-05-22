![Incarnate Logo](/Header.jpg?raw=true "Incarnate")

# Incarnate Cloud

Cloud Function Middleware for Incarnate

## Install

`npm i -S incarnate-cloud`

## API Docs

http://cloud.incarnate.resist.design

## Usage

```js
import {AWS} from 'incarnate-cloud';

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
```
