/* eslint-disable react-hooks/purity */
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { getMembers, createMember, renewMembership, updateMember, getMemberDetails, updateMembershipDates, deleteMember } from "@/app/actions/admin";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Search, Plus, User as UserIcon, Loader2, MoreVertical, Bell, Camera, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { openWhatsAppReminder } from "@/utils/whatsapp";

import imageCompression from 'browser-image-compression';

type Member = {
    id: string;
    name: string;
    email: string;
    phone: string;
    photo: string | null;
    enroll_no?: string | null;
    age?: number | null;
    dob?: string | null;
    weight?: number | null;
    height?: number | null;
    membership: {
        plan: string;
        status: string;
        start_date?: string;
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

    const [isRenewOpen, setIsRenewOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isEditDatesOpen, setIsEditDatesOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [memberDetails, setMemberDetails] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [renewPlan, setRenewPlan] = useState("BASIC");
    const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
    const [capturedPhotoFile, setCapturedPhotoFile] = useState<File | null>(null);

    const startCamera = async (mode: "user" | "environment" = "user") => {
        setIsCameraOpen(true);
        setFacingMode(mode);
        setCapturedPhotoUrl(null);
        setCapturedPhotoFile(null);
        // Stop any existing stream before starting a new one
        if (videoRef.current && videoRef.current.srcObject) {
            const existing = videoRef.current.srcObject as MediaStream;
            existing.getTracks().forEach(track => track.stop());
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please allow permissions.");
            setIsCameraOpen(false);
        }
    };

    const switchCamera = () => {
        const newMode = facingMode === "user" ? "environment" : "user";
        startCamera(newMode);
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext("2d");
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL("image/jpeg");
                setCapturedPhotoUrl(dataUrl);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "webcam_photo.jpg", { type: "image/jpeg" });
                        setCapturedPhotoFile(file);
                    }
                }, "image/jpeg");
                
                stopCamera();
            }
        }
    };

    // Compute preview dates for renew dialog
    const renewPreview = useMemo(() => {
        const PLAN_DURATIONS: Record<string, { months?: number; days?: number; label: string }> = {
            BASIC_1M: { months: 1, label: "BASIC (1 Month)" },
            BASIC: { months: 6, label: "BASIC (3+3 Months Offer)" },
            PRO: { months: 12, label: "PRO (6+6 Months Offer)" },
            ELITE: { months: 24, label: "ELITE (1+1 Year Offer)" },
            TRANSFORM_60: { days: 60, label: "60 Day Transformation" },
            TRANSFORM_120: { days: 120, label: "120 Day Transformation" },
        };
        const now = new Date();
        const currentEnd = selectedMember?.membership?.end_date ? new Date(selectedMember.membership.end_date) : null;
        const startDate = currentEnd && currentEnd > now ? currentEnd : now;
        const endDate = new Date(startDate);
        const duration = PLAN_DURATIONS[renewPlan];
        if (duration?.months) endDate.setMonth(startDate.getMonth() + duration.months);
        else if (duration?.days) endDate.setDate(startDate.getDate() + duration.days);
        return {
            start: startDate.toLocaleDateString("en-GB"),
            end: endDate.toLocaleDateString("en-GB"),
        };
    }, [renewPlan, selectedMember]);

    const handleViewProfile = async (member: Member) => {
        setSelectedMember(member);
        setActionLoading(true);
        setIsViewOpen(true);
        const res = await getMemberDetails(member.id);
        if (res.success) {
            setMemberDetails(res.data);
        } else {
            alert(res.error);
        }
        setActionLoading(false);
    };

    const fetchMembers = async () => {
        setLoading(true);
        const result = await getMembers();
        if (result.success && result.data) {
            setMembers(result.data as unknown as Member[]);
        }
        setLoading(false);
    };

    const handleRenew = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedMember) return;
        setSubmitLoading(true);
        const formData = new FormData(e.currentTarget);
        const plan = formData.get("plan") as string;

        const res = await renewMembership(selectedMember.id, plan);
        if (res.success) {
            setIsRenewOpen(false);
            fetchMembers();
            alert("Membership renewed successfully!");
        } else {
            alert(res.error);
        }
        setSubmitLoading(false);
    };

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedMember) return;
        setSubmitLoading(true);
        const formData = new FormData(e.currentTarget);

        let photoFile = formData.get("photo") as File;
        if (capturedPhotoFile && (!photoFile || photoFile.size === 0)) {
            formData.set("photo", capturedPhotoFile);
            photoFile = capturedPhotoFile;
        }

        if (photoFile && photoFile.size > 0) {
            try {
                const options = {
                    maxSizeMB: 0.8,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(photoFile, options);
                formData.set("photo", compressedFile, photoFile.name);
            } catch (error) {
                console.error("Error compressing image:", error);
            }
        }

        const res = await updateMember(selectedMember.id, formData);
        if (res.success) {
            setIsEditOpen(false);
            fetchMembers();
            alert("Member updated successfully!");
        } else {
            alert(res.error);
        }
        setSubmitLoading(false);
    };

    const handleEditDates = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedMember) return;
        setSubmitLoading(true);
        const formData = new FormData(e.currentTarget);

        // Parse DD/MM/YYYY back to YYYY-MM-DD for backend
        const startDisplay = formData.get("start_date_display") as string;
        const endDisplay = formData.get("end_date_display") as string;

        const [sDay, sMonth, sYear] = startDisplay.split('/');
        const [eDay, eMonth, eYear] = endDisplay.split('/');

        const startDate = `${sYear}-${sMonth}-${sDay}`;
        const endDate = `${eYear}-${eMonth}-${eDay}`;

        const res = await updateMembershipDates(selectedMember.id, startDate, endDate);
        if (res.success) {
            setIsEditDatesOpen(false);
            fetchMembers();
            alert("Membership dates updated successfully!");
        } else {
            alert(res.error);
        }
        setSubmitLoading(false);
    };

    useEffect(() => {
        fetchMembers();
    }, []);



    const handleCreateMember = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitLoading(true);
        const formData = new FormData(e.currentTarget);

        let photoFile = formData.get("photo") as File;
        if (capturedPhotoFile && (!photoFile || photoFile.size === 0)) {
            formData.set("photo", capturedPhotoFile);
            photoFile = capturedPhotoFile;
        }

        if (photoFile && photoFile.size > 0) {
            try {
                const options = {
                    maxSizeMB: 0.8,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(photoFile, options);
                formData.set("photo", compressedFile, photoFile.name);
            } catch (error) {
                console.error("Error compressing image:", error);
            }
        }

        const result = await createMember(formData);

        if (result.success) {
            setIsAddOpen(false);
            fetchMembers();
        } else {
            alert(result.error);
        }
        setSubmitLoading(false);
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm("Are you sure you want to delete this member? This action cannot be undone.")) return;

        setLoading(true);
        const res = await deleteMember(id);
        if (res.success) {
            fetchMembers();
            alert("Member deleted successfully.");
        } else {
            alert(res.error);
            setLoading(false);
        }
    };

    const filteredMembers = members.filter(m =>
        (m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.enroll_no && m.enroll_no.toLowerCase().includes(searchTerm.toLowerCase()))) ?? false
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Members</h1>
                    <p className="text-muted-foreground">Manage your gym members and subscriptions.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if (!val) { setCapturedPhotoUrl(null); setCapturedPhotoFile(null); stopCamera(); } }}>
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
                                    <Input name="name" placeholder="Enter member name" required className="bg-zinc-900 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone (WhatsApp)</Label>
                                    <Input name="phone" placeholder="Enter mobile number" required className="bg-zinc-900 border-zinc-800" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Enroll Number (PIN)</Label>
                                    <Input name="enroll_no" required placeholder="Enter enroll number" className="bg-zinc-900 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email (Optional)</Label>
                                    <Input name="email" type="email" placeholder="Enter email address" className="bg-zinc-900 border-zinc-800" />
                                </div>
                            </div>

                            {/* Photo Upload */}
                            <div className="space-y-2">
                                <Label>Member Photo</Label>
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="file"
                                            name="photo"
                                            accept="image/*"
                                            className="bg-zinc-900 border-zinc-800 file:bg-[#E50914] file:text-white file:border-0 file:rounded-sm file:px-2 file:mr-4"
                                        />
                                        <Button type="button" onClick={isCameraOpen ? stopCamera : () => startCamera()} variant="outline" className="bg-zinc-900 border-zinc-800 text-white shrink-0">
                                            {isCameraOpen ? <X className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                                            {isCameraOpen ? "Close Camera" : "Take Photo"}
                                        </Button>
                                    </div>
                                    {isCameraOpen && (
                                        <div className="flex flex-col items-center gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                                            <video ref={videoRef} autoPlay playsInline className="w-full max-w-[300px] h-auto rounded-md bg-black" />
                                            <canvas ref={canvasRef} className="hidden" />
                                            <div className="flex gap-2 w-full max-w-[300px]">
                                                <Button type="button" onClick={capturePhoto} className="bg-[#E50914] text-white flex-1">Capture Photo</Button>
                                                <Button type="button" onClick={switchCamera} variant="outline" className="bg-zinc-800 border-zinc-700 text-white shrink-0 px-3" title={facingMode === "user" ? "Switch to rear camera" : "Switch to front camera"}>
                                                    {facingMode === "user" ? "🔄 Rear" : "🔄 Front"}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    {capturedPhotoUrl && !isCameraOpen && (
                                        <div className="flex flex-col items-center gap-2">
                                            <img src={capturedPhotoUrl} alt="Captured" className="w-full max-w-[150px] h-auto rounded-md border border-zinc-700" />
                                            <Button type="button" onClick={() => { setCapturedPhotoUrl(null); setCapturedPhotoFile(null); startCamera(); }} variant="ghost" className="text-xs text-zinc-400">Retake Photo</Button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500">Upload from gallery or take a picture.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Age (Optional)</Label>
                                    <Input name="age" type="number" placeholder="Enter age" className="bg-zinc-900 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date of Birth (DD/MM/YYYY)</Label>
                                    <Input name="dob_display" type="text" pattern="\d{2}/\d{2}/\d{4}" placeholder="DD/MM/YYYY" className="bg-zinc-900 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Weight (kg)</Label>
                                    <Input name="weight" type="number" step="0.1" required placeholder="Enter weight in kg" className="bg-zinc-900 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Height (cm)</Label>
                                    <Input name="height" type="number" required placeholder="Enter height in cm" className="bg-zinc-900 border-zinc-800" />
                                </div>
                            </div>
                            {/* Address removed as per request */}
                            <div className="space-y-2">
                                <Label>Membership Plan</Label>
                                <Select name="plan" defaultValue="BASIC">
                                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                        <SelectValue placeholder="Select Plan" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                        <SelectItem value="BASIC_1M">BASIC (1 Month)</SelectItem>
                                        <SelectItem value="BASIC">BASIC (3+3 Months Offer)</SelectItem>
                                        <SelectItem value="PRO">PRO (6+6 Months Offer)</SelectItem>
                                        <SelectItem value="ELITE">ELITE (1+1 Year Offer)</SelectItem>
                                        <SelectItem value="TRANSFORM_60">60 Day Transformation</SelectItem>
                                        <SelectItem value="TRANSFORM_120">120 Day Transformation</SelectItem>
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
                        placeholder="Search by name or enroll no..."
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
                                    <div 
                                        className={`h-10 w-10 rounded-full overflow-hidden bg-zinc-800 border border-white/10 ${member.photo ? 'cursor-pointer hover:ring-2 hover:ring-[#E50914] transition-all' : ''}`}
                                        onClick={() => member.photo && setPhotoViewerUrl(member.photo)}
                                    >
                                        {member.photo ? (
                                            <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-zinc-500">
                                                <UserIcon size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">
                                            {member.name}
                                            {member.enroll_no && (
                                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                                                    #{member.enroll_no}
                                                </span>
                                            )}
                                        </div>
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
                                    {member.membership?.end_date ? new Date(member.membership.end_date).toLocaleDateString("en-GB") : '-'}
                                </TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-2">
                                    {(member.membership && (member.membership.status !== 'ACTIVE' || (member.membership.end_date && new Date(member.membership.end_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)))) && (
                                        <Button
                                            onClick={() => openWhatsAppReminder(member)}
                                            disabled={!member.phone}
                                            title={!member.phone ? "Phone number not available" : "Send Reminder via WhatsApp"}
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs font-medium"
                                        >
                                            Remind
                                        </Button>
                                    )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10">
                                                <span className="sr-only">Open menu</span>
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleViewProfile(member)}>View Profile</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsEditOpen(true); }}>Edit Member</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsEditDatesOpen(true); }}>Edit Membership Dates</DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-zinc-800" />
                                            <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsRenewOpen(true); }}>Renew Membership</DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-zinc-800" />
                                            <DropdownMenuItem onClick={() => handleDeleteMember(member.id)} className="text-red-500 focus:text-red-500">Delete Member</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div >

            {/* View Profile Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="bg-[#0A0A0A] border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Member Profile</DialogTitle>
                    </DialogHeader>
                    {actionLoading || !memberDetails ? (
                        <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-zinc-500" /></div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
                                <div 
                                    className={`h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border border-white/10 ${memberDetails.photo_url ? 'cursor-pointer hover:ring-2 hover:ring-[#E50914] transition-all' : ''}`}
                                    onClick={() => memberDetails.photo_url && setPhotoViewerUrl(memberDetails.photo_url)}
                                >
                                    {memberDetails.photo_url ? (
                                        <img src={memberDetails.photo_url} alt={memberDetails.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <UserIcon className="h-8 w-8 text-zinc-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{memberDetails.name}</h3>
                                    <p className="text-zinc-400">{memberDetails.mobile}</p>
                                    {memberDetails.enroll_no && (
                                        <p className="text-xs text-zinc-500 mb-2">Enroll No: <span className="text-zinc-300 font-medium">{memberDetails.enroll_no}</span></p>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded-full ${new Date(memberDetails.membership_end) > new Date() ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {new Date(memberDetails.membership_end) > new Date() ? 'ACTIVE' : 'EXPIRED'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-zinc-900 p-3 rounded-md border border-zinc-800">
                                    <p className="text-xs text-zinc-500">Date of Birth</p>
                                    <p className="font-medium">{memberDetails.dob ? new Date(memberDetails.dob).toLocaleDateString("en-GB") : 'N/A'}</p>
                                </div>
                                <div className="bg-zinc-900 p-3 rounded-md border border-zinc-800">
                                    <p className="text-xs text-zinc-500">Join Date</p>
                                    <p className="font-medium">{new Date(memberDetails.membership_start).toLocaleDateString("en-GB")}</p>
                                </div>
                                <div className="bg-zinc-900 p-3 rounded-md border border-zinc-800">
                                    <p className="text-xs text-zinc-500">Expiry Date</p>
                                    <p className="font-medium">{new Date(memberDetails.membership_end).toLocaleDateString("en-GB")}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">Recent Payments <span className="text-xs text-zinc-500 font-normal">({memberDetails.payments?.length})</span></h4>
                                {memberDetails.payments?.slice(0, 3).map((p: any) => (
                                    <div key={p.id} className="text-sm flex justify-between py-1 border-b border-zinc-800/50">
                                        <span>{new Date(p.created_at).toLocaleDateString("en-GB")}</span>
                                        <span className="font-medium flex gap-2"><span className="text-xs text-zinc-500 border rounded px-1">{p.plan}</span> Rs. {p.amount}</span>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Recent Attendance <span className="text-xs text-zinc-500 font-normal">({memberDetails.recent_attendance?.length})</span></h4>
                                {memberDetails.recent_attendance?.slice(0, 5).map((a: any) => (
                                    <div key={a.id} className="text-sm flex justify-between py-1 border-b border-zinc-800/50">
                                        <span>{new Date(a.check_in_time).toLocaleDateString("en-GB")}</span>
                                        <span className="text-zinc-400">{new Date(a.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Renew Dialog */}
            <Dialog open={isRenewOpen} onOpenChange={(open) => { setIsRenewOpen(open); if (!open) setRenewPlan("BASIC"); }}>
                <DialogContent className="bg-[#0A0A0A] border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Renew Membership</DialogTitle>
                        <p className="text-sm text-zinc-400">Renewing for {selectedMember?.name}</p>
                    </DialogHeader>
                    <form onSubmit={handleRenew} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Plan</Label>
                            <Select name="plan" value={renewPlan} onValueChange={setRenewPlan}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="BASIC_1M">BASIC (1 Month)</SelectItem>
                                    <SelectItem value="BASIC">BASIC (3+3 Months Offer)</SelectItem>
                                    <SelectItem value="PRO">PRO (6+6 Months Offer)</SelectItem>
                                    <SelectItem value="ELITE">ELITE (1+1 Year Offer)</SelectItem>
                                    <SelectItem value="TRANSFORM_60">60 Day Transformation</SelectItem>
                                    <SelectItem value="TRANSFORM_120">120 Day Transformation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Date preview */}
                        <div className="rounded-md bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Start Date</span>
                                <span className="font-medium text-white">{renewPreview.start}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">End Date</span>
                                <span className="font-medium text-[#E50914]">{renewPreview.end}</span>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={submitLoading} className="w-full bg-[#E50914] hover:bg-[#E50914]/90 text-white">
                                {submitLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null} Renew
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={(val) => { setIsEditOpen(val); if (!val) { setCapturedPhotoUrl(null); setCapturedPhotoFile(null); stopCamera(); } }}>
                <DialogContent className="bg-[#0A0A0A] border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Member</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input name="name" defaultValue={selectedMember?.name} required className="bg-zinc-900 border-zinc-800" />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input name="phone" defaultValue={selectedMember?.phone} required className="bg-zinc-900 border-zinc-800" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Enroll Number (PIN)</Label>
                            <Input name="enroll_no" defaultValue={selectedMember?.enroll_no || ""} required className="bg-zinc-900 border-zinc-800" />
                        </div>


                        <div className="space-y-2">
                            <Label>Member Photo</Label>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="file"
                                        name="photo"
                                        accept="image/*"
                                        className="bg-zinc-900 border-zinc-800 file:bg-[#E50914] file:text-white file:border-0 file:rounded-sm file:px-2 file:mr-4"
                                    />
                                    <Button type="button" onClick={isCameraOpen ? stopCamera : () => startCamera()} variant="outline" className="bg-zinc-900 border-zinc-800 text-white shrink-0">
                                        {isCameraOpen ? <X className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                                        {isCameraOpen ? "Close Camera" : "Take Photo"}
                                    </Button>
                                </div>
                                {isCameraOpen && (
                                    <div className="flex flex-col items-center gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                                        <video ref={videoRef} autoPlay playsInline className="w-full max-w-[300px] h-auto rounded-md bg-black" />
                                        <canvas ref={canvasRef} className="hidden" />
                                        <div className="flex gap-2 w-full max-w-[300px]">
                                            <Button type="button" onClick={capturePhoto} className="bg-[#E50914] text-white flex-1">Capture Photo</Button>
                                            <Button type="button" onClick={switchCamera} variant="outline" className="bg-zinc-800 border-zinc-700 text-white shrink-0 px-3" title={facingMode === "user" ? "Switch to rear camera" : "Switch to front camera"}>
                                                {facingMode === "user" ? "🔄 Rear" : "🔄 Front"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {capturedPhotoUrl && !isCameraOpen && (
                                    <div className="flex flex-col items-center gap-2">
                                        <img src={capturedPhotoUrl} alt="Captured" className="w-full max-w-[150px] h-auto rounded-md border border-zinc-700" />
                                        <Button type="button" onClick={() => { setCapturedPhotoUrl(null); setCapturedPhotoFile(null); startCamera(); }} variant="ghost" className="text-xs text-zinc-400">Retake Photo</Button>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-zinc-500">Upload new photo (leaves existing if empty).</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Age (Optional)</Label>
                                <Input name="age" type="number" defaultValue={selectedMember?.age || ""} placeholder="Enter age" className="bg-zinc-900 border-zinc-800" />
                            </div>
                            <div className="space-y-2">
                                <Label>Date of Birth (DD/MM/YYYY)</Label>
                                <Input name="dob_display" type="text" pattern="\d{2}/\d{2}/\d{4}" placeholder="DD/MM/YYYY" defaultValue={selectedMember?.dob ? new Date(selectedMember.dob).toLocaleDateString("en-GB") : ""} className="bg-zinc-900 border-zinc-800" />
                            </div>
                            <div className="space-y-2">
                                <Label>Weight (kg)</Label>
                                <Input name="weight" type="number" step="0.1" defaultValue={selectedMember?.weight || ""} placeholder="Enter weight in kg" className="bg-zinc-900 border-zinc-800" />
                            </div>
                            <div className="space-y-2">
                                <Label>Height (cm)</Label>
                                <Input name="height" type="number" defaultValue={selectedMember?.height || ""} placeholder="Enter height in cm" className="bg-zinc-900 border-zinc-800" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Plan (Label ONLY - does not affect renewal)</Label>
                            <Select name="plan" defaultValue={selectedMember?.membership?.plan || "BASIC"}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="BASIC_1M">BASIC (1 Month)</SelectItem>
                                    <SelectItem value="BASIC">BASIC (3+3 Months Offer)</SelectItem>
                                    <SelectItem value="PRO">PRO (6+6 Months Offer)</SelectItem>
                                    <SelectItem value="ELITE">ELITE (1+1 Year Offer)</SelectItem>
                                    <SelectItem value="TRANSFORM_60">60 Day Transformation</SelectItem>
                                    <SelectItem value="TRANSFORM_120">120 Day Transformation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={submitLoading} className="w-full bg-white text-black hover:bg-zinc-200">
                                {submitLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null} Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Photo Viewer Dialog */}
            <Dialog open={!!photoViewerUrl} onOpenChange={(open) => !open && setPhotoViewerUrl(null)}>
                <DialogContent className="bg-transparent border-none p-0 max-w-4xl flex justify-center items-center shadow-none">
                    <DialogTitle className="sr-only">Photo Viewer</DialogTitle>
                    {photoViewerUrl && (
                        <img 
                            src={photoViewerUrl} 
                            alt="Member Profile" 
                            className="max-w-full max-h-[85vh] object-contain rounded-md" 
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Membership Dates Dialog */}
            <Dialog open={isEditDatesOpen} onOpenChange={setIsEditDatesOpen}>
                <DialogContent className="bg-[#0A0A0A] border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Edit Membership Dates</DialogTitle>
                        <p className="text-sm text-zinc-400">Editing dates for {selectedMember?.name}</p>
                    </DialogHeader>
                    <form onSubmit={handleEditDates} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Start Date (DD/MM/YYYY)</Label>
                            <Input
                                type="text"
                                name="start_date_display"
                                pattern="\d{2}/\d{2}/\d{4}"
                                placeholder="DD/MM/YYYY"
                                defaultValue={selectedMember?.membership?.start_date ? new Date(selectedMember.membership.start_date).toLocaleDateString("en-GB") : ""}
                                required
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date (DD/MM/YYYY)</Label>
                            <Input
                                type="text"
                                name="end_date_display"
                                pattern="\d{2}/\d{2}/\d{4}"
                                placeholder="DD/MM/YYYY"
                                defaultValue={selectedMember?.membership?.end_date ? new Date(selectedMember.membership.end_date).toLocaleDateString("en-GB") : ""}
                                required
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={submitLoading} className="w-full bg-[#E50914] hover:bg-[#E50914]/90 text-white">
                                {submitLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null} Save Dates
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    );
}
