"use client"

import { GoogleLogin } from "@react-oauth/google"
import { useState, useEffect, useCallback } from "react"
import { useDispatch } from "react-redux"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { googleLogin, login, register, verifyOtp } from "@/features/auth/apis/auth-api"
import { setUser, setLoading } from "@/features/auth/redux"
import { useToast } from "@/hooks/use-toast"
import type { LoginFormData, RegisterFormData } from "@/features/auth/redux"
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { FEATURE_FLAGS } from "@/lib/feature-flags"

const RESEND_COOLDOWN_SECONDS = 63

const HAS_GOOGLE_AUTH =
  typeof process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID === "string" &&
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.length > 0

const HIDE_BASIC_AUTH = FEATURE_FLAGS.HIDE_BASIC_AUTH

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: "login" | "register"
}

export default function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "verify-otp">(defaultMode)
  const [error, setError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [otpValue, setOtpValue] = useState("")
  const [pendingEmail, setPendingEmail] = useState("")
  const [pendingUsername, setPendingUsername] = useState("")
  const [pendingPassword, setPendingPassword] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const dispatch = useDispatch()
  const { toast } = useToast()

  const formatCooldown = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [resendCooldown])

  const [loginForm, setLoginForm] = useState<LoginFormData>({
    username: "",
    password: "",
  })

  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    username: "",
    email: "",
    full_name: "",
    password: "",
    confirmPassword: "",
  })

  const resetForms = () => {
    setLoginForm({ username: "", password: "" })
    setRegisterForm({
      username: "",
      email: "",
      full_name: "",
      password: "",
      confirmPassword: "",
    })
    setOtpValue("")
    setPendingEmail("")
    setPendingUsername("")
    setPendingPassword("")
    setResendCooldown(0)
    setError("")
  }

  useEffect(() => {
    if (!isOpen || !HIDE_BASIC_AUTH || mode !== "verify-otp") return
    setMode("login")
    setOtpValue("")
    setPendingEmail("")
    setPendingUsername("")
    setPendingPassword("")
    setError("")
  }, [isOpen, HIDE_BASIC_AUTH, mode])

  const handleModeToggle = () => {
    setMode(mode === "login" ? "register" : "login")
    resetForms()
  }

  const handleBackToRegister = () => {
    setMode("register")
    setOtpValue("")
    setError("")
  }

  const handleClose = () => {
    resetForms()
    setMode(defaultMode)
    onClose()
  }

  const handleGoogleSuccess = async (credential?: string) => {
    if (!credential) {
      setError("Google did not return a credential. Try again.")
      return
    }
    setError("")
    setIsSubmitting(true)
    dispatch(setLoading(true))
    try {
      const userData = await googleLogin(credential)
      dispatch(
        setUser({
          user_id: userData.user_id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name,
        })
      )
      handleClose()
    } catch (err) {
      console.error("Google login error:", err)
      setError(err instanceof Error ? err.message : "Google sign-in failed")
    } finally {
      setIsSubmitting(false)
      dispatch(setLoading(false))
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)
    dispatch(setLoading(true))

    try {
      const userData = await login({
        username: loginForm.username,
        password: loginForm.password,
      })

      dispatch(
        setUser({
          user_id: userData.user_id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name,
        })
      )

      handleClose()
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "Invalid username or password")
    } finally {
      setIsSubmitting(false)
      dispatch(setLoading(false))
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (registerForm.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        username: registerForm.username,
        email: registerForm.email,
        full_name: registerForm.full_name,
        password: registerForm.password,
      })

      setPendingEmail(registerForm.email)
      setPendingUsername(registerForm.username)
      setPendingPassword(registerForm.password)

      setResendCooldown(RESEND_COOLDOWN_SECONDS)

      setMode("verify-otp")
    } catch (err) {
      console.error("Registration error:", err)
      setError(err instanceof Error ? err.message : "Registration failed. Username or email may already exist.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit code")
      return
    }

    setIsSubmitting(true)
    dispatch(setLoading(true))

    try {
      await verifyOtp({
        email: pendingEmail,
        otp: otpValue,
      })

      const loginUser = await login({
        username: pendingUsername,
        password: pendingPassword,
      })

      dispatch(
        setUser({
          user_id: loginUser.user_id,
          username: loginUser.username,
          email: loginUser.email,
          full_name: loginUser.full_name,
        })
      )

      handleClose()
    } catch (err) {
      console.error("OTP verification error:", err)
      setError(err instanceof Error ? err.message : "Invalid or expired OTP. Please try again.")
    } finally {
      setIsSubmitting(false)
      dispatch(setLoading(false))
    }
  }

  const handleResendOtp = async () => {
    setError("")
    setIsSubmitting(true)

    try {
      await register({
        username: pendingUsername,
        email: pendingEmail,
        full_name: registerForm.full_name,
        password: pendingPassword,
      })
      setOtpValue("")
      toast({
        title: "OTP sent successfully",
        description: `A new verification code has been sent to ${pendingEmail}`,
      })
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      console.error("Resend OTP error:", err)
      setError(err instanceof Error ? err.message : "Failed to resend OTP. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" && "Welcome Back"}
            {mode === "register" && "Create Account"}
            {mode === "verify-otp" && "Verify Your Email"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login" && "Sign in to your Arthik account"}
            {mode === "register" && "Sign up to get started with Arthik"}
            {mode === "verify-otp" && "We've sent a verification code to your email"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {mode === "verify-otp" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3 rounded-xl bg-[#0F1621]/60 border border-white/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#22d3ee]/10">
                <Mail className="h-5 w-5 text-[#22d3ee]" />
              </div>
              <div className="text-left">
                <p className="text-sm text-[#9AA7B2]">Code sent to</p>
                <p className="font-medium text-white">{pendingEmail}</p>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <Label className="text-sm text-[#9AA7B2]">Enter 6-digit code</Label>
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  onChange={(value) => setOtpValue(value)}
                  disabled={isSubmitting}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="h-12 w-12 text-lg border-white/10 bg-[#0F1621]/60 data-[active=true]:border-[#22d3ee] data-[active=true]:ring-[#22d3ee]/20" />
                    <InputOTPSlot index={1} className="h-12 w-12 text-lg border-white/10 bg-[#0F1621]/60 data-[active=true]:border-[#22d3ee] data-[active=true]:ring-[#22d3ee]/20" />
                    <InputOTPSlot index={2} className="h-12 w-12 text-lg border-white/10 bg-[#0F1621]/60 data-[active=true]:border-[#22d3ee] data-[active=true]:ring-[#22d3ee]/20" />
                    <InputOTPSlot index={3} className="h-12 w-12 text-lg border-white/10 bg-[#0F1621]/60 data-[active=true]:border-[#22d3ee] data-[active=true]:ring-[#22d3ee]/20" />
                    <InputOTPSlot index={4} className="h-12 w-12 text-lg border-white/10 bg-[#0F1621]/60 data-[active=true]:border-[#22d3ee] data-[active=true]:ring-[#22d3ee]/20" />
                    <InputOTPSlot index={5} className="h-12 w-12 text-lg border-white/10 bg-[#0F1621]/60 data-[active=true]:border-[#22d3ee] data-[active=true]:ring-[#22d3ee]/20" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] text-black font-medium hover:from-[#67e8f9] hover:to-[#22d3ee] shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all"
                disabled={isSubmitting || otpValue.length !== 6}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Verify & Create Account
                  </span>
                )}
              </Button>
            </form>

            <div className="space-y-3 text-center">
              <p className="text-sm text-[#9AA7B2]">
                Didn't receive the code?{" "}
                {resendCooldown > 0 ? (
                  <span className="text-[#9AA7B2]/60 font-medium">
                    Resend in {formatCooldown(resendCooldown)}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[#22d3ee] hover:text-[#67e8f9] font-medium transition-colors"
                    disabled={isSubmitting}
                  >
                    Resend
                  </button>
                )}
              </p>
              <button
                type="button"
                onClick={handleBackToRegister}
                className="flex items-center gap-1 mx-auto text-sm text-[#9AA7B2] hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-3 w-3" />
                Back to registration
              </button>
            </div>
          </div>
        ) : mode === "login" ? (
          <div className="space-y-4">
            {HAS_GOOGLE_AUTH ? (
              <>
                <div
                  className={cn(
                    "flex w-full justify-center [&>div]:!w-full",
                    isSubmitting && "pointer-events-none opacity-60"
                  )}
                >
                  <GoogleLogin
                    onSuccess={(res) => void handleGoogleSuccess(res.credential ?? undefined)}
                    onError={() => setError("Google sign-in was cancelled or failed")}
                    useOneTap={false}
                    theme="filled_black"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    width={384}
                  />
                </div>
                {!HIDE_BASIC_AUTH ? (
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wide">
                      <span className="bg-background px-3 text-muted-foreground">or</span>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
            {!HIDE_BASIC_AUTH ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="johndoe"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={handleModeToggle}
                    className="text-primary hover:underline font-medium"
                    disabled={isSubmitting}
                  >
                    Sign up
                  </button>
                </p>
              </form>
            ) : !HAS_GOOGLE_AUTH ? (
              <Alert variant="destructive">
                <AlertDescription>
                  Sign-in is not available. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID or disable NEXT_PUBLIC_HIDE_BASIC_AUTH.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {HAS_GOOGLE_AUTH ? (
              <>
                <div
                  className={cn(
                    "flex w-full justify-center [&>div]:!w-full",
                    isSubmitting && "pointer-events-none opacity-60"
                  )}
                >
                  <GoogleLogin
                    onSuccess={(res) => void handleGoogleSuccess(res.credential ?? undefined)}
                    onError={() => setError("Google sign-in was cancelled or failed")}
                    useOneTap={false}
                    theme="filled_black"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    width={384}
                  />
                </div>
                {!HIDE_BASIC_AUTH ? (
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wide">
                      <span className="bg-background px-3 text-muted-foreground">or</span>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
            {!HIDE_BASIC_AUTH ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="johndoe"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="john@example.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-fullname">Full Name</Label>
                  <Input
                    id="register-fullname"
                    type="text"
                    placeholder="John Doe"
                    value={registerForm.full_name}
                    onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                    minLength={8}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Confirm Password</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerForm.confirmPassword}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                    }
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={handleModeToggle}
                    className="text-primary hover:underline font-medium"
                    disabled={isSubmitting}
                  >
                    Sign in
                  </button>
                </p>
              </form>
            ) : !HAS_GOOGLE_AUTH ? (
              <Alert variant="destructive">
                <AlertDescription>
                  Sign-in is not available. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID or disable NEXT_PUBLIC_HIDE_BASIC_AUTH.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
