interface ZabbixItem {
    host: string
    key: string
    value: any
    clock?: number
    ns?: number
  }
  
  interface ZabbixSenderOptions {
    host?: string
    port?: number
    timeout?: number
    with_ns?: boolean
    with_timestamps?: boolean
    items_host?: string
  }
  
  interface ZabbixResponse {
    response: string
    info: string
  }
  
  declare class ZabbixSender {
    constructor(opts?: ZabbixSenderOptions)
  
    host: string
    port: number
    timeout: number
    with_ns: boolean
    with_timestamps: boolean
    items_host: string
  
    addItem(host: string, key: string, value: any): ZabbixSender
    addItem(key: string, value: any): ZabbixSender
  
    clearItems(): ZabbixSender
    countItems(): number
  
    send(callback: (err: Error | null, response: ZabbixResponse, items: ZabbixItem[]) => void): void
  }
  
  declare module 'node-zabbix-sender' {
    export = ZabbixSender
  }
  