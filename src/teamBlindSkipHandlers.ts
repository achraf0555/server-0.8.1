import type Client from './Client.js'
import type {
	ActionHandlerArgs,
	ActionReadySkipBlind,
} from './actions.js'
import { isSkipBlindRow } from './blindRules.js'
import {
	clearPendingBlindReadyState,
	clearPlayerReadyToSkipBlind,
	markPlayerReadyToSkipBlind,
} from './playerState.js'
import { isPlayerExcludedFromActiveMatch } from './lobbyPlayerState/queries.js'
import { sendTeamServerAction } from './protocol/v2/index.js'
import {
	getClientSharedSyncGroupId,
	getLobbyActiveSharedSyncGroupPlayers,
	lobbyUsesSharedSyncGroup,
} from './sharedSyncGroups.js'

const normalizeSkipAnte = (ante: unknown, fallbackAnte: number) => {
	const numericAnte = Number(ante)
	if (!Number.isFinite(numericAnte)) {
		return Math.max(0, Math.trunc(fallbackAnte))
	}
	return Math.max(0, Math.trunc(numericAnte))
}

export const readySkipBlindAction = (
	{ blindRow, ante }: ActionHandlerArgs<ActionReadySkipBlind>,
	client: Client,
) => {
	const lobby = client.lobby
	if (!lobbyUsesSharedSyncGroup(lobby)) return
	if (!client.isInMatch) return
	if (!isSkipBlindRow(blindRow)) return

	const skipAnte = normalizeSkipAnte(ante, client.ante)
	markPlayerReadyToSkipBlind(client, blindRow, skipAnte)

	const players = getLobbyActiveSharedSyncGroupPlayers(
		lobby,
		getClientSharedSyncGroupId(client),
	)
	if (players.length === 0) return

	const allReadyToSkip = players.every(
		(player) =>
			player.skipReadyBlindRow === blindRow &&
			player.skipReadyBlindAnte === skipAnte,
	)
	if (!allReadyToSkip) return

	for (const player of players) {
		clearPendingBlindReadyState(player)
	}

	for (const player of players) {
		sendTeamServerAction(player, {
			action: 'teamSkipBlind',
			blindRow,
			ante: skipAnte,
		})
	}
}

export const unreadySkipBlindAction = (client: Client) => {
	const lobby = client.lobby
	if (lobby && isPlayerExcludedFromActiveMatch(lobby, client)) {
		return
	}
	clearPlayerReadyToSkipBlind(client)
}
