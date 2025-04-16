import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, XAxis, YAxis, Bar, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from "recharts";
import { TrendingUp, BarChart2, PieChart as PieChartIcon } from "lucide-react";

interface InsightsChartProps {
  title: string;
  type: "tactics" | "openings" | "improvement";
}

// Mock data for the charts
const tacticsData = [
  { month: "Jan", rating: 1200 },
  { month: "Feb", rating: 1250 },
  { month: "Mar", rating: 1230 },
  { month: "Apr", rating: 1300 },
  { month: "May", rating: 1350 },
  { month: "Jun", rating: 1400 },
];

const openingsData = [
  { name: "Sicilian", value: 40 },
  { name: "Queen's Gambit", value: 30 },
  { name: "Ruy Lopez", value: 20 },
  { name: "Other", value: 10 },
];

const improvementAreas = [
  { area: "Endgame", level: 40 },
  { area: "Time Mgmt", level: 60 },
  { area: "Tactics", level: 75 },
  { area: "Openings", level: 80 },
];

const COLORS = ["#1565C0", "#388E3C", "#FFC107", "#757575"];

export default function InsightsChart({ title, type }: InsightsChartProps) {
  const renderChart = () => {
    switch (type) {
      case "tactics":
        return (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={tacticsData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="rating" 
                stroke="#1565C0" 
                strokeWidth={2} 
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "openings":
        return (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={openingsData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={40}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {openingsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case "improvement":
        return (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={improvementAreas} layout="vertical">
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="area" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="level" fill="#1565C0" />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };
  
  const renderIcon = () => {
    switch (type) {
      case "tactics":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "openings":
        return <PieChartIcon className="h-5 w-5 text-primary" />;
      case "improvement":
        return <BarChart2 className="h-5 w-5 text-amber-500" />;
      default:
        return null;
    }
  };
  
  const renderSummary = () => {
    switch (type) {
      case "tactics":
        return "You've improved your tactical awareness by 15% in the last month.";
      case "openings":
        return "You perform best with the Sicilian Defense (68% win rate).";
      case "improvement":
        return (
          <ul className="space-y-3">
            <li className="flex items-center">
              <span className="w-1 h-6 bg-red-500 rounded-full mr-3"></span>
              <div>
                <p className="font-medium">Endgame Technique</p>
                <p className="text-xs text-gray-500">Struggles with converting winning positions</p>
              </div>
            </li>
            <li className="flex items-center">
              <span className="w-1 h-6 bg-amber-500 rounded-full mr-3"></span>
              <div>
                <p className="font-medium">Time Management</p>
                <p className="text-xs text-gray-500">Often in time pressure after move 30</p>
              </div>
            </li>
            <li className="flex items-center">
              <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
              <div>
                <p className="font-medium">Pawn Structure</p>
                <p className="text-xs text-gray-500">Creating and exploiting weak squares</p>
              </div>
            </li>
          </ul>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {renderIcon()}
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
        
        <div className={`mt-4 ${type === "improvement" ? "" : "text-sm text-gray-600"}`}>
          {renderSummary()}
        </div>
      </CardContent>
    </Card>
  );
}
