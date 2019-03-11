import Patcher from 'import-locals'
const patcher = new Patcher(module)
patcher.export('http2-client/lib/request', 'HEADERS_TO_REMOVE')

import {
  HEADERS_TO_REMOVE,
  HttpRequestManager
} from 'http2-client/lib/request'
import { DebounceTimers } from 'http2-client/lib/utils'
import { IncomingResponse, OutgoingRequest } from 'http2.js'
import { Endpoint } from 'http2.js/lib/protocol/endpoint'

import { noopLog } from './noop'

class PatchedClass {
  public static httpCompatibleResponse: Function

  public http2Debouncer: DebounceTimers

  public identifyConnection: Function

  public cachedHTTP1Result: object
  public http2Support: boolean
  public setHttp2Client: Function

  public http2: any

  public _events: any
  public once: Function
  public emit: Function

  public holdConnectionToIdentification (
    clientKey: string,
    requestOptions: any,
    cb: Function
  ) {
    const topic = `identify-${clientKey}`
    if (this._events[topic]) {
      this.once(topic, cb)
      return
    }

    const socket = this.identifyConnection(requestOptions, (type: string) => {
      const options = {
        createConnection () {
          return socket
        }
      }
      if (type === 'h2' && this.http2Support) {
        const endpoint = new Endpoint(noopLog, 'CLIENT' /* settings */)
        endpoint.socket = socket
        endpoint.pipe(endpoint.socket).pipe(endpoint)

        this.setHttp2Client(clientKey, endpoint)
      } else {
        this.cachedHTTP1Result[clientKey] = Date.now()
      }
      cb(options)
      this.emit(topic, options)
    })
  }

  public makeHttp2Request (
    clientKey: string,
    inStream,
    endpoint: Endpoint,
    requestOptions,
    cb
  ) {
    const http2Debouncer = this.http2Debouncer
    http2Debouncer.pause(clientKey)

    const stream = endpoint.createStream()
    const req = new OutgoingRequest(noopLog)

    req.stream = stream
    req.options = requestOptions
    req.endpoint = endpoint

    for (const [name, value] of Object.entries(requestOptions.headers || {})) {
      req.setHeader(name, value)
    }

    const headers = req._headers

    for (const name of HEADERS_TO_REMOVE) delete headers[name]

    if (!headers[':authority']) {
      headers[':authority'] = requestOptions.hostname || requestOptions.host
      if (requestOptions.port) {
        headers[':authority'] += `:${requestOptions.port}`
      }
    }
    if (!headers[':method']) {
      headers[':method'] = (requestOptions.method || 'GET').toUpperCase()
    }
    if (!headers[':path']) {
      headers[':path'] = requestOptions.path || '/'
    }
    if (!headers[':scheme']) {
      headers[':scheme'] = requestOptions.protocol.slice(0, -1) || 'https'
    }
    if (!headers['accept-encoding']) {
      headers['accept-encoding'] = 'gzip'
    }
    if (requestOptions.auth) {
      headers.authorization =
        'Basic ' + Buffer.from(requestOptions.auth).toString('base64')
    }

    requestOptions.headers = headers

    stream.headers(headers)

    inStream.emit('socket', requestOptions.createConnection())

    let maxContentLength = 0
    let currentContent = 0

    stream.on('data', data => {
      currentContent += data.length
      if (currentContent >= maxContentLength) {
        http2Debouncer.unpauseAndTime(clientKey)
      }
    })

    const res = new IncomingResponse(stream)
    res.req = req
    res.once('ready', () => stream.emit('response', res.headers))

    inStream.take(stream)

    const onResponse = $headers => {
      maxContentLength = +$headers['content-length']
      if (isNaN(maxContentLength) || maxContentLength <= 0) {
        http2Debouncer.unpauseAndTime(clientKey)
      }

      HttpRequestManager.httpCompatibleResponse(res, requestOptions, $headers)
      inStream.emit('http1.response', res)
      if (cb) cb(res)
    }

    stream.on('response', Object.assign(onResponse, { http2Safe: true }))

    if (['GET', 'HEAD', 'DELETE'].includes(headers[':method'])) stream.end()
  }
}

if (!HttpRequestManager.$patched) {
  HttpRequestManager.$patched = true
  for (const [name, value] of Object.entries(PatchedClass.prototype)) {
    HttpRequestManager.prototype[name] = value
  }
}
