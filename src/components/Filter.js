import React from "react"

import {useState} from "react"

const Filter = ({ filter, onChange, onDelete, placeholder, onFocus, ...rest }) => {
  const [value, setValue] = useState(filter)

  return (
    <input
      {...rest}
      value={value || ""}
      onChange={e => {
        let v = e.target.value
        console.log("onChange", value, v)
        setValue(v || undefined)
        onChange(v || undefined)
      }}
      onBlur={e => {
        if (!e.target.value) {
          onDelete()
        }
      }}
      onFocus={onFocus}
      placeholder={placeholder}
    />
  )
}

Filter.defaultProps = {
  placeholder: "Search events..."
}

export default Filter
