'use client'

import {Octokit} from '@octokit/rest'
import {useQuery, useMutation} from '@tanstack/react-query'
import Markdown from 'markdown-to-jsx'
import Image from 'next/image'
import Link from 'next/link'
import {useQueryState} from 'nuqs'
import {useMemo} from 'react'
import {toast, Toaster} from 'sonner'
import * as licenseTexts from '@/app/fork/licenses'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Skeleton} from '@/components/ui/skeleton'

export interface AddValueOptions {
  octokit: Octokit
  codebase: {owner: string; repo: string}
  sourceRepo: {owner: string; repo: string}
  requestedForkName: string
  improve: (params: {path: string; content: string; readme: {content: string}}) => string
  toast: typeof toast
}

export interface GitHubForkProps {
  octokit: Octokit
  addValue?: (options: AddValueOptions) => Promise<void>
  inputMessages?: Partial<Messages>
}

export interface Replacement {
  from: string
  to: string
}

export function GitHubFork({octokit, addValue, inputMessages = {}}: GitHubForkProps) {
  const messages = {...defaultMessages, ...inputMessages}
  const [repoInput, setRepoInput] = useQueryState('repo', {defaultValue: ''})
  const [forkName, setForkName] = useQueryState('fork', {defaultValue: ''})
  const [replacements, setReplacements] = useQueryState('replacements', {
    defaultValue: [{from: '', to: ''}],
    parse: value => JSON.parse(value) as Replacement[],
    serialize: value => JSON.stringify(value),
  })
  const [showFullReadme, setShowFullReadme] = useQueryState('showFullReadme', {
    defaultValue: false,
    parse: value => value === 'true',
    serialize: value => value.toString(),
  })
  const [license, setLicense] = useQueryState('license', {defaultValue: ''})

  const {data: authenticatedUser} = useQuery({
    queryKey: ['authenticatedUser'],
    queryFn: async () => {
      const {data} = await octokit.users.getAuthenticated().catch(() => ({data: null}))
      return data?.login || null
    },
  })

  const fetchRepoInfo = async () => {
    if (!repoInput) return null
    const [owner, repo] = repoInput.split('/')
    const {data} = await octokit.repos.get({owner, repo})
    const readmeResponse = await octokit.repos.getReadme({owner, repo})
    const readmeContent = atob(readmeResponse.data.content)
    return {...data, readmeContent}
  }

  const {
    data: repoInfo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['repoInfo', repoInput],
    queryFn: fetchRepoInfo,
    enabled: !!repoInput,
  })

  const forkNameError = useMemo(() => {
    const regex = /^[\w.-]+$/
    if (!forkName) return ''
    if (!regex.test(forkName)) {
      return messages.fork_name_error
    }
    return ''
  }, [forkName, messages.fork_name_error])

  const checkRepoExists = async (owner: string, repo: string): Promise<boolean> => {
    try {
      await octokit.repos.get({owner, repo})
      return true
    } catch {
      return false
    }
  }

  const findExistingFork = async ({
    sourceOwner,
    sourceRepo,
    requestedForkName,
    lookForOtherNames = false,
  }: {
    sourceOwner: string
    sourceRepo: string
    requestedForkName: string
    lookForOtherNames?: boolean
  }): Promise<string | null> => {
    toast('Checking for existing forks...')
    const userRepos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
      per_page: 100,
    })

    for (const repo of userRepos) {
      if (repo.fork) {
        if (
          !lookForOtherNames &&
          repo.name.toLowerCase() !== sourceRepo.toLowerCase() &&
          repo.name.toLowerCase() !== requestedForkName.toLowerCase()
        ) {
          console.log(`skipping ${repo.name} because the name doesn't match ${sourceRepo} or ${requestedForkName}`)
          continue
        }
        const {data: repoDetails} = await octokit.repos.get({owner: repo.owner.login, repo: repo.name})
        if (
          repoDetails.parent &&
          repoDetails.parent.full_name.toLowerCase() === `${sourceOwner}/${sourceRepo}`.toLowerCase()
        ) {
          toast('Existing fork found')
          return repo.name
        }
      }
    }

    if (!lookForOtherNames) {
      return findExistingFork({sourceOwner, sourceRepo, requestedForkName, lookForOtherNames: true})
    }

    toast('No existing fork found')
    return null
  }

  const forkMutation = useMutation({
    mutationFn: async () => {
      if (!repoInfo) throw new Error(messages.no_repo_info)
      if (!forkName) throw new Error(messages.fork_name_required)
      if (forkNameError) throw new Error(forkNameError)
      if (!authenticatedUser) throw new Error(messages.user_not_authenticated)

      const [sourceOwner, sourceRepo] = repoInput.split('/')

      const forkExists = await checkRepoExists(authenticatedUser, forkName)

      if (!forkExists) {
        await octokit.repos.createFork({
          owner: sourceOwner,
          repo: sourceRepo,
          name: forkName,
        })
      }

      const progressMessages = [...messages.fork_progress_messages]

      let existingFork: string | null = null
      const startTime = Date.now()

      for (let i = 0; i < 12; i++) {
        if (await checkRepoExists(authenticatedUser, forkName)) {
          break
        }

        if (Date.now() - startTime > 3000 && !existingFork) {
          existingFork = await findExistingFork({sourceOwner, sourceRepo, requestedForkName: forkName})
          if (existingFork) {
            toast(messages.using_existing_fork_title, {
              description: messages.using_existing_fork_description(existingFork),
            })
            break
          }
        }

        const message = progressMessages.shift()
        if (message) {
          toast(messages.fork_progress_title, {
            description: message,
          })
        }
        await new Promise(r => setTimeout(r, 5000))
      }

      const finalForkName = existingFork || forkName

      if (addValue) {
        await addValue({
          octokit,
          codebase: {owner: authenticatedUser, repo: finalForkName},
          sourceRepo: {owner: sourceOwner, repo: sourceRepo},
          requestedForkName: forkName,
          improve: params => {
            let improvedContent = params.content
            if (params.path.toLowerCase().includes('license') && license in licenseTexts) {
              improvedContent = licenseTexts[license] as string
            }
            for (const replacement of replacements) {
              improvedContent = improvedContent.replaceAll(replacement.from, replacement.to)
            }
            return improvedContent
          },
          toast,
        })
      }

      return {owner: authenticatedUser, repo: finalForkName}
    },
    onSuccess: data => {
      toast.success(messages.fork_success_title, {
        description: messages.fork_success_description({owner: data.owner, repo: data.repo}),
        action: {
          label: 'Open Fork',
          onClick: () => window.open(`https://github.com/${data.owner}/${data.repo}`, '_blank'),
        },
      })
    },
    onError: (error: Error) => {
      toast.error(messages.fork_error_title, {
        description: error.message,
      })
    },
  })

  const handleFork = () => {
    if (!authenticatedUser) {
      const pathAndSearch = window.location.href.replace(window.location.origin, '')
      window.location.href = `/api/auth/signin?${new URLSearchParams({callbackUrl: pathAndSearch}).toString()}`
      return
    }
    if (forkMutation.isSuccess) {
      window.open(`https://github.com/${forkMutation.data.owner}/${forkMutation.data.repo}`, '_blank')
    } else {
      forkMutation.mutate()
    }
  }

  const addReplacement = () => {
    setReplacements([...replacements, {from: '', to: ''}])
    forkMutation.reset()
  }

  const updateReplacement = (index: number, field: 'from' | 'to', value: string) => {
    const newReplacements = [...replacements]
    newReplacements[index][field] = value
    setReplacements(newReplacements)
    forkMutation.reset()
  }

  const removeReplacement = (index: number) => {
    const newReplacements = replacements.filter((_, i) => i !== index)
    setReplacements(newReplacements)
    forkMutation.reset()
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="bg-[#FFF5EC] border-[#001F3F] relative">
        <CardHeader className="flex flex-row items-center space-x-4 pb-2">
          <Link href="/">
            <Image src="/logo.webp" alt="Fork Logo" width={64} height={64} />
          </Link>
          <div>
            <CardTitle className="text-[#001F3F]">{messages.card_title}</CardTitle>
            <CardDescription className="text-[#001F3F] opacity-70">{messages.card_description}</CardDescription>
            {authenticatedUser && (
              <div className="absolute top-4 right-4">
                <Link href="/api/auth/signout" className="text-sm text-[#001F3F] hover:underline">
                  Sign out
                </Link>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="repo-input" className="block text-sm font-medium text-[#001F3F]">
                {messages.repo_input_label}
              </label>
              <Input
                id="repo-input"
                type="text"
                value={repoInput}
                onChange={e => setRepoInput(e.target.value)}
                placeholder={messages.repo_input_placeholder}
                className="mt-1 border-[#001F3F] text-[#001F3F] placeholder-[#001F3F] placeholder-opacity-50"
              />
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-[#87CEEB] opacity-50" />
                <Skeleton className="h-4 w-3/4 bg-[#87CEEB] opacity-50" />
                <Skeleton className="h-4 w-1/2 bg-[#87CEEB] opacity-50" />
              </div>
            ) : repoInfo ? (
              <div className="border rounded-md p-4 bg-[#FFD7BA] border-[#001F3F]">
                <h3 className="text-lg font-semibold text-[#001F3F]">{repoInfo.full_name}</h3>
                <p className="text-sm text-[#001F3F] opacity-70">{repoInfo.description}</p>
                <div
                  className={`mt-2 text-sm text-[#001F3F] prose max-w-none ${showFullReadme ? '' : 'max-h-40 overflow-hidden'}`}
                >
                  <Markdown>{repoInfo.readmeContent}</Markdown>
                </div>
                {repoInfo.readmeContent.length > 500 && (
                  <Button
                    onClick={() => setShowFullReadme(!showFullReadme)}
                    className="mt-2 bg-[#87CEEB] text-[#001F3F] hover:bg-[#5CACEE]"
                  >
                    {showFullReadme ? 'Show Less' : 'Show More'}
                  </Button>
                )}
              </div>
            ) : null}

            {repoInfo && (
              <div>
                <label htmlFor="fork-name" className="block text-sm font-medium text-[#001F3F]">
                  {messages.fork_name_label}
                </label>
                <Input
                  id="fork-name"
                  type="text"
                  value={forkName}
                  onChange={e => setForkName(e.target.value)}
                  placeholder={messages.fork_name_placeholder}
                  className="mt-1 border-[#001F3F] text-[#001F3F] placeholder-[#001F3F] placeholder-opacity-50"
                />
                {forkNameError && <p className="text-red-500 text-sm mt-1">{forkNameError}</p>}
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[#001F3F]">{messages.add_value_title}</h4>
              {replacements.map((replacement, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    type="text"
                    value={replacement.from}
                    onChange={e => updateReplacement(index, 'from', e.target.value)}
                    placeholder={messages.replace_placeholder}
                    className="flex-1 border-[#001F3F] text-[#001F3F] placeholder-[#001F3F] placeholder-opacity-50"
                  />
                  <Input
                    type="text"
                    value={replacement.to}
                    onChange={e => updateReplacement(index, 'to', e.target.value)}
                    placeholder={messages.with_placeholder}
                    className="flex-1 border-[#001F3F] text-[#001F3F] placeholder-[#001F3F] placeholder-opacity-50"
                  />
                  <Button onClick={() => removeReplacement(index)} variant="destructive" className="px-2 py-0">
                    Remove
                  </Button>
                </div>
              ))}
              <Button onClick={addReplacement} className="w-full bg-[#87CEEB] text-[#001F3F] hover:bg-[#5CACEE]">
                {messages.add_more_value_button}
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[#001F3F]">{messages.relicense_title}</h4>
              <Select value={license} onValueChange={setLicense}>
                <SelectTrigger className="w-full border-[#001F3F] text-[#001F3F]">
                  <SelectValue placeholder={messages.relicense_placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wtfpl">WTFPL</SelectItem>
                  <SelectItem value="apache2">Apache License 2.0</SelectItem>
                  <SelectItem value="unlicense">The Unlicense</SelectItem>
                  <SelectItem value="mit">MIT License</SelectItem>
                  <SelectItem value="nochange">Keep original license (not recommended)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-red-500 text-sm">{messages.repo_fetch_error({error: error.message})}</p>}

            <Button
              onClick={handleFork}
              disabled={authenticatedUser ? !repoInfo || !forkName || !!forkNameError || forkMutation.isPending : false}
              className="w-full text-lg py-6 bg-[#87CEEB] text-[#001F3F] hover:bg-[#5CACEE]"
            >
              {authenticatedUser
                ? forkMutation.isPending
                  ? messages.forking_button
                  : forkMutation.isSuccess
                    ? messages.fork_success_button
                    : messages.fork_button
                : 'Login to ' + messages.fork_button}
            </Button>

            {forkMutation.isError && (
              <p className="text-red-500 text-sm">{messages.fork_error({error: forkMutation.error.message})}</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}

export const defaultMessages = {
  card_title: 'GitHub Repository Fork',
  card_description: 'Enter a GitHub repository to fork',
  repo_input_label: 'GitHub Repository (owner/repo)',
  repo_input_placeholder: 'e.g., octocat/Hello-World',
  fork_name_label: 'Fork Name',
  fork_name_placeholder: 'Enter fork name',
  fork_name_error: 'Fork name can only contain alphanumeric characters, hyphens, underscores, and dots.',
  add_value_title: 'Add Value',
  replace_placeholder: 'Replace...',
  with_placeholder: 'With...',
  add_more_value_button: 'Add more value',
  fork_button: 'FORK',
  forking_button: 'Forking...',
  no_repo_info: 'No repository information',
  fork_name_required: 'Fork name is required',
  user_not_authenticated: 'User not authenticated',
  fork_progress_title: 'Fork in progress',
  fork_progress_messages: [
    'Still working... GitHub is processing your request!',
    'Hang tight! Your fork is being prepared...',
    'Almost there! GitHub is setting up your repo...',
    'Just a bit longer... Your fork is on its way!',
  ],
  fork_timeout:
    'Timed out waiting for fork to be available. Please try refreshing the page or check your GitHub account.',
  fork_success_button: `Open Fork`,
  fork_success_title: 'Fork successful!',
  fork_success_description: ({owner, repo}: {owner: string; repo: string}) =>
    `Your fork is ready at https://github.com/${owner}/${repo}`,
  fork_error_title: 'Fork failed',
  repo_fetch_error: ({error}: {error: string}) => `Error fetching repository information: ${error}`,
  fork_error: ({error}: {error: string}) => `Error forking repository: ${error}`,
  using_existing_fork_title: 'Using Existing Fork',
  using_existing_fork_description: (forkName: string) =>
    `An existing fork named "${forkName}" was found and will be used.`,
  relicense_title: 'Relicense',
  relicense_placeholder: 'Select a license',
}

export type Messages = typeof defaultMessages
