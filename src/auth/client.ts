import {AugmentedSession} from '.'
import {useSession} from 'next-auth/react'

/** Just a wrapper for next-auth/react's useSession() to correctly type the session object */
export const useAugmentedSession = () => {
  const session = useSession()
  return session as Omit<typeof session, 'data'> & {data: AugmentedSession | null}
}
