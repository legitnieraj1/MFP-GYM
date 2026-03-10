"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Loader2, Edit } from "lucide-react";
import { updateMyProfile } from "@/app/actions/user";

export function EditProfileDialog({ memberProfile }: { memberProfile: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const res = await updateMyProfile(formData);
        if (res.success) {
            setIsOpen(false);
        } else {
            alert(res.error || "Failed to update profile");
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 hover:text-white">
                    <Edit className="w-4 h-4 mr-2" /> Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A0A] border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4" encType="multipart/form-data">
                    <div className="space-y-2">
                        <Label>Profile Photo</Label>
                        <Input
                            type="file"
                            name="photo"
                            accept="image/*"
                            className="bg-zinc-900 border-zinc-800 file:bg-[#E50914] file:text-white file:border-0 file:rounded-sm file:px-2 file:mr-4"
                        />
                        <p className="text-xs text-zinc-500">Upload new photo (leaves existing if empty).</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Age (Optional)</Label>
                            <Input name="age" type="number" defaultValue={memberProfile?.age || ""} className="bg-zinc-900 border-zinc-800" />
                        </div>
                        <div className="space-y-2">
                            <Label>Date of Birth</Label>
                            <Input name="dob" type="date" defaultValue={memberProfile?.dob || ""} className="bg-zinc-900 border-zinc-800" />
                        </div>
                        <div className="space-y-2">
                            <Label>Weight (kg)</Label>
                            <Input name="weight" type="number" step="0.1" defaultValue={memberProfile?.weight || ""} className="bg-zinc-900 border-zinc-800" />
                        </div>
                        <div className="space-y-2">
                            <Label>Height (cm)</Label>
                            <Input name="height" type="number" defaultValue={memberProfile?.height || ""} className="bg-zinc-900 border-zinc-800" />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={loading} className="w-full bg-[#E50914] hover:bg-[#E50914]/90 text-white">
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
