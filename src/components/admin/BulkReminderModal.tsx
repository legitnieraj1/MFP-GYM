"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buildReminderInfo } from "@/utils/whatsapp";
import { markMemberReminded } from "@/app/actions/admin";
import { MessageCircle, CheckCircle2, SkipForward, X } from "lucide-react";

type Member = {
    id: string;
    name: string;
    phone: string;
    enroll_no?: string | null;
    last_reminded_at?: string | null;
    membership?: {
        end_date: string;
    } | null;
};

type Phase = "summary" | "stepping" | "done";

function timeAgo(iso: string): string {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export function BulkReminderModal({
    open,
    onOpenChange,
    members,
    title = "Remind Members",
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    members: Member[];
    title?: string;
}) {
    const queue = useMemo(() => members.filter((m) => !!m.phone), [members]);
    const noPhoneCount = members.length - queue.length;

    const [phase, setPhase] = useState<Phase>("summary");
    const [index, setIndex] = useState(0);
    const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());
    const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
    const [sentThisStep, setSentThisStep] = useState(false);

    // Reset whenever the modal is (re)opened with a fresh queue.
    useEffect(() => {
        if (open) {
            setPhase("summary");
            setIndex(0);
            setRemindedIds(new Set());
            setSkippedIds(new Set());
            setSentThisStep(false);
        }
    }, [open]);

    const current = queue[index];

    const handleStart = () => {
        setPhase("stepping");
        setIndex(0);
        setSentThisStep(false);
    };

    const advance = () => {
        if (index + 1 >= queue.length) {
            setPhase("done");
        } else {
            setIndex((i) => i + 1);
            setSentThisStep(false);
        }
    };

    const handleOpenWhatsApp = () => {
        if (!current) return;
        const info = buildReminderInfo(current);
        if (!info.hasPhone) return;

        window.open(info.url, "_blank");
        setSentThisStep(true);
        setRemindedIds((prev) => new Set(prev).add(current.id));
        markMemberReminded(current.id).catch(() => {
            // Non-fatal: the WhatsApp message still opened for the admin.
        });
    };

    const handleSkip = () => {
        if (current) {
            setSkippedIds((prev) => new Set(prev).add(current.id));
        }
        advance();
    };

    const handleClose = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#0A0A0A] border-zinc-800 text-white max-w-md">
                {phase === "summary" && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-white">{title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <p className="text-sm text-zinc-300">
                                <span className="font-semibold text-white">{queue.length}</span> member
                                {queue.length === 1 ? "" : "s"} in this reminder queue.
                            </p>
                            {noPhoneCount > 0 && (
                                <p className="text-xs text-zinc-500">
                                    {noPhoneCount} member{noPhoneCount === 1 ? "" : "s"} skipped automatically — no phone number on file.
                                </p>
                            )}
                            <p className="text-xs text-zinc-500">
                                WhatsApp will open one member at a time. You confirm each send with a click.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={handleClose} className="text-zinc-400 hover:text-white hover:bg-white/10">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleStart}
                                disabled={queue.length === 0}
                                className="bg-[#E50914] hover:bg-[#E50914]/90 text-white disabled:opacity-50"
                            >
                                Start
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {phase === "stepping" && current && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-white">{title}</DialogTitle>
                            <div className="flex items-center gap-2 pt-1">
                                <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                                    <div
                                        className="h-full bg-[#E50914] transition-all duration-300"
                                        style={{ width: `${((index) / queue.length) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs text-zinc-500 whitespace-nowrap">
                                    {index + 1} / {queue.length}
                                </span>
                            </div>
                        </DialogHeader>

                        <div className="p-4 bg-black/40 rounded-lg border border-white/5 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="font-medium text-white">{current.name}</div>
                                {current.enroll_no && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                                        #{current.enroll_no}
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-zinc-500">{current.phone}</div>
                            {current.last_reminded_at && (
                                <div className="text-xs text-yellow-500/80">
                                    Last reminded {timeAgo(current.last_reminded_at)}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                variant="ghost"
                                onClick={handleSkip}
                                className="text-zinc-400 hover:text-white hover:bg-white/10"
                            >
                                <SkipForward className="w-4 h-4 mr-1.5" /> Skip
                            </Button>
                            {sentThisStep ? (
                                <Button
                                    onClick={advance}
                                    className="bg-green-600/20 text-green-400 border border-green-600/20 hover:bg-green-600/30"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Sent — Next
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleOpenWhatsApp}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <MessageCircle className="w-4 h-4 mr-1.5" /> Open WhatsApp
                                </Button>
                            )}
                        </DialogFooter>

                        <button
                            onClick={handleClose}
                            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 justify-center pt-1"
                        >
                            <X className="w-3 h-3" /> Stop / Cancel
                        </button>
                    </>
                )}

                {phase === "done" && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-white">All reminders completed</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-1 py-2 text-sm text-zinc-300">
                            <p>Reminded: <span className="text-green-400 font-semibold">{remindedIds.size}</span></p>
                            <p>Skipped (manual): <span className="text-zinc-400 font-semibold">{skippedIds.size}</span></p>
                            {noPhoneCount > 0 && (
                                <p>Skipped (no phone): <span className="text-zinc-400 font-semibold">{noPhoneCount}</span></p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button onClick={handleClose} className="bg-[#E50914] hover:bg-[#E50914]/90 text-white">
                                Close
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
