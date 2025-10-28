import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, Search, MoreVertical, Plus, Users, Hash } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  user: {
    name: string;
    avatar?: string;
    online: boolean;
  };
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newChannelName, setNewChannelName] = useState("");

  const conversations: Conversation[] = [
    {
      id: "1",
      user: { name: "Sarah Ocean", avatar: "", online: true },
      lastMessage: "See you at the dive site tomorrow!",
      timestamp: "2m ago",
      unreadCount: 2,
    },
    {
      id: "2",
      user: { name: "Mike Deep", avatar: "", online: false },
      lastMessage: "Thanks for the gear recommendation",
      timestamp: "1h ago",
      unreadCount: 0,
    },
    {
      id: "3",
      user: { name: "Emma Coral", avatar: "", online: true },
      lastMessage: "The photos from yesterday were amazing!",
      timestamp: "3h ago",
      unreadCount: 1,
    },
  ];

  const messages: Message[] = [
    {
      id: "1",
      senderId: "other",
      text: "Hey! Are you free for a dive this weekend?",
      timestamp: "10:30 AM",
      read: true,
    },
    {
      id: "2",
      senderId: "me",
      text: "Yes! I was thinking about the reef site we talked about",
      timestamp: "10:32 AM",
      read: true,
    },
    {
      id: "3",
      senderId: "other",
      text: "Perfect! Should we meet at 8 AM?",
      timestamp: "10:35 AM",
      read: true,
    },
    {
      id: "4",
      senderId: "me",
      text: "Sounds good. I'll bring my underwater camera",
      timestamp: "10:36 AM",
      read: true,
    },
    {
      id: "5",
      senderId: "other",
      text: "See you at the dive site tomorrow!",
      timestamp: "10:38 AM",
      read: false,
    },
  ];

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // Add message logic here
      setMessageText("");
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-screen bg-background pt-4 pb-20 overflow-hidden">
      {!selectedConversation ? (
        // Conversations List
        <div className="h-full flex flex-col">
          <div className="mb-4 px-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold">Messages</h1>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <Plus className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New</DialogTitle>
                    <DialogDescription>
                      Create a new group or channel for your dive community
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="group" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="group">Group</TabsTrigger>
                      <TabsTrigger value="channel">Channel</TabsTrigger>
                    </TabsList>
                    <TabsContent value="group" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                          id="group-name"
                          placeholder="Weekend Dive Crew"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>Groups are for small private conversations</span>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          // Add group creation logic here
                          setNewGroupName("");
                          setShowCreateDialog(false);
                        }}
                      >
                        Create Group
                      </Button>
                    </TabsContent>
                    <TabsContent value="channel" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="channel-name">Channel Name</Label>
                        <Input
                          id="channel-name"
                          placeholder="dive-trips-australia"
                          value={newChannelName}
                          onChange={(e) => setNewChannelName(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Hash className="w-4 h-4" />
                        <span>Channels are for large public discussions</span>
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => {
                          // Add channel creation logic here
                          setNewChannelName("");
                          setShowCreateDialog(false);
                        }}
                      >
                        Create Channel
                      </Button>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-muted-foreground">Connect with your dive buddies</p>
          </div>

          {/* Search */}
          <div className="mb-4 px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2 pb-4">
              {conversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className="p-4 cursor-pointer hover:bg-accent/5 transition-colors border-accent/20"
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.user.avatar} />
                        <AvatarFallback className="bg-accent text-accent-foreground">
                          {conversation.user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.user.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <h3 className="font-semibold truncate">{conversation.user.name}</h3>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{conversation.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                    </div>

                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-coral text-white flex-shrink-0">{conversation.unreadCount}</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : (
        // Chat View
        <div className="h-full flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-4 pb-4 border-b flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSelectedConversation(null)}
              className="flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="relative flex-shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConv?.user.avatar} />
                <AvatarFallback className="bg-accent text-accent-foreground">
                  {selectedConv?.user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {selectedConv?.user.online && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{selectedConv?.user.name}</h2>
              <p className="text-xs text-muted-foreground">
                {selectedConv?.user.online ? "Online" : "Offline"}
              </p>
            </div>

            <Button size="icon" variant="ghost" className="flex-shrink-0">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      message.senderId === "me"
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t flex-shrink-0">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
