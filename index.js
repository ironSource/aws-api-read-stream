const { Readable, finished } = require('stream')

class AWSApiReadStream extends Readable {
	constructor(fn, opts, nextToken) {
		super({ ...opts, objectMode: true })

		this._fn = fn
		this._nextToken = nextToken
	}

	async _read(size) {
		let shouldContinue = false
		do {
			try {
				const res = await this._fn(this._nextToken)

				if (!res) {
					this.push(null)
					return
				}

				if (this._isInBufferMode()) {
					this._buffer.push(res)
				}

				shouldContinue = this.push(res)
				this._nextToken = res.NextToken || res.NextContinuationToken

				if (!this._nextToken) {
					this.push(null)
					return
				}

			} catch (e) {
				this.destroy(e)
				return
			}
		} while (shouldContinue)
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