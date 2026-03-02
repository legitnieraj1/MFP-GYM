"use client";

import { useState, useEffect } from "react";
import { getPayments, getPaymentStats } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type PaymentRecord = {
    id: string;
    amount: number;
    status: string;
    plan: string;
    razorpay_order_id: string;
    created_at: string;
    member: {
        name: string;
        mobile: string;
    };
};

type PaymentStats = {
    revenue: number;
    prevRevenue: number;
    percentChange: number;
    pendingAmount: number;
    pendingCount: number;
    averageTransaction: number;
};

export default function PaymentsPage() {
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [stats, setStats] = useState<PaymentStats>({
        revenue: 0,
        prevRevenue: 0,
        percentChange: 0,
        pendingAmount: 0,
        pendingCount: 0,
        averageTransaction: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            const [paymentsRes, statsRes] = await Promise.all([
                getPayments(),
                getPaymentStats()
            ]);

            if (paymentsRes.success && paymentsRes.data) {
                setPayments(paymentsRes.data as unknown as PaymentRecord[]);
            }

            if (statsRes.success && statsRes.data) {
                setStats(statsRes.data);
            }

            setLoading(false);
        }
        fetch();
    }, []);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Payments & Revenue</h1>
                    <p className="text-muted-foreground">Track all membership transactions and invoices.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                    <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800">
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                </div>
            </div>

            {/* Revenue Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Revenue (Monthly)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {loading ? "..." : formatCurrency(stats.revenue)}
                        </div>
                        <p className={`text-xs flex items-center mt-1 ${stats.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {stats.percentChange > 0 ? '+' : ''}{stats.percentChange}% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Pending Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {loading ? "..." : formatCurrency(stats.pendingAmount)}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            from {stats.pendingCount} transactions
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Average Transaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {loading ? "..." : formatCurrency(stats.averageTransaction)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-white">Recent Transactions</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input placeholder="Search transaction ID..." className="pl-10 h-9 bg-black/50 border-zinc-800" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader className="bg-zinc-900/50">
                            <TableRow className="border-zinc-800">
                                <TableHead className="text-zinc-400">Transaction ID</TableHead>
                                <TableHead className="text-zinc-400">User</TableHead>
                                <TableHead className="text-zinc-400">Amount</TableHead>
                                <TableHead className="text-zinc-400">Status</TableHead>
                                <TableHead className="text-zinc-400">Date</TableHead>
                                <TableHead className="text-right text-zinc-400">Invoice</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-zinc-500">Loading payments...</TableCell>
                                </TableRow>
                            ) : payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-zinc-500">No transactions found.</TableCell>
                                </TableRow>
                            ) : (
                                payments.map((payment) => (
                                    <TableRow key={payment.id} className="border-zinc-800 hover:bg-zinc-800/30">
                                        <TableCell className="font-mono text-xs text-zinc-400">
                                            {payment.razorpay_order_id}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-white">{payment.member?.name || "Unknown"}</div>
                                            <div className="text-xs text-zinc-500">{payment.member?.mobile || "-"}</div>
                                        </TableCell>
                                        <TableCell className="text-white font-medium">
                                            {formatCurrency(payment.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`
                                                    ${payment.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                        payment.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                            'bg-red-500/10 text-red-500 border-red-500/20'}
                                                `}
                                            >
                                                {payment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-zinc-400 text-sm">
                                            {new Date(payment.created_at).toLocaleDateString("en-GB")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="h-8 text-[#E50914] hover:text-[#E50914] hover:bg-[#E50914]/10">
                                                Download
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
