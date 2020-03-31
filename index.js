const { Readable, finished } = require('stream')

class AWSApiReadStream extends Readable {
	constructor(fn, opts) {
		super({ ...opts, objectMode: true })

		this._fn = fn
		this._nextToken = undefined
	}

	async _read(size) {
		try {
			const res = await this._fn(this._nextToken)
			if (this._isInBufferMode()) {
				this._buffer.push(res)
			}

			this.push(res)

			if (res && res.NextToken !== undefined) {
				this._nextToken = res.NextToken
				return
			}

			if (res && res.NextContinuationToken !== undefined) {
				this._nextToken = res.NextContinuationToken
				return
			}

			this.push(null)
		} catch (e) {
			this.destroy(e)
		}
	}

	static from(fn) {
		return new AWSApiReadStream(fn)
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