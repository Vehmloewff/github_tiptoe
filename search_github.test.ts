import { asserts } from './deps.ts'
import { searchGithub } from './search_github.ts'

Deno.test('searchGithub searches github to a limit', async () => {
	const repos: string[] = []
	let iteration = 0

	await searchGithub('language:TypeScript', {
		limit: 100,
		handleResult(repo) {
			iteration++

			if (iteration % 3 == 0) return false

			repos.push(repo.full_name)
			return true
		},
	})

	asserts.assertEquals(repos.length, 100)
})

Deno.test('We always tick to `limit`, regardless of how many results there are', async () => {
	let tickCalledCount = 0

	await searchGithub('some impossible query', {
		limit: 100,
		handleResult() {
			return true
		},
		onTick() {
			tickCalledCount++
		},
		onStatusChange: console.log,
	})

	asserts.assertEquals(tickCalledCount, 100)
})
