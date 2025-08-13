import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  ChevronDown,
  ChevronRight,
  Bug,
  Database,
  Shield,
  Users
} from 'lucide-react';
import { customerValidator, ValidationResult } from '@/utils/customer-validation';
import { toast } from 'sonner';

interface ValidationPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const CustomerValidationPanel = ({ isOpen, onToggle }: ValidationPanelProps) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const runValidation = async () => {
    setIsRunning(true);
    try {
      const result = await customerValidator.runFullValidation();
      setValidationResult(result);
    } catch (error: any) {
      toast.error(`Validation failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getStatusIcon = (isValid: boolean, errorCount: number, warningCount: number) => {
    if (!isValid || errorCount > 0) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else if (warningCount > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = (isValid: boolean, errorCount: number, warningCount: number) => {
    if (!isValid || errorCount > 0) return 'destructive';
    if (warningCount > 0) return 'secondary';
    return 'default';
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50"
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug Panel
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[80vh] z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Bug className="h-5 w-5 mr-2" />
            Customer Validation
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            ×
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Run Validation Button */}
        <Button 
          onClick={runValidation} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {isRunning ? 'Running Validation...' : 'Run Full Validation'}
        </Button>

        {/* Validation Results */}
        {validationResult && (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(
                    validationResult.isValid, 
                    validationResult.errors.length, 
                    validationResult.warnings.length
                  )}
                  <span className="font-medium">
                    {validationResult.isValid ? 'Validation Passed' : 'Validation Failed'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {validationResult.errors.length > 0 && (
                    <Badge variant="destructive">{validationResult.errors.length} errors</Badge>
                  )}
                  {validationResult.warnings.length > 0 && (
                    <Badge variant="secondary">{validationResult.warnings.length} warnings</Badge>
                  )}
                </div>
              </div>

              {/* Duration */}
              {validationResult.details.validationDuration && (
                <div className="text-sm text-muted-foreground">
                  Completed in {validationResult.details.validationDuration}ms
                </div>
              )}

              {/* Errors Section */}
              {validationResult.errors.length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger 
                    className="flex items-center space-x-2 w-full text-left p-2 hover:bg-muted rounded"
                    onClick={() => toggleSection('errors')}
                  >
                    {expandedSections.has('errors') ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="font-medium">Errors ({validationResult.errors.length})</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 space-y-2">
                    {validationResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Warnings Section */}
              {validationResult.warnings.length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger 
                    className="flex items-center space-x-2 w-full text-left p-2 hover:bg-muted rounded"
                    onClick={() => toggleSection('warnings')}
                  >
                    {expandedSections.has('warnings') ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Warnings ({validationResult.warnings.length})</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 space-y-2">
                    {validationResult.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                        {warning}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Test Details */}
              {validationResult.details.contextTests && (
                <Collapsible>
                  <CollapsibleTrigger 
                    className="flex items-center space-x-2 w-full text-left p-2 hover:bg-muted rounded"
                    onClick={() => toggleSection('details')}
                  >
                    {expandedSections.has('details') ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                    <Database className="h-4 w-4" />
                    <span className="font-medium">Test Details</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 space-y-3">
                    {validationResult.details.contextTests.map((test: any, index: number) => (
                      <div key={index} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {test.type === 'RLS_ACCESS' ? (
                              <Shield className="h-4 w-4" />
                            ) : (
                              <Database className="h-4 w-4" />
                            )}
                            <span className="font-medium text-sm">{test.type.replace('_', ' ')}</span>
                          </div>
                          <Badge variant={getStatusColor(test.result.isValid, test.result.errors.length, test.result.warnings.length)}>
                            {test.result.isValid ? 'Pass' : 'Fail'}
                          </Badge>
                        </div>
                        
                        {test.result.details && Object.keys(test.result.details).length > 0 && (
                          <div className="text-xs text-muted-foreground mt-2">
                            <pre className="bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(test.result.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Summary Stats */}
              {validationResult.details.summary && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted p-2 rounded">
                    <div className="font-medium">Tests Run</div>
                    <div>{validationResult.details.summary.totalTests}</div>
                  </div>
                  <div className="bg-muted p-2 rounded">
                    <div className="font-medium">Passed</div>
                    <div>{validationResult.details.summary.passed}</div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Clear History Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            customerValidator.clearValidationHistory();
            toast.success('Validation history cleared');
          }}
          className="w-full"
        >
          Clear History
        </Button>
      </CardContent>
    </Card>
  );
};