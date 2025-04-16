import { useState } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Zap, BookOpen, Swords } from 'lucide-react';

// Mock data for charts
const accuracyData = [
  { date: 'Jan 1', accuracy: 65 },
  { date: 'Jan 15', accuracy: 68 },
  { date: 'Feb 1', accuracy: 72 },
  { date: 'Feb 15', accuracy: 69 },
  { date: 'Mar 1', accuracy: 75 },
  { date: 'Mar 15', accuracy: 79 },
  { date: 'Apr 1', accuracy: 82 },
];

const skillsData = [
  { name: 'Tactics', rating: 75 },
  { name: 'Openings', rating: 62 },
  { name: 'Middlegame', rating: 58 },
  { name: 'Endgame', rating: 45 },
  { name: 'Calculation', rating: 68 },
];

interface FocusArea {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const focusAreas: FocusArea[] = [
  {
    id: 1,
    title: 'Tactics: Knight Forks',
    description: "You've missed several knight fork opportunities in recent games.",
    icon: <Swords className="h-4 w-4" />
  },
  {
    id: 2,
    title: 'Endgame: Rook Endgames',
    description: "Your technique in rook endgames needs improvement.",
    icon: <Zap className="h-4 w-4" />
  },
  {
    id: 3,
    title: 'Strategy: Pawn Structure',
    description: "You tend to create weak pawn structures in the middlegame.",
    icon: <BookOpen className="h-4 w-4" />
  }
];

export default function ProgressSection() {
  const [timeRange, setTimeRange] = useState('30');
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium text-neutral-800">Your Progress</CardTitle>
        <Select defaultValue="30" onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="180">Last 6 months</SelectItem>
            <SelectItem value="365">This year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-neutral-800 mb-3">Skill Development</h3>
            <div className="bg-neutral-100 p-4 rounded-lg h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={skillsData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Rating']}
                    labelFormatter={() => ''}
                  />
                  <Bar dataKey="rating" fill="var(--chart-1)" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <h3 className="text-sm font-medium text-neutral-800 mb-3 mt-6">Accuracy Trend</h3>
            <div className="bg-neutral-100 p-4 rounded-lg h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={accuracyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[40, 100]} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Accuracy']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="var(--chart-2)"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-neutral-800 mb-3">Areas to Focus</h3>
            <div className="space-y-4">
              {focusAreas.map((area) => (
                <div key={area.id} className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white">
                        {area.icon}
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-neutral-800">{area.title}</h4>
                      <p className="mt-1 text-xs text-neutral-600">{area.description}</p>
                      <a href="#" className="mt-2 inline-flex items-center text-xs font-medium text-primary hover:text-primary-dark">
                        Train this skill →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="bg-neutral-100 p-4 rounded-lg mt-6">
                <h4 className="text-sm font-medium text-neutral-800 mb-3">Weekly Performance</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-700">Games Played</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-700">Win Rate</span>
                    <span className="font-medium">58%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-700">Average Accuracy</span>
                    <span className="font-medium">74%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-700">Blunders per Game</span>
                    <span className="font-medium">1.2</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-primary to-primary-dark p-4 rounded-lg text-white mt-4">
                <h4 className="text-sm font-medium mb-2">Weekly Insight</h4>
                <p className="text-xs">
                  Your tactical awareness has improved by 15% compared to last week. 
                  Continue focusing on knight forks and discovered attacks to further enhance your tactical vision.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
