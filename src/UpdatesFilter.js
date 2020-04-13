import React from 'react';

import { useForm } from 'react-hook-form'

import { DateTime } from "luxon";
import chrono from "chrono-node";

import {parseDatetime, parseUpdatesSince} from "./dates"

export default function UpdatesFilter(props) {
  const {onValidated, title, value} = props
  const { register, handleSubmit, errors } = useForm({
    mode: 'onChange',
  })

  console.log("errors")
  console.log(errors)

  return (
    <form onSubmit={handleSubmit( onValidated)}>
      {title} <input
          name="since"
          type="text"
          defaultValue={props.defaultValue}
          placeholder={props.placeholder}
          ref={register({ required: true, validate: value => parseUpdatesSince(value) && onValidated(value) })}
          />
      {errors.since && <div style={{color:"red"}}>Invalid relative date time, try "a week ago"</div>}
    </form>
  )
}
