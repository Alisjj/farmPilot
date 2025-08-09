import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6 p-4 sm:p-6">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                            404 Page Not Found
                        </h1>
                        <p className="text-sm sm:text-base text-slate-600">
                            The page you're looking for doesn't exist or has
                            been moved.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
