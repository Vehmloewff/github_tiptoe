import { dtils } from './deps.ts'
import { GithubRequester } from './requester.ts'

export interface GithubSearchedRepo {
	id: number
	node_id: string
	name: string
	full_name: string
	owner: {
		name: string | null
		email: string | null
		login: string
		id: number
		node_id: string
		avatar_url: string
		gravatar_id: string | null
		url: string
		html_url: string
		followers_url: string
		following_url: string
		gists_url: string
		starred_url: string
		subscriptions_url: string
		organizations_url: string
		repos_url: string
		events_url: string
		received_events_url: string
		type: string
		site_admin: boolean
		starred_at: string
	}
	private: boolean
	html_url: string
	description: string | null
	fork: boolean
	url: string
	created_at: string
	updated_at: string
	pushed_at: string
	homepage: string | null
	size: number
	stargazers_count: number
	watchers_count: number
	language: string | null
	forks_count: number
	open_issues_count: number
	master_branch: string
	default_branch: string
	score: number
	forks_url: string
	keys_url: string
	collaborators_url: string
	teams_url: string
	hooks_url: string
	issue_events_url: string
	events_url: string
	assignees_url: string
	branches_url: string
	tags_url: string
	blobs_url: string
	git_tags_url: string
	git_refs_url: string
	trees_url: string
	statuses_url: string
	languages_url: string
	stargazers_url: string
	contributors_url: string
	subscribers_url: string
	subscription_url: string
	commits_url: string
	git_commits_url: string
	comments_url: string
	issue_comment_url: string
	contents_url: string
	compare_url: string
	merges_url: string
	archive_url: string
	downloads_url: string
	issues_url: string
	pulls_url: string
	milestones_url: string
	notifications_url: string
	labels_url: string
	releases_url: string
	deployments_url: string
	git_url: string
	ssh_url: string
	clone_url: string
	svn_url: string
	forks: number
	open_issues: number
	watchers: number
	topics: string[]
	mirror_url: string | null
	has_issues: boolean
	has_projects: boolean
	has_pages: boolean
	has_wiki: boolean
	has_downloads: boolean
	has_discussions: boolean
	archived: boolean
	disabled: boolean
	visibility: string
	license: {
		key: string
		name: string
		url: string | null
		spdx_id: string | null
		node_id: string
		html_url: string
	} | null
	permissions: {
		admin: boolean
		maintain: boolean
		push: boolean
		triage: boolean
		pull: boolean
	}
	text_matches: Array<{
		object_url: string
		object_type: string | null
		property: string
		fragment: string
		matches: Array<{
			text: string
			indices: number[]
		}>
	}>
	temp_clone_token: string
	allow_merge_commit: boolean
	allow_squash_merge: boolean
	allow_rebase_merge: boolean
	allow_auto_merge: boolean
	delete_branch_on_merge: boolean
	allow_forking: boolean
	is_template: boolean
	web_commit_signoff_required: boolean
}

export type GithubSearchSort = 'stars' | 'forks' | 'help-wanted-issues' | 'updated' | 'best-match'
export type GithubSearchOrder = 'asc' | 'desc'

export interface SearchGithubParams {
	/** How the search results are to be sorted. Default is `best-match` */
	sort?: GithubSearchSort

	/** How the search results are to be ordered. Default is `desc` */
	order?: GithubSearchOrder

	/** The number of repos to search for. This number is only contributed to when `handleResult` returns true, not when it returns `false` */
	limit?: number

	/** Called anytime that a repo is discovered. Return `true` if the call should count towards our limit */
	handleResult(repo: GithubSearchedRepo): Promise<boolean> | boolean

	/**
	 * Called every time that limit is contributed to, which is really every time that `handleResult` is called and returns `true`.
	 * If the search runs out of results before `limit` is reached, this function will still be called `limit` times. */
	onTick?(): void

	/** Called directly. `limit` is the number of ticks that will occur, even if there aren't that many results */
	onPlan?(limit: number): void

	/** Gives a human-readable of description of the status of the operation */
	onStatusChange?(status: string): void
}

export async function searchGithub(query: string, params: SearchGithubParams): Promise<void> {
	const limit = params.limit ?? 500
	const sort = params.sort ?? 'best-match'
	const order = params.order ?? 'desc'
	const searcher = new GithubRequester({
		onStatusChange: params.onStatusChange,
	})

	if (params.onPlan) params.onPlan(limit)

	let resultsReceived = 0
	let currentPage: GithubSearchedRepo[] = []
	let nextPageLink: string | null = buildFirstLink()

	while (true) {
		if (resultsReceived >= limit) break

		const repo = await getNextRepo()
		if (!repo) break

		const repoIsGood = await params.handleResult(repo)
		if (!repoIsGood) continue

		resultsReceived++
		if (params.onTick) params.onTick()
	}

	while (resultsReceived < limit) {
		resultsReceived++
		if (params.onTick) params.onTick()
	}

	async function getNextRepo(): Promise<GithubSearchedRepo | null> {
		// If we have a current page already, just get the next repo from it
		if (currentPage.length) return currentPage.shift()!

		// So we must not have a current page. Additionally, there isn't a next page. We have reached the end of our results.
		if (!nextPageLink) return null

		// Fetch another page. This function sets `currentPage` and `nextPageLink`
		await fetchPage()

		// If there are no results in the just fetch page, we are at the end. This should really never happen, but it will
		// cause an infinite loop if it does happen, this check is in here for good measure
		if (!currentPage.length) return null

		// Then, because know we have results now, get the first repo in those results
		return currentPage.shift()!
	}

	function buildFirstLink() {
		const searchParams = new URLSearchParams()
		searchParams.append('q', query)
		searchParams.append('order', order)

		// best-match is default, but the default will only be triggered if sort is unset
		if (sort !== 'best-match') searchParams.append('sort', sort)

		return `https://api.github.com/search/repositories?${searchParams.toString()}`
	}

	function extractNextPageLink(headers: Headers) {
		const link = headers.get('link')
		if (!link) return null

		const linkItems = link.split(',')
		const nextLink = linkItems
			.map((item) => {
				const [rawLink, rel] = item.split(';').map((text) => text.trim())

				if (!rawLink.startsWith('<') && !rawLink.endsWith('>')) throw new Error('Expected link to be enclosed in brackets')
				const link = rawLink.slice(1, -1)
				const isNext = rel.includes('next')

				return { link, isNext }
			})
			.find((item) => item.isNext)

		if (!nextLink) return null

		return nextLink.link
	}

	async function fetchPage() {
		if (params.onStatusChange) params.onStatusChange('Fetching a new page of results from github')

		const response = await dtils.retryFailures(async () => {
			if (!nextPageLink) throw new Error('Cannot fetch next page because there\'s not a nextLink')

			const response = await searcher.fetch(new Request(nextPageLink))
			if (!response.ok) throw new Error(`Failed to fetch github response page: ${dtils.jsonEncode(await response.json(), '\t')}`)

			return response
		})

		nextPageLink = extractNextPageLink(response.headers)
		currentPage = new dtils.SafeUnknown(await response.json()).asObject().get('items').asArray().data as GithubSearchedRepo[]
	}
}
