import {NextRequest, NextResponse} from 'next/server'
import {getGithubAccessToken} from '@/auth'

export async function GET(request: NextRequest) {
  const token = await getGithubAccessToken(request)
  const {searchParams} = new URL(request.url)
  const owner = searchParams.get('owner')
  const repo = searchParams.get('repo')
  const sha = searchParams.get('sha')

  if (!owner || !repo || !sha) {
    return new Response('Missing owner, repo, or sha', {status: 400})
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/zipball/${sha}`, {
    headers: {
      authorization: `token ${token}`,
    },
  })
  const responseHeaders = {...Object.fromEntries(response.headers.entries())}
  delete responseHeaders['x-github-request-id']

  console.log('response.headers', response.headers)
  console.log('responseHeaders', responseHeaders)
  return new NextResponse(response.body, {
    headers: responseHeaders,
  })
  return NextResponse.json({headers: response.headers})
  //   const arrayBuffer = await response.arrayBuffer()

  //   return new Response(arrayBuffer, {
  //     headers: {'Content-Type': 'application/zip'},
  //   })
}
