import React, { createRef } from 'react'
import ReactDOM from 'react-dom/client'
import { useResizeDetector } from 'react-resize-detector'
import { Client, type IFrame, type Message } from '@stomp/stompjs'
import { type GameState } from '@src/types/GameState'
import { type GameMap } from '@src/types/GameMap'
import { type Player } from '@src/types/Player'
import { errorResult, type Result, valueResult } from '@src/utils/Result'
import { isGameMap, isGameState } from './utils/typeUtils'
import Chat from '@src/components/Chat'
import Scoreboard from '@src/components/Scoreboard'
import { Toggle } from '@src/components/Toggle'
import Map from '@src/Map'
import beerImage from '@src/assets/beer.png'
import '@src/index.css'

interface GameStateChanged {
  reason?: string
  gameState?: GameState
  newMap?: GameMap
}

function ErrorMessage ({ message }: { message: string }): JSX.Element {
  return (
    <p className="text-sm text-red-500 uppercase py-4">{message}</p>
  )
}

function ContainerWidth ({ containerRef, children }: {
  children: (containerWidth: number) => JSX.Element
  containerRef: React.RefObject<any>
}): JSX.Element {
  const { width: containerWidth } = useResizeDetector({ targetRef: containerRef })

  if (containerWidth === undefined) {
    return (
      <p className="text-sm uppercase py-4">Loading...</p>
    )
  }

  return <>
    {children(containerWidth)}
  </>
}

class App extends React.Component<unknown, {
  gameState: Result<GameState>
  gameMap: Result<GameMap>
  players: Player[]
  finishedPlayers: Player[]
  chatMessages: string[]
  showBeer: boolean
  showItemLabels: boolean
  showMapGrid: boolean
}> {
  private readonly maxMessages = 10
  private stompClient: Client | undefined
  private readonly containerRef: React.RefObject<any>

  constructor (props: unknown) {
    super(props)
    this.containerRef = createRef()
    this.state = {
      gameMap: errorResult('No game map.'),
      gameState: errorResult('No game state.'),
      players: [],
      finishedPlayers: [],
      chatMessages: [],
      showBeer: false,
      showItemLabels: true,
      showMapGrid: false
    }
  }

  comparePlayersByName (a: Player, b: Player): number {
    const nameA = a.name.toUpperCase()
    const nameB = b.name.toUpperCase()

    if (nameA < nameB) {
      return -1
    }
    if (nameA > nameB) {
      return 1
    }

    return 0
  }

  comparePlayersByScore (a: Player, b: Player): number {
    const scoreA = a.money + a.score
    const scoreB = b.money + b.score

    return scoreA - scoreB
  }

  derivedGameState (gameState: Result<GameState>): ({
    gameState: Result<GameState>
    players: Player[]
    finishedPlayers: Player[]
  }) {
    const players = (gameState.ok ? [...gameState.value.players] : [])
      .sort(this.comparePlayersByName)
    const finishedPlayers = (gameState.ok ? [...gameState.value.finishedPlayers] : [])
      .sort(this.comparePlayersByScore)

    return {
      gameState,
      players,
      finishedPlayers
    }
  }

  async componentDidMount (): Promise<void> {
    const gameMap = await fetch(import.meta.env.VITE_MAP_ENDPOINT)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Fetching map failed: ${response.status}`)
        }

        return await response.json()
      })
      .catch((err) => err)

    this.setState((state) => ({
      ...state,
      gameMap: isGameMap(gameMap) ? valueResult(gameMap) : errorResult(gameMap)
    }))

    const stompClient = new Client({
      brokerURL: import.meta.env.VITE_WEBSOCKET_ENDPOINT,
      connectionTimeout: 10_000,
      reconnectDelay: 10_000
    })

    stompClient.onConnect = () => {
      stompClient.subscribe('/topic/chat', (message: Message) => {
        this.handleChatEvent(message)
      })

      stompClient.subscribe('/topic/events', (message: Message) => {
        this.handleGameEvent(message)
      })
    }

    stompClient.onWebSocketError = (event: any) => {
      this.setState((state) => ({
        ...state,
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        gameMap: errorResult(`WebSocket error: ${event}`),
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        ...this.derivedGameState(errorResult(`WebSocket error: ${event}`))
      }))
    }

    stompClient.onStompError = (frame: IFrame) => {
      this.setState((state) => ({
        ...state,
        gameMap: errorResult(`Stomp error: ${frame.command}`),
        ...this.derivedGameState(errorResult(`Stomp error: ${frame.command}`))
      }))
    }

    this.stompClient = stompClient
    stompClient.activate()
  }

  handleChatEvent (message: Message): void {
    const newMessage = message.body
    this.setState((state) => ({
      ...state,
      chatMessages: [
        newMessage,
        ...state.chatMessages.slice(0, this.maxMessages - 1)
      ]
    }))
  }

  handleGameEvent (message: Message): void {
    const stateChange = JSON.parse(message.body) as GameStateChanged
    const newMap = stateChange.newMap
    const newState = stateChange.gameState

    if (isGameMap(newMap)) {
      this.setState((state) => ({
        ...state,
        gameMap: valueResult(newMap)
      }))
    } else if (isGameState(newState)) {
      this.setState((state) => ({
        ...state,
        ...this.derivedGameState(valueResult(newState))
      }))
    }
  }

  handleToggle (key: 'showBeer' | 'showItemLabels' | 'showMapGrid', value: boolean): void {
    this.setState((state) => ({
      ...state,
      [key]: value
    }))
  }

  async componentWillUnmount (): Promise<void> {
    await this.stompClient?.deactivate()
  }

  render (): JSX.Element {
    const {
      gameState,
      gameMap,
      players,
      finishedPlayers,
      chatMessages,
      showBeer,
      showMapGrid,
      showItemLabels
    } = this.state

    return (
      <div className="mx-auto min-h-screen bg-zinc-900 tracking-wider">
        <header className="flex flex-row sticky top-0 p-4 bg-zinc-800 border-4 border-zinc-800 border-b-zinc-400">
          <div className="flex-1 self-center">
            <h2 className="text-xs">Bots of Black Friday</h2>
          </div>
          <div>
            {gameMap.ok &&
              <h1 className="text-transparent text-2xl bg-clip-text bg-gradient-to-b from-amber-800 to-amber-100">
                {gameMap.value.name}
              </h1>
            }
          </div>
          <div className="flex-1"></div>
        </header>
        <div ref={this.containerRef} className="p-4">
          {!gameMap.ok && <ErrorMessage
            message={`Game map error: ${JSON.stringify(gameMap.error, null, '  ')}`}
          />}
          {!gameState.ok && <ErrorMessage
            message={`Game state error: ${JSON.stringify(gameState.error, null, '  ')}`}
          />}
          {gameMap.ok && gameState.ok && <ContainerWidth containerRef={this.containerRef}>
            {(containerWidth) => <Map
              gameMap={gameMap.value}
              gameState={gameState.value}
              containerWidth={containerWidth}
              showBeer={showBeer}
              showMapGrid={showMapGrid}
              showItemLabels={showItemLabels}
            />}
          </ContainerWidth>}
          <div className="flex flex-row gap-4 pt-4">
            <div className="flex-1">
              <Toggle
                id="show-map-grid"
                label="Map grid"
                checked={showMapGrid}
                onChange={(v) => { this.handleToggle('showMapGrid', v) }}
              />
            </div>
            <div className="flex-1">
              <Toggle
                id="show-item-labels"
                label="Item labels"
                checked={showItemLabels}
                onChange={(v) => { this.handleToggle('showItemLabels', v) }}
              />
            </div>
            <div className="flex-1">
              <Toggle
                id="show-beer"
                label={<img className="inline" src={beerImage} alt="🍺" />}
                checked={showBeer}
                onChange={(v) => { this.handleToggle('showBeer', v) }}
              />
            </div>
          </div>
          <div className="flex flex-row gap-4 pt-4">
            <div className="flex-1 rounded bg-zinc-700 p-4">
              <h3 className="text-sm uppercase pb-4">
                Active players
              </h3>
              <Scoreboard players={players} />
            </div>
            <div className="flex-1 rounded bg-zinc-700 p-4">
              <h3 className="text-sm uppercase pb-4">
                Scoreboard
              </h3>
              <Scoreboard players={finishedPlayers} />
            </div>
            <div className="flex-1 rounded bg-zinc-700 p-4">
              <h3 className="text-sm uppercase pb-4">
                Chat
              </h3>
              <Chat messages={chatMessages} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
