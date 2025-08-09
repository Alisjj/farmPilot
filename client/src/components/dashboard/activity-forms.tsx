import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Egg, Wheat, Skull, Plus } from "lucide-react";

export default function ActivityForms() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [eggData, setEggData] = useState({ quantity: "", grade: "" });
  const [feedData, setFeedData] = useState({ type: "", quantity: "" });
  const [mortalityData, setMortalityData] = useState({ count: "", cause: "" });

  const createActivityMutation = useMutation({
    mutationFn: async (activityData: any) => {
      await apiRequest("POST", "/api/activities", activityData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record activity",
        variant: "destructive",
      });
    },
  });

  const handleRecordEggCollection = () => {
    if (!eggData.quantity || !eggData.grade) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createActivityMutation.mutate({
      activityType: "egg_collection",
      data: {
        quantity: parseInt(eggData.quantity),
        grade: eggData.grade,
      },
    });

    setEggData({ quantity: "", grade: "" });
  };

  const handleRecordFeedDistribution = () => {
    if (!feedData.type || !feedData.quantity) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createActivityMutation.mutate({
      activityType: "feed_distribution",
      data: {
        feedType: feedData.type,
        quantity: parseFloat(feedData.quantity),
      },
    });

    setFeedData({ type: "", quantity: "" });
  };

  const handleRecordMortality = () => {
    if (!mortalityData.count || !mortalityData.cause) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createActivityMutation.mutate({
      activityType: "mortality",
      data: {
        count: parseInt(mortalityData.count),
        cause: mortalityData.cause,
      },
    });

    setMortalityData({ count: "", cause: "" });
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Quick Activity Recording
          </CardTitle>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            New Activity
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Egg Collection Form */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900 flex items-center">
              <Egg className="text-primary mr-2 w-5 h-5" />
              Egg Collection
            </h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="egg-quantity">Quantity</Label>
                <Input
                  id="egg-quantity"
                  type="number"
                  placeholder="0"
                  value={eggData.quantity}
                  onChange={(e) => setEggData({ ...eggData, quantity: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="egg-grade">Quality Grade</Label>
                <Select value={eggData.grade} onValueChange={(value) => setEggData({ ...eggData, grade: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grade_a">Grade A</SelectItem>
                    <SelectItem value="grade_b">Grade B</SelectItem>
                    <SelectItem value="grade_c">Grade C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleRecordEggCollection}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={createActivityMutation.isPending}
              >
                {createActivityMutation.isPending ? "Recording..." : "Record Collection"}
              </Button>
            </div>
          </div>

          {/* Feed Distribution Form */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900 flex items-center">
              <Wheat className="text-secondary mr-2 w-5 h-5" />
              Feed Distribution
            </h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="feed-type">Feed Type</Label>
                <Select value={feedData.type} onValueChange={(value) => setFeedData({ ...feedData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select feed type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="layer_feed">Layer Feed</SelectItem>
                    <SelectItem value="starter_feed">Starter Feed</SelectItem>
                    <SelectItem value="grower_feed">Grower Feed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="feed-quantity">Quantity (kg)</Label>
                <Input
                  id="feed-quantity"
                  type="number"
                  placeholder="0"
                  value={feedData.quantity}
                  onChange={(e) => setFeedData({ ...feedData, quantity: e.target.value })}
                />
              </div>
              <Button 
                onClick={handleRecordFeedDistribution}
                className="w-full bg-secondary hover:bg-secondary/90"
                disabled={createActivityMutation.isPending}
              >
                {createActivityMutation.isPending ? "Recording..." : "Record Distribution"}
              </Button>
            </div>
          </div>

          {/* Mortality Tracking Form */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900 flex items-center">
              <Skull className="text-warning mr-2 w-5 h-5" />
              Mortality Tracking
            </h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="mortality-count">Count</Label>
                <Input
                  id="mortality-count"
                  type="number"
                  placeholder="0"
                  value={mortalityData.count}
                  onChange={(e) => setMortalityData({ ...mortalityData, count: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="mortality-cause">Suspected Cause</Label>
                <Select value={mortalityData.cause} onValueChange={(value) => setMortalityData({ ...mortalityData, cause: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cause" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disease">Disease</SelectItem>
                    <SelectItem value="injury">Injury</SelectItem>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleRecordMortality}
                className="w-full bg-warning hover:bg-warning/90"
                disabled={createActivityMutation.isPending}
              >
                {createActivityMutation.isPending ? "Recording..." : "Record Mortality"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
