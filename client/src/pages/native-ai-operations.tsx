import { useCallback, useEffect, useRef, useState } from 'react'
import NativeAdvisoryWorkspace from '../components/NativeAdvisoryWorkspace'
import Header from '../components/layout/header'
import { useSearch } from 'wouter'
import { operationsExamples } from '../lib/operations-presets'
const configuredOrigin = import.meta.env.VITE_NATIVE_RUNTIME_API_ORIGIN || ''
function runtimeOrigin() {
  if (!configuredOrigin) return ''
  try { const url = new URL(configuredOrigin); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.origin : '' } catch { return '' }
}
export default function NativeAIOperations() {
  const origin = runtimeOrigin()
  const search = useSearch()
  const demo = operationsExamples.find(example => example.id === new URLSearchParams(search).get('demo'))
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [credentialNotice, setCredentialNotice] = useState('')
  const runtimeCredentialFillAllowed = import.meta.env.DEV && import.meta.env.VITE_NATIVE_RUNTIME_ENABLE_CREDENTIAL_AUTOFILL === 'true'
  const runtimeCredentialsAvailable = runtimeCredentialFillAllowed && Boolean(import.meta.env.VITE_NATIVE_RUNTIME_DEMO_EMAIL?.trim()) && Boolean(import.meta.env.VITE_NATIVE_RUNTIME_DEMO_PASSWORD)
  const [session, setSession] = useState<{ token: string; email: string } | null>(null)
  const pending = useRef<AbortController | null>(null)
  useEffect(() => () => { pending.current?.abort(); pending.current = null }, [])
  const cancel = () => { pending.current?.abort(); pending.current = null; setBusy(false) }
  const authenticate = async (credentials: { email: string; password: string }) => {
    if (!origin || pending.current) return
    const controller = new AbortController(); pending.current = controller; setBusy(true); setError('')
    try {
      const response = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials), signal: controller.signal }); const body = await response.json()
      if (!response.ok || typeof body.token !== 'string') throw new Error(body.error || 'AI sign-in failed')
      const me = await fetch(origin + '/api/auth/me', { headers: { Authorization: 'Bearer ' + body.token }, signal: controller.signal }); const actor = await me.json()
      if (!me.ok || !actor.user?.id || typeof actor.user.email !== 'string') throw new Error('AI session verification failed')
      if (pending.current !== controller || controller.signal.aborted) return
      setSession({ token: body.token, email: actor.user.email }); setPassword('')
    } catch (failure) { if (pending.current === controller && !controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'AI sign-in failed') }
    finally { if (pending.current === controller) { pending.current = null; setBusy(false) } }
  }
  const signin = (event: React.FormEvent) => { event.preventDefault(); void authenticate({ email, password }) }
  const demoLogin = () => {
    if (!runtimeCredentialsAvailable || busy) return
    const credentials = { email: import.meta.env.VITE_NATIVE_RUNTIME_DEMO_EMAIL.trim().toLowerCase(), password: import.meta.env.VITE_NATIVE_RUNTIME_DEMO_PASSWORD }
    setEmail(credentials.email); setPassword(credentials.password); setError(''); setCredentialNotice('Opening the configured AI demo workspace…'); void authenticate(credentials)
  }
  const request = useCallback(async (method: 'GET' | 'POST' | 'DELETE', body: unknown, signal: AbortSignal) => {
    if (!session) throw new Error('AI runtime sign-in required')
    const response = await fetch(origin + '/api/ai/nonprofit-guidance', { method, headers: { Authorization: 'Bearer ' + session.token, ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}) }, ...(method !== 'GET' ? { body: JSON.stringify(body) } : {}), signal }); const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'AI request failed')
    return result
  }, [origin, session])
  return <><Header/><main style={{ padding: '32px 24px', maxWidth: 1500, margin: 'auto' }}>{session ? <><div className="na-workspace"><p>AI workspace signed in as {session.email}</p><button type="button" onClick={() => { cancel(); setSession(null) }}>Close AI session</button></div><NativeAdvisoryWorkspace title={"Nonprofit operations advisory"} description={"Review program operations, evidence gaps and cautious next actions. Eligibility, coverage and legal decisions remain in their authorized human workflows."} endpoint={"/api/ai/nonprofit-guidance"} maxPrompt={8000} presets={operationsExamples} initialPrompt={demo?.prompt ?? ''} requestImpl={request} retainedEvidence/></> : <section className="na-workspace"><header className="na-heading"><span>AI OPERATIONS</span><h1>Nonprofit operations advisory</h1><p>Use your existing AI runtime account to open your saved operational reports. Three Demo AI buttons fill the entire prompt, including its context, before you choose Generate.</p>{demo && <p className="na-notice">{demo.label} selected. Its full prompt will be loaded after your AI workspace sign-in; no AI request has been sent.</p>}</header><div className="na-card">{!origin ? <p role="alert" className="na-alert">AI workspace configuration is unavailable. Start the app with its configured native launcher to connect the AI runtime.</p> : <form onSubmit={signin}><h2>Sign in to the AI workspace</h2><p>Program permissions and all eligibility, coverage and legal review requirements remain in their existing workflows.</p><label htmlFor="native-ai-email">Email</label><input id="native-ai-email" type="email" autoComplete="username" required value={email} disabled={busy} onChange={event => { setEmail(event.target.value); setCredentialNotice('') }}/><label htmlFor="native-ai-password">Password</label><input id="native-ai-password" type="password" autoComplete="current-password" required value={password} disabled={busy} onChange={event => { setPassword(event.target.value); setCredentialNotice('') }}/>{error && <p role="alert" className="na-alert">{error}</p>}<p id="native-ai-prefill-status" role="status" className="na-muted">{runtimeCredentialsAvailable ? credentialNotice || 'Demo AI login opens this separate configured AI workspace in one click.' : import.meta.env.PROD ? 'Credential autofill is disabled in production. Enter your AI runtime account details.' : 'Configured credentials are unavailable for this separate AI runtime account. Enter its email and password.'}</p><div className="na-actions"><button type="button" onClick={demoLogin} disabled={busy || !runtimeCredentialsAvailable} aria-describedby="native-ai-prefill-status">{busy ? 'Opening demo workspace…' : 'Log in as Demo AI'}</button><button type="submit" className="na-primary" disabled={busy}>{busy ? 'Verifying session…' : 'Sign in to AI workspace'}</button>{busy && <button type="button" onClick={cancel}>Cancel</button>}</div></form>}</div></section>}</main></>
}
