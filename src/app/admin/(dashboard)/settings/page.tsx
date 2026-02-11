"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, CreditCard, Lock, Save, Globe } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
                    <Settings className="text-[#E50914]" size={32} /> Settings
                </h1>
                <p className="text-muted-foreground">Manage your gym's configuration and preferences.</p>
            </div>

            <div className="grid gap-8 max-w-4xl">
                {/* General Settings */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Globe className="h-5 w-5 text-[#E50914]" /> General Information
                        </CardTitle>
                        <CardDescription className="text-zinc-500">Update your public gym details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Gym Name</Label>
                                <Input defaultValue="MFP GYM" className="bg-zinc-950 border-zinc-800" />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Email</Label>
                                <Input defaultValue="contact@mfpgym.com" className="bg-zinc-950 border-zinc-800" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input defaultValue="123 Fitness St, Muscle City" className="bg-zinc-950 border-zinc-800" />
                        </div>
                        <Button className="bg-white text-black hover:bg-zinc-200">
                            <Save className="mr-2 h-4 w-4" /> Save Changes
                        </Button>
                    </CardContent>
                </Card>

                {/* Security */}
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

                {/* Billing */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-[#E50914]" /> Payment Gateways
                        </CardTitle>
                        <CardDescription className="text-zinc-500">Manage API keys for Razorpay.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Razorpay Key ID</Label>
                            <Input defaultValue="rzp_test_..." type="password" className="bg-zinc-950 border-zinc-800" />
                        </div>
                        <div className="space-y-2">
                            <Label>Razorpay Secret</Label>
                            <Input defaultValue="******" type="password" className="bg-zinc-950 border-zinc-800" />
                        </div>
                        <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                            Test Connection
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
