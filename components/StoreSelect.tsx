'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface Store {
  _id: string;
  name: string;
}

interface StoreSelectProps {
  stores: Store[];
  selectedStore: string | null;
  onStoreSelect: (storeId: string) => void;
}

export default function StoreSelect({ stores, selectedStore, onStoreSelect }: StoreSelectProps) {
  return (
    <Card className="p-6 mb-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Select Store:</label>
        <Select value={selectedStore || ''} onValueChange={onStoreSelect}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Choose a store..." />
          </SelectTrigger>
          <SelectContent>
            {stores.map((store) => (
              <SelectItem key={store._id} value={store._id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
