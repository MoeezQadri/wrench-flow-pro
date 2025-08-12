import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';
import { testOrganizationIsolation, validateDataIsolation, type IsolationTestResults } from '@/utils/test-organization-isolation';

export const IsolationTest: React.FC = () => {
  const { currentUser } = useAuthContext();
  const [testResults, setTestResults] = useState<IsolationTestResults | null>(null);
  const [testing, setTesting] = useState(false);

  const runIsolationTest = async () => {
    setTesting(true);
    try {
      const results = await testOrganizationIsolation();
      setTestResults(results);
    } catch (error) {
      console.error('Failed to run isolation test:', error);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      runIsolationTest();
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle>Data Isolation Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please log in to test data isolation.</p>
        </CardContent>
      </Card>
    );
  }

  const validation = testResults ? validateDataIsolation(testResults) : null;

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Phase 3: Data Isolation Test Results</CardTitle>
        <Button onClick={runIsolationTest} disabled={testing}>
          {testing ? 'Testing...' : 'Run Test Again'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {testResults && (
          <>
            <div>
              <h3 className="font-semibold">User Context:</h3>
              <p>Organization ID: {testResults.currentUserOrg || 'null'}</p>
              <p>Is Super Admin: {testResults.isSuperAdmin ? 'Yes' : 'No'}</p>
            </div>

            <div>
              <h3 className="font-semibold">Data Access Summary:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Customers: {testResults.dataAccess.customers}</div>
                <div>Vehicles: {testResults.dataAccess.vehicles}</div>
                <div>Parts: {testResults.dataAccess.parts}</div>
                <div>Tasks: {testResults.dataAccess.tasks}</div>
                <div>Mechanics: {testResults.dataAccess.mechanics}</div>
                <div>Expenses: {testResults.dataAccess.expenses}</div>
                <div>Payments: {testResults.dataAccess.payments}</div>
                <div>Vendors: {testResults.dataAccess.vendors}</div>
              </div>
            </div>

            {validation && (
              <div>
                <h3 className="font-semibold">Validation Results:</h3>
                <p className={validation.isValid ? 'text-green-600' : 'text-red-600'}>
                  {validation.summary}
                </p>
                {validation.issues.length > 0 && (
                  <ul className="text-red-600 text-sm mt-2">
                    {validation.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};