import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserWithConfirmation, Organization } from './types';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { updateUser } from '@/utils/supabase-helpers';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithConfirmation | null;
  organizations: Organization[];
  onUserUpdated: (user: UserWithConfirmation) => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  onOpenChange,
  user,
  organizations,
  onUserUpdated,
}) => {
  if (!user) return null;

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required').min(2),
    email: Yup.string().email('Invalid email').required('Email is required'),
    role: Yup.string().required('Role is required'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        <Formik
          initialValues={{
            name: user.name || '',
            email: user.email || '',
            role: user.role || 'owner',
          }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const updatedUser = await updateUser({
                userId: user.id,
                name: values.name,
                email: values.email,
                role: values.role,
              });

              onUserUpdated({
                ...user,
                name: values.name,
                email: values.email,
                role: values.role,
              } as UserWithConfirmation);
              onOpenChange(false);
            } catch (err) {
              console.error('Failed to update user:', err);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({
            values,
            handleChange,
            handleSubmit,
            isSubmitting,
            errors,
            touched,
            setFieldValue,
          }) => (
            <Form className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                />
                {errors.name && touched.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                />
                {errors.email && touched.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={values.role}
                  onValueChange={(value) => setFieldValue('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="mechanic">Mechanic</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superuser">Super User</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && touched.role && (
                  <p className="text-red-500 text-sm">{errors.role}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
