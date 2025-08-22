import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

interface InventoryItem {
  id: string;
  name: string;
  currentStock: string;
  reorderPoint: string;
  unit: string;
  expirationDate?: string;
}

interface InventoryStatusProps {
  items: InventoryItem[];
}

export default function InventoryStatus({ items }: InventoryStatusProps) {
  const getStockStatus = (current: string, reorder: string) => {
    const currentNum = parseFloat(current);
    const reorderNum = parseFloat(reorder);
    const percentage = (currentNum / reorderNum) * 100;
    
    if (percentage <= 50) return { status: "Low Stock", color: "destructive", progress: 50 };
    if (percentage <= 100) return { status: "Reorder Soon", color: "warning", progress: 75 };
    return { status: "In Stock", color: "success", progress: 100 };
  };

  const isExpiringSoon = (expirationDate?: string) => {
    if (!expirationDate) return false;
    const expiry = new Date(expirationDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 30;
  };

  // Mock data if no items provided
  const displayItems = items.length > 0 ? items : [
    {
      id: "1",
      name: "Layer Feed",
      currentStock: "2.5",
      reorderPoint: "5",
      unit: "tons",
    },
    {
      id: "2",
      name: "Vitamins",
      currentStock: "150",
      reorderPoint: "50",
      unit: "bottles",
    },
    {
      id: "3",
      name: "Antibiotics",
      currentStock: "25",
      reorderPoint: "40",
      unit: "vials",
      expirationDate: "2024-04-20",
    },
    {
      id: "4",
      name: "Egg Cartons",
      currentStock: "5000",
      reorderPoint: "1000",
      unit: "units",
    },
  ];

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Inventory Status
          </CardTitle>
          <Link href="/inventory">
            <a className="text-primary hover:text-primary/80 text-sm font-medium">
              View All Inventory
            </a>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {displayItems.slice(0, 4).map((item) => {
            const stockInfo = getStockStatus(item.currentStock, item.reorderPoint);
            const expiring = isExpiringSoon(item.expirationDate);
            
            return (
              <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900">{item.name}</h4>
                  <Badge 
                    variant={expiring ? "destructive" : stockInfo.color === "success" ? "default" : "secondary"}
                    className={`text-xs ${
                      expiring ? "bg-warning/10 text-warning" :
                      stockInfo.color === "success" ? "bg-success/10 text-success" :
                      stockInfo.color === "warning" ? "bg-warning/10 text-warning" :
                      "bg-accent/10 text-accent"
                    }`}
                  >
                    {expiring ? "Expiring Soon" : stockInfo.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Current Stock:</span>
                    <span className="font-mono font-medium">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      {expiring ? "Expires:" : "Reorder Point:"}
                    </span>
                    <span className={`font-mono font-medium ${expiring ? "text-warning" : ""}`}>
                      {expiring && item.expirationDate ? 
                        new Date(item.expirationDate).toLocaleDateString() :
                        `${item.reorderPoint} ${item.unit}`
                      }
                    </span>
                  </div>
                  
                  <Progress 
                    value={stockInfo.progress} 
                    className={`w-full h-2 ${
                      expiring ? "progress-warning" :
                      stockInfo.color === "success" ? "progress-success" :
                      stockInfo.color === "warning" ? "progress-warning" :
                      "progress-destructive"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
