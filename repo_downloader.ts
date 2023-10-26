import { pathUtils } from './deps.ts'
import { dtils } from './deps.ts'
import { GithubRequester } from './requester.ts'

export interface DownloadRepoParams {
	user: string
	name: string
	ref: string | null
	destinationDir: string
	fileFilter?(file: string): Promise<boolean> | boolean
	fileMapper?(file: string): string
}

export interface RepoDownloaderParams {
	onStatusChange?(status: string): void
}

export class RepoDownloader {
	#params: RepoDownloaderParams
	#requester: GithubRequester

	constructor(params: RepoDownloaderParams = {}) {
		this.#params = params
		this.#requester = new GithubRequester({ onStatusChange: params.onStatusChange })
	}

	#updateStatus(status: string) {
		if (this.#params.onStatusChange) this.#params.onStatusChange(status)
	}

	async download(params: DownloadRepoParams): Promise<void> {
		const tmpFilePath = await Deno.makeTempFile()
		const tmpDirPath = await Deno.makeTempDir()
		const fullName = `${params.user}/${params.name}`

		this.#updateStatus(`Getting tarball for ${fullName}`)
		const response = await dtils.retryFailures(async () => {
			try {
				const request = new Request(`https://api.github.com/repos/${fullName}/tarball`)
				return await this.#requester.fetch(request)
			} catch (error) {
				this.#updateStatus(`Download of tarball for ${fullName} failed. Retrying shortly`)
				throw error
			}
		})
		if (!response.body) throw new Error('Expected a response body')

		this.#updateStatus(`Download ${fullName}`)
		const tmpFile = await Deno.open(tmpFilePath, { write: true })
		await response.body.pipeTo(tmpFile.writable)

		this.#updateStatus(`Unzip ${fullName}`)
		await dtils.sh(`tar -xf ${tmpFilePath} -C ${tmpDirPath}`)

		this.#updateStatus(`Write ${fullName} to ${params.destinationDir}`)
		const clonedFiles = await dtils.recursiveReadInsideDir(tmpDirPath)

		for (const file of clonedFiles) {
			if (params.fileFilter && !params.fileFilter(file.innerPath)) continue

			const localPath = file.innerPath.split('/').slice(1).join('/') // Remove the extra dir that github creates when zipping
			const path = params.fileMapper ? params.fileMapper(localPath) : localPath

			const text = await dtils.readText(file.path)
			const newPath = pathUtils.join(params.destinationDir, path)
			await dtils.writeText(newPath, text)
		}

		await Deno.remove(tmpFilePath)
		await Deno.remove(tmpDirPath, { recursive: true })
	}
}
