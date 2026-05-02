"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  A2uiSurface,
  MarkdownContext,
  basicCatalog,
  createBinderlessComponentImplementation,
  createComponentImplementation,
  type ReactComponentImplementation,
} from "@a2ui/react/v0_9"
import { renderMarkdown } from "@a2ui/markdown-it"
import {
  Catalog,
  DynamicStringSchema,
  DynamicValueSchema,
  MessageProcessor,
  type A2uiClientAction,
  type A2uiClientDataModel,
  type A2uiMessage,
  type DynamicValue,
} from "@a2ui/web_core/v0_9"
import { ButtonApi, TextFieldApi } from "@a2ui/web_core/v0_9/basic_catalog"
import { z } from "zod"

import { cn } from "@/lib/utils"
import type { A2UIClientEvent } from "@/features/chat/redux/chat.types"

import {
  clearLiveA2UISurfaceValues,
  getFieldDirtyPath,
  getFieldNameFromDataPath,
  getLiveA2UIFieldValidationErrors,
  getLiveA2UIDirtyFieldNames,
  getLiveA2UIFieldValues,
  rememberLiveFieldValue,
  subscribeLiveA2UIValidationErrors,
} from "@/features/chat/components/a2-ui/live-field-values"
import { A2UIBadge, normalizeBadgeVariant } from "@/features/chat/components/a2-ui/custom-components/a2ui-badge"
import {
  A2UIBasicTextField,
  type BasicTextFieldProps,
} from "@/features/chat/components/a2-ui/custom-components/a2ui-basic-text-field"
import {
  A2UIBasicSelectField,
  type BasicSelectOption,
} from "@/features/chat/components/a2-ui/custom-components/a2ui-basic-select-field"
import {
  A2UIChart,
  normalizeChartType,
  type ChartDataPoint,
  type ChartSeriesDefinition,
} from "@/features/chat/components/a2-ui/custom-components/a2ui-chart"
import type { TableColumn } from "@/features/chat/components/a2-ui/custom-components/a2ui-data-table"
import { A2UIDataTable } from "@/features/chat/components/a2-ui/custom-components/a2ui-data-table"
import { A2UIInfoBox, normalizeInfoBoxVariant } from "@/features/chat/components/a2-ui/custom-components/a2ui-info-box"
import { A2UIMetricCard } from "@/features/chat/components/a2-ui/custom-components/a2ui-metric-card"
import { A2UISourceList } from "@/features/chat/components/a2-ui/custom-components/a2ui-source-list"

export const FINANCE_CHAT_CATALOG_ID =
  "https://explainly.ai/catalogs/finance-chat-v1.json"
export const A2UI_STORED_DOCUMENT_TYPE = "a2ui_v0_9_document"
export const A2UI_MAIN_SURFACE_ID = "main"
export const A2UI_HITL_SURFACE_ID = "hitl-form"

export {
  clearLiveA2UISurfaceValues,
  getLiveA2UIDirtyFieldNames,
  getLiveA2UIFieldValues,
  setLiveA2UIValidationErrors,
} from "@/features/chat/components/a2-ui/live-field-values"

// ---------------------------------------------------------------------------
// Official A2UI v0.9 catalog + finance extensions
// ---------------------------------------------------------------------------

const BadgeApi = {
  name: "Badge",
  schema: z.object({
    text: DynamicStringSchema,
    variant: z.enum(["success", "warning", "error", "info", "neutral"]).optional(),
  }),
}

const MetricCardApi = {
  name: "MetricCard",
  schema: z.object({
    label: DynamicStringSchema,
    value: DynamicStringSchema,
    change: DynamicStringSchema.optional(),
  }),
}

const InfoBoxApi = {
  name: "InfoBox",
  schema: z.object({
    text: DynamicStringSchema,
    variant: z.enum(["info", "warning", "success", "error"]).optional(),
  }),
}

const DataTableApi = {
  name: "DataTable",
  schema: z.object({
    columns: DynamicValueSchema,
    rows: DynamicValueSchema,
  }),
}

const SourceListApi = {
  name: "SourceList",
  schema: z.object({
    sources: DynamicValueSchema,
    title: DynamicStringSchema.optional(),
  }),
}

const SelectFieldApi = {
  name: "SelectField",
  schema: z
    .object({
      label: DynamicStringSchema,
      value: DynamicStringSchema.optional(),
      options: z.array(
        z
          .object({
            label: DynamicStringSchema,
            value: z.string(),
          })
          .strict()
      ),
    })
    .strict(),
}

const ChartApi = {
  name: "Chart",
  schema: z.object({
    chartType: z.enum(["pie", "bar", "line", "area"]),
    title: DynamicStringSchema.optional(),
    data: DynamicValueSchema,
    series: DynamicValueSchema.optional(),
    xKey: DynamicStringSchema.optional(),
    colors: DynamicValueSchema.optional(),
    unit: DynamicStringSchema.optional(),
  }),
}

function isDynamicPath(value: unknown): value is { path: string } {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    "path" in value &&
    typeof (value as { path?: unknown }).path === "string"
  )
}

function isDynamicValue(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    ("path" in value || "call" in value)
  )
}

function normalizeTextFieldVariant(
  value: unknown
): NonNullable<BasicTextFieldProps["variant"]> {
  return value === "longText" ||
    value === "number" ||
    value === "shortText" ||
    value === "obscured"
    ? value
    : "shortText"
}

function useLiveA2UIValidationErrors(surfaceId: string, fieldName: string | null): string[] {
  useSyncExternalStore(
    subscribeLiveA2UIValidationErrors,
    () => JSON.stringify(fieldName ? getLiveA2UIFieldValidationErrors(surfaceId, fieldName) : []),
    () => "[]"
  )

  return fieldName ? getLiveA2UIFieldValidationErrors(surfaceId, fieldName) : []
}

const TextFieldComponent = createBinderlessComponentImplementation(
  TextFieldApi,
  ({ context }) => {
    const [, refresh] = useState(0)
    const rawProps = context.componentModel.properties
    const valueBinding = rawProps.value

    const resolveProp = useCallback(
      (value: unknown) =>
        isDynamicValue(value)
          ? context.dataContext.resolveDynamicValue(value as DynamicValue)
          : value,
      [context]
    )

    const getCurrentValue = useCallback(() => {
      const resolved = resolveProp(valueBinding)
      return resolved === null || resolved === undefined ? "" : String(resolved)
    }, [resolveProp, valueBinding])

    const [draft, setDraft] = useState(getCurrentValue)

    useEffect(() => {
      setDraft(getCurrentValue())
    }, [getCurrentValue])

    useEffect(() => {
      const subscription = context.componentModel.onUpdated.subscribe(() => {
        refresh((revision) => revision + 1)
      })
      return () => subscription.unsubscribe()
    }, [context])

    useEffect(() => {
      if (!isDynamicPath(valueBinding)) return

      const subscription = context.dataContext.subscribeDynamicValue<string>(
        valueBinding,
        (nextValue) => {
          setDraft(nextValue === null || nextValue === undefined ? "" : String(nextValue))
        }
      )

      return () => subscription.unsubscribe()
    }, [context, valueBinding])

    const setBoundValue = useCallback(
      (nextValue: string) => {
        setDraft(nextValue)
        if (isDynamicPath(valueBinding)) {
          rememberLiveFieldValue(context.dataContext.surface.id, valueBinding.path, nextValue)
          context.dataContext.set(valueBinding.path, nextValue)
          const fieldName = getFieldNameFromDataPath(valueBinding.path)
          if (fieldName) {
            context.dataContext.set(getFieldDirtyPath(fieldName), true)
          }
        }
      },
      [context, valueBinding]
    )
    const fieldName = isDynamicPath(valueBinding)
      ? getFieldNameFromDataPath(valueBinding.path)
      : null
    const validationErrors = useLiveA2UIValidationErrors(
      context.dataContext.surface.id,
      fieldName
    )

    return (
      <A2UIBasicTextField
        label={String(resolveProp(rawProps.label) ?? "")}
        value={draft}
        variant={normalizeTextFieldVariant(rawProps.variant)}
        setValue={setBoundValue}
        validationErrors={validationErrors}
        fieldName={fieldName ?? undefined}
      />
    )
  }
)

const SelectFieldComponent = createBinderlessComponentImplementation(
  SelectFieldApi,
  ({ context }) => {
    const [, refresh] = useState(0)
    const rawProps = context.componentModel.properties
    const valueBinding = rawProps.value

    const resolveProp = useCallback(
      (value: unknown) =>
        isDynamicValue(value)
          ? context.dataContext.resolveDynamicValue(value as DynamicValue)
          : value,
      [context]
    )

    const getCurrentValue = useCallback(() => {
      const resolved = resolveProp(valueBinding)
      return resolved === null || resolved === undefined ? "" : String(resolved)
    }, [resolveProp, valueBinding])

    const [draft, setDraft] = useState(getCurrentValue)

    useEffect(() => {
      setDraft(getCurrentValue())
    }, [getCurrentValue])

    useEffect(() => {
      const subscription = context.componentModel.onUpdated.subscribe(() => {
        refresh((revision) => revision + 1)
      })
      return () => subscription.unsubscribe()
    }, [context])

    useEffect(() => {
      if (!isDynamicPath(valueBinding)) return

      const subscription = context.dataContext.subscribeDynamicValue<string>(
        valueBinding,
        (nextValue) => {
          setDraft(nextValue === null || nextValue === undefined ? "" : String(nextValue))
        }
      )

      return () => subscription.unsubscribe()
    }, [context, valueBinding])

    const setBoundValue = useCallback(
      (nextValue: string) => {
        setDraft(nextValue)
        if (isDynamicPath(valueBinding)) {
          rememberLiveFieldValue(context.dataContext.surface.id, valueBinding.path, nextValue)
          context.dataContext.set(valueBinding.path, nextValue)
          const fieldNameFromPath = getFieldNameFromDataPath(valueBinding.path)
          if (fieldNameFromPath) {
            context.dataContext.set(getFieldDirtyPath(fieldNameFromPath), true)
          }
        }
      },
      [context, valueBinding]
    )
    const boundFieldName = isDynamicPath(valueBinding)
      ? getFieldNameFromDataPath(valueBinding.path)
      : null
    const validationErrors = useLiveA2UIValidationErrors(
      context.dataContext.surface.id,
      boundFieldName
    )

    const rawOptions = rawProps.options as unknown
    const options: BasicSelectOption[] = Array.isArray(rawOptions)
      ? rawOptions.flatMap((row) => {
          if (!row || typeof row !== "object") return []
          const r = row as { label?: unknown; value?: unknown }
          const opt: BasicSelectOption = {
            label: String(resolveProp(r.label) ?? ""),
            value: r.value == null ? "" : String(r.value),
          }
          return opt.value === "" ? [] : [opt]
        })
      : []

    return (
      <A2UIBasicSelectField
        label={String(resolveProp(rawProps.label) ?? "")}
        value={draft}
        options={options}
        setValue={setBoundValue}
        validationErrors={validationErrors}
        fieldName={boundFieldName ?? undefined}
      />
    )
  }
)

const ButtonComponent = createComponentImplementation(ButtonApi, ({ props, buildChild }) => {
  const isPrimary = props.variant === "primary"
  const isBorderless = props.variant === "borderless"

  return (
    <button
      type="button"
      onClick={props.action}
      disabled={props.isValid === false}
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        isPrimary &&
          "border border-cyan-400/30 bg-cyan-400 text-slate-950 hover:bg-cyan-300",
        isBorderless && "px-1 text-cyan-300 hover:text-cyan-100",
        !isPrimary &&
          !isBorderless &&
          "border border-white/12 bg-white/[0.05] text-gray-100 hover:bg-white/[0.08]"
      )}
    >
      {props.child ? buildChild(props.child) : null}
    </button>
  )
})

const BadgeComponent = createComponentImplementation(BadgeApi, ({ props }) => (
  <A2UIBadge
    text={String(props.text ?? "")}
    variant={normalizeBadgeVariant(props.variant)}
  />
))

const MetricCardComponent = createComponentImplementation(MetricCardApi, ({ props }) => (
  <A2UIMetricCard
    label={String(props.label ?? "")}
    value={String(props.value ?? "")}
    change={props.change !== undefined ? String(props.change) : undefined}
  />
))

const InfoBoxComponent = createComponentImplementation(InfoBoxApi, ({ props }) => (
  <A2UIInfoBox
    text={String(props.text ?? "")}
    variant={normalizeInfoBoxVariant(props.variant)}
  />
))

const DataTableComponent = createComponentImplementation(DataTableApi, ({ props }) => (
  <A2UIDataTable
    columns={Array.isArray(props.columns) ? (props.columns as TableColumn[]) : []}
    rows={Array.isArray(props.rows) ? (props.rows as unknown[]) : []}
  />
))

const SourceListComponent = createComponentImplementation(SourceListApi, ({ props }) => (
  <A2UISourceList
    sources={Array.isArray(props.sources) ? (props.sources as unknown[]) : []}
    title={props.title !== undefined ? String(props.title) : undefined}
  />
))

const ChartComponent = createComponentImplementation(ChartApi, ({ props }) => (
  <A2UIChart
    chartType={normalizeChartType(props.chartType)}
    title={props.title !== undefined ? String(props.title) : undefined}
    data={Array.isArray(props.data) ? (props.data as ChartDataPoint[]) : []}
    series={Array.isArray(props.series) ? (props.series as ChartSeriesDefinition[]) : undefined}
    xKey={props.xKey !== undefined ? String(props.xKey) : "name"}
    colors={Array.isArray(props.colors) ? (props.colors as string[]) : undefined}
    unit={props.unit !== undefined ? String(props.unit) : undefined}
  />
))

const financeChatComponents: ReactComponentImplementation[] = [
  ...Array.from(basicCatalog.components.values()),
  TextFieldComponent,
  SelectFieldComponent,
  ButtonComponent,
  BadgeComponent,
  MetricCardComponent,
  InfoBoxComponent,
  DataTableComponent,
  SourceListComponent,
  ChartComponent,
]

export const financeChatCatalog = new Catalog<ReactComponentImplementation>(
  FINANCE_CHAT_CATALOG_ID,
  financeChatComponents,
  Array.from(basicCatalog.functions.values())
)

export interface A2UIStoredDocument {
  type: typeof A2UI_STORED_DOCUMENT_TYPE
  mainSurfaceId: string
  messages: A2uiMessage[]
}

export function parseStoredA2UIDocument(raw: string | undefined | null): A2UIStoredDocument | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      parsed.type === A2UI_STORED_DOCUMENT_TYPE &&
      typeof parsed.mainSurfaceId === "string" &&
      Array.isArray(parsed.messages)
    ) {
      return parsed as A2UIStoredDocument
    }
  } catch {
    return null
  }

  return null
}

function getA2UIMessageFromEvent(event: A2UIClientEvent): A2uiMessage | null {
  if (event.event !== "a2ui_message") return null
  const payload = event.payload as { message?: A2uiMessage }
  return payload.message ?? null
}

export type A2UIActionHandler = (
  action: A2uiClientAction,
  clientDataModel?: A2uiClientDataModel
) => void | Promise<void>

export function useA2UIMessageProcessor({
  messageKey,
  events = [],
  content,
  onAction,
}: {
  messageKey: string
  events?: A2UIClientEvent[]
  content?: string
  onAction?: A2UIActionHandler
}) {
  const actionHandlerRef = useRef<A2UIActionHandler | undefined>(onAction)
  const processorRef = useRef<MessageProcessor<ReactComponentImplementation> | null>(null)
  const processedEventIdsRef = useRef<Set<string>>(new Set())
  const processedStoredContentRef = useRef<string | null>(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    actionHandlerRef.current = onAction
  }, [onAction])

  useEffect(() => {
    const processor = new MessageProcessor<ReactComponentImplementation>(
      [financeChatCatalog],
      async (action) => {
        const syncedDataModel = processor.getClientDataModel()
        const actionSurfaceData = processor.model
          .getSurface(action.surfaceId)
          ?.dataModel.get("/")
        const liveFields = getLiveA2UIFieldValues(action.surfaceId)
        const liveDirtyFieldNames = getLiveA2UIDirtyFieldNames(action.surfaceId)
        const hasLiveFields = Object.keys(liveFields).length > 0
        const actionSurfaceFieldMeta =
          actionSurfaceData && typeof actionSurfaceData === "object"
            ? ((actionSurfaceData as { fieldMeta?: Record<string, Record<string, unknown>> })
                .fieldMeta ?? {})
            : {}
        const liveFieldMeta = Object.fromEntries(
          liveDirtyFieldNames.map((fieldName) => [
            fieldName,
            {
              ...(actionSurfaceFieldMeta[fieldName] ?? {}),
              dirty: true,
            },
          ])
        )
        const mergedSurfaceData =
          actionSurfaceData && typeof actionSurfaceData === "object"
            ? {
                ...actionSurfaceData,
                fields: {
                  ...((actionSurfaceData as { fields?: Record<string, unknown> }).fields ?? {}),
                  ...liveFields,
                },
                fieldMeta: {
                  ...actionSurfaceFieldMeta,
                  ...liveFieldMeta,
                },
              }
            : hasLiveFields
              ? { fields: liveFields, fieldMeta: liveFieldMeta }
              : undefined
        const clientDataModel =
          mergedSurfaceData
            ? ({
                version: "v0.9",
                surfaces: {
                  ...(syncedDataModel?.surfaces ?? {}),
                  [action.surfaceId]: mergedSurfaceData,
                },
              } satisfies A2uiClientDataModel)
            : syncedDataModel

        await actionHandlerRef.current?.(action, clientDataModel)
      }
    )

    processorRef.current = processor
    processedEventIdsRef.current = new Set()
    processedStoredContentRef.current = null

    const createdSub = processor.onSurfaceCreated(() => {
      setRevision((v) => v + 1)
    })
    const deletedSub = processor.onSurfaceDeleted(() => {
      setRevision((v) => v + 1)
    })

    setRevision((v) => v + 1)

    return () => {
      createdSub.unsubscribe()
      deletedSub.unsubscribe()
      processor.model.dispose()
      processorRef.current = null
    }
  }, [messageKey])

  useEffect(() => {
    const processor = processorRef.current
    if (!processor || !content || processedEventIdsRef.current.size > 0) return
    if (processedStoredContentRef.current === content) return

    const stored = parseStoredA2UIDocument(content)
    if (!stored) return

    try {
      for (const message of stored.messages) {
        if ("createSurface" in message) {
          clearLiveA2UISurfaceValues(message.createSurface.surfaceId)
        }
      }
      processor.processMessages(stored.messages)
      processedStoredContentRef.current = content
      setRevision((v) => v + 1)
    } catch (error) {
      console.error("Failed to process stored A2UI document", error)
    }
  }, [content])

  useEffect(() => {
    const processor = processorRef.current
    if (!processor || !events.length) return

    let processedAny = false

    for (const event of events) {
      const message = getA2UIMessageFromEvent(event)
      if (!message || processedEventIdsRef.current.has(event.id)) continue

      try {
        if ("createSurface" in message) {
          clearLiveA2UISurfaceValues(message.createSurface.surfaceId)
        }
        processor.processMessages([message])
        processedEventIdsRef.current.add(event.id)
        processedAny = true
      } catch (error) {
        console.error("Failed to process streamed A2UI message", error, message)
      }
    }

    if (processedAny) {
      setRevision((v) => v + 1)
    }
  }, [events])

  const getSurface = useCallback(
    (surfaceId: string) => processorRef.current?.model.getSurface(surfaceId) ?? null,
    [revision]
  )

  return {
    processor: processorRef.current,
    revision,
    getSurface,
  }
}

export function findLatestHitlFormPayload(
  events: A2UIClientEvent[] | undefined
): { threadId: string; surfaceId: string; task?: string } | null {
  if (!events?.length) return null

  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i]
    if (event.event !== "hitl_form") continue

    const payload = event.payload as {
      thread_id?: string
      surface_id?: string
      task?: string
    }

    if (typeof payload.thread_id === "string" && typeof payload.surface_id === "string") {
      return {
        threadId: payload.thread_id,
        surfaceId: payload.surface_id,
        task: typeof payload.task === "string" ? payload.task : undefined,
      }
    }
  }

  return null
}

export function A2UIOfficialSurface({
  messageKey,
  events,
  content,
  surfaceId,
  onAction,
}: {
  messageKey: string
  events?: A2UIClientEvent[]
  content?: string
  surfaceId: string
  onAction?: A2UIActionHandler
}) {
  const { getSurface } = useA2UIMessageProcessor({
    messageKey,
    events,
    content,
    onAction,
  })

  const surface = getSurface(surfaceId)
  if (!surface) return null

  return (
    <div className="a2ui-dark">
      <MarkdownContext.Provider value={renderMarkdown}>
        <A2uiSurface surface={surface} />
      </MarkdownContext.Provider>
    </div>
  )
}

export function renderMarkdownFallback(content: string): ReactNode {
  return (
    <div className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-p:text-gray-200 prose-a:text-cyan-400 prose-strong:text-white prose-table:text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
