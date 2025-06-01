import React, { useState } from "react";
import {
    Table,
    TableHeader,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import HorizontalScroller from "@/components/dashboard/HorizontalScroller";


const mockStats = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `Metric ${i + 1}`,
    data: [
        { label: `Week 1`, value: 50 + i },
        { label: `Week 2`, value: 60 + i },
        { label: `Week 3`, value: 70 + i },
    ],
    key: "value",
}));

// Pure red → green gradient generator
const getGradientColor = (value, max) => {
    const min = 50;
    const ratio = Math.min(Math.max((value - min) / (max - min), 0), 1);

    const red = Math.round(240 * (1 - ratio));
    const green = Math.round(200 * ratio);
    const blue = 50;

    return `rgb(${red}, ${green}, ${blue})`;
};

export default function StudentStatsCarousel() {
    const [flippedIndexes, setFlippedIndexes] = useState(new Set());

    const toggleFlip = (index) => {
        const newSet = new Set(flippedIndexes);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setFlippedIndexes(newSet);
    };

    const renderItem = (stat, index) => {
        // Find the maximum value for stat.key across all entries
        const maxValue = Math.max(...stat.data.map(d => d[stat.key]));

        return (
            <Card
                key={stat.id}
                className="w-72 min-w-[18rem] h-[340px] flex flex-col transform scale-[0.95] transition-transform hover:scale-100"
                onClick={() => toggleFlip(index)}
            >
                {flippedIndexes.has(index) ? (
                    <div className="p-4 flex flex-col h-full">
                        <h4 className="text-md font-semibold text-black mb-2">
                            {stat.title} - Data
                        </h4>
                        <div className="overflow-y-auto flex-grow">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {Object.keys(stat.data[0]).map((key) => (
                                            <TableHead key={key} className="text-black">
                                                {key}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stat.data.map((row, rowIdx) => (
                                        <TableRow key={rowIdx}>
                                            {Object.values(row).map((val, cellIdx) => (
                                                <TableCell key={cellIdx} className="text-black">
                                                    {val}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 flex flex-col h-full">
                        <h4 className="text-md font-semibold text-black">{stat.title}</h4>
                        <div className="flex-grow pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stat.data}>
                                    <XAxis dataKey="label" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey={stat.key}>
                                        {stat.data.map((entry, i) => (
                                            <Cell
                                                key={`cell-${i}`}
                                                fill={getGradientColor(entry[stat.key], maxValue)}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </Card>
        );
    };

    return (
        <HorizontalScroller
            title="Student Stats"
            items={mockStats}
            renderItem={renderItem}
        />
    );
}
