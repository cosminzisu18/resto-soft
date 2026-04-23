import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from '@/lib/api';
import { getAccessToken } from '@/lib/authSession';
import type { User } from '@/data/mockData';

export type TeamChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
};

export type PresenceUser = {
  userId: string;
  userName: string;
  role: string;
};

type ServerPayload =
  | { type: 'welcome'; channel: string }
  | { type: 'history'; messages: TeamChatMessage[] }
  | { type: 'message'; message: TeamChatMessage }
  | { type: 'presence'; users: PresenceUser[] }
  | { type: 'error'; code: string; message: string };

function wsBaseFromHttp(httpBase: string): string {
  return httpBase.replace(/^https/i, 'wss').replace(/^http/i, 'ws');
}

export function getCommunicationWsUrl(): string {
  const base = API_BASE.replace(/\/$/, '');
  return `${wsBaseFromHttp(base)}/communication`;
}

function roleLabel(role: User['role']): string {
  switch (role) {
    case 'waiter':
      return 'Ospătar';
    case 'kitchen':
      return 'Bucătărie';
    case 'admin':
      return 'Admin';
    default:
      return role;
  }
}

export function useTeamChat(
  user: User | null,
  options?: { tenantId?: string; channelId?: string },
) {
  const [messages, setMessages] = useState<TeamChatMessage[]>([]);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'open' | 'closed' | 'error'>(
    'idle',
  );
  const [lastError, setLastError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalClose = useRef(false);
  const tenantId = options?.tenantId;
  const channelId = options?.channelId;

  const sendChat = useCallback(
    (content: string) => {
      const text = content.trim();
      if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }
      wsRef.current.send(JSON.stringify({ type: 'chat', content: text }));
    },
    [],
  );

  useEffect(() => {
    intentionalClose.current = false;
    if (!user) {
      setMessages([]);
      setPresence([]);
      setStatus('idle');
      return;
    }

    const connect = () => {
      if (intentionalClose.current) return;

      setStatus('connecting');
      setLastError(null);

      let url: string;
      try {
        url = getCommunicationWsUrl();
      } catch (e) {
        setStatus('error');
        setLastError(e instanceof Error ? e.message : 'URL WebSocket invalid');
        return;
      }

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        const accessToken = getAccessToken();
        ws.send(
          JSON.stringify({
            type: 'join',
            accessToken: accessToken ?? '',
            userId: user.id,
            userName: user.name,
            role: roleLabel(user.role),
            ...(tenantId ? { tenantId } : {}),
            ...(channelId ? { channelId } : {}),
          }),
        );
      };

      ws.onmessage = (ev: MessageEvent) => {
        try {
          const data = JSON.parse(String(ev.data)) as ServerPayload;
          if (data.type === 'history') {
            setMessages(data.messages);
            setStatus('open');
            return;
          }
          if (data.type === 'message') {
            setMessages((prev) => [...prev, data.message]);
            return;
          }
          if (data.type === 'presence') {
            setPresence(data.users);
            setStatus('open');
            return;
          }
          if (data.type === 'welcome') {
            setStatus('open');
            return;
          }
          if (data.type === 'error') {
            setLastError(data.message);
          }
        } catch {
          /* ignoră pachete non-JSON */
        }
      };

      ws.onerror = () => {
        setLastError('Eroare conexiune WebSocket');
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (intentionalClose.current) {
          setStatus('closed');
          return;
        }
        setStatus('closed');
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          connect();
        }, 2500);
      };
    };

    connect();

    return () => {
      intentionalClose.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setMessages([]);
      setPresence([]);
      setStatus('idle');
    };
  }, [user, tenantId, channelId]);

  const onlineIds = new Set(presence.map((p) => String(p.userId)));

  return {
    messages,
    presence,
    onlineIds,
    status,
    lastError,
    sendChat,
    isConnected: status === 'open',
  };
}
