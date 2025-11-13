"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { BrokerPayload } from "@/lib/api/client"

interface ConnectBrokerModalProps {
  isOpen: boolean
  onClose: () => void
  brokers: BrokerPayload[]
  onSubmit: (brokerId: string) => void
}

export function ConnectBrokerModal({
  isOpen,
  onClose,
  brokers,
  onSubmit,
}: ConnectBrokerModalProps) {
  const [brokerType, setBrokerType] = useState<string>("")
  const [country, setCountry] = useState<string>("")
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("")

  // Extract unique broker types
  const brokerTypes = useMemo(() => {
    const types = new Set(brokers.map((b) => b.broker_type))
    return Array.from(types).sort()
  }, [brokers])

  // Extract unique countries based on selected broker type
  const availableCountries = useMemo(() => {
    if (!brokerType) return []
    const countries = new Set(
      brokers
        .filter((b) => b.broker_type === brokerType)
        .map((b) => b.country)
    )
    return Array.from(countries).sort()
  }, [brokers, brokerType])

  // Filter brokers based on selected broker type and country
  const filteredBrokers = useMemo(() => {
    if (!brokerType || !country) return []
    return brokers
      .filter((b) => b.broker_type === brokerType && b.country === country)
      .sort((a, b) => a.broker_name.localeCompare(b.broker_name))
  }, [brokers, brokerType, country])

  // Reset dependent selections when filters change
  const handleBrokerTypeChange = (value: string) => {
    setBrokerType(value)
    setCountry("")
    setSelectedBrokerId("")
  }

  const handleCountryChange = (value: string) => {
    setCountry(value)
    setSelectedBrokerId("")
  }

  const handleSubmit = () => {
    if (selectedBrokerId) {
      onSubmit(selectedBrokerId)
      handleClose()
    }
  }

  const handleClose = () => {
    // Reset form state
    setBrokerType("")
    setCountry("")
    setSelectedBrokerId("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect Broker</DialogTitle>
          <DialogDescription>
            Select your broker type, country, and specific broker to connect your account.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Broker Type Dropdown */}
          <div className="grid gap-2">
            <Label htmlFor="broker-type">Broker Type</Label>
            <Select value={brokerType} onValueChange={handleBrokerTypeChange}>
              <SelectTrigger id="broker-type">
                <SelectValue placeholder="Select broker type" />
              </SelectTrigger>
              <SelectContent>
                {brokerTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country Dropdown */}
          <div className="grid gap-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={country}
              onValueChange={handleCountryChange}
              disabled={!brokerType}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {availableCountries.map((countryName) => (
                  <SelectItem key={countryName} value={countryName}>
                    {countryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Broker Name Dropdown */}
          <div className="grid gap-2">
            <Label htmlFor="broker-name">Broker Name</Label>
            <Select
              value={selectedBrokerId}
              onValueChange={setSelectedBrokerId}
              disabled={!country}
            >
              <SelectTrigger id="broker-name">
                <SelectValue placeholder="Select broker" />
              </SelectTrigger>
              <SelectContent>
                {filteredBrokers.map((broker) => (
                  <SelectItem key={broker.broker_id} value={broker.broker_id}>
                    {broker.broker_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedBrokerId}>
            Connect Broker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

