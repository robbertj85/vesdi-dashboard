'use client';

import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartTitle } from './chart-title';

interface DataTableProps {
  title: string;
  titleTooltip?: string;
  data: Record<string, string | number>[];
  columns: { key: string; label: string; format?: (v: number | string) => string }[];
  accentColor?: string;
  totalRow?: Record<string, string | number>;
}

export function DataTable({
  title,
  data,
  columns,
  accentColor = '#F58030',
  totalRow,
  titleTooltip,
}: DataTableProps) {
  return (
    <Card className="p-4 overflow-auto">
      <ChartTitle title={title} tooltip={titleTooltip} />
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className="text-white text-xs font-semibold"
                style={{ backgroundColor: accentColor }}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i} className="text-xs">
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.format
                    ? col.format(row[col.key])
                    : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {totalRow && (
            <TableRow className="font-bold text-xs" style={{ color: accentColor }}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.format
                    ? col.format(totalRow[col.key])
                    : totalRow[col.key]}
                </TableCell>
              ))}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
