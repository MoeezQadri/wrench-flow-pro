
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { registerOrganization, availableCountries, availableCurrencies } from '@/services/auth-service';
import { useAuthContext } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Register = () => {
  const [organizationName, setOrganizationName] = useState('');
  const [country, setCountry] = useState('United States');
  const [currency, setCurrency] = useState('USD');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { setCurrentUser, setToken } = useAuthContext();

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!organizationName || !country || !currency) {
        toast.error('Please fill in all organization details');
        return;
      }
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { organization, user, token } = registerOrganization(
        organizationName,
        country,
        currency,
        ownerName,
        email,
        password
      );
      
      setCurrentUser(user);
      setToken(token);
      
      // Store in localStorage for persistence
      localStorage.setItem('authToken', token);
      
      toast.success('Registration successful');
      
      // Redirect to dashboard
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building size={48} className="text-wrench-light-blue" />
          </div>
          <h1 className="text-3xl font-bold">WrenchFlow Pro</h1>
          <p className="text-muted-foreground">Automotive workshop management system</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Create Organization Account</CardTitle>
            <CardDescription>Register your workshop and get started</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent>
              <Tabs value={`step-${currentStep}`} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger 
                    value="step-1" 
                    onClick={() => setCurrentStep(1)}
                  >
                    Organization
                  </TabsTrigger>
                  <TabsTrigger 
                    value="step-2" 
                    onClick={() => currentStep === 2 && setCurrentStep(2)}
                    disabled={currentStep < 2}
                  >
                    Admin User
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="step-1" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <Input 
                      id="organizationName" 
                      placeholder="Your Workshop Name" 
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select 
                      value={country} 
                      onValueChange={setCountry}
                    >
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCountries.map((countryName) => (
                          <SelectItem key={countryName} value={countryName}>
                            {countryName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={currency} 
                      onValueChange={setCurrency}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCurrencies.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            {curr.code} ({curr.symbol}) - {curr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    type="button" 
                    onClick={handleNextStep}
                    className="w-full mt-4"
                  >
                    Continue
                  </Button>
                </TabsContent>
                
                <TabsContent value="step-2" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Your Name</Label>
                    <Input 
                      id="ownerName" 
                      placeholder="Full Name" 
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="your@email.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters long
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="••••••••" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handlePrevStep}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating Account...' : 'Register'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            
            <CardFooter className="flex justify-center pt-0">
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/auth/login" className="text-wrench-light-blue hover:underline">
                  Login here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
