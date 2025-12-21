"use client"

import { useState } from "react"
import { useDispatch } from "react-redux"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { login, register } from "@/lib/api/auth_api"
import { setUser, setLoading } from "@/lib/slices/auth"
import type { LoginFormData, RegisterFormData } from "@/types/auth"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: "login" | "register"
}

export default function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(defaultMode)
  const [error, setError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useDispatch()

  // Login form state
  const [loginForm, setLoginForm] = useState<LoginFormData>({
    username: "",
    password: "",
  })

  // Register form state
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
    setError("")
  }

  const handleModeToggle = () => {
    setMode(mode === "login" ? "register" : "login")
    resetForms()
  }

  const handleClose = () => {
    resetForms()
    onClose()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)
    dispatch(setLoading(true))

    try {
      // Login and get authenticated user (JWT set in httpOnly cookie)
      const userData = await login({
        username: loginForm.username,
        password: loginForm.password,
      })

      // Update Redux store
      dispatch(
        setUser({
          user_id: userData.user_id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name,
        })
      )

      // Close modal
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

    // Validation
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (registerForm.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsSubmitting(true)
    dispatch(setLoading(true))

    try {
      // Register user
      await register({
        username: registerForm.username,
        email: registerForm.email,
        full_name: registerForm.full_name,
        password: registerForm.password,
      })

      // Auto-login after registration
      const loginUser = await login({
        username: registerForm.username,
        password: registerForm.password,
      })

      // Update Redux store
      dispatch(
        setUser({
          user_id: loginUser.user_id,
          username: loginUser.username,
          email: loginUser.email,
          full_name: loginUser.full_name,
        })
      )

      // Close modal
      handleClose()
    } catch (err) {
      console.error("Registration error:", err)
      setError(err instanceof Error ? err.message : "Registration failed. Username or email may already exist.")
    } finally {
      setIsSubmitting(false)
      dispatch(setLoading(false))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "login" ? "Welcome Back" : "Create Account"}</DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Sign in to your Arthik account"
              : "Sign up to get started with Arthik"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {mode === "login" ? (
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
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  )
}
