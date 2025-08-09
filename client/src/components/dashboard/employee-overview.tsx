import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, DollarSign, Calendar, User } from "lucide-react";
import { Link } from "wouter";

interface EmployeeOverviewProps {
  totalEmployees: number;
  activeEmployees: number;
}

export default function EmployeeOverview({ totalEmployees, activeEmployees }: EmployeeOverviewProps) {
  const onLeave = totalEmployees - activeEmployees;
  
  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Employee Overview
          </CardTitle>
          <Link href="/employees">
            <a className="text-primary hover:text-primary/80 text-sm font-medium">
              Manage Employees
            </a>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Employee Stats */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900">Staff Statistics</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Employees:</span>
                <span className="font-mono font-medium">{totalEmployees}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Present Today:</span>
                <span className="font-mono font-medium text-success">{activeEmployees}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">On Leave:</span>
                <span className="font-mono font-medium text-warning">{onLeave}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Overtime Hours:</span>
                <span className="font-mono font-medium">18.5h</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900">Recent Activity</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="text-slate-600 w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Sarah Johnson</p>
                  <p className="text-xs text-slate-500">Clocked in - 6:00 AM</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="text-slate-600 w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Mike Chen</p>
                  <p className="text-xs text-slate-500">Completed morning rounds</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="text-slate-600 w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Anna Rodriguez</p>
                  <p className="text-xs text-slate-500">Updated inventory records</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900">Quick Actions</h4>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="w-4 h-4 mr-2" />
                Add New Employee
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="w-4 h-4 mr-2" />
                Process Payroll
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Shifts
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
