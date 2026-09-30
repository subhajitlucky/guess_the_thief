/**
 * Socket layer — replaces socket.io-client with partysocket.
 *
 * Two things changed underneath, and this module hides both so that all
 * twenty existing components keep working untouched:
 *
 * 1. The room is in the URL, not in a message. A Durable Object is addressed
 *    by path, so there is no server-side room table to look up. The socket
 *    therefore opens at /room/<CODE>?name=<user>, which means the room code
 *    has to exist before we can connect.
 *
 *    To avoid threading that through every component, this proxy connects
 *    lazily: the first emit() carrying a `roomCode` opens the socket, and any
 *    earlier emit() is queued and flushed on open. CreateRoom and
 *    JoinRoom therefore keep calling socket.emit('create-room', {...})
 *    exactly as before.
 *
 * 2. Socket.IO framing is gone. Messages are flat JSON with `t` as the event
 *    name. The `t` key exists so a payload field of `type` survives intact —
 *    PublicChat renders msg.type for CSS, which a shared `type` key would
 *    have clobbered.
 */

import PartySocket from 'partysocket'

const WS_BASE =
  import.meta.env.VITE_WS_URL ||
  (import.meta.env.DEV ? 'ws://localhost:8787' : window.location.host)

const listeners = new Map() // event -> Set<handler>
const queue = []           // messages emitted before the socket opened

let real = null
let connected = false
let currentRoom = null
let currentUser = null

function dispatch(event, payload) {
  const handlers = listeners.get(event)
  if (!handlers) return
  for (const fn of handlers) {
    try {
      fn(payload)
    } catch (err) {
      console.error('socket handler failed for', event, err)
    }
  }
}

function open(roomCode, username) {
  if (real && currentRoom === roomCode) return
  if (real) real.close()

  currentRoom = roomCode
  currentUser = username

  const url = `${WS_BASE}/room/${roomCode}?name=${encodeURIComponent(username)}`
  real = new PartySocket({ url })

  real.addEventListener('open', () => {
    connected = true
    dispatch('connect', { roomCode, username })
    const pending = queue.splice(0, queue.length)
    for (const msg of pending) real.send(JSON.stringify(msg))
  })

  real.addEventListener('message', (event) => {
    let data
    try {
      data = JSON.parse(event.data)
    } catch {
      return
    }
    const { t, ...payload } = data
    if (t) dispatch(t, payload)
  })

  real.addEventListener('close', () => {
    connected = false
    dispatch('disconnect', { roomCode: currentRoom })
  })

  real.addEventListener('error', () => {
    dispatch('connect_error', {})
  })
}

const socket = {
  /** Stable identity, so React effects keyed on `socket` behave as before. */
  connectTo(roomCode, username) {
    open(roomCode, username)
  },

  on(event, handler) {
    if (!listeners.has(event)) listeners.set(event, new Set())
    listeners.get(event).add(handler)
    return socket
  },

  off(event) {
    listeners.get(event)?.clear()
    return socket
  },

  /**
   * Connects on demand: any payload carrying a roomCode establishes the
   * socket, because the room has to be in the path before we can reach it.
   */
  emit(event, payload = {}) {
    const message = { t: event, ...payload }
    const target = payload.roomCode ?? currentRoom

    if (target && (!real || currentRoom !== target)) {
      open(target, payload.username ?? currentUser ?? 'guest')
      queue.push(message)
      return socket
    }

    if (real && connected) real.send(JSON.stringify(message))
    else queue.push(message)

    return socket
  },

  get connected() {
    return connected
  },

  get room() {
    return currentRoom
  },
}

export default socket
