"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Lock, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";

export default function SettingsPage() {
    // Bulk Upload State
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        processed: number;
        failed: number;
        errors: string[];
    } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        try {
            // Parse Excel client-side
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "buffer" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows: any[] = XLSX.utils.sheet_to_json(sheet);

            // Map columns to what /api/auth/bulk-upload expects
            const mapped = rows.map((row) => {
                // Normalize keys: lowercase, remove spaces/special chars
                const norm: any = {};
                Object.keys(row).forEach(k => {
                    norm[k.toLowerCase().replace(/[^a-z0-9]/g, "")] = row[k];
                });

                return {
                    enroll_no: String(norm["enrollno"] || norm["enrollmentnumber"] || norm["enrollmentno"] || norm["id"] || ""),
                    name: norm["name"] || "",
                    mobile: String(norm["mobilenumber"] || norm["mobile"] || norm["phone"] || ""),
                    start_date: norm["startdate"] || "",
                    end_date: norm["enddate"] || "",
                };
            });

            const res = await fetch("/api/auth/bulk-upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mapped),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");

            setResult({
                success: true,
                processed: data.details?.success || 0,
                failed: data.details?.failed || 0,
                errors: data.details?.errors || [],
            });
        } catch (error: any) {
            console.error(error);
            setResult({ success: false, processed: 0, failed: 1, errors: [error.message || "Unexpected error occurred"] });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
                    <Settings className="text-[#E50914]" size={32} /> Settings
                </h1>
                <p className="text-muted-foreground">Manage system configuration and data.</p>
            </div>

            <div className="grid gap-8 max-w-4xl">

                {/* Bulk Upload Section - Replaces General Info */}
                <Card className="bg-[#0A0A0A] border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Upload className="h-5 w-5 text-[#E50914]" /> Bulk Member Upload
                        </CardTitle>
                        <CardDescription className="text-zinc-500">
                            Import members from Excel sheet. <br />
                            Required columns: <strong>enroll no | Name | start date | end date | mobile number</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <FileSpreadsheet className="w-10 h-10 mb-3 text-zinc-500" />
                                    <p className="mb-2 text-sm text-zinc-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-zinc-500">XLSX or XLS files</p>
                                    {file && (
                                        <div className="mt-4 px-4 py-2 bg-[#E50914]/10 text-[#E50914] rounded-md font-medium">
                                            Selected: {file.name}
                                        </div>
                                    )}
                                </div>
                                <input id="dropzone-file" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
                            </label>
                        </div>

                        <Button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className="w-full bg-[#E50914] hover:bg-[#E50914]/90 text-white font-bold h-12 shadow-[0_0_15px_-5px_#E50914]"
                        >
                            {loading ? "Processing..." : "Upload & Process"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Upload Results */}
                {result && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-green-500/10 border-green-500/20">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                    <div>
                                        <p className="text-2xl font-bold text-white">{result.processed}</p>
                                        <p className="text-green-500 text-sm">Successfully Processed</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-red-500/10 border-red-500/20">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <AlertCircle className="w-8 h-8 text-red-500" />
                                    <div>
                                        <p className="text-2xl font-bold text-white">{result.failed}</p>
                                        <p className="text-red-500 text-sm">Failed Rows</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {result.errors.length > 0 && (
                            <Card className="bg-[#0A0A0A] border-zinc-800">
                                <CardHeader>
                                    <CardTitle className="text-red-500 text-lg">Error Log</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm text-zinc-400 max-h-60 overflow-y-auto">
                                        {result.errors.map((err, i) => (
                                            <li key={i} className="pb-2 border-b border-zinc-800 last:border-0">{err}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Security Section - Kept as good practice, but removed General & Billings as requested */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Lock className="h-5 w-5 text-[#E50914]" /> Security
                        </CardTitle>
                        <CardDescription className="text-zinc-500">Change your admin password.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Current Password</Label>
                            <Input type="password" className="bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input type="password" className="bg-zinc-950 border-zinc-800" />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm Password</Label>
                                <Input type="password" className="bg-zinc-950 border-zinc-800" />
                            </div>
                        </div>
                        <Button className="bg-[#E50914] text-white hover:bg-[#E50914]/90">
                            Update Password
                        </Button>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
