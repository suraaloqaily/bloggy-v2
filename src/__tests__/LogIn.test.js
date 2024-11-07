import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoginPage from "../app/login/page";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  useSession: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock Loading component
jest.mock("@/components/Loading/Loading", () => () => <div>Loading...</div>);

describe("LoginPage", () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock useRouter
    useRouter.mockReturnValue({ push: mockPush, refresh: mockRefresh });

    // Mock useSession with unauthenticated status by default
    useSession.mockReturnValue({
      status: "unauthenticated",
      data: null,
    });
  });

  it("renders login form and submits data successfully", async () => {
    // Mock successful sign in response
    signIn.mockResolvedValue({ ok: true, error: null });

    render(
      <SessionProvider>
        <LoginPage />
      </SessionProvider>
    );

    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    // Verify signIn was called with correct parameters
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("credentials", {
        email: "test@example.com",
        password: "password123",
        redirect: false,
      });
    });

    // Verify router.push and refresh were called
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("displays error message on login failure", async () => {
    // Mock failed sign in response
    signIn.mockResolvedValue({ ok: false, error: "Invalid credentials" });

    render(
      <SessionProvider>
        <LoginPage />
      </SessionProvider>
    );

    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "wrongpassword" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    // Verify router.push was not called
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("redirects to home if already authenticated", async () => {
    // Mock authenticated session
    useSession.mockReturnValue({
      status: "authenticated",
      data: { user: { email: "test@example.com" } },
    });

    render(
      <SessionProvider>
        <LoginPage />
      </SessionProvider>
    );

    // Verify redirect happens
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("shows loading state", () => {
    // Mock loading session
    useSession.mockReturnValue({
      status: "loading",
      data: null,
    });

    render(
      <SessionProvider>
        <LoginPage />
      </SessionProvider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
