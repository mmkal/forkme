import Link from 'next/link'

export default function Home() {
  return (
    <main>
      <h1>ForkMe</h1>
      <img width={400} height={400} src="/logo.webp" alt="ForkMe" />
      <Link href="/fork">Fork</Link>
    </main>
  )
}
