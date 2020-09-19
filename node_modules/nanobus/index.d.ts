type NanobusListener = (...args: any[]) => void
type AttachListener = (eventName:string, listener:NanobusListener) => Nanobus

declare class Nanobus {
  private _name:string
  private _startListeners:Array<any>
  private _listeners:{[key:string]:any}
  constructor(name?:string)
  emit:(eventName:string, ...args:any[]) => Nanobus
  on:AttachListener
  addListener:AttachListener
  prependListener:AttachListener
  once:AttachListener
  prependOnceListener:AttachListener
  removeListener:AttachListener
  removeAllListeners(eventName:string):Nanobus
  listeners(eventName:string):NanobusListener[]
}

export = Nanobus