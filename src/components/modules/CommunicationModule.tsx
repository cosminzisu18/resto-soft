import React, { useState } from 'react';
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

// Mock data for conversations
const mockConversations = [
  {
    id: '1',
    name: 'Bucătărie',
    type: 'department',
    avatar: null,
    lastMessage: 'Comanda 45 e gata pentru pickup',
    timestamp: new Date(Date.now() - 5 * 60000),
    unread: 3,
    online: true,
    pinned: true,
  },
  {
    id: '2',
    name: 'Maria Popescu',
    type: 'person',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    lastMessage: 'Poți să verifici stocul de vinuri?',
    timestamp: new Date(Date.now() - 15 * 60000),
    unread: 1,
    online: true,
    pinned: false,
  },
  {
    id: '3',
    name: 'Andrei Ionescu',
    type: 'person',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    lastMessage: 'Schimbul de mâine e confirmat',
    timestamp: new Date(Date.now() - 2 * 3600000),
    unread: 0,
    online: false,
    pinned: false,
  },
  {
    id: '4',
    name: 'Bar',
    type: 'department',
    avatar: null,
    lastMessage: 'Avem nevoie de gheață',
    timestamp: new Date(Date.now() - 4 * 3600000),
    unread: 0,
    online: true,
    pinned: false,
  },
  {
    id: '5',
    name: 'Management',
    type: 'department',
    avatar: null,
    lastMessage: 'Meeting la ora 16:00',
    timestamp: new Date(Date.now() - 24 * 3600000),
    unread: 0,
    online: false,
    pinned: true,
  },
];

const mockMessages = [
  {
    id: '1',
    sender: 'Bucătărie',
    senderId: 'kitchen',
    content: 'Bună! Avem o problemă cu comanda 42',
    timestamp: new Date(Date.now() - 30 * 60000),
    status: 'read',
    isOwn: false,
  },
  {
    id: '2',
    sender: 'Eu',
    senderId: 'me',
    content: 'Ce s-a întâmplat?',
    timestamp: new Date(Date.now() - 28 * 60000),
    status: 'read',
    isOwn: true,
  },
  {
    id: '3',
    sender: 'Bucătărie',
    senderId: 'kitchen',
    content: 'Clientul a cerut fără ceapă dar am primit comanda cu ceapă. Refacem?',
    timestamp: new Date(Date.now() - 25 * 60000),
    status: 'read',
    isOwn: false,
  },
  {
    id: '4',
    sender: 'Eu',
    senderId: 'me',
    content: 'Da, vă rog refaceți. Verific cu ospătarul.',
    timestamp: new Date(Date.now() - 20 * 60000),
    status: 'read',
    isOwn: true,
  },
  {
    id: '5',
    sender: 'Bucătărie',
    senderId: 'kitchen',
    content: 'Perfect, în 5 minute e gata!',
    timestamp: new Date(Date.now() - 15 * 60000),
    status: 'read',
    isOwn: false,
  },
  {
    id: '6',
    sender: 'Bucătărie',
    senderId: 'kitchen',
    content: 'Comanda 45 e gata pentru pickup',
    timestamp: new Date(Date.now() - 5 * 60000),
    status: 'delivered',
    isOwn: false,
    attachment: {
      type: 'image',
      name: 'comanda_45.jpg',
      url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300',
    },
  },
];

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

const employees = [
  { id: '1', name: 'Maria Popescu', role: 'Ospătar', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', online: true },
  { id: '2', name: 'Andrei Ionescu', role: 'Bucătar Șef', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', online: true },
  { id: '3', name: 'Elena Vasile', role: 'Barman', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', online: false },
  { id: '4', name: 'Ion Gheorghe', role: 'Manager', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', online: true },
];

export const CommunicationModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', priority: 'medium', description: '' });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
    if (!messageInput.trim()) return;
    toast({ title: 'Mesaj trimis', description: messageInput });
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

  const filteredConversations = mockConversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(c => c.pinned);
  const regularConversations = filteredConversations.filter(c => !c.pinned);

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
              <p className="text-muted-foreground">Chat intern și suport tehnic</p>
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
              {mockConversations.reduce((acc, c) => acc + c.unread, 0)} necitite
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
        <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
          <div className="h-full flex">
            {/* Conversations List */}
            <div className="w-80 border-r border-border flex flex-col">
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
                  <DialogTrigger asChild>
                    <Button className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      Conversație Nouă
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
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
                              variant="outline"
                              className="justify-start gap-2"
                              onClick={() => {
                                toast({ title: `Chat deschis cu ${dept.name}` });
                                setShowNewChat(false);
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
                          {employees.map((emp) => (
                            <button
                              key={emp.id}
                              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                              onClick={() => {
                                toast({ title: `Chat deschis cu ${emp.name}` });
                                setShowNewChat(false);
                              }}
                            >
                              <div className="relative">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={emp.avatar} />
                                  <AvatarFallback>{emp.name[0]}</AvatarFallback>
                                </Avatar>
                                {emp.online && (
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                                )}
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-sm">{emp.name}</p>
                                <p className="text-xs text-muted-foreground">{emp.role}</p>
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
                          onClick={() => setSelectedConversation(conv)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                            selectedConversation?.id === conv.id
                              ? "bg-primary/10"
                              : "hover:bg-muted"
                          )}
                        >
                          <div className="relative">
                            {conv.type === 'department' ? (
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
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
                          onClick={() => setSelectedConversation(conv)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                            selectedConversation?.id === conv.id
                              ? "bg-primary/10"
                              : "hover:bg-muted"
                          )}
                        >
                          <div className="relative">
                            {conv.type === 'department' ? (
                              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
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
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="flex-shrink-0 p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {selectedConversation.type === 'department' ? (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                        ) : (
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedConversation.avatar || undefined} />
                            <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
                          </Avatar>
                        )}
                        {selectedConversation.online && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedConversation.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {selectedConversation.online ? 'Online' : 'Offline'}
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
                      {mockMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            msg.isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[70%] rounded-2xl p-3",
                              msg.isOwn
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            )}
                          >
                            {msg.attachment && (
                              <div className="mb-2">
                                {msg.attachment.type === 'image' && (
                                  <img
                                    src={msg.attachment.url}
                                    alt={msg.attachment.name}
                                    className="rounded-lg max-w-full"
                                  />
                                )}
                              </div>
                            )}
                            <p className="text-sm">{msg.content}</p>
                            <div className={cn(
                              "flex items-center gap-1 mt-1",
                              msg.isOwn ? "justify-end" : "justify-start"
                            )}>
                              <span className={cn(
                                "text-xs",
                                msg.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}>
                                {formatTime(msg.timestamp)}
                              </span>
                              {msg.isOwn && getStatusIcon(msg.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="flex-shrink-0 p-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Image className="h-5 w-5" />
                      </Button>
                      <Input
                        placeholder="Scrie un mesaj..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon">
                        <Smile className="h-5 w-5" />
                      </Button>
                      <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
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
