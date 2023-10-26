# Github Tiptoe

Tiptoe around Github request limits and pagination to download and search for repositories.

Originally designed for the use case of downloading the 500 most popular PHP projects.

## Usage

Searching for Github repositories is pretty straightforward. Simply call `searchGithub` with a search query and a `handleResult` callback
parameter.

`handleResult(repo)` must return a boolean, which if true, accounts the call as contributing to `limit`. In other words, once `true` is
returned (`limit`) times, `searchGithub` will resolve.

```ts
await searchGithub('language:TypeScript', {
	limit: 500,
	sort: 'stars',
	handleResult(repo) {
		console.log(`Found repo ${repo.full_name}`)

		return true // Count this repository as contributing to the limit
	},
})
```

Downloading a repository is even simpler:

```ts
const downloader = new RepoDownloader()

await downloader.download({ user: 'Vehmloewff', repo: 'github_tiptoe', destinationDir: 'fixture/repo' })
```

## Tracking Progress

Because both downloading a repo and searching github can take a while, an `onStatusChange(status: string)` callback can be passed along. It
will called with `status` as a human readable description of what is currently being done.

```ts
searchGithub({
	// ...

	onStatusChange(status) {
		console.log('No need to fret. We\'re working or butts right now.', status)
	},
})

const downloader = new RepoDownloader({
	onStatusChange(status) {
		// ...
	},
})
```

Additionally, `searchGithub` will call the `onPlan` and `onTick` callback parameters if they are supplied.

```ts
searchGithub('...', {
	// ...
	onPlan(limit) {
		// Called synchronously after `searchGithub`
		// `limit` is the number of times that `onTick` will be called. It is going to be either `params.limit`, or if not specified, the internal limit
	},
	onTick() {
		// Called every time a new repo is found and accepted by `handleResult`
		// No matter how many results are received, this function will always be called `limit` (the limit passed in to `onPlan`) times
	},
})
```

## Contributing

```shell
# fork and clone repo
deno test -A --watch

# Before committing, run
deno fmt
```
