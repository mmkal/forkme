import mimeType from 'mime'
import {unzip} from 'unzipit'
import {GitHubFork} from '@/components/github-fork'

export type Improve = (params: {path: string; content: string; readme: {content: string}}) => Promise<string>
export const addValue: Parameters<typeof GitHubFork>[0]['addValue'] = async ({
  octokit,
  codebase,
  improve, //
}) => {
  // Get the default branch
  const {data: repo} = await octokit.repos.get({
    owner: codebase.owner,
    repo: codebase.repo,
  })
  const defaultBranch = repo.default_branch

  // Get the SHA of the head commit of the default branch
  const {data: ref} = await octokit.git.getRef({
    owner: codebase.owner,
    repo: codebase.repo,
    ref: `heads/${defaultBranch}`,
  })
  const {data: readme} = await octokit.repos.getReadme({
    owner: codebase.owner,
    repo: codebase.repo,
  })
  const headSha = ref.object.sha

  // Get the zipball
  const response = await fetch(
    `/fork/zipball?${new URLSearchParams({owner: codebase.owner, repo: codebase.repo, sha: headSha})}`,
  )
  console.log('response.headers', response.headers)
  const arrayBuffer = await response.arrayBuffer()

  // Unzip the archive using unzipit
  const {entries} = await unzip(arrayBuffer)

  // Log the entries
  console.log('Zip entries:', entries)

  const entriesWithAddedValue = await Promise.all(
    Object.entries(entries).map(async ([path, entry]) => {
      if (entry.isDirectory) return null
      const oneMeg = 1024 * 1024
      if (!entry.size || entry.size > oneMeg) return null
      if (mimeType.getType(path)?.startsWith('image/')) return null

      const original = await entry.text()
      const improved = improve({path, content: original, readme})
      const repoPath = path.split('/').slice(1).join('/')
      return {repoPath, original, improved}
    }),
  )

  let forkmeBranch = 'forkme'
  let branchExists = true

  while (branchExists) {
    try {
      await octokit.git.getRef({
        owner: codebase.owner,
        repo: codebase.repo,
        ref: `heads/${forkmeBranch}`,
      })
      const suffix = forkmeBranch.includes('again') ? '-again' : '-and-again'
      forkmeBranch += suffix
    } catch {
      branchExists = false
    }
  }

  // Create the new branch
  await octokit.git.createRef({
    owner: codebase.owner,
    repo: codebase.repo,
    ref: `refs/heads/${forkmeBranch}`,
    sha: headSha,
  })

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
    expectedHeadOid: headSha,
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

  console.log('commitResponse', commitResponse)

  // Set the forkmeBranch as the default branch
  await octokit.repos.update({
    owner: codebase.owner,
    repo: codebase.repo,
    default_branch: forkmeBranch,
  })

  return
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
