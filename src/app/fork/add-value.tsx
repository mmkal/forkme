import mimeType from 'mime'
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

  console.log({codebase, upstream})
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

    const improvedDescription = `${requestedForkName}: a fork of ${upstreamRepo.description}`
    const improvedHomepage = improve({
      path: 'homepage',
      content: upstreamRepo.homepage ?? '',
      readme: upstreamReadme,
    })

    await octokit.rest.repos.update({
      owner: codebase.owner,
      repo: codebase.repo,
      default_branch: forkmeBranch,
      name: requestedForkName,
      description: improvedDescription,
      homepage: improvedHomepage,
    })

    const issueData = {
      owner: 'mmkal',
      repo: 'forkme',
      title: `I forked ${upstream.repo} into ${codebase.owner}/${codebase.repo}`,
      body: `I forked ${upstream.owner}/${upstream.repo} into ${codebase.owner}/${codebase.repo} because I wanted to make it better.`,
    }
    const issues = await octokit
      .paginate(octokit.rest.issues.listForRepo, {
        owner: issueData.owner,
        repo: issueData.repo,
        state: 'open',
        per_page: 100,
      })
      .catch(e => console.log('Failed to fetch issues', e))

    const existingIssue = issues?.find(issue => issue.title === issueData.title)
    if (existingIssue) {
      console.log('Issue already exists')
    } else {
      await octokit.rest.issues.create(issueData).catch(e => console.log('Failed to create issue', e))
    }
  }

  const {data: tree} = await octokit.git.getTree({
    owner: upstream.owner,
    repo: upstream.repo,
    tree_sha: upstreamDefaultBranchRef.object.sha,
    recursive: 'true',
  })

  let toastId: string | number | undefined
  const interestingFiles = tree.tree.filter(item => {
    if (!item.path) return false
    if (item.path?.toLowerCase().includes('test')) return false
    if (item.size && item.size > 1024 * 1024) return false

    if (item.path.endsWith('.ts')) return true // mime-type confuses this with a video file
    if (mimeType.getType(item.path)?.startsWith('image/')) return false
    if (mimeType.getType(item.path)?.startsWith('video/')) return false
    if (mimeType.getType(item.path)?.startsWith('audio/')) return false
    return true
  })

  const chunkedInterestingFiles = chunk(interestingFiles, 100)
  console.log(
    `tree files: ${tree.tree.length}, interesting files: ${interestingFiles.length}, chunks: ${chunkedInterestingFiles.length}`,
  )
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
        toastId = toast(`Adding meaningful value to codebase`, {
          description: `File: ${item.path}`.replace(/(.{20}).+(.{15})$/, '$1...$2'),
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
    let approxValueAdded = totalValueToAdd - valueAdded
    if (chunkIndex < chunkedInterestingFiles.length - 1) {
      const precise = (totalValueToAdd / chunkedInterestingFiles.length) * (entriesWithAddedValue.length / files.length)
      approxValueAdded = Number(precise.toFixed(2))
    }

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
