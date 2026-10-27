import { isRecord, sanitizeText } from "@oh-my-pi/pi-utils";
import {
	replaceTabs,
	shortenEmbeddedPaths,
	shortenPath,
	TRUNCATE_LENGTHS,
	truncateToWidth,
} from "@oh-my-pi/pi-tui/render/render-utils";

export const MCP_CONNECTION_STATUS_EVENT_CHANNEL = "mcp:connection-status";

export type McpConnectionFailure = {
	serverName: string;
	error: string;
	sourcePath?: string;
};

export type McpConnectionStatusEvent =
	| { type: "connecting"; serverNames: string[] }
	| { type: "reconnecting"; serverName: string }
	| { type: "connected"; serverName: string }
	| ({ type: "failed" } & McpConnectionFailure);

export type McpConnectionStatusSnapshot = {
	pendingServers: readonly string[];
	connectedServers: readonly string[];
	failedServers: readonly McpConnectionFailure[];
};

function sanitizeMcpStatusText(value: string, maxWidth: number): string {
	const text = shortenEmbeddedPaths(
		replaceTabs(sanitizeText(value))
			.replace(/[\r\n]+/g, " ")
			.trim(),
	);
	return truncateToWidth(text.length > 0 ? text : "(unnamed)", maxWidth);
}

function sanitizeMcpServerName(serverName: string): string {
	return sanitizeMcpStatusText(serverName, TRUNCATE_LENGTHS.SHORT);
}

function formatServerList(serverNames: readonly string[]): string {
	return serverNames.map(sanitizeMcpServerName).join(", ");
}

function formatServerCount(_count: number): string {
	// 中文没有单复数，量词固定。
	return "个服务器";
}
function sanitizeMcpStatusError(error: string): string {
	return sanitizeMcpStatusText(error, TRUNCATE_LENGTHS.CONTENT);
}

export function formatMCPConnectingMessage(serverNames: readonly string[]): string {
	return `正在连接 MCP 服务器：${formatServerList(serverNames)}…`;
}

function formatFailedServer({ serverName, error, sourcePath }: McpConnectionFailure): string {
	const source = sourcePath
		? ` [config: ${sanitizeMcpStatusText(shortenPath(sourcePath), TRUNCATE_LENGTHS.CONTENT)}]`
		: "";
	return `${sanitizeMcpServerName(serverName)}${source}: ${sanitizeMcpStatusError(error)}`;
}

export function formatMCPConnectionStatusMessage(snapshot: McpConnectionStatusSnapshot): string {
	const { pendingServers, connectedServers, failedServers } = snapshot;
	if (pendingServers.length > 0) {
		if (connectedServers.length === 0 && failedServers.length === 0) {
			return formatMCPConnectingMessage(pendingServers);
		}
		const parts: string[] = [];
		if (connectedServers.length > 0) {
			parts.push(`已连接：${formatServerList(connectedServers)}。`);
		}
		if (failedServers.length > 0) {
			parts.push(`失败：${failedServers.map(formatFailedServer).join("; ")}。`);
		}
		parts.push(`仍在连接：${formatServerList(pendingServers)}…`);
		return parts.join(" ");
	}
	if (failedServers.length > 0) {
		const failureText = failedServers.map(formatFailedServer).join("; ");
		if (connectedServers.length === 0) {
			return `MCP ${formatServerCount(failedServers.length)} 连接失败：${failureText}`;
		}
		return `MCP 连接结束，但有失败项。已连接：${formatServerList(connectedServers)}。失败：${failureText}`;
	}
	if (connectedServers.length > 0) {
		return `已连接到 MCP ${formatServerCount(connectedServers.length)}：${formatServerList(connectedServers)}。`;
	}
	return "";
}

function isStringArray(data: unknown): data is string[] {
	return Array.isArray(data) && data.every(item => typeof item === "string");
}

/**
 * Runtime validator for the cross-module event payload. The event bus is
 * untyped at runtime, so the subscriber verifies the shape before formatting
 * rather than trusting a cast — a malformed emit is ignored instead of throwing.
 */
export function isMcpConnectionStatusEvent(data: unknown): data is McpConnectionStatusEvent {
	if (!isRecord(data) || typeof data.type !== "string") return false;
	switch (data.type) {
		case "connecting":
			return isStringArray(data.serverNames);
		case "reconnecting":
			return typeof data.serverName === "string";
		case "connected":
			return typeof data.serverName === "string";
		case "failed":
			return (
				typeof data.serverName === "string" &&
				typeof data.error === "string" &&
				(data.sourcePath === undefined || typeof data.sourcePath === "string")
			);
		default:
			return false;
	}
}
