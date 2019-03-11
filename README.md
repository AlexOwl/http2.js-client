# http2.js-client

# ❓ Why?

NodeJS http2 implementation uses [binding to C++ lib](https://github.com/nodejs/node/blob/3ad8f6123640ae82b1c4840e7184c36650a7b64d/lib/internal/http2/core.js#L125), it is not even exported to user land

[http2.js](https://npmjs.com/package/http2.js) is custom http2 implementation, pure coded using js and gives you access to frames, flow and other http2 advantages

You can also track (and modify) tcp packets ([NodeJS does not allow](https://github.com/nodejs/node/blob/3ad8f6123640ae82b1c4840e7184c36650a7b64d/lib/internal/http2/core.js#L822))

# 💿 Installation

Install peer dependencies ([http2.js](https://npmjs.com/package/http2.js), [http2-client](https://npmjs.com/package/http2-client))

```bat
npm i http2.js http2-client
```

Install module

```bat
npm i htt2.js-client
```

You can use any modules based on peers

```bat
npm i h2-request
```

# 📖 Usage

```js
// first of all, import this module
// it works like patcher
import "http2.js-client";
require("http2.js-client"); // ES5

// then import http2-client or any lib based on http2-client
import { get } from "http2-client";
import request from "h2-request";
```

# 🌈 Module

### This module does not contain any exports

### If you want modify code, just fork [repo](https://github.com/AlexOwl/http2.js-client)

# 📝 License

Released under [MIT license](https://AlexOwl.mit-license.org/)

# 🦉 [Alex Owl](https://github.com/AlexOwl)
