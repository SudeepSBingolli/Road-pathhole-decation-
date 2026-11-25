import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, RegisterFormData } from '../../lib/schemas';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail, Phone, User as UserIcon, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: ''
    }
  });

  const onSubmit = async (values: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/api/auth/register', values);
      login(data.token, data.user);
      toast.success('Account Created', {
        description: `Welcome to RoadWatch, ${data.user.name}!`
      });
      navigate('/report');
    } catch (err: any) {
      toast.error('Registration Failed', {
        description: err.response?.data?.message || 'Could not complete registration.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border shadow-soft-lg rounded-3xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-extrabold tracking-tight">
          Create Citizen Account
        </CardTitle>
        <CardDescription>
          Join your community in reporting and tracking road safety repairs
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Jane Doe"
                className="pl-10 rounded-xl"
                {...register('name')}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10 rounded-xl"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="(555) 000-0000"
                className="pl-10 rounded-xl"
                {...register('phone')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                className="pl-10 pr-10 rounded-xl"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-2xl text-sm font-semibold shadow-soft"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering...
              </span>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign In here
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
