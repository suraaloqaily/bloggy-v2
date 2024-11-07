import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "../app/login/page";

const mockRouter = {
  push: jest.fn(),
  refresh: jest.fn(),
};

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  useSession: jest.fn(),
  SessionProvider: function MockSessionProvider({ children }) {
    return <div>{children}</div>;
  },
}));

// Mock Loading component
jest.mock("@/components/Loading/Loading", () => {
  const MockLoading = () => <div>Loading...</div>;
  MockLoading.displayName = "MockLoading";
  return MockLoading;
});

// Import mocked functions
import { signIn, useSession } from "next-auth/react";

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSession.mockReturnValue({
      status: "unauthenticated",
      data: null,
    });
  });

  it("renders login form and submits data successfully", async () => {
    signIn.mockResolvedValue({ ok: true, error: null });

    render(<LoginPage />);

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
      expect(mockRouter.push).toHaveBeenCalledWith("/");
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  it("displays error message on login failure", async () => {
    signIn.mockResolvedValue({ ok: false, error: "Invalid credentials" });

    render(<LoginPage />);

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

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });

  it("redirects to home if already authenticated", async () => {
    useSession.mockReturnValue({
      status: "authenticated",
      data: { user: { email: "test@example.com" } },
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/");
    });
  });

  it("shows loading state", () => {
    useSession.mockReturnValue({
      status: "loading",
      data: null,
    });

    render(<LoginPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
