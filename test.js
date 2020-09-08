const test = require('ava')
const AWSApiReadStream = require('./index')
const tokens = 'abcdefghij'.split('')

test('AWSApiReadStream', async t => {
	const testapi = new TestAPI()
	const stream = AWSApiReadStream.from(nextToken => testapi.anAPICall(nextToken))

	let count = 0

	for await (const { data, NextToken } of stream) {
		t.is(data, count)
		count++
	}

	t.deepEqual(testapi.spy, [
		{ nextToken: undefined, data: 0 },
		{ nextToken: 'a', data: 1 },
		{ nextToken: 'b', data: 2 },
		{ nextToken: 'c', data: 3 },
		{ nextToken: 'd', data: 4 },
		{ nextToken: 'e', data: 5 },
		{ nextToken: 'f', data: 6 },
		{ nextToken: 'g', data: 7 },
		{ nextToken: 'h', data: 8 },
		{ nextToken: 'i', data: 9 },
		{ nextToken: 'j', data: 10 }
	])
})

test('AWSApiReadStream - initialize with existing token', async t => {
	const testapi = new TestAPI()
	const stream = AWSApiReadStream.from(nextToken => testapi.anAPICall(nextToken), { nextToken: 'f' })

	// can't think of a better way to test this other than check internals...
	t.is(stream._nextToken, 'f')
})

test('AWSApiReadStream - returning null or undefined will stop execution', async t => {
	const testapi = new TestAPI()
	const stream = AWSApiReadStream.from(nextToken => nextToken === 'b' ? null : testapi.anAPICall(nextToken))

	const results = []
	for await (const { data, NextToken } of stream) {
		results.push(data)
	}
	t.deepEqual(results, [0, 1])
})

test.skip('AWSApiReadStream - backpressure', async t => {

})

class TestAPI {
	constructor() {
		this._counter = 0
		this.spy = []
	}

	anAPICall(nextToken) {
		this.spy.push({ nextToken, data: this._counter })
		return new Promise(res => {
			setImmediate(() => {
				res({
					NextToken: tokens[this._counter],
					data: this._counter++
				})
			})
		})
	}
}