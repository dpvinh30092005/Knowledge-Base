import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { portfolioApi } from '@/features/shared/portfolio/api/portfolioApi';
import { ROUTES } from '@/shared';

// sessionStorage keys shared with GithubSyncModal's "Connect GitHub" kickoff.
export const GH_LINK_STATE_KEY = 'gh_link_state';
export const GH_LINK_RETURN_KEY = 'gh_link_return';

/**
 * Landing page for GitHub's OAuth redirect in the "Connect for repo sync" flow. Verifies the
 * CSRF state, exchanges the code via the backend (which binds the token to the signed-in
 * student), then returns to wherever the student started, flagging the result so the portfolio
 * can reopen the sync picker.
 */
export const GithubLinkCallback = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Connecting your GitHub account…');
  const [failed, setFailed] = useState(false);
  // React 18 StrictMode double-invokes effects in dev; the code is single-use, so guard it.
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const oauthError = params.get('error');

    const returnPath = sessionStorage.getItem(GH_LINK_RETURN_KEY) || ROUTES.DASHBOARD_STUDENT_PORTFOLIO;
    const expectedState = sessionStorage.getItem(GH_LINK_STATE_KEY);
    sessionStorage.removeItem(GH_LINK_STATE_KEY);
    sessionStorage.removeItem(GH_LINK_RETURN_KEY);

    const back = (flag: string) => {
      const sep = returnPath.includes('?') ? '&' : '?';
      navigate(`${returnPath}${sep}github=${flag}`, { replace: true });
    };

    if (oauthError) {
      setFailed(true);
      setMessage('GitHub authorization was cancelled.');
      setTimeout(() => back('error'), 1200);
      return;
    }
    if (!code || !state || !expectedState || state !== expectedState) {
      setFailed(true);
      setMessage('This GitHub link is invalid or expired. Please try again.');
      setTimeout(() => back('error'), 1400);
      return;
    }

    portfolioApi
      .linkGithubComplete(code)
      .then(() => back('connected'))
      .catch(() => {
        setFailed(true);
        setMessage('Could not finish connecting GitHub. Please try again.');
        setTimeout(() => back('error'), 1400);
      });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-slate-600">
      {failed ? <AlertCircle className="text-amber-500" size={32} /> : <Loader2 className="animate-spin" size={32} />}
      <p className="text-sm">{message}</p>
    </div>
  );
};
