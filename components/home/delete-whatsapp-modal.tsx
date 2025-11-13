"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteWhatsAppModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  phoneNumber: string
}

export function DeleteWhatsAppModal({
  isOpen,
  onClose,
  onConfirm,
  phoneNumber,
}: DeleteWhatsAppModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete WhatsApp Integration</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove WhatsApp integration for{" "}
            <span className="font-semibold">{phoneNumber}</span>? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

