"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { Loader2, Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";

export default function BulkUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = (acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        setError(null);
        setUploadResult(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const binaryStr = e.target?.result;
                const workbook = XLSX.read(binaryStr, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);
                setData(jsonData);
            } catch (err) {
                setError("Failed to parse Excel file. Please ensure valid format.");
                console.error(err);
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/vnd.ms-excel": [".xls"],
            "text/csv": [".csv"]
        },
        maxFiles: 1
    });

    const handleUpload = async () => {
        if (!data.length) return;
        setIsUploading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/bulk-upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Upload failed");
            }

            setUploadResult(result);
            if (result.success) {
                setFile(null);
                setData([]);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = () => {
        setFile(null);
        setData([]);
        setUploadResult(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-black p-8 text-white">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-red-800 bg-clip-text text-transparent">
                        Bulk Member Upload
                    </h1>
                    <p className="text-zinc-400">
                        Upload Excel or CSV file to import members. Required columns: name, mobile. Optional: enroll_no, start_date, end_date.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Upload Area */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white">Upload File</CardTitle>
                                <CardDescription>Drag & drop or click to select</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!file ? (
                                    <div
                                        {...getRootProps()}
                                        className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? "border-red-500 bg-red-900/10" : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50"
                                            }`}
                                    >
                                        <input {...getInputProps()} />
                                        <Upload className="h-10 w-10 text-zinc-500 mb-4" />
                                        <p className="text-sm text-zinc-400 text-center">
                                            {isDragActive ? "Drop file here" : "Drag 'n' drop .xlsx, .xls, .csv"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between border border-zinc-700">
                                        <div className="flex items-center gap-3">
                                            <FileSpreadsheet className="h-8 w-8 text-green-500" />
                                            <div>
                                                <p className="font-medium text-sm truncate max-w-[150px]">{file.name}</p>
                                                <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={removeFile} className="hover:text-red-500">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {error && (
                                    <div className="mt-4 bg-red-900/50 border border-red-900 text-red-200 text-sm p-3 rounded-md flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <Button
                                    className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold"
                                    onClick={handleUpload}
                                    disabled={!file || isUploading || data.length === 0}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            Process {data.length > 0 && `(${data.length} rows)`}
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Results Summary */}
                        <AnimatePresence>
                            {uploadResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                                        <div className={`h-2 w-full ${uploadResult.success ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <CardHeader>
                                            <CardTitle className="text-white flex items-center gap-2">
                                                {uploadResult.success ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                                )}
                                                Upload Status
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-zinc-800 p-3 rounded-lg text-center">
                                                    <p className="text-xs text-zinc-400 uppercase">Success</p>
                                                    <p className="text-2xl font-bold text-green-500">{uploadResult.details?.success || 0}</p>
                                                </div>
                                                <div className="bg-zinc-800 p-3 rounded-lg text-center">
                                                    <p className="text-xs text-zinc-400 uppercase">Failed</p>
                                                    <p className="text-2xl font-bold text-red-500">{uploadResult.details?.failed || 0}</p>
                                                </div>
                                            </div>
                                            {uploadResult.details?.errors?.length > 0 && (
                                                <div className="bg-zinc-950 p-3 rounded-lg text-xs text-red-400 max-h-40 overflow-y-auto space-y-1">
                                                    {uploadResult.details.errors.map((err: string, i: number) => (
                                                        <p key={i}>• {err}</p>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Preview Table */}
                    <div className="lg:col-span-2">
                        <Card className="bg-zinc-900 border-zinc-800 h-full">
                            <CardHeader>
                                <CardTitle className="text-white">Data Preview</CardTitle>
                                <CardDescription>
                                    {data.length > 0 ? `Showing first 10 of ${data.length} rows` : "Upload a file to preview data"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {data.length > 0 ? (
                                    <div className="rounded-md border border-zinc-700 overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-zinc-800">
                                                <TableRow className="border-zinc-700 hover:bg-zinc-800">
                                                    {Object.keys(data[0]).slice(0, 5).map((header) => (
                                                        <TableHead key={header} className="text-zinc-300 font-bold">{header}</TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.slice(0, 10).map((row, i) => (
                                                    <TableRow key={i} className="border-zinc-700 hover:bg-zinc-800/50">
                                                        {Object.values(row).slice(0, 5).map((cell: any, j) => (
                                                            <TableCell key={j} className="text-zinc-400">
                                                                {String(cell)}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        {data.length > 10 && (
                                            <div className="p-2 text-center text-xs text-zinc-500 bg-zinc-800/30">
                                                ...and {data.length - 10} more rows
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800 rounded-lg">
                                        <FileSpreadsheet className="h-12 w-12 mb-2 opacity-20" />
                                        <p>No data to display</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
