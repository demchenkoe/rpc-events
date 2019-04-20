const debug = require('debug')('rpc-events:RemoteProcedureCaller')
const { eventNameToMethodName } = require('./utils')

class RemoteProcedureCaller {
  constructor({serverControlQueue, baseCorrelationId, client, worker, taskOptions }) {
    this.serverControlQueue = serverControlQueue
    this.baseCorrelationId = baseCorrelationId
    this.worker = worker
    this.client = client
    this.taskOptions = taskOptions || {}
  }

  sendEventToServer(event, properties, payload) {
    debug(`send event: ${event}`)
    return this.client.sendEventToServer(this, event, properties, payload)
  }

  onServerEvent(content) {
    debug(`receive event: ${content.event}`)
    const methodName1 = eventNameToMethodName('onServerEvent', content.event)
    if(typeof this[methodName1] === 'function') {
      this.taskOptions[methodName1](content)
    }
    const methodName2 = eventNameToMethodName('on', content.event)
    if(typeof this.taskOptions[methodName2] === 'function') {
      this.taskOptions[methodName2](content)
    }
  }
}

module.exports = { RemoteProcedureCaller }