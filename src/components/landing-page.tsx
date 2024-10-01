/* eslint-disable react/no-unescaped-entities */
'use client'

import {motion} from 'framer-motion'
import {GitFork, Zap, Rocket, PartyPopper, SearchCheck} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {useState} from 'react'

const WobbleBox = ({children}: {children: React.ReactNode}) => {
  const [initial] = useState(() => Math.random() * 10 - 5)

  return (
    <motion.div
      initial={{rotate: initial}}
      whileHover={{rotate: [initial, 0, -5, 5, -5, 5, 0], transition: {duration: 0.5}}}
      // whileDrag={{rotate: [initial, 0, -5, 5, -5, 5, 0], transition: {duration: 0.5}}}
      // whileFocus={{rotate: 0}}
      // whileTap={{rotate: [initial, 0, -5, 5, -5, 5, 0], transition: {duration: 0.5}}}
      whileInView={{rotate: [initial, 0, -5, 5, -5, 5, 0, initial], transition: {duration: 0.5}}}
      className="relative"
    >
      {children}
    </motion.div>
  )
}

export function LandingPageComponent() {
  const [repo, setRepo] = useState('')
  const [forkName, setForkName] = useState('')

  return (
    <div className="min-h-screen bg-[#f0ebe0] flex flex-col items-center justify-center p-4 overflow-hidden pb-2">
      <WobbleBox>
        <motion.div
          initial={{scale: 0}}
          animate={{scale: 1, rotate: 360}}
          transition={{type: 'spring', stiffness: 260, damping: 20}}
          className="mb-8"
        >
          <Image src="/logo-nobg.png" alt="ForkMe" width={120} height={120} />
          {/* <svg width="120" height="120" viewBox="0 0 100 100" className="drop-shadow-xl">
          <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="#ffd1b3" stroke="#1a237e" strokeWidth="4" />
          <path d="M40 40 L60 40 L60 70 Q50 80 40 70 Z" fill="#bbdefb" stroke="#1a237e" strokeWidth="2" />
        </svg> */}
        </motion.div>
      </WobbleBox>

      <WobbleBox>
        <motion.h1
          className="text-6xl font-extrabold text-[#1a237e] mb-8 text-center"
          initial={{y: -100}}
          animate={{y: 0}}
          transition={{type: 'spring', stiffness: 100, delay: 0.5}}
        >
          {/* <span className="inline-block transform hover:rotate-12 transition-transform duration-300">🍴</span>{' '} */}
          forkme
        </motion.h1>
      </WobbleBox>

      <motion.div
        className="bg-[#ffd1b3] rounded-[40px] p-8 w-full max-w-2xl relative shadow-2xl"
        initial={{y: 50, opacity: 0}}
        animate={{y: 0, opacity: 1}}
        transition={{delay: 0.2}}
      >
        <motion.div
          className="absolute -top-10 -left-10 bg-[#bbdefb] rounded-full p-6 shadow-lg"
          whileHover={{rotate: 360, scale: 1.2}}
          transition={{duration: 0.5}}
        >
          <GitFork className="w-6 h-6 text-[#1a237e]" />
        </motion.div>

        <h2 className="text-4xl font-bold mb-6 text-[#1a237e]">Fork me, Beautiful</h2>
        <p className="mb-4 text-[#4a148c] text-lg">Enter a GitHub repo and watch the AI magic happen</p>

        <div className="space-y-6">
          <WobbleBox>
            <input
              type="text"
              className="w-full px-4 py-3 border-4 border-[#1a237e] rounded-full focus:outline-none focus:ring-4 focus:ring-[#bbdefb] text-lg"
              value={repo}
              onChange={e => setRepo(e.target.value)}
              placeholder="e.g., microsoft/typescript"
            />
          </WobbleBox>

          <WobbleBox>
            <input
              type="text"
              className="w-full px-4 py-3 border-4 border-[#1a237e] rounded-full focus:outline-none focus:ring-4 focus:ring-[#bbdefb] text-lg"
              value={forkName}
              onChange={e => setForkName(e.target.value)}
              placeholder="your-awesome-fork-name"
            />
          </WobbleBox>

          <motion.button
            className="w-full bg-[#1a237e] text-white font-bold py-4 px-6 rounded-full text-xl hover:bg-[#3949ab] focus:outline-none focus:ring-4 focus:ring-[#bbdefb] transform transition-all duration-200 ease-in-out"
            whileHover={{scale: 1.05, rotate: [0, -5, 5, -5, 5, 0]}}
            whileTap={{scale: 0.95}}
            onClick={() => {
              const searchParams = new URLSearchParams({repo, fork: forkName}).toString()
              return (window.location.href = `/fork?${searchParams}`.replace(/\?$/, ''))
            }}
          >
            <span className="flex items-center justify-center">
              <GitFork className="w-6 h-6 mr-2" />
              Fork & Supercharge!
            </span>
          </motion.button>
        </div>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <WobbleBox>
          <motion.div
            className="bg-[#bbdefb] rounded-[30px] p-6 shadow-xl"
            initial={{x: -50, opacity: 0}}
            animate={{x: 0, opacity: 1}}
            transition={{delay: 0.4}}
          >
            <Zap className="w-16 h-16 text-[#1a237e] mb-4" />
            <h3 className="text-2xl font-bold mb-2 text-[#1a237e]">AI-Powered Zap-o-matic</h3>
            <p className="text-[#4a148c] text-lg">
              Our AI will zap your code into a masterpiece faster than you can say "mechanistic interpretability"
            </p>
          </motion.div>
        </WobbleBox>

        <WobbleBox>
          <motion.div
            className="bg-[#bbdefb] rounded-[30px] p-6 shadow-xl"
            initial={{x: 50, opacity: 0}}
            animate={{x: 0, opacity: 1}}
            transition={{delay: 0.6}}
          >
            <Rocket className="w-16 h-16 text-[#1a237e] mb-4" />
            <h3 className="text-2xl font-bold mb-2 text-[#1a237e]">Insta-Startup Launcher</h3>
            <p className="text-[#4a148c] text-lg">
              Turn any repo into a billion-dollar idea with our patented Hype-Generator™!
            </p>
          </motion.div>
        </WobbleBox>

        <WobbleBox>
          <motion.div
            className="bg-[#bbdefb] rounded-[30px] p-6 shadow-xl"
            initial={{x: 50, opacity: 0}}
            animate={{x: 0, opacity: 1}}
            transition={{delay: 0.6}}
          >
            <SearchCheck className="w-16 h-16 text-[#1a237e] mb-4" />
            <h3 className="text-2xl font-bold mb-2 text-[#1a237e]">Your Code, Your Brand</h3>
            <p className="text-[#4a148c] text-lg">
              Add instant value to the codebase using our smart-replace tool. Take full ownership with upstream branding
              find-and-replace.
            </p>
          </motion.div>
        </WobbleBox>

        <WobbleBox>
          <motion.div
            className="bg-[#bbdefb] rounded-[30px] p-6 shadow-xl"
            initial={{x: 50, opacity: 0}}
            animate={{x: 0, opacity: 1}}
            transition={{delay: 0.6}}
          >
            <PartyPopper className="w-16 h-16 text-[#1a237e] mb-4" />
            <h3 className="text-2xl font-bold mb-2 text-[#1a237e]">chatgpt'd license, dawg</h3>
            <p className="text-[#4a148c] text-lg">
              Do whatever you want, and fix pesky license issues with our one-click license upgrader! No more worrying
              about legal stuff.
            </p>
          </motion.div>
        </WobbleBox>
      </div>
      <WobbleBox>
        <div className="mt-16 text-center">
          <h2 className="text-4xl font-bold text-[#1a237e] mb-4">See it in action</h2>
          <p className="text-xl text-[#4a148c] mb-8">
            Or take a look at{' '}
            <a
              href="https://github.com/mmkal/hypescript"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3949ab] hover:underline"
            >
              mmkal/hypescript
            </a>{' '}
            - a Series-B-funded* SaaS fork of TypeScript
          </p>
        </div>
        <video
          loop
          muted
          autoPlay
          playsInline
          onClick={ev => {
            const video = ev.target as HTMLVideoElement
            if (video.paused) void video.play()
            else void video.pause()
          }}
          // controls
          // controlsList="nodownload noremoteplayback nofullscreen"
          className="w-full h-[800px] max-h-[100vw] max-w-[80vw] aspect-video rounded-lg DISABLEDshadow-lg mt-5 mb-5"
        >
          <source src={`/typescript-hypescript.webm`} type="video/webm" />
          Your browser does not support the video tag.
        </video>
      </WobbleBox>

      <div className="mt-16 text-center">
        <h2 className="text-3xl font-bold text-[#1a237e] mb-8 max-w-[950vw]">
          Fork open-source projects built by your favourite organizations:
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-8">
          {['Google', 'Microsoft', 'Amazon', 'Airbnb', 'Meta', 'Netflix', 'Uber', 'WordPress'].map(company => {
            const repoMap = {
              Google: 'google/guava',
              Microsoft: 'microsoft/typescript',
              Amazon: 'aws/aws-cdk',
              Airbnb: 'airbnb/javascript',
              Meta: 'facebook/react',
              Netflix: 'netflix/chaosmonkey',
              Uber: 'uber/RIBs',
              WordPress: 'WordPress/wordpress-develop',
            } as Record<string, string>
            const repo = repoMap[company]
            const params = {
              repo,
              fork: repo
                .split('/')[1]
                .toLowerCase()
                .replace(/.*?([aeiouy])/, 'schm$1'),
            }
            return (
              <WobbleBox key={company}>
                <motion.div
                  className="bg-white p-4 rounded-lg shadow-md"
                  whileHover={{scale: 1.1}}
                  whileTap={{scale: 0.9}}
                  // initial={{x: 0}}
                  // animate={{x: -1000}}
                >
                  <Link href={`/fork?${new URLSearchParams(params)}`}>
                    <Image
                      src={`/forkable-logos/${company.toLowerCase()}.svg`}
                      alt={`${company} logo`}
                      width={100}
                      height={50}
                    />
                  </Link>
                </motion.div>
              </WobbleBox>
            )
          })}
        </div>
      </div>

      <footer className="mt-16 text-center text-[#4a148c] pb-8">
        <p>
          *Funding <i>almost</i> secured. We're skipping Seed and Series A though.
        </p>
        <br />
        <p className="mb-2">
          This app uses the GitHub API to create forks. Note: yes this actually works, and no you shouldn't use it.
        </p>
        <Link
          href="https://x.com/mmkalmmkal"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#3949ab] hover:underline"
        >
          Follow me on X
        </Link>
      </footer>
    </div>
  )
}
