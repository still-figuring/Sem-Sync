import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { loginWithGoogle } from "../../lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError("Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="text-lg font-bold tracking-tight">
            Sem<span className="text-primary">Sync</span>
          </span>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  placeholder="student@university.edu"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-muted-foreground"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-primary hover:text-primary/90"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <svg
                className="h-4 w-4"
                aria-hidden="true"
                focusable="false"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to SemSync?{" "}
            <Link
              to="/register"
              className="font-medium text-primary hover:text-primary/80"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
