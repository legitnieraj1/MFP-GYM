"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMember } from "@/app/actions/admin";
import { Loader2, Upload, ScanLine, Calculator } from "lucide-react";
import { createWorker } from "tesseract.js";

type LogMember = {
    name: string;
    phone: string;
    age: string;
    weight: string;
    height: string;
    address: string;
    joinDate: string;
    amount: string;
    plan: string;
};

export default function MembersLogPage() {
    const [loading, setLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [formData, setFormData] = useState<LogMember>({
        name: "",
        phone: "",
        age: "",
        weight: "",
        height: "",
        address: "",
        joinDate: new Date().toISOString().split('T')[0],
        amount: "",
        plan: "BASIC"
    });

    const calculatePlanFromAmount = (amount: number) => {
        if (amount >= 5000) return "ELITE";
        if (amount >= 3000) return "PRO";
        return "BASIC";
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const amt = e.target.value;
        setFormData(prev => ({
            ...prev,
            amount: amt,
            plan: calculatePlanFromAmount(Number(amt) || 0)
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];

        setOcrLoading(true);
        setOcrProgress(0);

        try {
            const worker = await createWorker();

            // Tesseract.js logger for progress updates if needed
            // await worker.loadLanguage('eng');
            // await worker.initialize('eng');

            const ret = await worker.recognize(file);
            const text = ret.data.text;

            // Simple parsing logic (can be refined based on logbook format)
            // Expecting something like: "Name: John, Phone: 1234..."
            // For now, let's just dump the text into name if it looks like a name, or alert user
            console.log("OCR Text:", text);

            // Attempt to find phone number (10 digits)
            const phoneMatch = text.match(/[\d]{10}/);
            // Attempt to find amount (3-5 digits)
            const amountMatch = text.match(/\b\d{3,5}\b/);

            setFormData(prev => ({
                ...prev,
                // Naive name extraction: first line often contains name
                name: text.split('\n')[0].substring(0, 50) || prev.name,
                phone: phoneMatch ? phoneMatch[0] : prev.phone,
                amount: amountMatch ? amountMatch[0] : prev.amount
            }));

            await worker.terminate();
            alert("Scan complete! Please review and correct the extracted details.");
        } catch (err) {
            console.error(err);
            alert("Failed to read image. Please enter details manually.");
        } finally {
            setOcrLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append("name", formData.name);
        data.append("phone", formData.phone);
        data.append("email", `log_${Date.now()}@mfpgym.local`); // Placeholder email for log members
        data.append("age", formData.age);
        data.append("weight", formData.weight);
        data.append("height", formData.height);
        data.append("address", formData.address);
        data.append("plan", formData.plan);
        data.append("joinDate", formData.joinDate); // Pass manual join date
        data.append("amount", formData.amount);

        const result = await createMember(data);

        if (result.success) {
            alert("Member added successfully from log!");
            setFormData({
                name: "",
                phone: "",
                age: "",
                weight: "",
                height: "",
                address: "",
                joinDate: new Date().toISOString().split('T')[0],
                amount: "",
                plan: "BASIC"
            });
        } else {
            alert(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Members Log Entry</h1>
                <p className="text-zinc-400">Digitize your physical gym register. Add past members manually or scan a page.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Manual Entry Form */}
                <Card className="bg-[#0A0A0A] border-zinc-800 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center justify-between">
                            <span>Member Details</span>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="log-upload"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={ocrLoading}
                                />
                                <Label
                                    htmlFor="log-upload"
                                    className={`flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg cursor-pointer transition-colors ${ocrLoading ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    {ocrLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <ScanLine className="w-4 h-4" />}
                                    {ocrLoading ? "Scanning..." : "Scan Log Photo"}
                                </Label>
                            </div>
                        </CardTitle>
                        <CardDescription>
                            Enter details from your physical register.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Member Name</Label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-zinc-900 border-zinc-800 text-white"
                                        placeholder="e.g. Rahul Sharma"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Phone Number</Label>
                                    <Input
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="bg-zinc-900 border-zinc-800 text-white"
                                        placeholder="+91..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Age</Label>
                                    <Input
                                        type="number"
                                        required
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        className="bg-zinc-900 border-zinc-800 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Weight (kg)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                        className="bg-zinc-900 border-zinc-800 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Original Joining Date</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={formData.joinDate}
                                        onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                                        className="bg-zinc-900 border-zinc-800 text-white"
                                    />
                                    <p className="text-xs text-zinc-500">The actual date they paid in the logbook.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300 flex items-center gap-2">
                                        Amount Paid <Calculator className="w-3 h-3" />
                                    </Label>
                                    <Input
                                        type="number"
                                        required
                                        value={formData.amount}
                                        onChange={handleAmountChange}
                                        className="bg-zinc-900 border-zinc-800 text-white"
                                        placeholder="e.g. 1500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Assigned Plan</Label>
                                    <Select
                                        value={formData.plan}
                                        onValueChange={(val) => setFormData({ ...formData, plan: val })}
                                    >
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BASIC">BASIC (Quarterly)</SelectItem>
                                            <SelectItem value="PRO">PRO (Half-Yearly)</SelectItem>
                                            <SelectItem value="ELITE">ELITE (Yearly)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-zinc-500">Auto-selected based on amount paid.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Height (cm)</Label>
                                    <Input
                                        type="number"
                                        required
                                        value={formData.height}
                                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                        className="bg-zinc-900 border-zinc-800 text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-300">Address</Label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="bg-zinc-900 border-zinc-800 text-white"
                                    placeholder="Residential Address"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#E50914] hover:bg-[#E50914]/90 text-white font-bold h-12"
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2 w-4 h-4" />}
                                Add to Digital Database
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
