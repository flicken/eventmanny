import React from 'react';

import { useForm } from 'react-hook-form'

export default function AddEvent(props) {
  var summaryInput = null
  const { register, handleSubmit } = useForm()

  return (
    <form onSubmit={handleSubmit(props.onSubmit)}>
      <input type="text" name="summary" ref={elem => {summaryInput = elem; register({ required: true })(elem)}}  size="40"/>
      <input name="datetimes" ref={register({ required: true })} placeholder="e.g. Monday, 11-12"/>
      <div tabIndex="0" onFocus={(a) => {handleSubmit(props.onSubmit)(a); summaryInput.focus(); summaryInput.select()}}/>
    </form>
  )
}
