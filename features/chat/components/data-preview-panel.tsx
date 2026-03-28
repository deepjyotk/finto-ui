"use client"

import { useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { AgGridReact } from "ag-grid-react"
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  themeQuartz,
} from "ag-grid-community"
import { Table2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AppDispatch } from "@/lib/store"
import { setChatPanelOpen, selectChatPanelOpen } from "@/features/chat/redux"

ModuleRegistry.registerModules([AllCommunityModule])

const gridDarkTheme = themeQuartz.withParams({
  backgroundColor: "#0B0F14",
  foregroundColor: "#E5EAF2",
  borderColor: "rgba(255,255,255,0.08)",
  headerBackgroundColor: "#141920",
  headerFontSize: 13,
  headerFontWeight: 600,
  headerTextColor: "#a0aec0",
  rowHoverColor: "rgba(255,255,255,0.04)",
  selectedRowBackgroundColor: "rgba(34,211,238,0.08)",
  rangeSelectionBorderColor: "#22d3ee",
  cellHorizontalPadding: 16,
  rowBorder: { color: "rgba(255,255,255,0.04)" },
  columnBorder: false,
  wrapperBorderRadius: 0,
  fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  fontSize: 13,
})

interface DataPreviewPanelProps {
  rowData?: Record<string, unknown>[]
  columnDefs?: ColDef[]
}

export default function DataPreviewPanel({
  rowData = [],
  columnDefs: externalColumnDefs,
}: DataPreviewPanelProps) {
  const dispatch = useDispatch<AppDispatch>()
  const chatPanelOpen = useSelector(selectChatPanelOpen)

  const defaultColumnDefs = useMemo<ColDef[]>(
    () => [
      { field: "symbol", headerName: "Symbol", width: 110, pinned: "left" },
      { field: "company", headerName: "Company", flex: 1, minWidth: 150 },
      { field: "qty", headerName: "Qty", width: 80 },
      {
        field: "avgPrice",
        headerName: "Avg Price",
        width: 120,
        valueFormatter: (p) =>
          p.value != null ? `₹${Number(p.value).toLocaleString("en-IN")}` : "",
      },
      {
        field: "currentPrice",
        headerName: "Current Price",
        width: 135,
        valueFormatter: (p) =>
          p.value != null ? `₹${Number(p.value).toLocaleString("en-IN")}` : "",
      },
      {
        field: "value",
        headerName: "Value",
        width: 130,
        valueFormatter: (p) =>
          p.value != null ? `₹${Number(p.value).toLocaleString("en-IN")}` : "",
      },
      {
        field: "pnl",
        headerName: "P&L",
        width: 110,
        valueFormatter: (p) =>
          p.value != null ? `₹${Number(p.value).toLocaleString("en-IN")}` : "",
        cellStyle: (p) => ({
          color: p.value != null && p.value >= 0 ? "#22c55e" : "#ef4444",
        }),
      },
      {
        field: "pnlPercent",
        headerName: "P&L %",
        width: 100,
        valueFormatter: (p) =>
          p.value != null ? `${Number(p.value).toFixed(2)}%` : "",
        cellStyle: (p) => ({
          color: p.value != null && p.value >= 0 ? "#22c55e" : "#ef4444",
        }),
      },
    ],
    []
  )

  const columnDefs = externalColumnDefs ?? defaultColumnDefs

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  )

  return (
    <div className="flex h-full flex-col bg-[#0B0F14]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Table2 className="h-4 w-4 text-[#22d3ee]" />
          <span className="text-sm font-semibold text-white">Live Preview</span>
          {rowData.length > 0 && (
            <span className="text-xs text-gray-500 ml-1">
              {rowData.length} row{rowData.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!chatPanelOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(setChatPanelOpen(true))}
              className="h-7 gap-1.5 text-gray-400 hover:text-white hover:bg-white/10 px-2.5"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-xs">Chat</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {rowData.length > 0 ? (
          <AgGridReact
            theme={gridDarkTheme}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows
            rowSelection="multiple"
            suppressCellFocus
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <Table2 className="h-7 w-7 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">
                  No data to preview
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Chat with AI to generate and visualise data
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
