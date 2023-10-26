import { asserts, dtils } from './deps.ts'
import { RepoDownloader } from './repo_downloader.ts'
import { convertMapToRecord } from './utils.ts'

interface TestRepo {
	user: string
	name: string
	ref: string
	fileIntegrity: Record<string, string>
}

const testRepos: TestRepo[] = [
	{
		user: 'Vehmloewff',
		name: 'dtils',
		ref: '0f5cbfcff6fd97b074cd5bfa4d3e8d0fa47430e8',
		fileIntegrity: {
			'.github/workflows/ci.yaml': 'eeef24fcecace0d07ce5b0b724a5f8b283bc073338f931b8ae36ceb6044f8d2f',
			'.gitignore': '884a7bf79465af405dc7d01e9486cf1dba45762dd047fb67f1c86c4f3a785c4c',
			'.vscode/settings.json': 'bd5d50d18a0126617702fa6f3d3315ff60f0cc7a30b2bd5661574fb641fc900b',
			'array.ts': '6584135589beeea337ef9077645163fafac607d8d4378b053b7694fe889b8b05',
			'binary.ts': '0bde9b53fec5e643fc7b0220c3f79dce7b36effecca5c80b078df99538e104e8',
			'cache.test.ts': 'abde1d283eddfd7626b9c1a2525d7d90af13554916594b43732a916e9f7c4623',
			'cache.ts': '23c1f19f61ba0c7f1df0cbd6799d4e1bab9cdb7459112983847ffa4b1d102216',
			'cbor.test.ts': '26cb217bb2094e961535e6c10a15e791b9d9183a0a107d4e9f80629c88865939',
			'cbor.ts': '0cd7b04626c13faf0b1bd6cd91ba30063e22ee7b5d1dedf3c446950d148649d2',
			'date.ts': '26e14ef189ba010f9e3646e70cf4b6004bd4391605afa2d880d3f4b9f3d885ec',
			'debug.ts': '5200dde2105951a4af1eecdd9bfb7b4632fd61ce056ec4a8e61db5d8912f3ae7',
			'deno.jsonc': '7c9b55a4112973e89846d15a2f9747aa84b54ffafbd4814b562446b3217702e4',
			'deno.ts': 'f094520f8c9d843dc933353770fa195be611a8f7e7fbc295e53db59bc15ec203',
			'deps.ts': '91171f0f8634d3502d626468865044fb0ba5b64f89dd718743197aa03a0868ca',
			'devops/deps.ts': 'f2d72a55152b8674df4f01dcc24ac1fcb88de79ba92c1d92b25d40b55f48e900',
			'devops/mod.ts': '77c1026c933450662c35a5f7267e3af447343a03e61d25e5093d66bf27e2d3af',
			'encryption.test.ts': 'e79e58478844d79081c81f2579d9b213bb61332d66c3d80f9cb626f5685c916c',
			'encryption.ts': '23eb5f77df462af220f0a33570f4e27b16ed00e0d61c79a35d38b30d4f0d18d7',
			'env.ts': 'ebde4c8a6b3b1997df07832f0b530e625923cdeb0a371373ad1ee6db647e32ae',
			'errors.test.ts': '8ca3022e65ea78c0ec97c938c44517fe7642a8f7a4864576f0e21e4a4ea2d400',
			'errors.ts': 'c00d2d68a186d710c8d2f037a07fb6889aac90060e1fd475a182515546cc6b92',
			'fetch.test.ts': '96361a826f495e2fda91c62c06725b25a31799fee7f12e7671b56bcfb882f2db',
			'fetch.ts': '2e0bfdff493999584bd555ea491da7e98e2cb400a26c45d29647dba7f855c62e',
			'fs.test.ts': '0d200d74e35f4a8d853015bb3e9690125a5512b6fe477ce9a3e7ec54034169ef',
			'fs.ts': '2a93af4925a387ddc359a7f7349c98ef6db6e04d8d7663f74069d24e91fa044d',
			'hash/mod.test.ts': '412d80e001cd5ea1dedf947896ce279cf93dd41a6d6149a71d8caeb61b683bf4',
			'hash/mod.ts': '1181074c14a16722761d523bcfa1fb4af3647deaaae4b66f2583f39976027988',
			'hash/spark_md5.d.ts': 'a303b0234a82cffabfb28307f3b7b70436512770a7e7a303f80c3b4cac2b1097',
			'hash/spark_md5.js': 'beb93741bdc6836f8096d022187feeb7222308a032a55fcffc7e3ce5c8687897',
			'http.ts': '0397ccdecc44c6f13a73739d93dc986a4edcd700f160b1bc655c2fd5c23ef2b3',
			'json.test.ts': 'dcdc8da34d52dd09c8c40e36243b04d968822311d9911cc57857c2b15d8df62e',
			'json.ts': '2324d671c0dc6150edd9b95b17e46bbb2d707d528c31626f213ac0ab2b7d39ea',
			'jwt.ts': '3f99eeba7a9b8ac3cc4ba4ba9412696f54a244bca2006cb50c03558869c0c283',
			'logger.ts': '9b9ff655c6e426452effbf77d0ae2cd46fee854dea21755b10dce3032723d948',
			'loop.ts': '81fb943b4518b10280ef992d71ddf50dad77bc06262db9a78ef22e6670bd6056',
			'mod.test.ts': '87920c9c17a172d569c15f6c3af76d9dd1bec40af5abf055f4b73b9e6ea5a4a9',
			'mod.ts': 'd42ae14ead18307b46fd083c99dad260a39f12ffc65fdb473902c2780267a28a',
			'mod.unstable.ts': '2b198b28624ec23c0e622565cae72e0157bdd0714cb26cd46048174580022692',
			'number.ts': 'a279dd2dfcf49f1680b8d8beddb4d708b1a0d240d206c0a63c335b73bd418d93',
			'path.ts': '7b75c43b13c8a222225550d6fc6fea7d8661dac8ecc690b476aeadea1d416460',
			'promise.ts': 'ecdb46523f87ba61ba16baac8e1d0552597a7b0d3a55fabd7dd813df9885ddcc',
			'random.ts': 'd2f24135ddd8d7536d5ab5fe18bc24118062a68ff16f14c2f40b132e6be6e582',
			'readme.md': 'f05b3f481cb74d75b88761157e05f15f341ea5f8b11e35f24b6212a9dbfa49ff',
			'record.ts': '8ab0b7238f73b80a63e84d5a7eef13b237356d1c5658b0ed2bc712747379083a',
			'regex.ts': '3a1e7ea2f9251a04d2b180f90c0678320c79aa05a0b94da658871385d01c5ff1',
			'safe_unknown.test.ts': '8d1904cec9d3e4c2917fc960a8e55342247aa012af67f7fc9aaae0040e82f67f',
			'safe_unknown.ts': '463d956416116e41849a27222592d06eca13913b47b26280908139454629e52d',
			'sh.test.ts': '66107558e194996ac667a8257ceea6fc78cb5f6037e517fa6a28902cc86d97d3',
			'sh.ts': '5549449babc6ec5aa00ef1a50014e84b3472fba317f9eb38cc20118fd5d6bb09',
			'stream.test.ts': 'd90800b864acff0053ce5d14ac2047efbb6d08d734e7200aefce2b095fdd3ac1',
			'stream.ts': '2371370be62d27c8ba864c12e124c3e525b05f52a1eb825631aadbbdcaf6e5ec',
			'string.test.ts': 'bab0330a1f021ed7d8c8f25608bced4449fb57474a6d64959f688a02e8db77c9',
			'string.ts': '1ee4dde553574f80a5e25b481382790281dc7bb842ae64fdcd35d99c1daa78b3',
		},
	},
	{
		user: 'Vehmloewff',
		name: 'brave_binary',
		ref: '9750dab022aaa3333159757de966a4500a6ca52d',
		fileIntegrity: {
			'.github/workflows/ci.yaml': 'eeef24fcecace0d07ce5b0b724a5f8b283bc073338f931b8ae36ceb6044f8d2f',
			'.gitignore': 'e7d87b738825c33824cf3fd32b7314161fc8c425129163ff5e7260fc7288da36',
			'.vscode/settings.json': 'bd5d50d18a0126617702fa6f3d3315ff60f0cc7a30b2bd5661574fb641fc900b',
			'deno.jsonc': 'f7fee4a67de0a876e8cab1998e266db7d64cf77c4cb6efca50f7b0e801cd089c',
			'deno.lock': 'ddc6cdece599a8b69596c38956da381be1dd756d4364fda34e3b9f39bf6054b0',
			'deps.ts': '8875eca44bd6044dd456bd696aa4802634e9ea67266701e3fa6ea0f73d5eff3e',
			'devops/deps.ts': 'bfa6084dc0acd8e71e2aaf474f70714dbd6197663e025811337077fa55b69fa8',
			'devops/mod.ts': '77c1026c933450662c35a5f7267e3af447343a03e61d25e5093d66bf27e2d3af',
			'download.ts': 'd3388c884941ff5cd04150c1038e6cba7e6be6a28ea1ab1a53bd1c9735ee93d0',
			'mod.test.ts': '0b05c580d01ecbc89061e24d10ffd09cd22678ca0b747aa71496420ad2d7a352',
			'mod.ts': '164e3b614e3f037747dd3ff211451079ec7132ad512e0f28c5fa0b0a1f75c2c2',
			'path.ts': 'c49d9d27888e51060017fede4863f6513f68ebceeeadb5ec6d97ba944324a816',
			'readme.md': '267acacad26357610764eb207f75777237eefa22d79a6b8dae72ec65e25ae260',
		},
	},
]

function buildFileIntegrity(dir: string) {
	const shaReader = async (path: string) => {
		const text = await dtils.readText(path)

		return dtils.Sha256.hash(text)
	}

	return dtils.recursiveReadFiles(dir, shaReader)
}

Deno.test('RepoDownloader downloads some repos', async () => {
	const downloader = new RepoDownloader()

	for (const repo of testRepos) {
		const tempDir = await Deno.makeTempDir()
		await downloader.download({ user: repo.user, name: repo.name, destinationDir: tempDir, ref: repo.ref })

		const files = await buildFileIntegrity(tempDir)
		asserts.assertEquals(convertMapToRecord(files), repo.fileIntegrity)
	}
})
