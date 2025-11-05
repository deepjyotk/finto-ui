"use client"
import { useState } from "react"
import { useDispatch } from "react-redux"
import { useRouter } from "next/navigation"
import { logout } from "@/lib/features/auth/auth-slice"
import { signOut } from "@/lib/auth/session"
import UserInitialsAvatar from "@/components/landing/UserInitialsAvatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function UserMenu({ 
  name, 
  email 
}: { 
  name?: string
  email?: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const router = useRouter()

  const onConfirmLogout = async () => {
    try {
      setLoading(true)
      const { success } = await signOut()
      if (success) {
        dispatch(logout())
        router.push("/")
      }
    } catch (err) {
      console.error("Failed to sign out", err)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          aria-label="User menu"
          className="inline-flex items-center justify-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <UserInitialsAvatar name={name} email={email} size={32} />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out?</AlertDialogTitle>
          <AlertDialogDescription>
            You will be signed out of Finto.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmLogout} disabled={loading}>
            {loading ? "Signing out…" : "Sign out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}


