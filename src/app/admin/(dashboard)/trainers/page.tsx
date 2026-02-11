"use client";

import { useState, useEffect } from "react";
import { getTrainers, createTrainer, deleteTrainer } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Plus, User, Loader2 } from "lucide-react";

type Trainer = {
    id: string;
    name: string;
    specialty: string;
    experience: string;
    image_url: string;
};

export default function TrainersPage() {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        fetchTrainers();
    }, []);

    const fetchTrainers = async () => {
        setLoading(true);
        const res = await getTrainers();
        if (res.success && res.data) {
            setTrainers(res.data as unknown as Trainer[]);
        }
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitLoading(true);
        const formData = new FormData(e.currentTarget);

        // If no image provided, use placeholder
        if (!formData.get("image_url")) {
            formData.set("image_url", `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.get("name")}`);
        }

        const res = await createTrainer(formData);
        if (res.success) {
            setIsAddOpen(false);
            fetchTrainers();
        } else {
            alert(res.error);
        }
        setSubmitLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this trainer?")) return;
        const res = await deleteTrainer(id);
        if (res.success) {
            fetchTrainers();
        } else {
            alert(res.error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Trainers Management</h1>
                    <p className="text-muted-foreground">Manage your gym's fitness experts.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#E50914] text-white hover:bg-[#E50914]/90 shadow-[0_0_15px_-5px_#E50914]">
                            <Plus className="mr-2 h-4 w-4" /> Add Trainer
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0A0A0A] border-zinc-800 text-white">
                        <DialogHeader>
                            <DialogTitle>Add New Trainer</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input name="name" required className="bg-zinc-900 border-zinc-800" placeholder="e.g. Mike Tyson" />
                            </div>
                            <div className="space-y-2">
                                <Label>Specialty</Label>
                                <Input name="specialty" required className="bg-zinc-900 border-zinc-800" placeholder="e.g. Boxing, HIIT" />
                            </div>
                            <div className="space-y-2">
                                <Label>Experience</Label>
                                <Input name="experience" required className="bg-zinc-900 border-zinc-800" placeholder="e.g. 5 Years" />
                            </div>
                            <div className="space-y-2">
                                <Label>Image URL (Optional)</Label>
                                <Input name="image_url" className="bg-zinc-900 border-zinc-800" placeholder="https://..." />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={submitLoading} className="w-full bg-[#E50914] hover:bg-[#E50914]/90">
                                    {submitLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add Trainer"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-zinc-500">Loading trainers...</div>
                ) : trainers.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-zinc-500">No trainers found. Add one to get started.</div>
                ) : (
                    trainers.map((trainer) => (
                        <Card key={trainer.id} className="bg-zinc-900 border-zinc-800 overflow-hidden group hover:border-[#E50914]/50 transition-colors">
                            <div className="aspect-square w-full relative overflow-hidden bg-zinc-800">
                                {trainer.image_url ? (
                                    <img src={trainer.image_url} alt={trainer.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                        <User size={48} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-lg font-bold text-white">{trainer.name}</h3>
                                    <p className="text-sm text-[#E50914]">{trainer.specialty}</p>
                                </div>
                            </div>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="text-sm text-zinc-400">
                                    Exp: <span className="text-white">{trainer.experience}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                                    onClick={() => handleDelete(trainer.id)}
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
