import type { BlindKind, BlindRow } from './actionShared.js'

export type ActionStartGameRequest = { action: 'startGame' }
export type ActionReadyBlind = {
	action: 'readyBlind'
	blindRow: BlindRow
	blindKind: BlindKind
	handsLeft?: number
	blindTarget?: string
}
export type ActionBlindPreview = {
	action: 'blindPreview'
	previewKey: string
	targets: Partial<Record<BlindRow, string>>
}
export type ActionCoopBossBlindRequest = {
	action: 'coopBossBlind'
	phase: 'start' | 'result'
	ante: number
	bossKey?: string
}
export type ActionUnreadyBlind = { action: 'unreadyBlind' }
export type ActionReadySkipBlind = {
	action: 'readySkipBlind'
	blindRow: 'Small' | 'Big'
	ante?: number
}
export type ActionUnreadySkipBlind = { action: 'unreadySkipBlind' }
export type ActionPlayHand = {
	action: 'playHand'
	score: string
	handsLeft: number
	blindTarget?: string
}
export type ActionFailRound = { action: 'failRound' }
export type ActionSetAnte = {
	action: 'setAnte'
	ante: number
}
export type ActionSetLocation = { action: 'setLocation'; location: string }
export type ActionNewRound = { action: 'newRound' }
export type ActionSetFurthestBlind = {
	action: 'setFurthestBlind'
	furthestBlind: number
}
export type ActionSkip = {
	action: 'skip'
	skips: number
}
type AnteTimerIntentFields = {
	localTimer?: boolean
}
export type ActionStartAnteTimerRequest = {
	action: 'startAnteTimer'
} & AnteTimerIntentFields
export type ActionPauseAnteTimerRequest = {
	action: 'pauseAnteTimer'
} & AnteTimerIntentFields
export type ActionFailTimer = { action: 'failTimer' }
export type ActionFailPvPTimer = { action: 'failPvPTimer' }
export type ActionSyncMoney = { action: 'syncMoney'; money: number }
export type ActionSendTeamMoney = {
	action: 'sendTeamMoney'
	targetPlayerId: string
	amount: number
	money: number
}

export type ActionClientMatch =
	| ActionStartGameRequest
	| ActionReadyBlind
	| ActionBlindPreview
	| ActionCoopBossBlindRequest
	| ActionUnreadyBlind
	| ActionReadySkipBlind
	| ActionUnreadySkipBlind
	| ActionPlayHand
	| ActionFailRound
	| ActionSetAnte
	| ActionSetLocation
	| ActionNewRound
	| ActionSetFurthestBlind
	| ActionSkip
	| ActionStartAnteTimerRequest
	| ActionPauseAnteTimerRequest
	| ActionFailTimer
	| ActionFailPvPTimer
	| ActionSyncMoney
	| ActionSendTeamMoney
