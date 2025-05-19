
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { AlertCircle, Save, Code, Play, Trash } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AnalyticsScript {
  id: string;
  name: string;
  code: string;
  isEnabled: boolean;
  scriptType: 'gtm' | 'ga' | 'custom';
  location: 'head' | 'body';
  createdAt: string;
  updatedAt: string;
}

// Mock data - would come from API in real app
const mockScripts: AnalyticsScript[] = [
  {
    id: 'script_1',
    name: 'Google Tag Manager',
    code: `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->`,
    isEnabled: false,
    scriptType: 'gtm',
    location: 'head',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'script_2',
    name: 'Google Analytics',
    code: `<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXX');
</script>
<!-- End Google Analytics -->`,
    isEnabled: true,
    scriptType: 'ga',
    location: 'head',
    createdAt: '2023-02-01T00:00:00Z',
    updatedAt: '2023-02-01T00:00:00Z'
  }
];

const SuperAdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState('scripts');
  const [scripts, setScripts] = useState<AnalyticsScript[]>(mockScripts);
  const [editScript, setEditScript] = useState<AnalyticsScript | null>(null);
  const [newScript, setNewScript] = useState<Partial<AnalyticsScript>>({
    name: '',
    code: '',
    isEnabled: false,
    scriptType: 'custom',
    location: 'head'
  });
  
  const handleToggleScript = (scriptId: string) => {
    setScripts(prevScripts => 
      prevScripts.map(script => 
        script.id === scriptId 
          ? { ...script, isEnabled: !script.isEnabled, updatedAt: new Date().toISOString() } 
          : script
      )
    );
    
    const script = scripts.find(s => s.id === scriptId);
    if (script) {
      toast.success(`${script.isEnabled ? 'Disabled' : 'Enabled'} ${script.name}`);
    }
  };
  
  const handleDeleteScript = (scriptId: string) => {
    const script = scripts.find(s => s.id === scriptId);
    if (script) {
      // In a real app, make API call to delete
      setScripts(prevScripts => prevScripts.filter(s => s.id !== scriptId));
      toast.success(`Deleted ${script.name}`);
    }
  };
  
  const handleSaveScript = () => {
    if (!newScript.name || !newScript.code) {
      toast.error('Please provide a name and script code');
      return;
    }
    
    // In a real app, make API call to save
    const now = new Date().toISOString();
    const script: AnalyticsScript = {
      id: `script_${Math.random().toString(36).substring(2, 9)}`,
      name: newScript.name,
      code: newScript.code,
      isEnabled: newScript.isEnabled || false,
      scriptType: newScript.scriptType as 'gtm' | 'ga' | 'custom',
      location: newScript.location as 'head' | 'body',
      createdAt: now,
      updatedAt: now
    };
    
    setScripts(prevScripts => [...prevScripts, script]);
    setNewScript({
      name: '',
      code: '',
      isEnabled: false,
      scriptType: 'custom',
      location: 'head'
    });
    
    toast.success('Script added successfully');
  };

  const handleUpdateScript = () => {
    if (!editScript || !editScript.name || !editScript.code) {
      toast.error('Please provide a name and script code');
      return;
    }
    
    // In a real app, make API call to update
    setScripts(prevScripts => 
      prevScripts.map(script => 
        script.id === editScript.id 
          ? { ...editScript, updatedAt: new Date().toISOString() }
          : script
      )
    );
    
    setEditScript(null);
    toast.success('Script updated successfully');
  };
  
  const validateScript = (code: string): boolean => {
    // Basic validation - check for script tags and ensure it's not empty
    return code.includes('<script') && code.includes('</script>') && code.length > 20;
  };
  
  const getScriptTemplate = (type: 'gtm' | 'ga' | 'custom'): string => {
    switch (type) {
      case 'gtm':
        return `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->`;
      case 'ga':
        return `<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXX');
</script>
<!-- End Google Analytics -->`;
      default:
        return `<!-- Custom Script -->
<script>
  // Your custom script here
  console.log("Custom tracking script loaded");
</script>
<!-- End Custom Script -->`;
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="scripts">Analytics Scripts</TabsTrigger>
          <TabsTrigger value="new">Add New Script</TabsTrigger>
          {editScript && <TabsTrigger value="edit">Edit Script</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="scripts" className="space-y-4">
          {scripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
              <p className="text-muted-foreground">No analytics scripts found</p>
              <Button 
                onClick={() => setActiveTab('new')}
                variant="outline" 
                size="sm" 
                className="mt-4"
              >
                Add your first script
              </Button>
            </div>
          ) : (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Integration Status</AlertTitle>
                <AlertDescription>
                  {scripts.some(s => s.isEnabled) 
                    ? `${scripts.filter(s => s.isEnabled).length} script(s) currently active`
                    : 'No scripts are currently active'}
                </AlertDescription>
              </Alert>
              
              {scripts.map(script => (
                <Card key={script.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-md font-medium">
                      {script.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id={`switch-${script.id}`}
                        checked={script.isEnabled}
                        onCheckedChange={() => handleToggleScript(script.id)}
                      />
                      <Label htmlFor={`switch-${script.id}`}>
                        {script.isEnabled ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2 rounded-md bg-muted p-4 overflow-x-auto">
                      <pre className="text-xs font-mono">
                        {script.code.length > 200 
                          ? script.code.substring(0, 200) + '...'
                          : script.code}
                      </pre>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {script.scriptType === 'gtm' ? 'Google Tag Manager' : 
                         script.scriptType === 'ga' ? 'Google Analytics' : 'Custom'}
                      </div>
                      <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        {script.location === 'head' ? 'Head' : 'Body'}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-xs text-muted-foreground">
                      Last updated: {new Date(script.updatedAt).toLocaleString()}
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditScript(script);
                          setActiveTab('edit');
                        }}
                      >
                        <Code className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteScript(script.id)}
                      >
                        <Trash className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Add Analytics Script</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="script-name">Script Name</Label>
                <Input 
                  id="script-name"
                  placeholder="e.g., Google Tag Manager"
                  value={newScript.name}
                  onChange={e => setNewScript({...newScript, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Script Type</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={newScript.scriptType === 'gtm' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewScript({
                      ...newScript, 
                      scriptType: 'gtm', 
                      code: getScriptTemplate('gtm')
                    })}
                  >
                    Google Tag Manager
                  </Button>
                  <Button
                    variant={newScript.scriptType === 'ga' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewScript({
                      ...newScript, 
                      scriptType: 'ga', 
                      code: getScriptTemplate('ga')
                    })}
                  >
                    Google Analytics
                  </Button>
                  <Button
                    variant={newScript.scriptType === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewScript({
                      ...newScript, 
                      scriptType: 'custom',
                      code: getScriptTemplate('custom')
                    })}
                  >
                    Custom Script
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Script Location</Label>
                <div className="flex gap-2">
                  <Button
                    variant={newScript.location === 'head' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewScript({...newScript, location: 'head'})}
                  >
                    Head
                  </Button>
                  <Button
                    variant={newScript.location === 'body' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewScript({...newScript, location: 'body'})}
                  >
                    Body
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="script-code">Script Code</Label>
                <Textarea 
                  id="script-code"
                  placeholder="Paste your script code here..."
                  value={newScript.code}
                  onChange={e => setNewScript({...newScript, code: e.target.value})}
                  className="font-mono text-sm h-60"
                />
                {newScript.code && !validateScript(newScript.code) && (
                  <p className="text-sm text-red-500">
                    Script code should contain valid script tags.
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="script-enabled"
                  checked={newScript.isEnabled}
                  onCheckedChange={(checked) => setNewScript({...newScript, isEnabled: checked})}
                />
                <Label htmlFor="script-enabled">Enable script immediately</Label>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={() => setActiveTab('scripts')}>
                Cancel
              </Button>
              <Button onClick={handleSaveScript}>
                <Save className="h-4 w-4 mr-2" />
                Save Script
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {editScript && (
          <TabsContent value="edit">
            <Card>
              <CardHeader>
                <CardTitle>Edit Analytics Script</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-script-name">Script Name</Label>
                  <Input 
                    id="edit-script-name"
                    value={editScript.name}
                    onChange={e => setEditScript({...editScript, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Script Type</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={editScript.scriptType === 'gtm' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditScript({...editScript, scriptType: 'gtm'})}
                    >
                      Google Tag Manager
                    </Button>
                    <Button
                      variant={editScript.scriptType === 'ga' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditScript({...editScript, scriptType: 'ga'})}
                    >
                      Google Analytics
                    </Button>
                    <Button
                      variant={editScript.scriptType === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditScript({...editScript, scriptType: 'custom'})}
                    >
                      Custom Script
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Script Location</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={editScript.location === 'head' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditScript({...editScript, location: 'head'})}
                    >
                      Head
                    </Button>
                    <Button
                      variant={editScript.location === 'body' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditScript({...editScript, location: 'body'})}
                    >
                      Body
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-script-code">Script Code</Label>
                  <Textarea 
                    id="edit-script-code"
                    value={editScript.code}
                    onChange={e => setEditScript({...editScript, code: e.target.value})}
                    className="font-mono text-sm h-60"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="edit-script-enabled"
                    checked={editScript.isEnabled}
                    onCheckedChange={(checked) => setEditScript({...editScript, isEnabled: checked})}
                  />
                  <Label htmlFor="edit-script-enabled">
                    {editScript.isEnabled ? 'Script is active' : 'Script is inactive'}
                  </Label>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditScript(null);
                    setActiveTab('scripts');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateScript}>
                  <Save className="h-4 w-4 mr-2" />
                  Update Script
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SuperAdminAnalytics;
