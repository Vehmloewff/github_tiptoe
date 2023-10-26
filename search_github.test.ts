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
