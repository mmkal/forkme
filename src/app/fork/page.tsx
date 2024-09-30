'use client'

import {Octokit} from '@octokit/rest'
import Link from 'next/link'
import {addValue} from './add-value'
import {useAugmentedSession} from '@/auth/client'
import {GitHubFork} from '@/components/github-fork'

export default function ForkPage() {
  const session = useAugmentedSession()
  if (!session.data) {
    return (
      <>
        <div>Not signed in (yet?)</div>
        <Link href="/api/auth/signin?callbackUrl=/fork">Sign in</Link>
      </>
    )
  }

  console.log(session.data)

  const octokit = new Octokit({auth: session.data.jwt_access_token})

  return <GitHubFork octokit={octokit} addValue={addValue} />
}
