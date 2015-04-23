let http = require('http')
let request = require('request')
let fs = require('fs')
let argv = require('yargs')
  .default('host', '127.0.0.1')
  .argv

let scheme = 'http://'
let port = argv.port || argv.host === '127.0.0.1' ? 8000 : 80
let destinationUrl = argv.url || scheme + argv.host + ':' + port
let outputStream = argv.logFile ? fs.createWriteStream(argv.logFile) : process.stdout

// echo server
http.createServer((req, res) => {
  req.pipe(res)
  for (let header in req.headers) {
    res.setHeader(header, req.headers[header])
  }
}).listen(8000)

// proxy server
http.createServer((req, res) => {
  let url = destinationUrl
  if (req.headers['x-destination-url']) {
    url = req.headers['x-destination-url']
    delete req.headers['x-destination-url']
  } else {
    url = destinationUrl + req.url
  }

  let options = {
    method: req.method,
    headers: req.headers,
    url: url
  }

  outputStream.write('\n\n\n' + JSON.stringify(req.headers) + '\n')
  req.pipe(outputStream)

  let downstreamResponse = req.pipe(request(options))
  downstreamResponse.pipe(outputStream)
  downstreamResponse.pipe(res)
}).listen(8001)

