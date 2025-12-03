# Home Components

This directory contains modular components for the home page, which manages user integrations and broker connections.

## Components

### 1. WhatsAppIntegrationCard
**File:** `whatsapp-integration-card.tsx`

Displays WhatsApp integration status and provides connection/disconnection functionality.

**Features:**
- Shows "Connect WhatsApp" button when not connected
- Displays connected phone number when integration exists
- Inline delete button for removing integration
- Triggers delete confirmation modal

**Props:**
```typescript
interface WhatsAppIntegrationCardProps {
  whatsappData: WhatsAppPayload | null
  onConnect: () => void
  onDelete: () => void
}
```

### 2. DeleteWhatsAppModal
**File:** `delete-whatsapp-modal.tsx`

Confirmation modal for deleting WhatsApp integration.

**Features:**
- Warning dialog with phone number display
- Cancel and Delete actions
- Uses AlertDialog component for accessibility

**Props:**
```typescript
interface DeleteWhatsAppModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  phoneNumber: string
}
```

### 3. ConnectBrokerModal
**File:** `connect-broker-modal.tsx`

Modal with cascading dropdowns for broker selection.

**Features:**
- Three-level filtering: Broker Type → Country → Broker Name
- Automatically filters options based on previous selections
- Resets dependent fields when parent selection changes
- Disabled states for dependent dropdowns

**Props:**
```typescript
interface ConnectBrokerModalProps {
  isOpen: boolean
  onClose: () => void
  brokers: BrokerPayload[]
  onSubmit: (brokerId: string) => void
}
```

**Dropdown Flow:**
1. Select broker type (e.g., "Stock", "Crypto")
2. Select country (filtered by broker type)
3. Select specific broker (filtered by both type and country)

## Page

### HomePage
**File:** `app/home/page.tsx`

Main home page that orchestrates all components.

**Features:**
- Fetches home feed data from `/api/home` endpoint
- Displays loading skeletons during data fetch
- Error handling with redirect to login on 401
- WhatsApp integration management
- Broker connection flow
- Grid layout showing available brokers

**API Integration:**
- `GET /api/home` - Fetches home feed data
- Returns `HomeFeedSchema` with:
  - `chat_integrations`: Array with WhatsApp data
  - `available_brokers`: Array of broker information

## Type Definitions

All types are defined in `lib/api/integrations_api.ts`:

```typescript
interface WhatsAppPayload {
  id: string
  user_e164: string
}

interface ChatIntegration {
  whatsapp: WhatsAppPayload | null
}

interface BrokerPayload {
  broker_id: string
  broker_name: string
  broker_type: string
  country: string
}

interface HomeFeedSchema {
  chat_integrations: ChatIntegration[]
  available_brokers: BrokerPayload[]
}
```

## Usage

```tsx
import { WhatsAppIntegrationCard, ConnectBrokerModal } from "@/components/home"

// Or import individually
import { WhatsAppIntegrationCard } from "@/components/home/whatsapp-integration-card"
```

## TODO Items

The following functionality is marked for future implementation:

1. **WhatsApp Connection Flow** - Complete OAuth/connection flow for WhatsApp
2. **WhatsApp Deletion API** - Backend endpoint for removing WhatsApp integration
3. **Multi-Broker Support** - Connection flows for brokers other than Zerodha/Kite

## Styling

All components use:
- Tailwind CSS for styling
- shadcn/ui components for consistency
- Lucide React icons
- Responsive design with mobile-first approach
