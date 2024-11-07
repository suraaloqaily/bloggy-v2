import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoginPage from "../app/login/page";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  useSession: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/components/Loading/Loading", () => () => <div>Loading...</div>);

describe("LoginPage", () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useRouter.mockReturnValue({ push: mockPush, refresh: mockRefresh });

    useSession.mockReturnValue({
      status: "unauthenticated",
      data: null,
    });
  });

  it("renders login form and submits data successfully", async () => {
    signIn.mockResolvedValue({ ok: true, error: null });

    render(
      <SessionProvider>
        <LoginPage />
      </SessionProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("credentials", {
        email: "test@example.com",
        password: "password123",
        redirect: false,
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("displays error message on login failure", async () => {
    signIn.mockResolvedValue({ ok: false, error: "Invalid credentials" });

    render(
      <SessionProvider>
        <LoginPage />
      </SessionProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "wrongpassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("redirects to home if already authenticated", async () => {
    useSession.mockReturnValue({
      status: "authenticated",
      data: { user: { email: "test@example.com" } },
    });

    render(
      <SessionProvider>
        <LoginPage />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("shows loading state", () => {
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
