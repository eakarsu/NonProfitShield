import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { updateProfileSchema, changePasswordSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Shield, CheckCircle, XCircle } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ProfileSkeleton } from "@/components/ui/loading-skeleton";
import { useToast } from "@/hooks/use-toast";

type ProfileForm = z.infer<typeof updateProfileSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function Profile() {
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["/api/profile"],
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    values: profile
      ? {
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          email: profile.email || "",
        }
      : undefined,
  });

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile updated!" });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      const res = await apiRequest("POST", "/api/auth/change-password", data);
      return res.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({ title: "Password changed!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Profile & Settings</h1>

        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <>
            {/* Profile Header */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-semibold">
                      {profile?.firstName?.[0]}
                      {profile?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {profile?.firstName} {profile?.lastName}
                    </h2>
                    <p className="text-slate-600">{profile?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="capitalize">
                        <Shield className="h-3 w-3 mr-1" />
                        {profile?.role}
                      </Badge>
                      {profile?.emailVerified ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="profile">
              <TabsList className="mb-6">
                <TabsTrigger value="profile">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Lock className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={profileForm.handleSubmit((data) =>
                        updateProfileMutation.mutate(data)
                      )}
                      className="space-y-4 max-w-md"
                    >
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" {...profileForm.register("firstName")} />
                        {profileForm.formState.errors.firstName && (
                          <p className="text-red-500 text-xs mt-1">
                            {profileForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" {...profileForm.register("lastName")} />
                        {profileForm.formState.errors.lastName && (
                          <p className="text-red-500 text-xs mt-1">
                            {profileForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...profileForm.register("email")} />
                        {profileForm.formState.errors.email && (
                          <p className="text-red-500 text-xs mt-1">
                            {profileForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="bg-primary-500 hover:bg-primary-600"
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={passwordForm.handleSubmit((data) =>
                        changePasswordMutation.mutate(data)
                      )}
                      className="space-y-4 max-w-md"
                    >
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          {...passwordForm.register("currentPassword")}
                        />
                        {passwordForm.formState.errors.currentPassword && (
                          <p className="text-red-500 text-xs mt-1">
                            {passwordForm.formState.errors.currentPassword.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          {...passwordForm.register("newPassword")}
                        />
                        {passwordForm.formState.errors.newPassword && (
                          <p className="text-red-500 text-xs mt-1">
                            {passwordForm.formState.errors.newPassword.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                        <Input
                          id="confirmNewPassword"
                          type="password"
                          {...passwordForm.register("confirmNewPassword")}
                        />
                        {passwordForm.formState.errors.confirmNewPassword && (
                          <p className="text-red-500 text-xs mt-1">
                            {passwordForm.formState.errors.confirmNewPassword.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="bg-primary-500 hover:bg-primary-600"
                      >
                        {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
