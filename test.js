const test = require('ava')
const AWSApiReadStream = require('./index')

test('AWSApiReadStream', async t => {
	const testapi = new TestAPI()
	const stream = AWSApiReadStream.from(nextToken => testapi.anAPICall(nextToken))

	let count = 0

	for await (const { data, NextToken } of stream) {
		t.is(data, count)

		if (count < 10) {
			t.is(NextToken, count + 1)

			t.is(testapi.nextTokenSpy, count + 1)

		} else {
			t.is(NextToken, undefined)
		}

		count++
	}
})

test('AWSApiReadStream - initialize with existing token', async t => {
	const testapi = new TestAPI()

	let count = 0

	const stream = AWSApiReadStream.from(nextToken => testapi.anAPICall(nextToken), { nextToken: 5 })

	// can't think of a better way to test this other than check internals...
	t.is(stream._nextToken, 5)
})

test('AWSApiReadStream - returning null or undefined will stop execution', async t => {
	const testapi = new TestAPI()
	const stream = AWSApiReadStream.from(nextToken => nextToken === 2 ? null : testapi.anAPICall(nextToken))


	const results = []
	for await (const { data, NextToken } of stream) {
		results.push(data)
	}
	t.deepEqual(results, [0, 1])
})


class TestAPI {
	constructor() {
		this._counter = 0
	}

	anAPICall(nextToken) {
		this.nextTokenSpy = nextToken
		return new Promise(res => {
			setImmediate(() => {
				res({
					data: this._counter,
					NextToken: this._counter < 10 ? ++this._counter : undefined
				})
			})
		})
	}
}