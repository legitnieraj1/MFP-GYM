"use client";

import { useEffect, useMemo, useState } from "react";
import { getExpiredMembers } from "@/app/actions/admin";
import { openWhatsAppReminder } from "@/utils/whatsapp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, AlertTriangle, MessageCircle } from "lucide-react";
import { BulkReminderModal } from "@/components/admin/BulkReminderModal";

type Member = {
    id: string;
    name: string;
    phone: string;
    enroll_no?: string | null;
    last_reminded_at?: string | null;
    membership: {
        plan: string;
        status: string;
        end_date: string;
    } | null;
};

function monthKey(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ExpiredMembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [monthFilter, setMonthFilter] = useState("ALL");
    const [isBulkOpen, setIsBulkOpen] = useState(false);

    useEffect(() => {
        fetchExpired();
    }, []);

    async function fetchExpired() {
        setLoading(true);
        const res = await getExpiredMembers();
        if (res.success && res.data) {
            setMembers(res.data as Member[]);
        }
        setLoading(false);
    }

    const monthOptions = useMemo(() => {
        const keys = new Set<string>();
        members.forEach((m) => {
            if (m.membership?.end_date) keys.add(monthKey(m.membership.end_date));
        });
        return Array.from(keys).sort().reverse();
    }, [members]);

    const filteredMembers = useMemo(() => {
        return members.filter((m) => {
            const matchesSearch =
                m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (m.enroll_no && m.enroll_no.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesMonth =
                monthFilter === "ALL" ||
                (m.membership?.end_date && monthKey(m.membership.end_date) === monthFilter);
            return matchesSearch && matchesMonth;
        });
    }, [members, searchTerm, monthFilter]);

    const bulkTitle =
        monthFilter === "ALL" ? "Remind All Expired Members" : `Remind Expired — ${monthLabel(monthFilter)}`;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        Expired Members
                    </h1>
                    <p className="text-muted-foreground">
                        {loading ? "Loading..." : `${filteredMembers.length} of ${members.length} expired members`}
                    </p>
                </div>
                <Button
                    onClick={() => setIsBulkOpen(true)}
                    disabled={filteredMembers.length === 0}
                    className="bg-[#E50914] hover:bg-[#E50914]/90 text-white font-bold shadow-[0_0_15px_-5px_#E50914] disabled:opacity-50 disabled:shadow-none"
                >
                    <MessageCircle className="w-4 h-4 mr-2" /> Remind All
                </Button>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Search by name or enroll no..."
                        className="pl-10 bg-zinc-900 border-zinc-800 text-white focus:border-[#E50914]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className="w-full md:w-56 bg-zinc-900 border-zinc-800 text-white">
                        <SelectValue placeholder="All months" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="ALL">All months</SelectItem>
                        {monthOptions.map((key) => (
                            <SelectItem key={key} value={key}>
                                {monthLabel(key)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-900">
                        <TableRow className="border-zinc-800">
                            <TableHead className="text-zinc-400">Member</TableHead>
                            <TableHead className="text-zinc-400">Phone</TableHead>
                            <TableHead className="text-zinc-400">Plan</TableHead>
                            <TableHead className="text-zinc-400">Expired On</TableHead>
                            <TableHead className="text-right text-zinc-400">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                                    Loading expired members...
                                </TableCell>
                            </TableRow>
                        ) : members.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                                    No expired members.
                                </TableCell>
                            </TableRow>
                        ) : filteredMembers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                                    {monthFilter === "ALL"
                                        ? "No members match your search."
                                        : `No members expired in ${monthLabel(monthFilter)}.`}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMembers.map((member) => (
                                <TableRow key={member.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                                    <TableCell>
                                        <div className="font-medium text-white">
                                            {member.name}
                                            {member.enroll_no && (
                                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                                                    #{member.enroll_no}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-zinc-300">{member.phone || "-"}</TableCell>
                                    <TableCell>
                                        {member.membership ? (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                                {member.membership.plan}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-500">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-red-400 text-sm">
                                        {member.membership?.end_date
                                            ? new Date(member.membership.end_date).toLocaleDateString("en-GB")
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            onClick={() => openWhatsAppReminder(member)}
                                            disabled={!member.phone}
                                            title={!member.phone ? "Phone number not available" : "Send Reminder via WhatsApp"}
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Remind
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <BulkReminderModal
                open={isBulkOpen}
                onOpenChange={setIsBulkOpen}
                members={filteredMembers}
                title={bulkTitle}
            />
        </div>
    );
}
