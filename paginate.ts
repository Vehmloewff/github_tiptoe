export interface GithubEndpoint<Input, Output> {
	buildRequest(inputs: Input, nextLink: string | null): Request
	presentResponse(response: Response): Output
}

export class RepoSearch implements GithubEndpoint {
	formatResponse() {
		const request: Request
	}
}

export class Paginator<Input, Output> implements AsyncIterable<Output> {
	#tiptoe: Tiptoe
	#endpoint: GithubEndpoint<Input, Output>
	#params: Input

	constructor(tiptoe: Tiptoe, endpoint: GithubEndpoint<Input, Output>, params: Input) {
		this.#tiptoe = tiptoe
		this.#endpoint = endpoint
		this.#params = params
	}

	[Symbol.asyncIterator](): AsyncIterator<Output> {
		return {
			async next() {
				return { value: 'd', done: false }
			},
		}
	}
}

export class RateLimitsManager {
}

export class Tiptoe {
	async fetch<Input, Output>(endpoint: GithubEndpoint<Input, Output>, params: Input): Promise<Output> {}

	paginate<Input, Output>(endpoint: GithubEndpoint<Input, Output>, params: Input): Paginator<Input, Output> {
		return new Paginator(this, endpoint, params)
	}
}
