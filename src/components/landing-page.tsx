'use client'

import {motion} from 'framer-motion'
import {GitFork, Zap, Rocket, PartyPopper, SearchCheck} from 'lucide-react'
import {useState} from 'react'

const WobbleBox = ({children}: {children: React.ReactNode}) => {
  const [initial] = useState(() => Math.random() * 10 - 5)

  return (
    <motion.div
      initial={{rotate: initial}}
      whileHover={{rotate: [initial, 0, -5, 5, -5, 5, 0], transition: {duration: 0.5}}}
      whileDrag={{rotate: [initial, 0, -5, 5, -5, 5, 0], transition: {duration: 0.5}}}
      whileFocus={{rotate: 0}}
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
    <div className="min-h-screen bg-[#f0ebe0] flex flex-col items-center justify-center p-4 overflow-hidden pb-[300px]">
      <WobbleBox>
        <motion.div
          initial={{scale: 0}}
          animate={{scale: 1, rotate: 360}}
          transition={{type: 'spring', stiffness: 260, damping: 20}}
          className="mb-8"
        >
          <img src="/logo.webp" alt="ForkMe" width={120} height={120} />
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
          <span className="inline-block transform hover:rotate-12 transition-transform duration-300 hidden">🍴</span>{' '}
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
          <GitFork className="w-12 h-12 text-[#1a237e]" />
        </motion.div>

        <h2 className="text-4xl font-bold mb-6 text-[#1a237e]">GitHub Repo Fork-a-tron 3000</h2>
        <p className="mb-4 text-[#4a148c] text-lg">Enter a GitHub repo and watch the AI magic happen!</p>

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
              Our AI will zap your code into a masterpiece faster than you can say "neural network"!
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
              Add instant value to the codebase using our smart-replace tool. Take full ownership by with upstream
              branding find-and-replace.
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
        <video loop muted autoPlay className="w-full max-w-4xl aspect-video rounded-lg shadow-lg m-10">
          <source src={`/typescript-hypescript.webm`} type="video/webm" />
          Your browser does not support the video tag.
        </video>
      </WobbleBox>
    </div>
  )
}
