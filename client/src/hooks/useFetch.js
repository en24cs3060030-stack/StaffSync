import { useCallback, useEffect, useState } from 'react'

// const { data, loading, error, reload } = useFetch(() => api.get('/x'), [dep])
export default function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)

  const load = useCallback(() => {
    let active = true
    setState((s) => ({ ...s, loading: true, error: '' }))
    run()
      .then((data) => active && setState({ data, loading: false, error: '' }))
      .catch((e) => active && setState({ data: null, loading: false, error: e.message }))
    return () => { active = false }
  }, [run])

  useEffect(() => load(), [load])

  return { ...state, reload: load }
}
