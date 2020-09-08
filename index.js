const debug = require('debug')('aws-api-read-stream')
const { Readable, finished } = require('stream')

const STOPPED = 'stopped'
const READING = 'reading'
const DONE = 'done'

class AWSApiReadStream extends Readable {
	constructor(fn, opts, nextToken) {
		super({ ...opts, objectMode: true })

		this._fn = fn
		this._nextToken = nextToken
		this._state = STOPPED
	}

	_read(size) {
		if (this._state === READING) return
		debug('_read', size, 'nextToken', this._nextToken)
		this._execApiCall()
	}

	async _execApiCall() {
		this._state = READING
		try {
			const res = await this._fn(this._nextToken)
			
			if (!res) {
				this._apiExecutionDone()
				return
			}

			if (this._isInBufferMode()) {
				this._buffer.push(res)
			}

			this._nextToken = res.NextToken || res.NextContinuationToken

			if (!this._nextToken) {
				this._apiExecutionDone()
				return
			}

			if (!this.push(res)) {
				this._state = STOPPED
				return
			}

			this._execApiCall()
		} catch (e) {
			this.destroy(e)
		}
	}

	_apiExecutionDone() {
		this._state = DONE
		this._nextToken = undefined
		this.push(null)
	}

	stop() {
		this._stop = true
		this.destroy()
	}

	static from(fn, { nextToken, options } = {}) {
		return new AWSApiReadStream(fn, options, nextToken)
	}

	// can probably come up with a better name...
	// also, not sure if I should also use this.push in _read
	// while in this mode...
	readAll() {
		this._buffer = []
		return new Promise((res, rej) => {
			this.resume()
			finished(this, err => {
				if (err) return rej(err)
				res(this._buffer)
			})
		})
	}

	_isInBufferMode() {
		return Array.isArray(this._buffer)
	}
}

module.exports = AWSApiReadStream