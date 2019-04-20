const debug = require('debug')('rpc-events:RemoteProcedureWorker')
const { eventNameToMethodName } = require('./utils')

class RemoteProcedureWorker {
  //This is user space version.
  //Setup your version of task handler when define extends class.
  get version() { return  '0.0.1' }

  constructor({ server, clientControlQueue, baseCorrelationId, command, queueName, taskOptions }) {
    this.server = server
    this.clientControlQueue = clientControlQueue
    this.baseCorrelationId = baseCorrelationId
    this.command = command
    this.incommingEvents = []
    this.outgoingEvents = []
    let { state, ...options } = taskOptions || {}
    this.state = {
      status: 'started',
      start_at: Date.now(),
      ...state
    }
    this.taskOptions = options || {}
    this.init()

    debug(`execute: ${this.command} v${this.version}`)
    debug(`incommingEvents: ${this.incommingEvents.join(', ')}`)
    debug(`outgoingEvents: ${this.outgoingEvents.join(', ')}`)
  }

  init() {
    let obj = this
    while(obj) {
      Object.getOwnPropertyNames(obj).forEach(key => {
        const m1 = /^onClientEvent(.{1,70})$/.exec(key)
        if (m1) this.incommingEvents.push(m1[1].toUpperCase())

        const m2 = /^sendEvent(.{1,70})$/.exec(key)
        if (m2) this.outgoingEvents.push(m2[1].toUpperCase())
      })
      obj = obj.__proto__
    }

    if(this.taskOptions.onClientEvent) {
      Object.keys(this.taskOptions.onClientEvent).forEach(key => {
        key = key.toUpperCase()
        if (this.outgoingEvents.indexOf(key) === -1) this.events.push(key)
      })
    }
  }

  setState(newState) {
    this.state = {
      ...this.state,
      ...newState
    }
  }

  stateToJSON(state) {
    return state
  }

  sendEvent(event, protocolProperties, payload) {
    return this.server.sendEventToClient(this, event, protocolProperties, payload)
  }

  sendEventError({code, message}, payload) {
    if(!code) code = 100
    return this.server.sendErrorToClient(this, { code, message, finish: true }, payload)
  }

  sendEventCompleted(result, payload) {
    this.setState({
      status: 'completed',
      completed_at: Date.now(),
    })
    return this.server.sendEventToClient(this, 'COMPLETED', { result, finish: true }, payload)
  }

  sendEventProgress(state, payload) {
    if(!state) {
      state = this.stateToJSON(this.state)
    }
    return this.server.sendEventToClient(this, 'PROGRESS', { state }, payload)
  }

  sendEventCanceled(state, payload) {
    if(!state) {
      state = this.stateToJSON(this.state)
    }
    if(!this.state.canceled_at || !this.state.canceled)
    this.setState({
      status: 'canceled',
      canceled_at: Date.now(),
    })
    return this.server.sendEventToClient(this, 'CANCELED', { state, finish: true }, payload)
  }

  sendEventPong(payload) {
    return this.server.sendEventToClient(this, 'PONG', {}, payload)
  }

  onClientEventCancel(content) {
    this.setState({
      status: 'canceled',
      canceled_at: Date.now(),
    })
  }

  onClientEventPing(content) {
    this.sendEventPong()
  }

  onClientEvent(content) {
    const methodName = eventNameToMethodName('onClientEvent', content.event)
    if(typeof this[methodName] === "function") this[methodName](content)
  }

  async parseIncommingMessage(content, contentType) {
    if(/^(application\/([\w\.-]+)?(json|x-javascript)|text\/(x-)?javascript|x-json)(;.*)?$/.test(contentType)) {
      content = JSON.parse(content.toString())
      switch(typeof content) {
        case 'number':
        case 'boolean':
        case 'string':
        case 'undefined':
        case 'function':
          contentType = typeof content
          break
        case 'object':
          if(content === null) {
            contentType = 'null'
          } else if(Array.isArray(content)) {
            contentType = 'array'
          } else {
            contentType = 'object'
          }
      }
      return {
        content,
        contentType
      }
    }
    return { content, contentType }
  }

  async execute(content, contentType) {
    //place your handler code here

    debug(`execute: ${this.command} v${this.version}`)
    debug(`incommingEvents: ${this.incommingEvents.join(', ')}`)
    debug(`outgoingEvents: ${this.outgoingEvents.join(', ')}`)
    debug(`content: ${content instanceof Buffer ? content.length + 'bytes, ': ''}contentType ${contentType}`)
  }
}


module.exports = { RemoteProcedureWorker }