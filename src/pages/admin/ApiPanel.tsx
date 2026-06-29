import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Terminal, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ApiPanel = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-800 flex items-center gap-2.5">
                        <Terminal className="w-8 h-8 text-blue-600" />
                        API Panel
                    </h1>
                    <p className="text-slate-500 mt-1.5 font-medium text-sm">
                        Embed system for managing KwikAPI order status and developer parameters.
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    className="h-11 rounded-xl font-bold flex items-center gap-2 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => window.open("https://www.kwikapi.com/Dashboard/myorders.php", "_blank")}
                >
                    Open Dashboard directly
                    <ExternalLink className="w-4 h-4" />
                </Button>
            </div>

            <Card className="border-slate-100 shadow-sm rounded-2.5xl overflow-hidden bg-white">
                <CardContent className="p-2">
                    <iframe
                        src="https://www.kwikapi.com/Dashboard/myorders.php"
                        width="100%"
                        height="700px"
                        name="KwikAPI"
                        scrolling="yes"
                        allowFullScreen
                        loading="lazy"
                        style={{
                            border: "none",
                            borderRadius: "16px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
};
