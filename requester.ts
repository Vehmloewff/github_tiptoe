import { asyncUtils } from './deps.ts'

export type GithubRequestListener = (response: Response) => void

export interface GithubRequesterParams {
	onStatusChange(status: string): void
}

/** Sends github requests while staying within rate limits */
export class GithubRequester {
	#params: GithubRequesterParams
	#queue: Request[] = []
	#listeners = new Map<Request, GithubRequestListener>()
	#rateLimitResetTime: number | null = null
	#isDriving = false

	constructor(params: GithubRequesterParams) {
		this.#params = params
	}

	onRequestCompletion(request: Request, fn: GithubRequestListener): void {
		this.#listeners.set(request, fn)
	}

	addToQueue(request: Request): void {
		this.#queue.push(request)
		this.#drive()
	}

	async fetch(request: Request): Promise<Response> {
		const response = new Promise<Response>((resolve) => {
			this.onRequestCompletion(request, resolve)
		})

		this.addToQueue(request)

		return await response
	}

	#updateStatus(status: string) {
		this.#params.onStatusChange(status)
	}

	async #drive(): Promise<void> {
		// We only want one driver
		if (this.#isDriving) return

		const request = this.#queue[0]
		if (!request) return

		// Start our async driving
		this.#isDriving = true

		await this.#delayUntilReset()

		this.#updateStatus(`Fetch ${request.url}`)
		const response = await fetch(request)

		// Finish our async driving
		this.#isDriving = false

		// If, after all that work, we still got rate limited, just wait till the reset (or 30 seconds) 30 seconds and retry
		if (response.status === 403) {
			this.#rateLimitResetTime = Date.now() + 30 * 1000
			this.#searchForRateCeiling(response)

			this.#updateStatus(`Rate limited for ${request.url}`)
			return await this.#drive()
		}

		this.#notifyOfResponse(request, response)

		this.#queue.shift()
		await this.#drive()
	}

	#notifyOfResponse(request: Request, response: Response) {
		const listener = this.#listeners.get(request)
		if (!listener) return

		listener(response)
	}

	#searchForRateCeiling(response: Response): void {
		const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
		const rateLimitResetTime = response.headers.get('x-ratelimit-reset')

		if (!rateLimitRemaining || !rateLimitResetTime) return

		const rateLimitRemainingCount = parseInt(rateLimitRemaining)
		if (rateLimitRemainingCount > 2) return

		const resetTime = parseInt(rateLimitResetTime)
		if (isNaN(resetTime)) throw new Error(`Could not parse reset header: ${rateLimitResetTime}`)

		this.#rateLimitResetTime = resetTime * 1000 + 5000 // Github time is in seconds, but we track milliseconds. Additionally, we want to wait fix seconds longer just to be safe
	}

	async #delayUntilReset(): Promise<void> {
		if (!this.#rateLimitResetTime) return

		const timeUntilReset = this.#rateLimitResetTime - Date.now()
		if (timeUntilReset < 0) return

		const minsToWait = Math.round(timeUntilReset / (1000 * 60))
		this.#updateStatus(`Waiting for rate limit to reset. Continuing in ${minsToWait}min${minsToWait === 1 ? '' : 's'}`)

		await asyncUtils.delay(timeUntilReset)
	}
}
