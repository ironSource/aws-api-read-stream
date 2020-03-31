const test = require('ava')
const AWSApiReadStream = require('./index')

test('AWSApiReadStream', async t => {
	const testapi = new TestAPI()
	const stream = new AWSApiReadStream((nextToken) => {
		return testapi.anAPICall(nextToken)
	})

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