import React from "react"

const GlobalFilter = ({ globalFilter, setGlobalFilter, placeholder }) => {
  return (
    <input
      value={globalFilter || ""}
      onChange={e => {
        setGlobalFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
      }}
      placeholder={placeholder}
    />
  )
}

GlobalFilter.defaultProps = {
  placeholder: "Search...",
}
export default GlobalFilter
