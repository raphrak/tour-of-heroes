const express = require('express')
const path = require('path')
var enforce = require('express-sslify')
var compression = require('compression')
var helmet = require('helmet')
const PORT = process.env.PORT || 5000

let app = express()

if (process.env.FORCE_SSL === 'true') {
  app.use(enforce.HTTPS({ // eslint-disable-line new-cap
      trustProtoHeader: true
  }))
}

app.use(helmet.contentSecurityPolicy({
  'directives': {
      'scriptSrc': [
          '\'self\'',
          'blob:',
          '\'unsafe-eval\'',
          '*.cdn.pubnub.com'
      ],
      'frame-ancestors': ['\'self\'']
  }
}))
app.use(helmet.frameguard({
  action: 'sameorigin'
}))
app.use(compression())
app.use(express.static(path.join(__dirname, 'dist')));
app.get('/*', (req,res) => { res.sendFile(path.join(__dirname+'/dist/index.html')) })
app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
