"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Card, TextInput, Button, Alert, Label, Spinner, Modal, ModalHeader, ModalBody, ModalFooter } from "flowbite-react";
// sample response data:
// {
//   "user": {
//       "pk": 6,
//       "username": "dumdum",
//       "email": "dum@gmail.com",
//       "first_name": "",
//       "last_name": ""
//   }
// }
// sets cookies as "refresh_token", "access_token"

type FormData = {
  email: string;
  password1: string;
  password2: string;
};

export default function Registration() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password1: "",
    password2: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const router = useRouter();
  const { authorizeUser } = useAuth();

  const register_endpoint = process.env.NEXT_PUBLIC_API_BASE_URL + "api/accounts/registration/";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear field error when user starts typing
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      const response = await fetch(register_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const responseJson = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          // Handle field-specific errors
          const newFieldErrors: Record<string, string> = {};
          Object.keys(responseJson).forEach((key) => {
            if (key !== "non_field_errors" && key !== "detail") {
              const errorValue = responseJson[key];
              if (Array.isArray(errorValue)) {
                newFieldErrors[key] = errorValue[0];
              } else if (typeof errorValue === "string") {
                newFieldErrors[key] = errorValue;
              }
            }
          });
          setFieldErrors(newFieldErrors);

          // Handle general errors
          if (responseJson.non_field_errors) {
            const generalError = Array.isArray(responseJson.non_field_errors)
              ? responseJson.non_field_errors[0]
              : responseJson.non_field_errors;
            setError(generalError);
          } else if (responseJson.detail) {
            setError(Array.isArray(responseJson.detail) ? responseJson.detail[0] : responseJson.detail);
          } else {
            setError("Please check the form for errors.");
          }
        } else if (response.status === 500) {
          setError("Internal server error. Please try again later.");
        } else {
          setError(responseJson.detail || "An unexpected error occurred. Please try again later.");
        }
        return;
      }

      // Handle successful registration
      await authorizeUser();

      // Check if email verification is required
      if (responseJson.detail === "Verification e-mail sent.") {
        setShowVerificationModal(true);
        return; // Don't redirect - user must verify email first
      }

      // Only redirect if user is fully registered (no email verification required)
      if (responseJson.user?.pk) {
        router.push(`/account/profile/${responseJson.user.pk}`);
      } else {
        setError("Registration successful but user data is missing.");
        console.log("responseJson:", responseJson);
        return;
      }
    } catch (err: any) {
      setError("Network error: Check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create an account</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Enter your information to get started</p>
          </div>

          {error && (
            <Alert color="failure" onDismiss={() => setError(null)}>
              <span className="font-medium">Error!</span> {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Your email</Label>
              <TextInput
                id="email"
                type="email"
                name="email"
                placeholder="name@company.com"
                required
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                className="mt-1"
                color={fieldErrors.email ? "failure" : undefined}
              />
              {fieldErrors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-500">{fieldErrors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password1">Your password</Label>
              <TextInput
                id="password1"
                type="password"
                name="password1"
                placeholder="••••••••"
                required
                value={formData.password1}
                onChange={handleChange}
                autoComplete="new-password"
                className="mt-1"
                color={fieldErrors.password1 ? "failure" : undefined}
              />
              {fieldErrors.password1 && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-500">{fieldErrors.password1}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password2">Confirm password</Label>
              <TextInput
                id="password2"
                type="password"
                name="password2"
                placeholder="••••••••"
                required
                value={formData.password2}
                onChange={handleChange}
                autoComplete="new-password"
                className="mt-1"
                color={fieldErrors.password2 ? "failure" : undefined}
              />
              {fieldErrors.password2 && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-500">{fieldErrors.password2}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner aria-label="Loading" size="sm" className="mr-3" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </div>
      </Card>

      {/* Email Verification Modal */}
      <Modal show={showVerificationModal} onClose={() => setShowVerificationModal(false)} size="md">
        <ModalHeader>Verify your email</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
              A confirmation link has been sent to <strong>{formData.email}</strong>
            </p>
            <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Please check your email and click the verification link to activate your account. You must verify your email before you can access your profile.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={() => {
              setShowVerificationModal(false);
              router.push("/account/login");
            }}
            className="w-full"
          >
            Go to login
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
