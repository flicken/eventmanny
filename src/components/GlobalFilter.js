import React from "react"

const GlobalFilter = ({ globalFilter, setGlobalFilter }) => {
  return (
    <input
      value={globalFilter || ""}
      onChange={e => {
        setGlobalFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
      }}
      placeholder={`Search calendars ...`}
    />
  )
}

export default GlobalFilter
