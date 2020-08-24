# aws-api-read-stream
Turn an aws api call into a readable stream.

## Install
```
npm i aws-api-read-stream
```

## example

Piping the result of `s3.listObjectsV2()` 

Take care to use `NextToken` or `ContinuationToken` accordingly.

```js
const aws = require('aws-sdk')
const APIStream = require('aws-api-read-stream')
const { promisify } = require('util')
const pipeline = promisify(require('stream').pipeline)

async function main() {
    const s3 = new aws.S3()

    const s = APIStream.from((nextToken) => {
        return s3.listObjectsV2({
            Bucket: 'your-bucket-here',
            ContinuationToken: nextToken
        }).promise()
    })

    // convert the object stream to strings using async generator
    const transform = async function*(source) {
        for await (const chunk of source) {
            yield JSON.stringify(chunk)
        }
    }

    await pipeline(s, transform, process.stdout)
}

main()
```

Keep reading until the stream finishes. This will buffer the results in an internal array

```js
const aws = require('aws-sdk')
const APIStream = require('aws-api-read-stream')
const { promisify } = require('util')
const pipeline = promisify(require('stream').pipeline)

async function main() {
    const s3 = new aws.S3()

    const s = APIStream.from((nextToken) => {
        return s3.listObjectsV2({
            Bucket: 'your-bucket-here',
            ContinuationToken: nextToken
        }).promise()
    })

    const results = await s.readAll()
}

main()
```

Provide `Readable` stream options during initialization.
`objectMode` will always be set to `true`

```js
const aws = require('aws-sdk')
const APIStream = require('aws-api-read-stream')
const { promisify } = require('util')
const pipeline = promisify(require('stream').pipeline)

async function main() {
    const s3 = new aws.S3()

    const s = APIStream.from((nextToken) => {
        return s3.listObjectsV2({
            Bucket: 'your-bucket-here',
            ContinuationToken: nextToken
        }).promise()
    }, { options: { ... your options here } })

    const results = await s.readAll()
}

main()
```

Start with an existing `nextToken`

```js
const aws = require('aws-sdk')
const APIStream = require('aws-api-read-stream')
const { promisify } = require('util')
const pipeline = promisify(require('stream').pipeline)

async function main() {
    const s3 = new aws.S3()

    const s = APIStream.from((nextToken) => {
        return s3.listObjectsV2({
            Bucket: 'your-bucket-here',
            ContinuationToken: nextToken
        }).promise()
    }, { nextToken: '123123' })

    const results = await s.readAll()
}

main()
```