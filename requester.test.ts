import { asserts, porter } from './deps.ts'
import { GithubRequester } from './requester.ts'

type Listener<T> = (data: T) => void

class ServerManager {
	#servers: TestServer[] = []

	async create() {
		const server = await TestServer.create()
		this.#servers.push(server)

		return server
	}

	stopAll() {
		for (const server of this.#servers) server.stop()
	}
}

class TestServer {
	#port: number | null = null
	#requestListeners: Listener<Request>[] = []
	#responseListeners: Listener<Response>[] = []
	#abortController = new AbortController()

	static async create() {
		const server = new TestServer()
		await server.start()

		return server
	}

	async #waitForIt<T>(listeners: Listener<T>[]) {
		return await new Promise<T>((resolve) => {
			listeners.push((data) => resolve(data))
		})
	}

	#feed<T>(listeners: Listener<T>[], item: T) {
		const firstListener = listeners.shift()
		if (!firstListener) throw new Error('No listeners are registered')

		return firstListener(item)
	}

	async start() {
		const possiblePort = await porter.getAvailablePort()
		if (!possiblePort) throw new Error('Could not find an available port')

		this.#port = possiblePort

		await new Promise<void>((resolve) => {
			const options: Deno.ServeOptions = {
				port: possiblePort,
				onListen: () => resolve(),
				signal: this.#abortController.signal,
			}

			const handler = async (request: Request): Promise<Response> => {
				this.#feed(this.#requestListeners, request)

				return await this.#waitForIt(this.#responseListeners)
			}

			Deno.serve(options, handler)
		})
	}

	async next() {
		return await this.#waitForIt(this.#requestListeners)
	}

	respond(response: Response) {
		this.#feed(this.#responseListeners, response)
	}

	getPort() {
		if (!this.#port) throw new Error('Cannot get port because server has not been started yet')

		return this.#port
	}

	buildRequest(path: string, options?: RequestInit) {
		const url = new URL(path, `http://localhost:${this.getPort()}`)

		return new Request(url, options)
	}

	stop() {
		this.#abortController.abort()
	}
}

function buildResponse(status: number, data: string, remainingCount: number, resetTime: number) {
	const headers = new Headers({
		'x-ratelimit-remaining': remainingCount.toString(),
		'x-ratelimit-reset': (resetTime / 1000).toString(),
	})

	return new Response(data, { status, headers })
}

function get5SecondsFromNow() {
	return Date.now() + 10 * 1000
}

Deno.test('GithubRequester', async (test) => {
	const serverManager = new ServerManager()
	const responseItems = 'x'.repeat(30).split('').map((_, index) => `Response ${index + 1}`)

	const step = (name: string, fn: () => Promise<void>) =>
		test.step({
			name,
			sanitizeOps: false,
			sanitizeResources: false,
			fn,
		})

	await step('A request sends properly', async () => {
		const server = await serverManager.create()
		const requester = new GithubRequester({ onStatusChange() {} })

		const [_, response] = await Promise.all([
			server.next().then((request) => {
				asserts.assertEquals(new URL(request.url).pathname, '/foo')

				server.respond(buildResponse(200, responseItems[0], 10, get5SecondsFromNow()))
			}),
			requester.fetch(server.buildRequest('/foo')),
		])

		asserts.assertEquals(await response.text(), responseItems[0])
	})

	await step('We never get rate limited', async () => {
		const server = await serverManager.create()
		const requester = new GithubRequester({ onStatusChange() {} })

		let requestsLeft = 0
		let resetTime = 0

		for (const data of responseItems) {
			const handle = async () => {
				const request = await server.next()
				asserts.assertEquals(new URL(request.url).pathname, '/foo')

				if (Date.now() > resetTime) requestsLeft = 10

				resetTime = get5SecondsFromNow()

				if (requestsLeft === 0) {
					throw new Error('Rate limit was hit')
				}

				server.respond(buildResponse(200, data, requestsLeft--, resetTime))
			}

			const [_, response] = await Promise.all([
				handle(),
				requester.fetch(server.buildRequest('/foo')),
			])

			asserts.assertEquals(await response.text(), data)
		}
	})

	serverManager.stopAll()
})
