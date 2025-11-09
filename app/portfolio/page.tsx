import { redirect } from 'next/navigation'

export default function PortfolioRedirectPage() {
  // Redirect legacy /portfolio route to /holdings to remove portfolio implementation.
  redirect('/holdings')
}
