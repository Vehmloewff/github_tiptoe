import { pathUtils } from './deps.ts'
import { dtils } from './deps.ts'
import { GithubRequester } from './requester.ts'

export interface DownloadRepoParams {
	/** The Github user that owns this repository */
	user: string

	/** The name of the repository without the user part */
	name: string

	/** A commit or branch to download. If `null`, the default branch will be used */
	ref: string | null

	/** The directory to download the project into */
	destinationDir: string

	/**
	 * If specified, this function will be called for every file, right before it is written to the disk. If it returns `false`,
	 * the file will not be written */
	fileFilter?(file: string): Promise<boolean> | boolean

	/**
	 * If specified, this function will be called for every file, right before it is written to the disk. Whatever it returns will
	 * be the path that the file is written to. */
	fileMapper?(file: string): Promise<string> | string
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

	/** Download a repository into `destinationDir`. Files can be filtered out with `params.fileFilter` and filenames can be mapped with `params.fileMapper` */
	async download(params: DownloadRepoParams): Promise<void> {
		const tmpFilePath = await Deno.makeTempFile()
		const tmpDirPath = await Deno.makeTempDir()
		const fullName = `${params.user}/${params.name}`

		let url = `https://api.github.com/repos/${fullName}/tarball`
		if (params.ref) url += `/${params.ref}`

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
			const path = params.fileMapper ? await params.fileMapper(localPath) : localPath

			const text = await dtils.readText(file.path)
			const newPath = pathUtils.join(params.destinationDir, path)
			await dtils.writeText(newPath, text)
		}

		await Deno.remove(tmpFilePath)
		await Deno.remove(tmpDirPath, { recursive: true })
	}
}
