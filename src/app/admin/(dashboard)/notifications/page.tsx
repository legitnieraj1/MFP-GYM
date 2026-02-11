"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, History, Users, Megaphone } from "lucide-react";

export default function NotificationsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
                    <Megaphone className="text-[#E50914]" size={32} /> Broadcasts
                </h1>
                <p className="text-muted-foreground">Send announcements and automated messages to members.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Compose Message */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Compose Message</CardTitle>
                        <CardDescription className="text-zinc-500">Send WhatsApp or Email notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Channel</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" className="border-[#E50914] bg-[#E50914]/10 text-[#E50914] hover:bg-[#E50914]/20 hover:text-[#E50914]">
                                    <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
                                </Button>
                                <Button variant="outline" className="border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white">
                                    <Send className="mr-2 h-4 w-4" /> Email
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Target Audience</Label>
                            <Select defaultValue="all">
                                <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="all">All Active Members</SelectItem>
                                    <SelectItem value="expiring">Expiring Soon (7 days)</SelectItem>
                                    <SelectItem value="expired">Expired Members</SelectItem>
                                    <SelectItem value="specific">Specific Member</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Subject / Template Header</Label>
                            <Input placeholder="Gym Maintenance Alert" className="bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="space-y-2">
                            <Label>Message Body</Label>
                            <Textarea
                                placeholder="Dear members, please note that the gym will be closed on..."
                                className="bg-zinc-950 border-zinc-800 min-h-[150px]"
                            />
                        </div>
                        <Button className="w-full bg-[#E50914] hover:bg-[#E50914]/90 text-white shadow-[0_0_15px_-5px_#E50914]">
                            <Send className="mr-2 h-4 w-4" /> Send Broadcast
                        </Button>
                    </CardContent>
                </Card>

                {/* History */}
                <div className="space-y-4">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <History className="h-4 w-4" /> Recent Broadcasts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { title: "Holiday Schedule", date: "2 days ago", audience: "All Members", status: "Sent" },
                                    { title: "Payment Reminder", date: "5 days ago", audience: "Expiring Soon", status: "Sent" },
                                    { title: "New Equipment Arrived!", date: "1 week ago", audience: "All Members", status: "Sent" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-white/5">
                                        <div>
                                            <div className="text-sm font-medium text-white">{item.title}</div>
                                            <div className="text-xs text-zinc-500">{item.date} • {item.audience}</div>
                                        </div>
                                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                            {item.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Users className="h-4 w-4" /> Auto-Triggers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-medium text-white">Welcome Message</div>
                                        <div className="text-xs text-zinc-500">Sent immediately after signup</div>
                                    </div>
                                    <div className="h-6 w-10 rounded-full bg-green-500/20 border border-green-500 p-1 cursor-pointer">
                                        <div className="h-full w-[16px] bg-green-500 rounded-full ml-auto" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-medium text-white">Expiry Warning</div>
                                        <div className="text-xs text-zinc-500">3 days before expiry</div>
                                    </div>
                                    <div className="h-6 w-10 rounded-full bg-green-500/20 border border-green-500 p-1 cursor-pointer">
                                        <div className="h-full w-[16px] bg-green-500 rounded-full ml-auto" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-medium text-white">Birthday Wish</div>
                                        <div className="text-xs text-zinc-500">On member's birthday</div>
                                    </div>
                                    <div className="h-6 w-10 rounded-full bg-zinc-800 border border-zinc-700 p-1 cursor-pointer">
                                        <div className="h-full w-[16px] bg-zinc-600 rounded-full mr-auto" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
