import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export { FASTAPI_BASE_URL } from "./fastapi-base-url"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
