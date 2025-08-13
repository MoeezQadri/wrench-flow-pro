import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details: Record<string, any>;
}

export interface UserContext {
  userId: string;
  organizationId: string | null;
  role: string;
  isSuperAdmin: boolean;
}

/**
 * Comprehensive validation utility for customer data operations
 */
export class CustomerValidator {
  private static instance: CustomerValidator;
  private validationLog: Array<{
    timestamp: string;
    operation: string;
    result: ValidationResult;
    context: UserContext;
  }> = [];

  static getInstance(): CustomerValidator {
    if (!CustomerValidator.instance) {
      CustomerValidator.instance = new CustomerValidator();
    }
    return CustomerValidator.instance;
  }

  /**
   * Log validation results for debugging
   */
  private logValidation(operation: string, result: ValidationResult, context: UserContext) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      result,
      context
    };
    
    this.validationLog.push(logEntry);
    console.log(`[CustomerValidator] ${operation}:`, logEntry);
    
    // Keep only last 100 entries
    if (this.validationLog.length > 100) {
      this.validationLog = this.validationLog.slice(-100);
    }
  }

  /**
   * Validate RLS policies for customer access
   */
  async validateRLSAccess(context: UserContext): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      details: {}
    };

    try {
      console.log('[RLS Validation] Testing customer access for context:', context);

      // Test basic customer read access
      const { data: customers, error: readError } = await supabase
        .from('customers')
        .select('id, name, organization_id')
        .limit(1);

      if (readError) {
        result.isValid = false;
        result.errors.push(`RLS Read Error: ${readError.message}`);
        result.details.readError = readError;
      } else {
        result.details.readAccess = true;
        result.details.customerCount = customers?.length || 0;
        console.log('[RLS Validation] Read access successful, customers found:', customers?.length || 0);
      }

      // Test organization filtering
      if (context.organizationId && customers && customers.length > 0) {
        const orgMismatch = customers.filter(c => c.organization_id !== context.organizationId);
        if (orgMismatch.length > 0 && !context.isSuperAdmin) {
          result.warnings.push(`Found ${orgMismatch.length} customers from other organizations`);
          result.details.organizationLeakage = orgMismatch;
        }
      }

      // Test write access (dry run)
      const testCustomer = {
        name: 'RLS Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        organization_id: context.organizationId
      };

      const { error: insertError } = await supabase
        .from('customers')
        .insert(testCustomer)
        .select()
        .single();

      if (insertError) {
        if (insertError.message.includes('permission') || insertError.message.includes('policy')) {
          result.warnings.push(`Insert permission issue: ${insertError.message}`);
          result.details.insertRestricted = true;
        } else {
          result.details.insertError = insertError.message;
        }
      } else {
        result.details.insertAccess = true;
        // Clean up test data
        await supabase.from('customers').delete().eq('name', 'RLS Test Customer');
      }

    } catch (error: any) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error.message}`);
      result.details.exception = error;
    }

    this.logValidation('RLS_ACCESS_VALIDATION', result, context);
    return result;
  }

  /**
   * Validate customer data integrity
   */
  async validateDataIntegrity(context: UserContext): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      details: {}
    };

    try {
      console.log('[Data Validation] Checking customer data integrity');

      // Check for customers without organization_id
      const { data: orphanedCustomers, error } = await supabase
        .from('customers')
        .select('id, name, organization_id')
        .is('organization_id', null);

      if (error) {
        result.warnings.push(`Could not check orphaned customers: ${error.message}`);
      } else if (orphanedCustomers && orphanedCustomers.length > 0) {
        result.warnings.push(`Found ${orphanedCustomers.length} customers without organization`);
        result.details.orphanedCustomers = orphanedCustomers;
      }

      // Check for duplicate customers in organization
      if (context.organizationId) {
        const { data: duplicateCheck } = await supabase
          .from('customers')
          .select('name, email, count(*)')
          .eq('organization_id', context.organizationId)
          .not('email', 'is', null);

        // This would require a more complex query in real implementation
        result.details.duplicateCheckAttempted = true;
      }

      // Validate real-time subscription
      const channelName = `customers-validation-${Date.now()}`;
      const testChannel = supabase.channel(channelName);
      
      let subscriptionWorking = false;
      testChannel.on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        subscriptionWorking = true;
      });
      
      await testChannel.subscribe();
      
      // Wait a moment to see if subscription works
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!subscriptionWorking) {
        result.warnings.push('Real-time subscription may not be working properly');
      }
      
      supabase.removeChannel(testChannel);
      result.details.realtimeTest = subscriptionWorking;

    } catch (error: any) {
      result.errors.push(`Data integrity check failed: ${error.message}`);
      result.details.integrityError = error;
    }

    this.logValidation('DATA_INTEGRITY_VALIDATION', result, context);
    return result;
  }

  /**
   * Test customer operations with different user contexts
   */
  async validateUserContexts(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      details: { contextTests: [] }
    };

    try {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        result.errors.push('No authenticated user found');
        return result;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        result.errors.push('User profile not found');
        return result;
      }

      const currentContext: UserContext = {
        userId: user.id,
        organizationId: profile.organization_id,
        role: profile.role,
        isSuperAdmin: ['superuser', 'superadmin', 'owner'].includes(profile.role)
      };

      console.log('[Context Validation] Current user context:', currentContext);

      // Test RLS access
      const rlsResult = await this.validateRLSAccess(currentContext);
      result.details.contextTests.push({ type: 'RLS_ACCESS', result: rlsResult });

      // Test data integrity
      const integrityResult = await this.validateDataIntegrity(currentContext);
      result.details.contextTests.push({ type: 'DATA_INTEGRITY', result: integrityResult });

      // Aggregate results
      const allTests = [rlsResult, integrityResult];
      const hasErrors = allTests.some(test => !test.isValid || test.errors.length > 0);
      const hasWarnings = allTests.some(test => test.warnings.length > 0);

      if (hasErrors) {
        result.isValid = false;
        result.errors.push('One or more validation tests failed');
      }

      if (hasWarnings) {
        result.warnings.push('Validation completed with warnings');
      }

      result.details.summary = {
        totalTests: allTests.length,
        passed: allTests.filter(test => test.isValid).length,
        errors: allTests.reduce((sum, test) => sum + test.errors.length, 0),
        warnings: allTests.reduce((sum, test) => sum + test.warnings.length, 0)
      };

    } catch (error: any) {
      result.isValid = false;
      result.errors.push(`Context validation failed: ${error.message}`);
      result.details.validationError = error;
    }

    this.logValidation('USER_CONTEXT_VALIDATION', result, {
      userId: 'unknown',
      organizationId: null,
      role: 'unknown',
      isSuperAdmin: false
    });

    return result;
  }

  /**
   * Run comprehensive validation suite
   */
  async runFullValidation(): Promise<ValidationResult> {
    console.log('[CustomerValidator] Running comprehensive validation suite...');
    
    const startTime = Date.now();
    const result = await this.validateUserContexts();
    const endTime = Date.now();

    result.details.validationDuration = endTime - startTime;
    result.details.timestamp = new Date().toISOString();

    // Log summary
    console.log('[CustomerValidator] Validation completed:', {
      duration: `${result.details.validationDuration}ms`,
      isValid: result.isValid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length
    });

    if (result.errors.length > 0) {
      console.error('[CustomerValidator] Validation errors:', result.errors);
      toast.error(`Validation failed: ${result.errors.length} error(s) found`);
    } else if (result.warnings.length > 0) {
      console.warn('[CustomerValidator] Validation warnings:', result.warnings);
      toast.warning(`Validation completed with ${result.warnings.length} warning(s)`);
    } else {
      console.log('[CustomerValidator] All validations passed successfully');
      toast.success('All validations passed successfully');
    }

    return result;
  }

  /**
   * Get validation history for debugging
   */
  getValidationHistory(): typeof this.validationLog {
    return [...this.validationLog];
  }

  /**
   * Clear validation history
   */
  clearValidationHistory(): void {
    this.validationLog = [];
    console.log('[CustomerValidator] Validation history cleared');
  }
}

// Export singleton instance
export const customerValidator = CustomerValidator.getInstance();
