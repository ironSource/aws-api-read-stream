const { Readable, finished } = require('stream')

class AWSApiReadStream extends Readable {
	constructor(fn, opts, nextToken) {
		super({ ...opts, objectMode: true })

		this._fn = fn
		this._nextToken = nextToken
	}

	async _read(size) {
		try {
			const res = await this._fn(this._nextToken)
			if (res) {
				if (this._isInBufferMode()) {
					this._buffer.push(res)
				}

				this.push(res)

				if (res.NextToken !== undefined) {
					this._nextToken = res.NextToken
					return
				}

				if (res.NextContinuationToken !== undefined) {
					this._nextToken = res.NextContinuationToken
					return
				}
			}

			this.push(null)
		} catch (e) {
			this.destroy(e)
		}
	}

	stop() {
		this._stop = true
		this.destroy()
	}

	static from(fn, { nextToken, options } = {}) {
		return new AWSApiReadStream(fn, options, nextToken)
	}

	// can probably come up with a better name...
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