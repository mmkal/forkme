import mimeType from 'mime'
import {unzip} from 'unzipit'
import {GitHubFork} from '@/components/github-fork'

export type Improve = (params: {path: string; content: string; readme: {content: string}}) => Promise<string>
export const addValue: Parameters<typeof GitHubFork>[0]['addValue'] = async ({
  octokit,
  codebase,
  sourceRepo: upstream,
  toast,
  improve,
  requestedForkName,
}) => {
  const {data: upstreamRepo} = await octokit.repos.get({
    owner: upstream.owner,
    repo: upstream.repo,
  })
  const {data: upstreamDefaultBranchRef} = await octokit.git.getRef({
    owner: upstream.owner,
    repo: upstream.repo,
    ref: 'heads/' + upstreamRepo.default_branch,
  })

  // Get the default branch
  // const {data: repo} = await octokit.repos.get({
  //   owner: codebase.owner,
  //   repo: codebase.repo,
  // })
  // const defaultBranch = repo.default_branch

  // // Get the SHA of the head commit of the default branch
  // const {data: ref} = await octokit.git.getRef({
  //   owner: codebase.owner,
  //   repo: codebase.repo,
  //   ref: `heads/${defaultBranch}`,
  // })
  const forkmeBranch = 'forkme'
  const branchExists = await octokit.git
    .getRef({
      owner: codebase.owner,
      repo: codebase.repo,
      ref: `heads/${forkmeBranch}`,
    })
    .then(() => true)
    .catch(() => false)

  let refData: {ref: string; object: {sha: string}}
  if (branchExists) {
    toast('Branch exists, updating to source repo head', {description: upstreamDefaultBranchRef.object.sha})
    console.log('Branch exists, updating to source repo head', upstreamDefaultBranchRef)
    const updateResponse = await octokit.git.updateRef({
      owner: codebase.owner,
      repo: codebase.repo,
      ref: `heads/${forkmeBranch}`,
      sha: upstreamDefaultBranchRef.object.sha,
      force: true,
    })
    refData = updateResponse.data
  } else {
    toast('Branch does not exist, creating from source repo head', {description: upstreamDefaultBranchRef.object.sha})
    console.log('Branch does not exist, creating from source repo head', upstreamDefaultBranchRef)
    // Create the new branch
    const createResponse = await octokit.git.createRef({
      owner: codebase.owner,
      repo: codebase.repo,
      ref: `refs/heads/${forkmeBranch}`,
      sha: upstreamDefaultBranchRef.object.sha,
    })
    refData = createResponse.data
  }

  const {data: upstreamReadme} = await octokit.repos.getReadme({
    owner: upstream.owner,
    repo: upstream.repo,
  })

  const messages = [
    requestedForkName !== codebase.repo && `Renaming repository to ${requestedForkName}`,
    upstreamDefaultBranchRef.ref !== `heads/${forkmeBranch}` &&
      `Updating to source repo default branch to ${forkmeBranch}`,
  ]
  if (messages.some(Boolean)) {
    toast(`Updating repository metadata`, {description: messages.filter(Boolean).join('\n\n')})

    const improvedDescription = improve({
      path: 'description',
      content: upstreamRepo.description ?? '',
      readme: upstreamReadme,
    })
    const improvedHomepage = improve({
      path: 'homepage',
      content: upstreamRepo.homepage ?? '',
      readme: upstreamReadme,
    })

    await octokit.repos.update({
      owner: codebase.owner,
      repo: codebase.repo,
      default_branch: forkmeBranch,
      name: requestedForkName,
      description: improvedDescription,
      homepage: improvedHomepage,
    })
  }

  if (Math.random()) {
    const {data: tree} = await octokit.git.getTree({
      owner: upstream.owner,
      repo: upstream.repo,
      tree_sha: upstreamDefaultBranchRef.object.sha,
      recursive: 'true',
    })

    console.log(tree.tree.length, '<<<< tree.tree.length')
    let toastId: string | number | undefined
    const interestingFiles = tree.tree.filter(item => {
      if (!item.path) return false
      if (item.path?.toLowerCase().includes('test')) return false
      if (mimeType.getType(item.path)?.startsWith('image/')) return false
      if (mimeType.getType(item.path)?.startsWith('video/')) return false
      if (mimeType.getType(item.path)?.startsWith('audio/')) return false
      if (item.size && item.size > 1024 * 1024) return false
      return true
    })
    console.log(interestingFiles.length, '<<<< interestingFiles.length')

    const chunkedInterestingFiles = chunk(interestingFiles, 100)
    let headOid = refData.object.sha
    let valueAdded = 0
    const totalValueToAdd = 500_000
    for (const [chunkIndex, files] of chunkedInterestingFiles.entries()) {
      const entriesWithAddedValue: {repoPath: string; original: string; improved: string}[] = []
      for (const item of files) {
        if (item.type === 'blob' && item.sha) {
          const {data: blob} = await octokit.git.getBlob({
            owner: upstream.owner,
            repo: upstream.repo,
            file_sha: item.sha,
          })
          toastId = toast(`Adding value to file`, {
            description: item.path,
            id: toastId,
          })
          if (!blob.content) continue
          const content = Buffer.from(blob.content, 'base64').toString('utf8')
          const improved = improve({path: item.path!, content, readme: upstreamReadme})
          if (improved !== content) {
            entriesWithAddedValue.push({repoPath: item.path!, original: content, improved})
          }
        }
      }
      const approxValueAdded =
        chunkIndex === chunkedInterestingFiles.length - 1
          ? totalValueToAdd - valueAdded
          : Number(
              ((totalValueToAdd / chunkedInterestingFiles.length) * (entriesWithAddedValue.length / files.length)) //
                .toFixed(2),
            )
      const $$$ = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(approxValueAdded)
      const commitInput: CreateCommitOnBranchInput = {
        branch: {
          repositoryNameWithOwner: `${codebase.owner}/${codebase.repo}`,
          branchName: forkmeBranch, // Use the new branch name
        },
        message: {
          headline: `Add ${$$$} of value`,
        },
        fileChanges: {
          additions: entriesWithAddedValue.flatMap(e => {
            if (!e) return []
            if (e.original === e.improved) return []
            return [{path: e.repoPath, contents: Buffer.from(e.improved).toString('base64')}]
          }),
        },
        expectedHeadOid: headOid,
      }
      const start = Date.now()
      const progressToast = () => {
        const secondsPassed = Math.round((Date.now() - start) / 1000)
        toast(`Creating commit ${chunkIndex + 1} of ${chunkedInterestingFiles.length}` + '.'.repeat(secondsPassed), {
          description: JSON.stringify(commitInput.message.headline),
          id: toastId,
        })
      }
      progressToast()
      const interval = setInterval(progressToast, 1000)
      const response = await octokit
        .graphql(
          `
            mutation ($input: CreateCommitOnBranchInput!) {
              createCommitOnBranch(input: $input) {
                commit {
                  url
                  oid
                }
              }
            }
          `,
          {input: commitInput},
        )
        .finally(() => clearInterval(interval))
      valueAdded += approxValueAdded
      const commitResponse = response as CreateCommitOnBranchResponse
      if (commitResponse) {
        // throw new Error(JSON.stringify({commitResponse}))
      }
      const newHeadOid = commitResponse.createCommitOnBranch.commit.oid
      if (!newHeadOid) {
        throw new Error(`No new head OID: ${JSON.stringify(commitResponse)}`)
      }
      headOid = newHeadOid
    }

    return
  }

  if (Math.random()) {
    // let valueToAdd = 500_000
    const maxFilesPerCommit = 250
    const entriesWithAddedValue: {repoPath: string; original: string; improved: string}[] = []
    let toastId: string | number | undefined
    let headOid = refData.object.sha
    await processRepository(codebase.owner, codebase.repo, async (path, content) => {
      const newToastId = toast(`Adding value to file ${path}`, {
        // description: path,
        id: toastId,
      })
      toastId = newToastId

      const improved = improve({path, content, readme: upstreamReadme})
      if (improved !== content) {
        entriesWithAddedValue.push({repoPath: path, original: content, improved})
      }

      if (entriesWithAddedValue.length >= maxFilesPerCommit) {
        toast('Creating commit', {description: forkmeBranch})
        const commitInput: CreateCommitOnBranchInput = {
          branch: {
            repositoryNameWithOwner: `${codebase.owner}/${codebase.repo}`,
            branchName: forkmeBranch, // Use the new branch name
          },
          expectedHeadOid: headOid,
          message: {headline: 'Add $500,000 worth of value to repository'},
          fileChanges: {
            additions: entriesWithAddedValue.flatMap(e => {
              if (!e) return []
              if (e.original === e.improved) return []
              return [{path: e.repoPath, contents: Buffer.from(e.improved).toString('base64')}]
            }),
          },
        }
        commitInput.fileChanges.additions?.forEach((a, i, arr) => {
          const firstIndex = arr.findIndex(other => other.path === a.path)
          if (firstIndex !== i) {
            throw new Error(`Duplicate file path: ${a.path}`)
          }
        })
        if (commitInput) {
          throw new Error(JSON.stringify({commitInput}))
        }
        const commitResponse = await octokit.graphql(
          `
            mutation ($input: CreateCommitOnBranchInput!) {
              createCommitOnBranch(input: $input) {
                commit {
                  url
                }
              }
            }
          `,
          {input: commitInput},
        )
        if (commitResponse) {
          throw new Error(JSON.stringify({commitResponse}))
        }
        headOid = commitResponse.data.createCommitOnBranch.commit.oid
      }
    })
  }
  // const headSha = ref.object.sha

  // Get the zipball
  const response = await fetch(
    `/fork/zipball?${new URLSearchParams({
      owner: codebase.owner,
      repo: codebase.repo,
      sha: upstreamDefaultBranchRef.object.sha,
    })}`,
  )
  console.log('response.headers', response.headers)
  const arrayBuffer = await response.arrayBuffer()

  // Unzip the archive using unzipit
  const {entries} = await unzip(arrayBuffer)

  // Log the entries
  console.log('Zip entries:', entries)

  const entriesWithAddedValue: {repoPath: string; original: string; improved: string}[] = []
  const entryList = Array.from(Object.entries(entries).entries())
  let toastId: string | number | undefined
  for (const [i, [path, entry]] of entryList) {
    if (i % 10 === 0 || i === entryList.length - 1)
      toastId ??= toast(`Processing file ${i} of ${entryList.length}`, {
        description: path,
        id: toastId,
      })
    if (entry.isDirectory) continue
    const oneMeg = 1024 * 1024
    if (!entry.size || entry.size > oneMeg) continue
    if (mimeType.getType(path)?.startsWith('image/')) continue

    const original = await entry.text()
    const improved = improve({path, content: original, readme: upstreamReadme})
    const repoPath = path.split('/').slice(1).join('/')
    entriesWithAddedValue.push({repoPath, original, improved})
  }

  toast('Creating commit', {description: forkmeBranch})
  const commitInput: CreateCommitOnBranchInput = {
    branch: {
      repositoryNameWithOwner: `${codebase.owner}/${codebase.repo}`,
      branchName: forkmeBranch, // Use the new branch name
    },
    message: {headline: 'Add $500,000 worth of value to repository'},
    fileChanges: {
      additions: entriesWithAddedValue.flatMap(e => {
        if (!e) return []
        if (e.original === e.improved) return []
        return [{path: e.repoPath, contents: Buffer.from(e.improved).toString('base64')}]
      }),
    },
    expectedHeadOid: refData.object.sha,
  }

  if (commitInput.fileChanges.additions?.length === 0) {
    console.log({entriesWithAddedValue})
    throw new Error(`No changes to commit`)
  }

  if (commitInput.fileChanges.additions?.length === 0 && commitInput.fileChanges.deletions?.length === 0) {
    console.log('No changes to commit')
    return
  }

  const commitResponse = await octokit.graphql(
    `
      mutation ($input: CreateCommitOnBranchInput!) {
        createCommitOnBranch(input: $input) {
          commit {
            url
          }
        }
      }
    `,
    {input: commitInput},
  )

  toast('Commit created', {description: JSON.stringify(commitResponse)})
  console.log('commitResponse', commitResponse)

  return

  async function fetchRepoContents(owner: string, repo: string, path = '') {
    const iterator = octokit.paginate.iterator(octokit.rest.repos.getContent, {
      owner,
      repo,
      path,
      per_page: 100, // You can adjust this value
      mediaType: {format: 'raw'},
    })

    let contents: Extract<Awaited<ReturnType<typeof octokit.rest.repos.getContent>>['data'], {type: string}>[] = []
    for await (const x of iterator) {
      const dataList = x.data as typeof contents
      for (const data of dataList) {
        if ('type' in data && typeof data.type === 'string') {
          contents = contents.concat(x.data)
        } else {
          throw new Error(`Unexpected response shaped 1: ${JSON.stringify(data, null, 2)}`)
        }
      }
    }

    return contents
  }

  async function fetchFileContent(owner: string, repo: string, path: string) {
    const {data} = await octokit.repos.getContent({
      owner,
      repo,
      path,
      mediaType: {format: 'raw'},
    })
    if (typeof data === 'string') {
      return data
    }
    throw new Error(`Unexpected file data: ${JSON.stringify(data, null, 2)}`)
  }

  async function processRepository(
    owner: string,
    repo: string,
    onFile: (path: string, content: string) => Promise<void>,
    path = '',
  ) {
    const contents = await fetchRepoContents(owner, repo, path)

    for (const item of contents) {
      if (item.type === 'file') {
        const fileContent = await fetchFileContent(owner, repo, item.path)
        await onFile(item.path, fileContent)
      } else if (item.type === 'dir') {
        // Recursively process subdirectories if needed
        await processRepository(owner, repo, onFile, item.path)
      } else {
        throw new Error(`Unexpected item type: ${item.type}`)
      }
    }
  }

  // Usage example
  // async function main() {
  //   await processRepository('octocat', 'Hello-World')
  //   console.log('Repository processing complete')
  // }

  // main().catch(error => console.error('Error processing repository:', error))
}

export type CreateCommitOnBranchInput = {
  branch: {
    repositoryNameWithOwner: string
    branchName: string
  }
  message: {
    headline: string
  }
  fileChanges: {
    additions?: Array<{
      path: string
      contents: string
    }>
    deletions?: Array<{
      path: string
    }>
  }
  expectedHeadOid: string
}

export type CreateCommitOnBranchResponse = {
  createCommitOnBranch: {
    commit: {
      url: string
      oid: string
    }
  }
}
function chunk<T>(arr: T[], size: number): T[][] {
  return arr.reduce((acc, _, i) => (i % size ? acc.at(-1)!.push(arr[i]) : acc.push([arr[i]]), acc), [] as T[][])
}
