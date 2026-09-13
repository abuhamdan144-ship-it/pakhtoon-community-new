const fs = require('fs');
const file = 'src/components/Admin.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add signInWithEmailAndPassword to imports
if (!content.includes('signInWithEmailAndPassword')) {
  content = content.replace("signInWithPopup, signOut } from 'firebase/auth';", "signInWithPopup, signInWithEmailAndPassword, signOut } from 'firebase/auth';");
}

// 2. Add state for email and password
const stateRegex = /const \[signingIn, setSigningIn\] = useState\(false\);/;
const stateMatch = content.match(stateRegex);
if (stateMatch) {
  content = content.replace(stateRegex, "const [signingIn, setSigningIn] = useState(false);\n  const [email, setEmail] = useState('');\n  const [password, setPassword] = useState('');");
}

// 3. Add handleEmailSignIn
const handleSignInRegex = /const handleSignIn = async \(\) => {[\s\S]*?};/;
const handleSignInMatch = content.match(handleSignInRegex);
if (handleSignInMatch) {
  const newHandleEmailSignIn = `
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setSigningIn(true); setAuthError('');
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (!isAuthorisedAdmin(credential.user)) {
        await signOut(auth);
        setAuthError('This account is not authorised to access the OPC administrator portal.');
      }
    } catch (error) {
      setAuthError('Invalid email or password. Please try again.');
    } finally { setSigningIn(false); }
  };
  `;
  content = content.replace(handleSignInMatch[0], handleSignInMatch[0] + newHandleEmailSignIn);
}

// 4. Update the login UI
const loginUIRegex = /<div className="px-7 py-7">[\s\S]*?<\/section>/;
const loginUIMatch = content.match(loginUIRegex);
if (loginUIMatch) {
  const newLoginUI = `
<div className="px-7 py-7">
  {authError && <div className="mb-5 flex gap-3 rounded-xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm text-red-100"><AlertTriangle size={17} /><span>{authError}</span></div>}
  <form onSubmit={handleEmailSignIn} className="mb-6 flex flex-col gap-4">
    <input type="email" placeholder="Admin Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-gold focus:ring-1 focus:ring-gold" />
    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-gold focus:ring-1 focus:ring-gold" />
    <button type="submit" disabled={signingIn} className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-gold px-5 py-3.5 font-bold text-forest-dark disabled:opacity-70">
      {signingIn ? <LoaderCircle className="animate-spin" size={19} /> : <LogIn size={19} />}
      {signingIn ? 'Signing in securely…' : 'Sign In'}
    </button>
  </form>
  <div className="relative mb-6 flex items-center py-2">
    <div className="flex-grow border-t border-white/10"></div>
    <span className="shrink-0 px-4 text-xs font-semibold uppercase tracking-widest text-white/40">Or</span>
    <div className="flex-grow border-t border-white/10"></div>
  </div>
  <button type="button" onClick={handleSignIn} disabled={signingIn} className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 font-bold text-white hover:bg-white/10 disabled:opacity-70">
    <svg viewBox="0 0 24 24" width="19" height="19" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
    Sign in with Google
  </button>
  <p className="mt-5 text-center text-xs leading-5 text-white/45">Access is restricted to authorised OPC administrators. Member records are not made public.</p>
</div>
</section>
  `;
  content = content.replace(loginUIMatch[0], newLoginUI);
}

fs.writeFileSync(file, content);
console.log('Patched Admin.jsx with email login form');
