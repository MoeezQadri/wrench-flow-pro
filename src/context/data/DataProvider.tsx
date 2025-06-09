import React from 'react';
import { DataProvider as DataProviderComponent } from './DataContext';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <DataProviderComponent>{children}</DataProviderComponent>;
};
