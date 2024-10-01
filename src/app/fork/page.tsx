'use client'

import {Octokit} from '@octokit/rest'
import {useQuery} from '@tanstack/react-query'
import {addValue} from './add-value'
import {useAugmentedSession} from '@/auth/client'
import {GitHubFork} from '@/components/github-fork'

export default function ForkPage() {
  const session = useAugmentedSession()
  const someTimeHasPassedQuery = useQuery({
    queryKey: ['someTimeHasPassed'],
    queryFn: () => new Promise(r => setTimeout(r, 2000)).then(Boolean),
  })
  if (session.status === 'loading') return someTimeHasPassedQuery.isSuccess ? <>Loading...</> : <></>

  const octokit = new Octokit({auth: session.data?.jwt_access_token})

  return <GitHubFork octokit={octokit} addValue={addValue} />
}
