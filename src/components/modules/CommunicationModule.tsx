import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import type { User as StaffUser } from '@/data/mockData';
import { useTeamChat } from '@/hooks/useTeamChat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  MessageCircle,
  Send,
  Paperclip,
  Search,
  Plus,
  Check,
  CheckCheck,
  Clock,
  Image,
  FileText,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Bell,
  BellOff,
  Users,
  User,
  Building2,
  HeadphonesIcon,
  TicketIcon,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  ChevronRight,
  Star,
  Archive,
  Trash2,
  Pin
} from 'lucide-react';

const mockTickets = [
  {
    id: 'TKT-001',
    subject: 'Problemă integrare Glovo',
    status: 'open',
    priority: 'high',
    created: new Date(Date.now() - 2 * 24 * 3600000),
    lastUpdate: new Date(Date.now() - 1 * 3600000),
    messages: 4,
  },
  {
    id: 'TKT-002',
    subject: 'Întrebare despre rapoarte',
    status: 'resolved',
    priority: 'low',
    created: new Date(Date.now() - 7 * 24 * 3600000),
    lastUpdate: new Date(Date.now() - 3 * 24 * 3600000),
    messages: 6,
  },
  {
    id: 'TKT-003',
    subject: 'Eroare la printare bon fiscal',
    status: 'in_progress',
    priority: 'medium',
    created: new Date(Date.now() - 1 * 24 * 3600000),
    lastUpdate: new Date(Date.now() - 2 * 3600000),
    messages: 3,
  },
];

const departments = [
  { id: 'kitchen', name: 'Bucătărie', icon: '🍳' },
  { id: 'bar', name: 'Bar', icon: '🍸' },
  { id: 'service', name: 'Sală', icon: '🍽️' },
  { id: 'management', name: 'Management', icon: '💼' },
  { id: 'delivery', name: 'Livrări', icon: '🛵' },
];

function userRoleLabel(role: StaffUser['role']): string {
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

type ChatListItem = {
  id: string;
  name: string;
  type: 'department' | 'person';
  avatar: string | null;
  /** Emoji afișat pentru thread-uri de departament (conversație „nouă”). */
  deptEmoji?: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  online: boolean;
  pinned: boolean;
};

export const CommunicationModule: React.FC = () => {
  const { currentUser, directoryUsers } = useRestaurant();
  const tenantId =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_TENANT_ID?.trim() : undefined;
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedId, setSelectedId] = useState<string>('team');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', priority: 'medium', description: '' });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const selectedChannelId = useMemo(() => {
    const sid = String(selectedId);
    if (sid === 'team') return 'team';
    if (sid.startsWith('dept:')) return sid;
    if (!currentUser) return 'team';
    const a = String(currentUser.id);
    const b = sid;
    return `dm:${[a, b].sort().join(':')}`;
  }, [selectedId, currentUser]);

  const { messages, presence, onlineIds, status, lastError, sendChat, isConnected } = useTeamChat(
    currentUser,
    { tenantId: tenantId || undefined, channelId: selectedChannelId },
  );

  const teamConversation: ChatListItem = useMemo(() => {
    const last = messages[messages.length - 1];
    const ts = last ? new Date(last.timestamp) : new Date();
    let lastMessage = last?.content ?? 'Niciun mesaj încă';
    if (status === 'connecting') lastMessage = 'Se conectează…';
    if (status === 'closed' && currentUser) lastMessage = 'Reconectare…';
    if (status === 'error') lastMessage = lastError ?? 'Eroare conexiune';
    return {
      id: 'team',
      name: 'Canal echipă',
      type: 'department',
      avatar: null,
      lastMessage,
      timestamp: ts,
      unread: 0,
      online: isConnected,
      pinned: true,
    };
  }, [messages, status, lastError, isConnected, currentUser]);

  /** Thread-uri per departament (mesajele sunt tot pe canalul comun, dar UI-ul arată conversație dedicată). */
  const departmentThreads: ChatListItem[] = useMemo(
    () =>
      departments.map((d) => ({
        id: `dept:${d.id}`,
        name: d.name,
        type: 'department' as const,
        avatar: null,
        deptEmoji: d.icon,
        lastMessage: 'Apasă pentru a scrie echipei',
        timestamp: new Date(),
        unread: 0,
        online: isConnected,
        pinned: false,
      })),
    [isConnected],
  );

  const colleagueConversations: ChatListItem[] = useMemo(() => {
    if (!currentUser) return [];
    const selfId = String(currentUser.id);
    return directoryUsers
      .filter((u) => String(u.id) !== selfId)
      .map((u) => ({
        id: String(u.id),
        name: u.name,
        type: 'person' as const,
        avatar: u.avatar,
        lastMessage: 'Canal comun — mesajele sunt partajate',
        timestamp: new Date(),
        unread: 0,
        online: onlineIds.has(String(u.id)),
        pinned: false,
      }));
  }, [currentUser, directoryUsers, onlineIds]);

  const allConversations = useMemo(
    () => [teamConversation, ...departmentThreads, ...colleagueConversations],
    [teamConversation, departmentThreads, colleagueConversations],
  );

  const chatThreadPanelRef = useRef<HTMLDivElement>(null);

  /** După „Conversație nouă”, lista nu mai e filtrată ascuns; pe mobil derulăm la zona de mesaje. */
  useEffect(() => {
    chatThreadPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  const selectedConversation = useMemo(() => {
    const sid = String(selectedId);
    return (
      allConversations.find((c) => String(c.id) === sid) ?? teamConversation
    );
  }, [allConversations, selectedId, teamConversation]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / (24 * 3600000));

    if (days > 0) return `${days}z`;
    if (hours > 0) return `${hours}h`;
    return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Check className="w-3 h-3 text-muted-foreground" />;
      case 'delivered': return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
      case 'read': return <CheckCheck className="w-3 h-3 text-primary" />;
      default: return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getTicketStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
      closed: 'bg-muted text-muted-foreground border-border',
    };
    const labels = {
      open: 'Deschis',
      in_progress: 'În lucru',
      resolved: 'Rezolvat',
      closed: 'Închis',
    };
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-muted text-muted-foreground',
      medium: 'bg-yellow-500/10 text-yellow-500',
      high: 'bg-red-500/10 text-red-500',
    };
    const labels = { low: 'Scăzută', medium: 'Medie', high: 'Urgentă' };
    return (
      <Badge variant="secondary" className={styles[priority as keyof typeof styles]}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    );
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentUser) return;
    if (!isConnected) {
      toast({
        title: 'Fără conexiune',
        description: 'Așteaptă reconectarea la chat.',
        variant: 'destructive',
      });
      return;
    }
    sendChat(messageInput);
    setMessageInput('');
  };

  const handleCreateTicket = () => {
    if (!newTicket.subject || !newTicket.description) {
      toast({ title: 'Eroare', description: 'Completați toate câmpurile', variant: 'destructive' });
      return;
    }
    toast({ title: 'Ticket creat', description: `Ticket ${newTicket.subject} a fost creat cu succes` });
    setShowNewTicket(false);
    setNewTicket({ subject: '', priority: 'medium', description: '' });
  };

  const filteredConversations = allConversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const pinnedConversations = filteredConversations.filter((c) => c.pinned);
  const regularConversations = filteredConversations.filter((c) => !c.pinned);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Comunicare</h1>
              <p className="text-muted-foreground flex items-center gap-2 flex-wrap">
                Chat intern și suport tehnic
                {activeTab === 'chat' && currentUser && (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <Users className="h-3.5 w-3.5" />
                    {presence.length} online
                    {status === 'connecting' && (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                    )}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            >
              {notificationsEnabled ? (
                <Bell className="h-5 w-5" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              0 necitite
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 px-6 pt-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="chat" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat Intern
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2">
              <HeadphonesIcon className="h-4 w-4" />
              Suport
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Chat Tab */}
        <TabsContent value="chat" forceMount className="flex-1 min-h-0 mt-0">
          <div className="h-full flex min-h-0 min-w-0 flex-col lg:flex-row">
            {/* Conversations List */}
            <div className="w-full lg:w-80 shrink-0 border-r border-border flex flex-col min-h-0">
              <div className="p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Caută conversații..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
                  <Button
                    type="button"
                    className="w-full gap-2"
                    onClick={() => setShowNewChat(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Conversație Nouă
                  </Button>
                  <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Conversație Nouă</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Departamente</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {departments.map((dept) => (
                            <Button
                              key={dept.id}
                              type="button"
                              variant="outline"
                              className="justify-start gap-2"
                              onClick={() => {
                                setSelectedId(`dept:${dept.id}`);
                                setSearchQuery('');
                                setShowNewChat(false);
                                toast({
                                  title: `Conversație — ${dept.name}`,
                                  description: 'Mesajele merg pe canalul comun al echipei.',
                                });
                              }}
                            >
                              <span>{dept.icon}</span>
                              {dept.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Angajați</Label>
                        <div className="space-y-2">
                          {(currentUser
                            ? directoryUsers.filter((u) => String(u.id) !== String(currentUser.id))
                            : directoryUsers
                          ).map((emp) => (
                            <button
                              key={String(emp.id)}
                              type="button"
                              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                              onClick={() => {
                                setSelectedId(String(emp.id));
                                setSearchQuery('');
                                setShowNewChat(false);
                                toast({
                                  title: emp.name,
                                  description: 'Conversația e deschisă. Mesajele sunt pe canalul comun.',
                                });
                              }}
                            >
                              <div className="relative">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={emp.avatar} />
                                  <AvatarFallback>{emp.name[0]}</AvatarFallback>
                                </Avatar>
                                {onlineIds.has(String(emp.id)) && (
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                                )}
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-sm">{emp.name}</p>
                                <p className="text-xs text-muted-foreground">{userRoleLabel(emp.role)}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="flex-1">
                <div className="px-2 pb-4">
                  {/* Pinned */}
                  {pinnedConversations.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                        <Pin className="h-3 w-3" />
                        FIXATE
                      </div>
                      {pinnedConversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedId(conv.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                            String(selectedConversation?.id) === String(conv.id)
                              ? "bg-primary/10"
                              : "hover:bg-muted"
                          )}
                        >
                          <div className="relative">
                            {conv.type === 'department' ? (
                              <div
                                className={cn(
                                  'w-12 h-12 rounded-full flex items-center justify-center text-xl',
                                  conv.id === 'team' ? 'bg-primary/10' : 'bg-muted',
                                )}
                              >
                                {conv.deptEmoji ? (
                                  <span aria-hidden>{conv.deptEmoji}</span>
                                ) : (
                                  <Building2
                                    className={cn(
                                      'h-5 w-5',
                                      conv.id === 'team' ? 'text-primary' : 'text-muted-foreground',
                                    )}
                                  />
                                )}
                              </div>
                            ) : (
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={conv.avatar || undefined} />
                                <AvatarFallback>{conv.name[0]}</AvatarFallback>
                              </Avatar>
                            )}
                            {conv.online && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm truncate">{conv.name}</span>
                              <span className="text-xs text-muted-foreground">{formatTime(conv.timestamp)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-xs text-muted-foreground truncate pr-2">{conv.lastMessage}</p>
                              {conv.unread > 0 && (
                                <Badge className="h-5 min-w-5 flex items-center justify-center p-0 text-xs">
                                  {conv.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Regular */}
                  {regularConversations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                        <MessageCircle className="h-3 w-3" />
                        TOATE MESAJELE
                      </div>
                      {regularConversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedId(conv.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                            String(selectedConversation?.id) === String(conv.id)
                              ? "bg-primary/10"
                              : "hover:bg-muted"
                          )}
                        >
                          <div className="relative">
                            {conv.type === 'department' ? (
                              <div
                                className={cn(
                                  'w-12 h-12 rounded-full flex items-center justify-center text-xl',
                                  conv.id === 'team' ? 'bg-primary/10' : 'bg-muted',
                                )}
                              >
                                {conv.deptEmoji ? (
                                  <span aria-hidden>{conv.deptEmoji}</span>
                                ) : (
                                  <Building2
                                    className={cn(
                                      'h-5 w-5',
                                      conv.id === 'team' ? 'text-primary' : 'text-muted-foreground',
                                    )}
                                  />
                                )}
                              </div>
                            ) : (
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={conv.avatar || undefined} />
                                <AvatarFallback>{conv.name[0]}</AvatarFallback>
                              </Avatar>
                            )}
                            {conv.online && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm truncate">{conv.name}</span>
                              <span className="text-xs text-muted-foreground">{formatTime(conv.timestamp)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-xs text-muted-foreground truncate pr-2">{conv.lastMessage}</p>
                              {conv.unread > 0 && (
                                <Badge className="h-5 min-w-5 flex items-center justify-center p-0 text-xs">
                                  {conv.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Panel */}
            <div
              ref={chatThreadPanelRef}
              id="chat-thread-panel"
              className="flex-1 flex flex-col min-w-0 min-h-0"
            >
              {!currentUser ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground p-6">
                  <div className="text-center max-w-sm">
                    <User className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-foreground">Autentificare necesară</p>
                    <p className="text-sm mt-2">
                      Conectează-te cu un cont de angajat pentru a folosi chat-ul în timp real pe canalul echipei.
                    </p>
                  </div>
                </div>
              ) : selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="flex-shrink-0 p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {selectedConversation.type === 'department' ? (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                            {selectedConversation.deptEmoji ? (
                              <span aria-hidden>{selectedConversation.deptEmoji}</span>
                            ) : (
                              <Building2 className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        ) : (
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedConversation.avatar || undefined} />
                            <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
                          </Avatar>
                        )}
                        {(String(selectedConversation.id) === 'team' ||
                        String(selectedConversation.id).startsWith('dept:')
                          ? isConnected
                          : onlineIds.has(String(selectedConversation.id))) && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedConversation.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {String(selectedConversation.id) === 'team'
                            ? isConnected
                              ? 'Canal live — toți angajații conectați'
                              : status === 'connecting'
                                ? 'Se conectează…'
                                : 'Deconectat — reconectare automată'
                            : String(selectedConversation.id).startsWith('dept:')
                              ? isConnected
                                ? 'Grup departament · mesaje pe canalul comun'
                                : status === 'connecting'
                                  ? 'Se conectează…'
                                  : 'Deconectat'
                              : onlineIds.has(String(selectedConversation.id))
                                ? 'Online · mesaje pe canal comun'
                                : 'Offline · mesaje pe canal comun'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {String(selectedConversation.id) !== 'team' && (
                        <p className="text-xs text-center text-muted-foreground bg-muted/40 rounded-lg py-2 px-3 border border-border/60">
                          Canal separat activ: mesajele rămân în această conversație.
                        </p>
                      )}
                      {messages.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8 px-4">
                          {isConnected
                            ? 'Începe conversația — mesajele sunt vizibile pentru toată echipa conectată la același canal.'
                            : 'Se conectează la server…'}
                        </p>
                      )}
                      {messages.map((msg) => {
                        const isOwn = String(msg.senderId) === String(currentUser.id);
                        const ts = new Date(msg.timestamp);
                        return (
                          <div
                            key={msg.id}
                            className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                          >
                            <div
                              className={cn(
                                'max-w-[70%] rounded-2xl p-3',
                                isOwn
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-muted rounded-bl-md',
                              )}
                            >
                              {!isOwn && (
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {msg.senderName}
                                </p>
                              )}
                              <p className="text-sm">{msg.content}</p>
                              <div
                                className={cn(
                                  'flex items-center gap-1 mt-1',
                                  isOwn ? 'justify-end' : 'justify-start',
                                )}
                              >
                                <span
                                  className={cn(
                                    'text-xs',
                                    isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground',
                                  )}
                                >
                                  {formatTime(ts)}
                                </span>
                                {isOwn && getStatusIcon('read')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="flex-shrink-0 p-4 border-t border-border space-y-2">
                    {lastError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {lastError}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" type="button" disabled={!isConnected}>
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" type="button" disabled={!isConnected}>
                        <Image className="h-5 w-5" />
                      </Button>
                      <Input
                        placeholder={
                          isConnected ? 'Scrie un mesaj…' : 'Așteaptă conexiunea…'
                        }
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                        disabled={!isConnected}
                      />
                      <Button variant="ghost" size="icon" type="button" disabled={!isConnected}>
                        <Smile className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || !isConnected}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Selectează o conversație</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="flex-1 min-h-0 mt-0 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Support Chat */}
            <Card className="lg:col-span-2 flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <HeadphonesIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Echipa Suport</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Online - Răspundem în &lt;5 minute
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 pr-4 -mr-4">
                  <div className="space-y-4">
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl rounded-bl-md p-3 bg-muted">
                        <p className="text-sm">Bună! 👋 Cu ce vă putem ajuta astăzi?</p>
                        <span className="text-xs text-muted-foreground mt-1 block">10:30</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center py-2">
                      {['Probleme tehnice', 'Întrebări facturare', 'Configurare', 'Altele'].map((topic) => (
                        <Button key={topic} variant="outline" size="sm" className="rounded-full">
                          {topic}
                        </Button>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
                <div className="flex items-center gap-2 pt-4 border-t border-border mt-4">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input placeholder="Scrieți mesajul..." className="flex-1" />
                  <Button>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tickets */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TicketIcon className="h-5 w-5 text-primary" />
                      Tickete
                    </CardTitle>
                    <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-1">
                          <Plus className="h-4 w-4" />
                          Nou
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ticket Nou</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Subiect</Label>
                            <Input
                              value={newTicket.subject}
                              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                              placeholder="Descrieți problema pe scurt"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Prioritate</Label>
                            <Select
                              value={newTicket.priority}
                              onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Scăzută</SelectItem>
                                <SelectItem value="medium">Medie</SelectItem>
                                <SelectItem value="high">Urgentă</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Descriere</Label>
                            <Textarea
                              value={newTicket.description}
                              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                              placeholder="Descrieți problema în detaliu..."
                              rows={4}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setShowNewTicket(false)}>
                              Anulează
                            </Button>
                            <Button className="flex-1" onClick={handleCreateTicket}>
                              Creează Ticket
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                        {getTicketStatusBadge(ticket.status)}
                      </div>
                      <h4 className="font-medium text-sm mb-2">{ticket.subject}</h4>
                      <div className="flex items-center justify-between">
                        {getPriorityBadge(ticket.priority)}
                        <span className="text-xs text-muted-foreground">
                          {ticket.messages} mesaje
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    Ajutor Rapid
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { icon: FileText, label: 'Documentație' },
                    { icon: Video, label: 'Tutoriale Video' },
                    { icon: HelpCircle, label: 'FAQ' },
                  ].map((item) => (
                    <Button
                      key={item.label}
                      variant="ghost"
                      className="w-full justify-start gap-2"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunicationModule;
