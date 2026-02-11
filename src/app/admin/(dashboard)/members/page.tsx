"use client";

import { useState, useEffect } from "react";
import { getMembers, createMember } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Search, Plus, User as UserIcon, Loader2, MoreVertical, Bell } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { sendFeeReminder } from "@/app/actions/notifications";

type Member = {
    id: string;
    name: string;
    email: string;
    phone: string;
    photo: string | null;
    membership: {
        plan: string;
        status: string;
        end_date: string;
    } | null;
};

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        const result = await getMembers();
        if (result.success && result.data) {
            setMembers(result.data as unknown as Member[]);
        }
        setLoading(false);
    };

    const handleCreateMember = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitLoading(true);
        const formData = new FormData(e.currentTarget);



        const result = await createMember(formData);

        if (result.success) {
            setIsAddOpen(false);
            fetchMembers();
        } else {
            alert(result.error);
        }
        setSubmitLoading(false);
    };

    const filteredMembers = members.filter(m =>
        (m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.phone?.includes(searchTerm)) ?? false
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Members</h1>
                    <p className="text-muted-foreground">Manage your gym members and subscriptions.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#E50914] hover:bg-[#E50914]/90 text-white shadow-[0_0_15px_-5px_#E50914]">
                            <Plus className="mr-2 h-4 w-4" /> Add New Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0A0A0A] border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Member (Walk-in)</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateMember} className="space-y-4 py-4" encType="multipart/form-data">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input name="name" placeholder="John Doe" required className="bg-zinc-900 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone (WhatsApp)</Label>
                                    <Input name="phone" placeholder="+91 98765 43210" required className="bg-zinc-900 border-zinc-800" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input name="email" type="email" placeholder="john@example.com" required className="bg-zinc-900 border-zinc-800" />
                            </div>

                            {/* Photo Upload */}
                            <div className="space-y-2">
                                <Label>Member Photo</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="file"
                                        name="photo"
                                        accept="image/*"
                                        capture="environment" // Opens camera on mobile
                                        className="bg-zinc-900 border-zinc-800 file:bg-[#E50914] file:text-white file:border-0 file:rounded-sm file:px-2 file:mr-4"
                                    />
                                </div>
                                <p className="text-xs text-zinc-500">Upload from gallery or take a picture.</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Age</Label>
                                    <Input name="age" type="number" required className="bg-zinc-900 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Weight (kg)</Label>
                                    <Input name="weight" type="number" step="0.1" required className="bg-zinc-900 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Height (cm)</Label>
                                    <Input name="height" type="number" required className="bg-zinc-900 border-zinc-800" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Input name="address" placeholder="Residential Address" className="bg-zinc-900 border-zinc-800" />
                            </div>
                            <div className="space-y-2">
                                <Label>Membership Plan</Label>
                                <Select name="plan" defaultValue="BASIC">
                                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                        <SelectValue placeholder="Select Plan" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                        <SelectItem value="BASIC">BASIC (Quarterly)</SelectItem>
                                        <SelectItem value="PRO">PRO (Half-Yearly)</SelectItem>
                                        <SelectItem value="ELITE">ELITE (Yearly)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={submitLoading} className="w-full bg-[#E50914] hover:bg-[#E50914]/90">
                                    {submitLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Profile...
                                        </>
                                    ) : (
                                        "Create Member Account"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Search users..."
                        className="pl-10 bg-zinc-900 border-zinc-800 text-white focus:border-[#E50914]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-900">
                        <TableRow className="border-zinc-800">
                            <TableHead className="text-zinc-400">Member</TableHead>
                            <TableHead className="text-zinc-400">Contact</TableHead>
                            <TableHead className="text-zinc-400">Plan</TableHead>
                            <TableHead className="text-zinc-400">Status</TableHead>
                            <TableHead className="text-zinc-400">Expiry</TableHead>
                            <TableHead className="text-right text-zinc-400">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                                    Loading members...
                                </TableCell>
                            </TableRow>
                        ) : filteredMembers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                                    No members found.
                                </TableCell>
                            </TableRow>
                        ) : filteredMembers.map((member) => (
                            <TableRow key={member.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                                <TableCell className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full overflow-hidden bg-zinc-800 border border-white/10">
                                        {member.photo ? (
                                            <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-zinc-500">
                                                <UserIcon size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">{member.name}</div>
                                        <div className="text-xs text-zinc-500">ID: {member.id.substring(0, 8)}...</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-zinc-300">{member.email}</div>
                                    <div className="text-xs text-zinc-500">{member.phone}</div>
                                </TableCell>
                                <TableCell>
                                    {member.membership ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                            {member.membership.plan}
                                        </span>
                                    ) : (
                                        <span className="text-zinc-500">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {member.membership?.status === 'ACTIVE' ? (
                                        <span className="flex items-center gap-1.5 text-green-500 text-xs font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-red-500 text-xs font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Expired
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-zinc-300">
                                    {member.membership?.end_date ? new Date(member.membership.end_date).toLocaleDateString() : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10">
                                                <span className="sr-only">Open menu</span>
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-zinc-800 text-white">
                                            <DropdownMenuItem
                                                onClick={async () => {
                                                    const res = await sendFeeReminder(member.id);
                                                    if (res.success) alert("Fee reminder sent!");
                                                    else alert(res.error);
                                                }}
                                                className="text-red-500 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                            >
                                                <Bell className="mr-2 h-4 w-4" /> Remind Fee
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div >
        </div >
    );
}
