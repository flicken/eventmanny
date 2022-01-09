import React from 'react'

import { useForm } from 'react-hook-form'

export default function AddEvent({onSubmit, ...props}) {
  const summaryRef = useRef(null);
  const { register, handleSubmit } = useForm()
  const { ref, ...rest } = register("summary", {required: true});


  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...rest} type="text" name="summary" size="40" ref={(e) => {
        ref(e);
        summaryRef.current = e;
      }}/>
      <input name="datetimes" ref={...register("datetimes", { required: true })} placeholder="e.g. Monday, 11-12"/>
      <div tabIndex="0" onFocus={(a) => {handleSubmit(onSubmit)(a); summaryRef.current.focus(); summaryRef.current.select()}}/>
    </form>
  )
}
